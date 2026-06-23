import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: 'staff' })
    if (!auth.authorized) return NextResponse.json(auth.error, { status: auth.statusCode || 401 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 200)
    const userId = searchParams.get('user_id') || auth.user!.id
    const franchiseId = auth.user!.franchise_id
    const isSuperAdmin = auth.user!.is_super_admin

    let query = supabaseServer
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    // Staff can only see their own records; admins can filter by user_id or see franchise-wide
    if (!isSuperAdmin && auth.user!.role !== 'franchise_admin') {
      query = query.eq('user_id', auth.user!.id)
    } else if (userId && userId !== 'all') {
      query = query.eq('user_id', userId)
    }

    if (franchiseId && !isSuperAdmin) {
      query = query.eq('franchise_id', franchiseId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: 'staff' })
    if (!auth.authorized) return NextResponse.json(auth.error, { status: auth.statusCode || 401 })

    const body = await request.json()
    const { date, status = 'present', check_in, check_out, notes } = body

    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    const userId = auth.user!.id
    const franchiseId = auth.user!.franchise_id

    // Check if already marked for today
    const { data: existing } = await supabaseServer
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (existing) {
      const { data, error } = await supabaseServer
        .from('attendance')
        .update({ status, check_in: check_in || existing, check_out: check_out || null, notes: notes || null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data, updated: true })
    }

    const { data, error } = await supabaseServer
      .from('attendance')
      .insert({
        user_id: userId,
        franchise_id: franchiseId,
        date,
        status,
        check_in: check_in || new Date().toISOString(),
        check_out: check_out || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
