import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAnonClient } from "@/lib/supabase/client"

/**
 * Get user session from cookie and validate franchise access
 */
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      throw new Error("Invalid session")
    }

    // Use service role to fetch user details
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role,
      isSuperAdmin: user.role === "super_admin"
    }
  } catch (error) {
    throw new Error("Authentication required")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin } = await getUserFromSession(request)
    
    // Use anon client to respect RLS policies
    const supabase = createAnonClient()

    console.log(`[Customers API] Fetching customers for franchise: ${franchiseId}, isSuperAdmin: ${isSuperAdmin}`)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    // Build query - RLS will automatically filter by franchise
    let query = supabase
      .from("customers")
      .select(`
        *,
        franchise:franchises(id, name, code)
      `)
      .order("created_at", { ascending: false })
      .eq('is_active', true)

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    let { data, error } = await query

    // Fallback if is_active column not yet migrated
    if (error && /is_active|column .* does not exist/i.test(String(error.message))) {
      console.warn("[Customers API] is_active column missing. Falling back to show all customers.")
      let fallback = supabase
        .from("customers")
        .select(`
          *,
          franchise:franchises(id, name, code)
        `)
        .order("created_at", { ascending: false })

      if (search && search.trim()) {
        fallback = fallback.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const res = await fallback
      data = res.data as any
      error = res.error as any
    }

    if (error) {
      console.error("[Customers API] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Customers API] Returning ${data?.length || 0} customers`)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[Customers API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, franchiseId } = await getUserFromSession(request)
    const supabase = createClient()

    const body = await request.json()
    const { name, phone, whatsapp, email, address, city, state, pincode, notes } = body

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 })
    }

    // Check for duplicate phone in same franchise
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone.trim())
      .eq("franchise_id", franchiseId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Customer with this phone number already exists in your franchise" }, { status: 409 })
    }

    // Insert new customer with franchise_id
    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim() || null,  // FIX: Save WhatsApp field
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        notes: notes?.trim() || null,
        franchise_id: franchiseId,
        created_by: userId,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Customers API] Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[Customers API] Created customer ${newCustomer.id} for franchise ${franchiseId}`)
    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 })
  } catch (error) {
    console.error("[Customers API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
