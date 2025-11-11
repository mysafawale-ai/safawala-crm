import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = 'then' in context.params ? await context.params : context.params
    const { id } = params

  const auth = await requireAuth(request, 'staff')
    if (!auth.success) {
      return NextResponse.json(auth.response, { status: 401 })
    }

    const user = auth.authContext!.user
    const franchiseId = user.franchise_id
    const isSuperAdmin = user.is_super_admin

    const supabase = createClient()
    const body = await request.json()
    const type = body.type || 'unified'

    console.log('[Bookings RESTORE] Type:', type, 'ID:', id)

    // Map type to table name
    const tableMap: Record<string, 'package_bookings' | 'product_orders' | 'direct_sales_orders' | 'bookings'> = {
      'package_booking': 'package_bookings',
      'package_bookings': 'package_bookings',
      'product_order': 'product_orders',
      'product_orders': 'product_orders',
      'direct_sales': 'direct_sales_orders',
      'direct_sales_orders': 'direct_sales_orders',
      'unified': 'bookings',
      'bookings': 'bookings'
    }

    const preferred = tableMap[type]
    const allTables: Array<'package_bookings' | 'product_orders' | 'direct_sales_orders' | 'bookings'> = [
      'package_bookings', 'product_orders', 'direct_sales_orders', 'bookings'
    ]
    const candidates = preferred ? [preferred, ...allTables.filter(t => t !== preferred)] : allTables

    // Find the archived booking first (including archived records)
    let foundTable: typeof candidates[number] | null = null
    let existing: { id: string; franchise_id?: string | null } | null = null

    for (const tbl of candidates) {
      console.log(`[Bookings RESTORE] Checking table: ${tbl}`)
      const { data, error } = await supabase.from(tbl).select('id, franchise_id').eq('id', id).maybeSingle()
      console.log(`[Bookings RESTORE] ${tbl} result:`, { found: !!data, error: error?.message })
      if (!error && data) {
        foundTable = tbl
        existing = data as any
        console.log(`[Bookings RESTORE] Found in ${tbl}:`, existing)
        break
      }
    }

    if (!foundTable || !existing) {
      console.log('[Bookings RESTORE] Not found in any candidate table:', candidates)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Franchise ownership check
    if (!isSuperAdmin && existing.franchise_id && existing.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Restore the booking (soft delete by setting is_archived = false)
    console.log(`[Bookings RESTORE] Restoring from ${foundTable}...`)
    const { error } = await supabase
      .from(foundTable)
      .update({ is_archived: false })
      .eq('id', id)

    if (error) {
      console.error('[Bookings RESTORE] Restore failed:', error)

      // Check if column doesn't exist
      if (error.message.includes('is_archived') || error.code === '42703') {
        return NextResponse.json({
          error: 'Archive column not yet added to database',
          message: 'Please run the SQL migration: ADD_ARCHIVE_TO_BOOKINGS.sql',
          sql: `
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE direct_sales_orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
          `.trim()
        }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[Bookings RESTORE] Successfully restored')
    return NextResponse.json({ 
      success: true, 
      message: 'Booking restored successfully',
      table: foundTable,
      bookingId: id
    })
  } catch (error: any) {
    console.error('[Bookings RESTORE] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to restore booking" 
    }, { status: 500 })
  }
}

// Accept POST as a fallback for environments or clients that cannot send PATCH
export const POST = PATCH
