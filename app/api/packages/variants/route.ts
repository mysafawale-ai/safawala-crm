import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getUser(request: NextRequest) {
  console.log('[Variants API] All cookies:', request.cookies.getAll())
  const cookieHeader = request.cookies.get('safawala_session')
  console.log('[Variants API] safawala_session cookie:', cookieHeader)
  if (!cookieHeader?.value) throw new Error('Authentication required')
  let session
  try { session = JSON.parse(cookieHeader.value) } catch (e) { 
    console.log('[Variants API] Cookie parse error:', e)
    throw new Error('Authentication required') 
  }
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

// GET /api/packages/variants
// Returns active package variants with franchise isolation
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'readonly')
    if (!auth.success) {
      return NextResponse.json(auth.response, { status: 401 })
    }
    const user = auth.authContext!.user
    const franchiseId = user.franchise_id || null
    const isSuperAdmin = user.role === 'super_admin'
    const supabase = createClient()

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const includeLegacy = (searchParams.get('include_legacy') ?? 'true') === 'true'
    const includeInactive = (searchParams.get('include_inactive') ?? 'false') === 'true'

    let query = supabase
      .from('package_variants')
      .select('*')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    // Franchise isolation: super admin sees all, others see own or null (legacy)
    if (!isSuperAdmin && franchiseId) {
      query = query.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
    }

    // Optional category filter; support legacy package_id linkage
    if (categoryId) {
      if (includeLegacy) {
        query = query.or(`category_id.eq.${categoryId},package_id.eq.${categoryId}`)
      } else {
        query = query.eq('category_id', categoryId)
      }
    }

    const { data, error } = await query.order('display_order', { ascending: true })
    if (error) {
      console.error('[Variants API] GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('[Variants API] GET Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Authentication required' },
      { status: error?.message === 'Authentication required' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { franchiseId, role, isSuperAdmin } = await getUser(request)
    if (!['super_admin', 'franchise_admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      base_price,
      extra_safa_price,
      missing_safa_penalty,
      deposit_amount,
      inclusions,
      category_id,
      package_id,
      franchise_id: bodyFranchiseId,
      is_active = true,
      display_order 
    } = body || {}

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Variant name is required' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Variant description is required' }, { status: 400 })
    }
    if (!category_id || typeof category_id !== 'string') {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    }

    const basePriceNum = Number(base_price)
    if (isNaN(basePriceNum) || basePriceNum < 0) {
      return NextResponse.json({ error: 'Invalid base_price' }, { status: 400 })
    }

    const extraSafaPriceNum = Number(extra_safa_price || 0)
    const missingSafaPenaltyNum = Number(missing_safa_penalty || 0)
    const depositAmountNum = Number(deposit_amount || 0)

    if (isNaN(extraSafaPriceNum) || extraSafaPriceNum < 0) {
      return NextResponse.json({ error: 'Invalid extra_safa_price' }, { status: 400 })
    }
    if (isNaN(missingSafaPenaltyNum) || missingSafaPenaltyNum < 0) {
      return NextResponse.json({ error: 'Invalid missing_safa_penalty' }, { status: 400 })
    }
    if (isNaN(depositAmountNum) || depositAmountNum < 0) {
      return NextResponse.json({ error: 'Invalid deposit_amount' }, { status: 400 })
    }

    // Process inclusions
    let inclusionsArray: string[] = []
    if (Array.isArray(inclusions)) {
      inclusionsArray = inclusions.filter(item => typeof item === 'string' && item.trim())
    } else if (typeof inclusions === 'string' && inclusions.trim()) {
      inclusionsArray = inclusions.split(',').map(item => item.trim()).filter(item => item)
    }

    const supabase = createClient()
    const now = new Date().toISOString()

    // Use franchise_id from body if provided, otherwise use from user session
    const finalFranchiseId = bodyFranchiseId || franchiseId

    const insertData: any = {
      name: name.trim(),
      description: description.trim(),
      base_price: basePriceNum,
      extra_safa_price: extraSafaPriceNum,
      missing_safa_penalty: missingSafaPenaltyNum,
      deposit_amount: depositAmountNum,
      inclusions: inclusionsArray,
      category_id,
      package_id: package_id || category_id, // For backward compat
      franchise_id: finalFranchiseId,
      is_active,
      display_order: display_order || 0,
      created_at: now,
      updated_at: now
    }

    const { data, error } = await supabase
      .from('package_variants')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('[Variants API] Insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Variants API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create variant' }, 
      { status: error?.message === 'Authentication required' ? 401 : 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { franchiseId, role, isSuperAdmin } = await getUser(request)
    if (!['super_admin', 'franchise_admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id,
      name, 
      description, 
      base_price,
      extra_safa_price,
      missing_safa_penalty,
      deposit_amount,
      inclusions,
      category_id,
      is_active,
      display_order 
    } = body || {}

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Variant id is required' }, { status: 400 })
    }

    // Validation
    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      return NextResponse.json({ error: 'Invalid variant name' }, { status: 400 })
    }
    if (description !== undefined && (!description || typeof description !== 'string' || !description.trim())) {
      return NextResponse.json({ error: 'Invalid variant description' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if variant exists and user has access
    if (!isSuperAdmin) {
      const { data: existing, error: fetchErr } = await supabase
        .from('package_variants')
        .select('id, franchise_id')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (existing && existing.franchise_id && existing.franchise_id !== franchiseId) {
        return NextResponse.json({ error: "You don't have access to update this variant" }, { status: 403 })
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (base_price !== undefined) {
      const basePriceNum = Number(base_price)
      if (isNaN(basePriceNum) || basePriceNum < 0) {
        return NextResponse.json({ error: 'Invalid base_price' }, { status: 400 })
      }
      updateData.base_price = basePriceNum
    }
    if (extra_safa_price !== undefined) {
      const extraSafaPriceNum = Number(extra_safa_price)
      if (isNaN(extraSafaPriceNum) || extraSafaPriceNum < 0) {
        return NextResponse.json({ error: 'Invalid extra_safa_price' }, { status: 400 })
      }
      updateData.extra_safa_price = extraSafaPriceNum
    }
    if (missing_safa_penalty !== undefined) {
      const missingSafaPenaltyNum = Number(missing_safa_penalty)
      if (isNaN(missingSafaPenaltyNum) || missingSafaPenaltyNum < 0) {
        return NextResponse.json({ error: 'Invalid missing_safa_penalty' }, { status: 400 })
      }
      updateData.missing_safa_penalty = missingSafaPenaltyNum
    }
    if (deposit_amount !== undefined) {
      const depositAmountNum = Number(deposit_amount)
      if (isNaN(depositAmountNum) || depositAmountNum < 0) {
        return NextResponse.json({ error: 'Invalid deposit_amount' }, { status: 400 })
      }
      updateData.deposit_amount = depositAmountNum
    }
    if (inclusions !== undefined) {
      let inclusionsArray: string[] = []
      if (Array.isArray(inclusions)) {
        inclusionsArray = inclusions.filter(item => typeof item === 'string' && item.trim())
      } else if (typeof inclusions === 'string' && inclusions.trim()) {
        inclusionsArray = inclusions.split(',').map(item => item.trim()).filter(item => item)
      }
      updateData.inclusions = inclusionsArray
    }
    if (category_id !== undefined) updateData.category_id = category_id
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    const { data, error } = await supabase
      .from('package_variants')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[Variants API] Update error:', error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Variants API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update variant' }, 
      { status: error?.message === 'Authentication required' ? 401 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin } = await getUser(request)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Variant id is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if variant exists and user has access
    if (!isSuperAdmin) {
      const { data: existing, error: fetchErr } = await supabase
        .from('package_variants')
        .select('id, franchise_id')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (!existing) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
      }
      if (existing.franchise_id && existing.franchise_id !== franchiseId) {
        return NextResponse.json({ error: "You don't have access to delete this variant" }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('package_variants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Variants API] Delete error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Variants API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete variant' }, 
      { status: error?.message === 'Authentication required' ? 401 : 500 }
    )
  }
}
