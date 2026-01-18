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
    const errors: { table: string; error: string }[] = []

    for (const spec of tables) {
      try {
        // Build the base query
        let query = supabase
          .from(spec.table)
          .select(`
            id, ${spec.numberColumn}, customer_id, franchise_id, status, event_date, delivery_date, return_date, event_type,
            venue_address, venue_name, total_amount, amount_paid, notes, created_at, booking_type, payment_type, payment_method,
            groom_name, bride_name, event_for, 
            customer:customers(id, customer_code, name, phone, whatsapp, email, address, city, state, pincode)
          `)
          .eq('is_archived', true)

        // Apply franchise filter ONLY for non-super admins
        if (!isSuperAdmin && franchiseId) {
          query = query.eq('franchise_id', franchiseId)
        }
        
        // Add ordering and limit
        query = query.order('created_at', { ascending: false }).limit(10)

        const { data, error } = await query
        if (error) {
          console.error('[ArchivedBookingsAPI] Error fetching', spec.table, ':', error.message, error.code)
          errors.push({ table: spec.table, error: error.message })
          continue
        }
        
        console.log(`[ArchivedBookingsAPI] ${spec.table}: found ${data?.length || 0} archived records`)
        
        for (const row of data || []) {
          // Cast row to any to satisfy TS spread constraint (Supabase returns generic Record<string, unknown>)
          results.push({ ...(row as any), source: spec.table })
        }
      } catch (tableError: any) {
        console.error('[ArchivedBookingsAPI] Exception fetching', spec.table, ':', tableError.message)
        errors.push({ table: spec.table, error: tableError.message })
      }
    }

    // Sort globally, take top 5
    const sorted = results
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    // Include errors in response for debugging (only if there are errors)
    const response: any = { success: true, data: sorted, count: sorted.length }
    if (errors.length > 0) {
      response.warnings = errors
      console.warn('[ArchivedBookingsAPI] Completed with warnings:', errors)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[ArchivedBookingsAPI] Fatal error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
