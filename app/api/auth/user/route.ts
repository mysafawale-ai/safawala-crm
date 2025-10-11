import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

// Supabase client is lazy via supabaseServer

/**
 * GET /api/auth/user
 * Get current user info from session cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const cookieHeader = request.cookies.get("safawala_session")
    
    if (!cookieHeader?.value) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      )
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    
    if (!sessionData.id) {
      return NextResponse.json(
        { error: "Invalid session" }, 
        { status: 401 }
      )
    }

    // Fetch fresh user data from database
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        franchise_id,
        is_active,
        permissions,
        created_at,
        updated_at,
        franchises!inner (
          id,
          name,
          code,
          city
        )
      `)
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // Franchises is an array, get the first one
    const franchise = Array.isArray(user.franchises) ? user.franchises[0] : user.franchises

    // Return user with franchise info
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      franchise_id: user.franchise_id,
      franchise_name: franchise?.name || null,
      franchise_code: franchise?.code || null,
      franchise_city: franchise?.city || null,
      is_active: user.is_active,
      permissions: user.permissions || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
      isSuperAdmin: user.role === "super_admin",
    })

  } catch (error: any) {
    console.error("[Auth User API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}
