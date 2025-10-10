import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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
    const { data: user, error } = await supabaseAdmin
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

export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.base_price) {
      return NextResponse.json({ error: "Name and base price are required" }, { status: 400 })
    }

    // 🔒 FRANCHISE ISOLATION: Auto-assign franchise_id from session (super admin can override)
    const serviceFranchiseId = isSuperAdmin && body.franchise_id 
      ? body.franchise_id 
      : franchiseId

    // Create service using admin client (bypasses RLS for creation)
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert({
        name: body.name,
        description: body.description || "",
        base_price: Number.parseFloat(body.base_price) || 0,
        service_category: body.service_category || "other",
        vendor_id: body.vendor_id || null,
        franchise_id: serviceFranchiseId,
        is_active: true,
        duration_minutes: body.duration_minutes || 60,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating service:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
