import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const { data: user, error } = await supabaseServer
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
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category_id = searchParams.get("category_id")
    const include_variants = searchParams.get("include_variants") === "true"

    let query = supabaseServer
      .from("package_sets")
      .select(`
        *,
        packages_categories (
          id,
          name,
          description
        )
        ${include_variants ? `, package_variants (*)` : ''}
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    // 🔒 FRANCHISE ISOLATION: Super admin sees all, others see only their franchise
    if (!isSuperAdmin && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    if (category_id) {
      query = query.eq("category_id", category_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching packages:", error)
      return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })

  } catch (error) {
    console.error("Package API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const {
      name,
      description,
      base_price,
      package_type,
      category_id,
      display_order = 1,
      variants = [],
      security_deposit,
      extra_safa_price,
    } = body

    // 🔒 FRANCHISE ISOLATION: Auto-assign franchise_id from session (super admin can override)
    const packageFranchiseId = isSuperAdmin && body.franchise_id 
      ? body.franchise_id 
      : franchiseId

    // Create the package
    const { data: packageData, error: packageError } = await supabaseServer
      .from("package_sets")
      .insert({
        name,
        description,
        base_price,
        package_type,
        category_id,
        franchise_id: packageFranchiseId,
        display_order,
        created_by: userId,
        security_deposit,
        extra_safa_price,
        is_active: true
      })
      .select()
      .single()

    if (packageError) {
      console.error("Error creating package:", packageError)
      return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
    }

    // Create variants if provided
    if (variants.length > 0) {
      const variantInserts = variants.map((variant: any) => ({
        ...variant,
        package_id: packageData.id,
        is_active: true
      }))

      const { error: variantError } = await supabaseServer
        .from("package_variants")
        .insert(variantInserts)

      if (variantError) {
        console.error("Error creating variants:", variantError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ success: true, data: packageData })

  } catch (error) {
    console.error("Package creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}