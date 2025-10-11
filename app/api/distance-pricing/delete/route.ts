import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getUser(request: NextRequest) {
  const cookieHeader = request.cookies.get('safawala_session')
  if (!cookieHeader?.value) throw new Error('Authentication required')
  let session
  try { session = JSON.parse(cookieHeader.value) } catch { throw new Error('Authentication required') }
  if (!session?.id) throw new Error('Authentication required')
  const supabase = createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, franchise_id, role, is_active')
    .eq('id', session.id)
    .single()
  if (error || !user || user.is_active === false) throw new Error('Authentication required')
  return { userId: user.id as string, franchiseId: user.franchise_id as string | null, role: user.role as string, isSuperAdmin: user.role === 'super_admin' }
}

export async function POST(request: NextRequest) {
  try {
    const { franchiseId, role, isSuperAdmin } = await getUser(request)
    if (!['super_admin', 'franchise_admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid id is required' }, { status: 400 })
    }

    const supabase = createClient()

    // If franchise_id column exists, enforce tenant check
    const { error: probeErr } = await supabase.from('distance_pricing').select('franchise_id').limit(1)
    const hasFranchise = !probeErr
    if (hasFranchise && !isSuperAdmin) {
      const { data: existing, error: fetchErr } = await supabase
        .from('distance_pricing')
        .select('id, franchise_id')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (existing && existing.franchise_id && existing.franchise_id !== franchiseId) {
        return NextResponse.json({ error: "You don't have access to delete this pricing" }, { status: 403 })
      }
    }

    const { error: delErr } = await supabase.from('distance_pricing').delete().eq('id', id)
    if (delErr) throw delErr

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Distance Pricing Delete] Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete distance pricing' }, { status: error?.message === 'Authentication required' ? 401 : 500 })
  }
}
