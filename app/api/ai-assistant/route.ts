import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"
export const maxDuration = 30

async function getCRMContext(supabase: any, franchiseId: string, isSuperAdmin: boolean) {
  const today = new Date().toISOString().split("T")[0]
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

  const baseFilter = (q: any) =>
    !isSuperAdmin && franchiseId ? q.eq("franchise_id", franchiseId) : q

  // Run all queries in parallel
  const [
    bookingsToday,
    pendingPayments,
    lowStock,
    todayDeliveries,
    recentLeads,
    recentBookings,
  ] = await Promise.allSettled([
    baseFilter(
      supabase
        .from("product_orders")
        .select("id, order_number, event_date, total_amount, payment_status, customers(name, phone)")
        .eq("event_date", today)
        .limit(10)
    ),
    baseFilter(
      supabase
        .from("product_orders")
        .select("id, order_number, total_amount, paid_amount, customers(name, phone)")
        .in("payment_status", ["pending", "partial"])
        .order("created_at", { ascending: false })
        .limit(10)
    ),
    baseFilter(
      supabase
        .from("products")
        .select("id, name, stock_available, reorder_level, category:product_categories(name)")
        .filter("stock_available", "lte", "reorder_level")
        .limit(10)
    ),
    baseFilter(
      supabase
        .from("deliveries")
        .select("id, delivery_date, delivery_type, status, customers(name, phone)")
        .eq("delivery_date", today)
        .limit(10)
    ),
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    baseFilter(
      supabase
        .from("product_orders")
        .select("id, order_number, event_date, total_amount, payment_status, customers(name, phone)")
        .order("created_at", { ascending: false })
        .limit(5)
    ),
  ])

  const get = (r: PromiseSettledResult<any>) =>
    r.status === "fulfilled" ? r.value.data || [] : []

  return {
    bookingsToday: get(bookingsToday),
    pendingPayments: get(pendingPayments),
    lowStock: get(lowStock),
    todayDeliveries: get(todayDeliveries),
    recentLeads: get(recentLeads),
    recentBookings: get(recentBookings),
    today,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "readonly" })
    if (!auth.authorized) {
      return NextResponse.json({ error: "Please login to use Safawala AI" }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured. Please add OPENAI_API_KEY." }, { status: 500 })
    }

    const { message, history = [] } = await request.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = createClient()
    const franchiseId = auth.user!.franchise_id
    const isSuperAdmin = auth.user!.is_super_admin || false
    const userName = auth.user!.name || "there"

    // Fetch live CRM data
    const ctx = await getCRMContext(supabase, franchiseId, isSuperAdmin)

    const systemPrompt = `You are Safawala AI — the intelligent CRM assistant for Safawala, a premium Indian wedding accessories rental business. You are embedded inside the Safawala CRM dashboard.

The logged-in user is: ${userName} (${isSuperAdmin ? "Super Admin" : "Franchise Staff"})
Today's date: ${ctx.today}

## LIVE CRM DATA (as of right now):

### Today's Bookings (${ctx.bookingsToday.length}):
${ctx.bookingsToday.length > 0
  ? ctx.bookingsToday.map((b: any) => `- ${b.order_number}: ${b.customers?.name} | Event: ${b.event_date} | ₹${b.total_amount} | ${b.payment_status}`).join("\n")
  : "No bookings today"}

### Pending Payments (${ctx.pendingPayments.length}):
${ctx.pendingPayments.length > 0
  ? ctx.pendingPayments.map((b: any) => `- ${b.order_number}: ${b.customers?.name} | Total: ₹${b.total_amount} | Paid: ₹${b.paid_amount || 0} | Due: ₹${(b.total_amount || 0) - (b.paid_amount || 0)}`).join("\n")
  : "No pending payments"}

### Low Stock Items (${ctx.lowStock.length}):
${ctx.lowStock.length > 0
  ? ctx.lowStock.map((p: any) => `- ${p.name} | Stock: ${p.stock_available} | Reorder at: ${p.reorder_level} | Category: ${p.category?.name || "—"}`).join("\n")
  : "All items well stocked"}

### Today's Deliveries (${ctx.todayDeliveries.length}):
${ctx.todayDeliveries.length > 0
  ? ctx.todayDeliveries.map((d: any) => `- ${d.delivery_type} for ${d.customers?.name} | Status: ${d.status}`).join("\n")
  : "No deliveries today"}

### Recent Leads (${ctx.recentLeads.length}):
${ctx.recentLeads.length > 0
  ? ctx.recentLeads.map((l: any) => `- ${l.name} (${l.phone}) | Event: ${l.event_date || "TBD"} | Location: ${l.location || "—"} | Status: ${l.status} | Package: ${l.package_interest || "—"}`).join("\n")
  : "No leads yet"}

### Recent Bookings:
${ctx.recentBookings.length > 0
  ? ctx.recentBookings.map((b: any) => `- ${b.order_number}: ${b.customers?.name} | ₹${b.total_amount} | ${b.payment_status}`).join("\n")
  : "No recent bookings"}

## YOUR CAPABILITIES:
You can help with:
- Reading & summarizing any CRM data (bookings, customers, inventory, leads, payments, deliveries, laundry, expenses)
- Giving business insights and recommendations
- Drafting WhatsApp messages for customers
- Writing notes, descriptions, instructions
- Explaining how to use any CRM feature
- Suggesting next actions based on current data
- Answering questions about products, pricing, packages

## RULES:
- Always respond in a friendly, helpful tone
- Use Indian context (₹ for currency, Indian names, Hindi words when appropriate)
- Keep responses concise but complete
- Use bullet points for lists
- If asked to "create", "add", or "update" something — guide the user to the right page with clear instructions (you cannot make direct DB changes via chat)
- Always refer to the live data above when answering questions about the current state of the business
- Respond in the same language the user writes in (Hindi/English/Hinglish)`

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
      { role: "user", content: message },
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("[AI Assistant] OpenAI error:", err)
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (err) {
    console.error("[AI Assistant] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
