import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"

// POST - Public: Submit a lead enquiry (no auth needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, event_date, location, message, package_interest, source } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        event_date: event_date || null,
        location: location?.trim() || null,
        message: message?.trim() || null,
        package_interest: package_interest?.trim() || null,
        source: source || "website",
        status: "new",
      })
      .select()
      .single()

    if (error) {
      console.error("[Leads] Insert error:", error)
      return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[Leads] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Authenticated: Fetch all leads for CRM
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "readonly" })
    if (!auth.authorized) {
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Leads] Fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err) {
    console.error("[Leads] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Authenticated: Update lead status/notes
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "staff" })
    if (!auth.authorized) {
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }

    const body = await request.json()
    const { id, status, notes, assigned_to } = body

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = createClient()
    const updateData: any = { updated_at: new Date().toISOString() }
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
