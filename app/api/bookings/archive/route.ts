import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Handle the actual logic
  return handleArchiveRequest(request)
}

// Also accept PATCH for compatibility
export async function PATCH(request: NextRequest) {
  return handleArchiveRequest(request)
}

async function handleArchiveRequest(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'staff')
    if (!auth.success) {
      return NextResponse.json(auth.response, { status: 401 })
    }

    const user = auth.authContext!.user
    const franchiseId = user.franchise_id
    const isSuperAdmin = user.is_super_admin

    const supabase = createClient()
    const body = await request.json()
    const { id, type = 'unified' } = body

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    console.log('[Bookings ARCHIVE] Simple archive for ID:', id, 'Type:', type)

    // Map type to table name
    const tableMap: Record<string, string> = {
      'package_booking': 'package_bookings',
      'package_bookings': 'package_bookings',
      'product_order': 'product_orders',
      'product_orders': 'product_orders',
      'direct_sales': 'direct_sales_orders',
      'direct_sales_orders': 'direct_sales_orders',
      'unified': 'bookings',
      'bookings': 'bookings'
    }

    const tableName = tableMap[type] || 'package_bookings'

    // Check if booking exists and belongs to user's franchise
    const { data: existing, error: findError } = await supabase
      .from(tableName)
      .select('id, franchise_id')
      .eq('id', id)
      .maybeSingle()

    if (findError) {
      console.error('[Bookings ARCHIVE] Find error:', findError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Franchise ownership check
    if (!isSuperAdmin && existing.franchise_id && existing.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to archive
    const { error: archiveError } = await supabase
      .from(tableName)
      .update({ is_archived: true })
      .eq('id', id)

    if (archiveError) {
      console.error('[Bookings ARCHIVE] Archive error:', archiveError)

      // Check if column doesn't exist
      if (archiveError.message?.includes('is_archived') || archiveError.code === '42703') {
        return NextResponse.json({
          error: 'Archive functionality not available',
          message: 'Database needs update. Please contact admin.',
          details: 'Run ADD_ARCHIVE_TO_BOOKINGS.sql migration'
        }, { status: 400 })
      }

      return NextResponse.json({ error: archiveError.message }, { status: 400 })
    }

    console.log('[Bookings ARCHIVE] Successfully archived booking:', id)
    return NextResponse.json({
      success: true,
      message: 'Booking archived successfully',
      bookingId: id
    })

  } catch (error: any) {
    console.error('[Bookings ARCHIVE] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to archive booking"
    }, { status: 500 })
  }
}