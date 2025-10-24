import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const { franchiseId, isSuperAdmin, role } = await getUserFromSession(request)
    
    // Use service role client but manually enforce franchise filtering
    const supabase = createClient()

    console.log(`[Customers API] User: role=${role}, franchiseId=${franchiseId}, isSuperAdmin=${isSuperAdmin}`)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    // Build query - manually apply franchise filter for non-super-admins
    let query = supabase
      .from("customers")
      .select(`
        *,
        franchise:franchises(id, name, code)
      `)
      .order("created_at", { ascending: false })
      // avoid filtering on removed columns; rely on franchise isolation

    // CRITICAL: Apply franchise filter for non-super-admins
    if (!isSuperAdmin && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
      console.log(`[Customers API] ✅ Applied franchise filter: ${franchiseId}`)
    } else if (isSuperAdmin) {
      console.log(`[Customers API] ⚠️  Super admin mode - no franchise filter`)
    } else {
      console.log(`[Customers API] ❌ WARNING: No franchise_id for non-super-admin user!`)
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    let { data, error } = await query

    if (error) {
      console.error("[Customers API] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Build a simple ETag for the list response based on the latest updated_at, count, franchise and search
    const latestUpdatedAt = (data || [])
      .map((c: any) => c.updated_at || c.created_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || ''
    const variant = `${franchiseId}|${isSuperAdmin ? 'super' : 'fr'}|${search || ''}`
    const etag = `W/"list:${variant}:${data?.length || 0}:${latestUpdatedAt}"`
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, must-revalidate, max-age=0',
          Vary: 'Cookie'
        }
      })
    }

    console.log(`[Customers API] Returning ${data?.length || 0} customers`)
    return NextResponse.json({ success: true, data: data || [] }, {
      headers: {
        ETag: etag,
        'Cache-Control': 'private, must-revalidate, max-age=0',
        Vary: 'Cookie'
      }
    })
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

export async function PUT(request: NextRequest) {
  try {
    const { userId, franchiseId, isSuperAdmin } = await getUserFromSession(request)
    const supabase = createClient()

    const body = await request.json()
    const { id, name, phone, whatsapp, email, address, city, state, pincode, notes } = body || {}

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "Valid customer ID is required" }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 })
    }

    // Fetch existing to verify and enforce franchise isolation
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('id, franchise_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!isSuperAdmin && existing.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Access denied to this franchise' }, { status: 403 })
    }

    const updateData: any = {
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      pincode: pincode?.trim() || null,
      notes: typeof notes === 'string' ? notes.trim() : notes ?? null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('[Customers API] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Customers API] PUT Error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
