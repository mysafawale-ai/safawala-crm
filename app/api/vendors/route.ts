import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

/**
 * GET /api/vendors - List vendors with franchise isolation
 */
export async function GET(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin } = await getUserFromSession(request)
    const supabase = createClient()

    console.log(`[Vendors API] Fetching vendors for franchise: ${franchiseId}, isSuperAdmin: ${isSuperAdmin}`)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // 'active', 'inactive', or 'all'

    let query = supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false })

    // Franchise isolation: super_admin sees all, others see only their franchise
    if (!isSuperAdmin && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    // Try to filter by is_active column (may not exist in production yet)
    try {
      if (status === "active") {
        query = query.eq("is_active", true)
      } else if (status === "inactive") {
        query = query.eq("is_active", false)
      } else if (!status || status === "all") {
        // Default: show only active vendors
        query = query.eq("is_active", true)
      }
      
      const { data, error } = await query

      if (error) {
        // If error is about missing column, retry without is_active filter
        if (error.message?.includes("column") && error.message?.includes("is_active")) {
          console.log("[Vendors API] is_active column not found, retrying without filter")
          query = supabase
            .from("vendors")
            .select("*")
            .order("created_at", { ascending: false })
          
          if (!isSuperAdmin && franchiseId) {
            query = query.eq("franchise_id", franchiseId)
          }
          
          const { data: retryData, error: retryError } = await query
          if (retryError) throw retryError
          
          return NextResponse.json({ 
            vendors: retryData || [],
            warning: "is_active filtering not available - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
          })
        }
        throw error
      }

      return NextResponse.json({ vendors: data || [] })
    } catch (error: any) {
      // Fallback for missing is_active column
      if (error.message?.includes("column") && error.message?.includes("is_active")) {
        console.log("[Vendors API] Fallback: fetching vendors without is_active filter")
        let fallbackQuery = supabase
          .from("vendors")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (!isSuperAdmin && franchiseId) {
          fallbackQuery = fallbackQuery.eq("franchise_id", franchiseId)
        }
        
        const { data, error: fallbackError } = await fallbackQuery
        if (fallbackError) throw fallbackError
        
        return NextResponse.json({ 
          vendors: data || [],
          warning: "is_active filtering not available - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error("[Vendors API] GET error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendors" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}

/**
 * POST /api/vendors - Create a new vendor with franchise isolation
 */
export async function POST(request: NextRequest) {
  try {
    const { franchiseId, userId, role } = await getUserFromSession(request)
    
    // Only allow staff and above to create vendors
    if (!["super_admin", "franchise_admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to create vendors" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const supabase = createClient()

    console.log(`[Vendors API] Creating vendor for franchise: ${franchiseId}, user: ${userId}`)

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      )
    }

    // Check for duplicate vendor name in same franchise
    const { data: existing } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("name", body.name)
      .eq("franchise_id", franchiseId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: `Vendor "${body.name}" already exists in your franchise` },
        { status: 409 }
      )
    }

    // Prepare vendor data with franchise isolation
    const vendorData: any = {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      franchise_id: franchiseId, // Always use user's franchise
    }

    // Add optional fields if columns exist (graceful degradation)
    if (body.contact_person !== undefined) {
      vendorData.contact_person = body.contact_person
    }
    if (body.pricing_per_item !== undefined) {
      vendorData.pricing_per_item = body.pricing_per_item
    }
    if (body.notes !== undefined) {
      vendorData.notes = body.notes
    }
    if (body.gst_number !== undefined) {
      vendorData.gst_number = body.gst_number
    }

    // Try to set is_active flag (fallback if column doesn't exist)
    try {
      vendorData.is_active = true
      
      const { data, error } = await supabase
        .from("vendors")
        .insert([vendorData])
        .select()
        .single()

      if (error) {
        // If error is about missing column, retry without that field
        if (error.message?.includes("column")) {
          console.log("[Vendors API] Some columns missing, retrying with minimal data")
          
          // Retry with only core columns that definitely exist
          const minimalData: any = {
            name: body.name,
            phone: body.phone || null,
            email: body.email || null,
            address: body.address || null,
            franchise_id: franchiseId,
          }

          // Try adding gst_number if it exists
          if (body.gst_number) {
            minimalData.gst_number = body.gst_number
          }

          const { data: retryData, error: retryError } = await supabase
            .from("vendors")
            .insert([minimalData])
            .select()
            .single()

          if (retryError) throw retryError

          return NextResponse.json({
            vendor: retryData,
            warning: "Some fields not saved - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
          }, { status: 201 })
        }
        throw error
      }

      return NextResponse.json({ vendor: data }, { status: 201 })
    } catch (error: any) {
      console.error("[Vendors API] POST error:", error)
      
      // Additional fallback for column errors
      if (error.message?.includes("column")) {
        const minimalData: any = {
          name: body.name,
          phone: body.phone || null,
          email: body.email || null,
          address: body.address || null,
          franchise_id: franchiseId,
        }

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("vendors")
          .insert([minimalData])
          .select()
          .single()

        if (fallbackError) throw fallbackError

        return NextResponse.json({
          vendor: fallbackData,
          warning: "Partial data saved - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
        }, { status: 201 })
      }

      throw error
    }
  } catch (error: any) {
    console.error("[Vendors API] POST error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create vendor" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}
