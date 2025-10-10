import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

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

/**
 * GET /api/franchises
 * Fetch all franchises (super admin sees all, franchise admin sees only theirs)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[Franchises API] GET request received")
    
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      console.error("[Franchises API] Unauthorized - no userId")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[Franchises API] User: ${userId}, Super Admin: ${isSuperAdmin}, Franchise: ${franchiseId}`)

    let query = supabase
      .from("franchises")
      .select("*")
      .order("created_at", { ascending: false })

    // 🔒 FRANCHISE ISOLATION: Super admin sees all, others see only their franchise
    if (!isSuperAdmin && franchiseId) {
      console.log(`[Franchises API] Filtering by franchise: ${franchiseId}`)
      query = query.eq("id", franchiseId)
    } else {
      console.log("[Franchises API] Super admin - returning all franchises")
    }

    const { data, error } = await query

    if (error) {
      console.error("[Franchises API] Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Franchises API] Successfully fetched ${data?.length || 0} franchises`)
    return NextResponse.json({ data: data || [] })

  } catch (error: any) {
    console.error("[Franchises API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

/**
 * POST /api/franchises
 * Create a new franchise (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user
    const { isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only super admin can create franchises
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: "Forbidden: Only super admin can create franchises" 
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      code,
      name,
      owner_name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gst_number,
      is_active = true
    } = body

    // Validate required fields
    if (!code || !name || !city) {
      return NextResponse.json({ 
        error: "Missing required fields: code, name, city" 
      }, { status: 400 })
    }

    // Check if franchise code already exists
    const { data: existing } = await supabase
      .from("franchises")
      .select("code")
      .eq("code", code)
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: "Franchise code already exists" 
      }, { status: 409 })
    }

    // Create franchise
    const { data, error } = await supabase
      .from("franchises")
      .insert({
        code,
        name,
        owner_name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        is_active,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error("[Franchises API] Error creating franchise:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error: any) {
    console.error("[Franchises API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

/**
 * PUT /api/franchises
 * Update a franchise (super admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user
    const { isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only super admin can update franchises
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: "Forbidden: Only super admin can update franchises" 
      }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Missing franchise ID" }, { status: 400 })
    }

    // Update franchise
    const { data, error } = await supabase
      .from("franchises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Franchises API] Error updating franchise:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error: any) {
    console.error("[Franchises API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}
