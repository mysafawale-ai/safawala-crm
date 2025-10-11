import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
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
 * POST /api/staff/[id]/toggle-status
 * Toggle a staff member's active status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[Toggle Status API] === REQUEST RECEIVED ===')
  console.log('[Toggle Status API] Params:', params)
  console.log('[Toggle Status API] URL:', request.url)
  
  try {
    console.log('[Toggle Status] Starting request for user:', params.id)
    
    // 🔒 SECURITY: Authenticate user
    let authContext
    try {
      authContext = await getUserFromSession(request)
      console.log('[Toggle Status] Auth successful:', authContext.userId)
    } catch (authError) {
      console.error('[Toggle Status] Auth failed:', authError)
      return NextResponse.json({ 
        error: "Authentication required. Please login again." 
      }, { status: 401 })
    }
    
    const { franchiseId, isSuperAdmin } = authContext
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    // Use service role client for admin operations
    const supabase = createClient()
    
    // Get current user and verify franchise access
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("is_active, franchise_id")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      console.error("Error fetching staff member:", fetchError)
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch staff member" }, { status: 500 })
    }
    
    // 🔒 FRANCHISE ISOLATION: Non-super-admins can only toggle staff in their franchise
    if (!isSuperAdmin && currentUser.franchise_id !== franchiseId) {
      return NextResponse.json(
        { error: "Unauthorized: Can only toggle staff in your own franchise" },
        { status: 403 }
      )
    }
    
    // Toggle status
    const newStatus = !currentUser.is_active
    
    const { data, error } = await supabase
      .from("users")
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        franchise:franchises(name, code)
      `)
      .single()
    
    if (error) {
      console.error("Error toggling staff status:", error)
      return NextResponse.json({ error: "Failed to update staff status" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`, 
      user: data 
    })
  } catch (error) {
    console.error("Error in staff toggle-status route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}