import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get('safawala_session')
    if (!cookieHeader?.value) throw new Error('No session')
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) throw new Error('Invalid session')
    const supabase = createClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', sessionData.id)
      .eq('is_active', true)
      .single()
    if (!user) throw new Error('User not found')
    return { isSuperAdmin: user.role === 'super_admin' }
  } catch {
    throw new Error('Authentication required')
  }
}

// GET /api/settings/company/all - super admin only
export async function GET(request: NextRequest) {
  try {
    const { isSuperAdmin } = await getUserFromSession(request)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('company_settings')
      .select('*, franchise:franchises(id, name, code)')
      .order('franchise_id')

    if (error) {
      console.error('[Settings All] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}
