import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// GET /api/expenses - paginated, filtered, franchise-isolated
export async function GET(req: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate user and get franchise context
    const { franchiseId, isSuperAdmin, userId } = await getUserFromSession(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSizeRaw = parseInt(searchParams.get('pageSize') || '25')
    const pageSize = Math.min(100, pageSizeRaw > 0 ? pageSizeRaw : 25)
    const category = searchParams.get('category') || ''
    const vendor = searchParams.get('vendor') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') === 'amount' ? 'amount' : 'expense_date'
    const sortDir = searchParams.get('sortDir') === 'asc' ? true : false

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('expenses')
      .select('*', { count: 'exact' })

    // 🔒 FRANCHISE ISOLATION: Super admin sees all, others see only their franchise
    if (!isSuperAdmin && franchiseId) {
      query = query.eq('franchise_id', franchiseId)
    }

    if (category) query = query.eq('subcategory', category)
    if (vendor) query = query.ilike('vendor_name', `%${vendor}%`)
    if (dateFrom) query = query.gte('expense_date', dateFrom)
    if (dateTo) query = query.lte('expense_date', dateTo)
    if (search) {
      // OR filter across description & vendor_name
      const pattern = `%${search}%`
      query = query.or(`description.ilike.${pattern},vendor_name.ilike.${pattern}`)
    }

    query = query.order(sortField, { ascending: sortDir })
    // Secondary stable order when sorting by date
    if (sortField === 'expense_date') {
      query = query.order('id', { ascending: false })
    }

    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return NextResponse.json({
      data: data || [],
      page,
      pageSize,
      total,
      totalPages,
      sortField,
      sortDir: sortDir ? 'asc' : 'desc'
    })
  } catch (e: any) {
    console.error('GET /api/expenses error', e)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
