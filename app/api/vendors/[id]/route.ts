import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: {
    id: string
  }
}

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
 * GET /api/vendors/[id] - Get vendor by ID with franchise authorization
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { franchiseId, isSuperAdmin } = await getUserFromSession(request)
    const supabase = createClient()

    const { id } = params

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid vendor ID is required" },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid vendor ID format" },
        { status: 400 }
      )
    }

    console.log(`[Vendors API] Fetching vendor ${id} for franchise: ${franchiseId}`)

    // 1) Fetch vendor by ID first (no franchise filter to avoid false 404s)
    let query = supabase
      .from("vendors")
      .select("*")
      .eq("id", id)

    // Try to filter by is_active (may not exist yet)
    try {
      query = query.eq("is_active", true)
      
      let { data: vendor, error } = await query.single()

      // Fallback if is_active column missing
      if (error && error.message?.includes("is_active")) {
        console.log("[Vendors API] is_active column missing, retrying without filter")
        const retry = await supabase
          .from("vendors")
          .select("*")
          .eq("id", id)
          .single()
        vendor = retry.data
        error = retry.error
      }

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Vendor not found" },
            { status: 404 }
          )
        }
        throw error
      }

      // 2) Now authorize by checking vendor's franchise_id
      if (!isSuperAdmin && vendor.franchise_id !== franchiseId) {
        return NextResponse.json(
          { error: "You don't have access to this vendor" },
          { status: 403 }
        )
      }

      return NextResponse.json({ vendor })
    } catch (error: any) {
      // Additional fallback for column errors
      if (error.message?.includes("column")) {
        const { data: vendor, error: fallbackError } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", id)
          .single()

        if (fallbackError) {
          if (fallbackError.code === "PGRST116") {
            return NextResponse.json(
              { error: "Vendor not found" },
              { status: 404 }
            )
          }
          throw fallbackError
        }

        // Authorize by franchise
        if (!isSuperAdmin && vendor.franchise_id !== franchiseId) {
          return NextResponse.json(
            { error: "You don't have access to this vendor" },
            { status: 403 }
          )
        }

        return NextResponse.json({ 
          vendor,
          warning: "Run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error("[Vendors API] GET error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendor" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}

/**
 * PUT /api/vendors/[id] - Update vendor with franchise authorization
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { franchiseId, userId, role, isSuperAdmin } = await getUserFromSession(request)
    
    // Only allow staff and above to update vendors
    if (!["super_admin", "franchise_admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to update vendors" },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { id } = params

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid vendor ID is required" },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid vendor ID format" },
        { status: 400 }
      )
    }

    const body = await request.json()

    console.log(`[Vendors API] Updating vendor ${id} for franchise: ${franchiseId}`)

    // 1) Fetch existing vendor first
    const { data: existingVendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // 2) Check if vendor is inactive (if column exists)
    if (existingVendor.is_active === false) {
      return NextResponse.json(
        { error: "Cannot update inactive vendor" },
        { status: 400 }
      )
    }

    // 3) Authorize by vendor's franchise_id
    if (!isSuperAdmin && existingVendor.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "You don't have access to update this vendor" },
        { status: 403 }
      )
    }

    // Validate name if provided
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Vendor name must be a non-empty string" },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (body.phone !== undefined && body.phone && typeof body.phone !== "string") {
      return NextResponse.json(
        { error: "Phone must be a string" },
        { status: 400 }
      )
    }

    // Check for duplicate name in same franchise (if changing name)
    if (body.name && body.name !== existingVendor.name) {
      const { data: duplicate } = await supabase
        .from("vendors")
        .select("id")
        .eq("name", body.name)
        .eq("franchise_id", franchiseId)
        .neq("id", id)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json(
          { error: `Vendor "${body.name}" already exists in your franchise` },
          { status: 409 }
        )
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person
    if (body.pricing_per_item !== undefined) updateData.pricing_per_item = body.pricing_per_item
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.gst_number !== undefined) updateData.gst_number = body.gst_number

    // Try update with all fields
    try {
      const { data, error } = await supabase
        .from("vendors")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        // If column error, retry with minimal fields
        if (error.message?.includes("column")) {
          console.log("[Vendors API] Some columns missing, retrying with core fields")
          
          const minimalUpdate: any = {
            updated_at: new Date().toISOString(),
          }
          if (body.name !== undefined) minimalUpdate.name = body.name
          if (body.phone !== undefined) minimalUpdate.phone = body.phone
          if (body.email !== undefined) minimalUpdate.email = body.email
          if (body.address !== undefined) minimalUpdate.address = body.address
          if (body.gst_number !== undefined) minimalUpdate.gst_number = body.gst_number

          const { data: retryData, error: retryError } = await supabase
            .from("vendors")
            .update(minimalUpdate)
            .eq("id", id)
            .select()
            .single()

          if (retryError) throw retryError

          return NextResponse.json({
            vendor: retryData,
            warning: "Some fields not saved - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
          })
        }
        throw error
      }

      return NextResponse.json({ vendor: data })
    } catch (error: any) {
      console.error("[Vendors API] PUT error:", error)
      throw error
    }
  } catch (error: any) {
    console.error("[Vendors API] PUT error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/vendors/[id] - Soft delete vendor with franchise authorization
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { franchiseId, userId, role, isSuperAdmin } = await getUserFromSession(request)
    
    // Only allow staff and above to delete vendors
    if (!["super_admin", "franchise_admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete vendors" },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { id } = params

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid vendor ID is required" },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid vendor ID format" },
        { status: 400 }
      )
    }

    console.log(`[Vendors API] Deleting vendor ${id} for franchise: ${franchiseId}, user: ${userId}`)

    // 1) Fetch existing vendor first
    const { data: existingVendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // 2) Authorize by vendor's franchise_id
    if (!isSuperAdmin && existingVendor.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "You don't have access to delete this vendor" },
        { status: 403 }
      )
    }

    // 3) Check for active purchases (prevent deleting vendor with pending orders)
    const { data: activePurchases, error: purchaseError } = await supabase
      .from("purchases")
      .select("id")
      .eq("vendor_id", id)
      .in("status", ["pending", "partial"])
      .limit(1)

    if (purchaseError) {
      console.error("[Vendors API] Error checking purchases:", purchaseError)
      // Continue with deletion even if check fails
    } else if (activePurchases && activePurchases.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete vendor with active purchases. Complete or cancel purchases first." },
        { status: 409 }
      )
    }

    // 4) Try soft delete (set is_active = false)
    try {
      const { data, error } = await supabase
        .from("vendors")
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        // If is_active column doesn't exist, do hard delete as fallback
        if (error.message?.includes("is_active") || error.message?.includes("column")) {
          console.log("[Vendors API] is_active column missing, performing hard delete")
          
          const { error: deleteError } = await supabase
            .from("vendors")
            .delete()
            .eq("id", id)

          if (deleteError) throw deleteError

          return NextResponse.json({
            message: "Vendor deleted successfully (hard delete)",
            warning: "Soft delete not available - run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql"
          })
        }
        throw error
      }

      return NextResponse.json({
        message: "Vendor deleted successfully",
        vendor: data
      })
    } catch (error: any) {
      // Final fallback: hard delete
      if (error.message?.includes("column")) {
        const { error: deleteError } = await supabase
          .from("vendors")
          .delete()
          .eq("id", id)

        if (deleteError) throw deleteError

        return NextResponse.json({
          message: "Vendor deleted successfully",
          warning: "Run migration ADD_VENDORS_FRANCHISE_ISOLATION.sql for soft delete support"
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error("[Vendors API] DELETE error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete vendor" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}
