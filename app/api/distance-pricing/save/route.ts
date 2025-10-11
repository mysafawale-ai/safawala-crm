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

    const body = await request.json()
    const { id, variant_id, distance_range, min_km, max_km, base_price_addition, is_active = true } = body || {}

    if (!variant_id || typeof variant_id !== 'string') {
      return NextResponse.json({ error: 'variant_id is required' }, { status: 400 })
    }
    if (typeof distance_range !== 'string' || !distance_range.trim()) {
      return NextResponse.json({ error: 'distance_range is required' }, { status: 400 })
    }
    if (!Number.isFinite(min_km) || !Number.isFinite(max_km) || min_km < 0 || max_km <= min_km) {
      return NextResponse.json({ error: 'Invalid min_km/max_km' }, { status: 400 })
    }
    if (!Number.isFinite(base_price_addition) || base_price_addition < 0) {
      return NextResponse.json({ error: 'Invalid base_price_addition' }, { status: 400 })
    }

    const supabase = createClient()

    const now = new Date().toISOString()

    // Safely detect which columns exist by probing with select
    async function has(name: string) {
      const { error } = await supabase.from('distance_pricing').select(name).limit(1)
      return !error
    }
    const [hasBaseAdd, hasExtraPrice, hasPriceMult, hasMinKm, hasMaxKm, hasFranchise, hasCreatedAt, hasUpdatedAt, hasIsActive, hasDistanceRange, hasVariantId] = await Promise.all([
      has('base_price_addition'),
      has('extra_price'),
      has('price_multiplier'),
      has('min_km'),
      has('max_km'),
      has('franchise_id'),
      has('created_at'),
      has('updated_at'),
      has('is_active'),
      has('distance_range'),
      has('variant_id'),
    ])

    const dataToSave: any = {}
    if (hasVariantId) dataToSave.variant_id = variant_id
    if (hasDistanceRange) dataToSave.distance_range = distance_range.trim()
    if (hasMinKm) dataToSave.min_km = min_km
    if (hasMaxKm) dataToSave.max_km = max_km
    if (hasIsActive) dataToSave.is_active = is_active
    if (hasUpdatedAt) dataToSave.updated_at = now
    // Price columns variants
    if (hasBaseAdd) dataToSave.base_price_addition = base_price_addition
    else if (hasExtraPrice) {
      dataToSave.extra_price = base_price_addition
      if (hasPriceMult && dataToSave.price_multiplier === undefined) dataToSave.price_multiplier = 1.0
    }
    if (franchiseId && hasFranchise) dataToSave.franchise_id = franchiseId

    if (id) {
      // Update
      const updateData = { ...dataToSave }
      // Optional authorization: ensure same franchise when column exists
      if (hasFranchise && !isSuperAdmin) {
        const { data: existing, error: fetchErr } = await supabase
          .from('distance_pricing')
          .select('id, franchise_id')
          .eq('id', id)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (existing && existing.franchise_id && existing.franchise_id !== franchiseId) {
          return NextResponse.json({ error: "You don't have access to update this pricing" }, { status: 403 })
        }
      }

      const { data, error } = await supabase
        .from('distance_pricing')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, pricing: data })
    } else {
      // Create
  const insertData = { ...dataToSave }
  if (hasCreatedAt) insertData.created_at = now
      const { data, error } = await supabase
        .from('distance_pricing')
        .insert(insertData)
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, pricing: data })
    }
  } catch (error: any) {
    console.error('[Distance Pricing Save] Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save distance pricing' }, { status: error?.message === 'Authentication required' ? 401 : 500 })
  }
}
