import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Reuse the same session helper used in other staff APIs
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

/**
 * POST /api/staff/toggle-status
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  console.log('[Toggle Status Fallback] === REQUEST RECEIVED ===')
  try {
    // Authenticate
    let auth
    try {
      auth = await getUserFromSession(request)
      console.log('[Toggle Status Fallback] Auth OK for user:', auth.userId)
    } catch (authErr) {
      console.error('[Toggle Status Fallback] Auth failed:', authErr)
      return NextResponse.json({ error: 'Authentication required. Please login again.' }, { status: 401 })
    }

    const { franchiseId, isSuperAdmin } = auth

    // Parse body
    const body = await request.json().catch(() => null as any)
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Load target user and verify franchise
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, is_active, franchise_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('[Toggle Status Fallback] Fetch error:', fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch staff member' }, { status: 500 })
    }

    if (!isSuperAdmin && targetUser.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Unauthorized: Can only toggle staff in your own franchise' }, { status: 403 })
    }

    // Toggle
    const newStatus = !targetUser.is_active

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`*, franchise:franchises(name, code)`) // keep response shape consistent
      .single()

    if (updateError) {
      console.error('[Toggle Status Fallback] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update staff status' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`,
        user: data,
      },
      { headers: { 'x-route': 'fallback' } }
    )
  } catch (error) {
    console.error('[Toggle Status Fallback] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
