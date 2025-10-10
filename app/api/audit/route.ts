import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/audit - record an audit entry
// Body: { entity_type, entity_id, action, changes?, actor_id?, actor_role? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entity_type, entity_id, action, changes, actor_id, actor_role } = body || {}

    if (!entity_type || !entity_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const insert = {
      entity_type,
      entity_id,
      action,
      changes: changes || null,
      actor_id: actor_id || null,
      actor_role: actor_role || null
    }

    const { data, error } = await supabase.from('expense_audit').insert(insert).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('POST /api/audit error', e)
    return NextResponse.json({ error: 'Failed to write audit entry' }, { status: 500 })
  }
}
