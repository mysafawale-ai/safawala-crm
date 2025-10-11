import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getUserFromSession(cookies: any) {
  try {
    const cookieHeader = cookies.get('safawala_session')
    if (!cookieHeader?.value) throw new Error('No session')
    const sessionData = JSON.parse(cookieHeader.value)
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('id, franchise_id, role')
      .eq('id', sessionData.id)
      .eq('is_active', true)
      .single()
    if (error || !user) throw new Error('Auth failed')
    return { userId: user.id, franchiseId: user.franchise_id, isSuperAdmin: user.role === 'super_admin' }
  } catch {
    throw new Error('Authentication required')
  }
}

export async function POST(request: Request) {
  try {
    // @ts-ignore - NextRequest-like cookies API
    const { franchiseId, isSuperAdmin } = await getUserFromSession((request as any).cookies)
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing package id' }, { status: 400 })

    if (!isSuperAdmin && franchiseId) {
      const { data: pkg, error: fetchErr } = await supabaseServer
        .from('package_sets')
        .select('id, franchise_id')
        .eq('id', id)
        .single()
      if (fetchErr || !pkg || pkg.franchise_id !== franchiseId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Hard delete package and cascade manual cleanups if needed
    const { error } = await supabaseServer
      .from('package_sets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Package delete error:', error)
      return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Package delete API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
