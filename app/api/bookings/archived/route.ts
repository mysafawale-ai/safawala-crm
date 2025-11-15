import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/bookings/archived
// Returns up to 5 most recent archived bookings (across sources) enriched with customer data
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, 'readonly')
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 })
    }
    const { authContext } = authResult
    const franchiseId = authContext!.user.franchise_id
    const isSuperAdmin = authContext!.user.role === 'super_admin'

    const supabase = createClient()

    // Helper to build query per table
    type TableSpec = {
      table: string
      numberColumn: string
      franchiseColumn?: string
    }

    const tables: TableSpec[] = [
      { table: 'package_bookings', numberColumn: 'package_number' },
      { table: 'product_orders', numberColumn: 'order_number' },
      { table: 'direct_sales_orders', numberColumn: 'order_number' },
      { table: 'bookings', numberColumn: 'booking_number' },
    ]

    const results: any[] = []

    for (const spec of tables) {
      let query = supabase
        .from(spec.table)
        .select(`
          id, ${spec.numberColumn}, customer_id, franchise_id, status, event_date, delivery_date, return_date, event_type,
          venue_address, venue_name, total_amount, amount_paid, notes, created_at, booking_type, payment_type, payment_method,
          groom_name, bride_name, event_for, 
          customer:customers(id, customer_code, name, phone, whatsapp, email, address, city, state, pincode)
        `)
        .eq('is_archived', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!isSuperAdmin && franchiseId) {
        // Restrict by franchise; include legacy NULL franchise rows (visible to all?)
        query = query.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
      }

      const { data, error } = await query
      if (error) {
        console.warn('[ArchivedBookingsAPI] Error fetching', spec.table, error.message)
        continue
      }
      for (const row of data || []) {
        // Cast row to any to satisfy TS spread constraint (Supabase returns generic Record<string, unknown>)
        results.push({ ...(row as any), source: spec.table })
      }
    }

    // Sort globally, take top 5
    const sorted = results
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return NextResponse.json({ success: true, data: sorted, count: sorted.length })
  } catch (error: any) {
    console.error('[ArchivedBookingsAPI] Fatal error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
