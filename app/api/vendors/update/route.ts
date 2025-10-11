import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

// POST /api/vendors/update - Update vendor by id (body contains id + fields)
export async function POST(request: NextRequest) {
  try {
    const { franchiseId, role, isSuperAdmin } = await getUserFromSession(request)

    if (!["super_admin", "franchise_admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to update vendors" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

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

    const supabase = createClient()

    // Fetch existing vendor
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

    // Allow updating even if vendor is inactive (so reactivation and edits are possible)

    // Authorize by franchise if column exists
    if (!isSuperAdmin && Object.prototype.hasOwnProperty.call(existingVendor, 'franchise_id') && existingVendor.franchise_id && existingVendor.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "You don't have access to update this vendor" },
        { status: 403 }
      )
    }

    // Duplicate name check (if name provided and franchise column exists)
    if (body.name && body.name !== existingVendor.name) {
      try {
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
      } catch (dupError: any) {
        const msg = dupError.message?.toLowerCase() || ""
        if (msg.includes("column") && msg.includes("franchise_id")) {
          // Skip if column missing
        } else {
          throw dupError
        }
      }
    }

    // Build update data
    const coreUpdateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (body.name !== undefined) coreUpdateData.name = body.name
    if (body.phone !== undefined) coreUpdateData.phone = body.phone
    if (body.email !== undefined) coreUpdateData.email = body.email
    if (body.address !== undefined) coreUpdateData.address = body.address
    if (body.gst_number !== undefined) coreUpdateData.gst_number = body.gst_number

    const enhancedUpdateData = { ...coreUpdateData }
    if (body.contact_person !== undefined) (enhancedUpdateData as any).contact_person = body.contact_person
    if (body.pricing_per_item !== undefined) (enhancedUpdateData as any).pricing_per_item = body.pricing_per_item
    if (body.notes !== undefined) (enhancedUpdateData as any).notes = body.notes
    if (body.is_active !== undefined) (enhancedUpdateData as any).is_active = body.is_active

    // Try enhanced update, fall back to core
    const { data, error } = await supabase
      .from("vendors")
      .update(enhancedUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      const msg = error.message?.toLowerCase() || ""
      if (msg.includes("column") || msg.includes("does not exist")) {
        const { data: retryData, error: retryError } = await supabase
          .from("vendors")
          .update(coreUpdateData)
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
    console.error("[Vendors API] UPDATE error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    )
  }
}
