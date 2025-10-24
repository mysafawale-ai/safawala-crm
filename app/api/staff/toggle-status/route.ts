import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/staff/toggle-status
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  console.log('[Toggle Status Fallback] === REQUEST RECEIVED ===')
  try {
    // 🔒 SECURITY: Authenticate user with franchise_admin role + staff permission
    const auth = await authenticateRequest(request, {
      minRole: 'franchise_admin',
      requirePermission: 'staff'
    })
    
    if (!auth.authorized) {
      console.error('[Toggle Status Fallback] Auth failed')
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }

    const { user } = auth
    console.log('[Toggle Status Fallback] Auth OK for user:', user!.id)

    // Parse body
    const body = await request.json().catch(() => null as any)
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Load target user and verify franchise
    const { data: targetUser, error: fetchError } = await supabaseServer
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

    if (user!.role !== 'super_admin' && targetUser.franchise_id !== user!.franchise_id) {
      return NextResponse.json({ error: 'Unauthorized: Can only toggle staff in your own franchise' }, { status: 403 })
    }

    // Toggle
    const newStatus = !targetUser.is_active

    const { data, error: updateError } = await supabaseServer
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
