import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Authentication is handled via requireAuth which uses Supabase auth-helpers

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const auth = await requireAuth(request, 'readonly')
    if (!auth.success) {
      return NextResponse.json(auth.response, { status: 401 })
    }
    const user = auth.authContext!.user
    const franchiseId = user.franchise_id
    const isSuperAdmin = user.is_super_admin
    const supabase = createClient()
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let booking: any = null
    let error: any = null

    if (type === 'product_order') {
      const res = await supabase
        .from('product_orders')
        .select(`*, franchise_id, customer:customers(*)`)
        .eq('id', id)
        .single()
      booking = res.data; error = res.error
    } else if (type === 'package_booking') {
      const res = await supabase
        .from('package_bookings')
        .select(`*, franchise_id, customer:customers(*)`)
        .eq('id', id)
        .single()
      booking = res.data; error = res.error
    } else {
      const res = await supabase
        .from("bookings")
        .select(`
          *,
          franchise_id,
          customer:customers(*),
          items:booking_items(*, product:products(*))
        `)
        .eq("id", id)
        .single()
      booking = res.data; error = res.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Franchise isolation check
    if (!isSuperAdmin && booking?.franchise_id && booking.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let table = 'bookings'
    if (type === 'product_order') table = 'product_orders'
    if (type === 'package_booking') table = 'package_bookings'

    // Check franchise ownership before update
    const { data: existing, error: fetchErr } = await supabase
      .from(table)
      .select('id, franchise_id')
      .eq('id', params.id)
      .single()
    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!isSuperAdmin && existing.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: booking, error } = await supabase
      .from(table)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, 'staff')
    if (!auth.success) {
      return NextResponse.json(auth.response, { status: 401 })
    }
    const user = auth.authContext!.user
    const franchiseId = user.franchise_id
    const isSuperAdmin = user.is_super_admin
    const supabase = createClient()
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let table = 'bookings'
    if (type === 'product_order') table = 'product_orders'
    if (type === 'package_booking') table = 'package_bookings'

    // Check franchise ownership before delete
    const { data: existing, error: fetchErr } = await supabase
      .from(table)
      .select('id, franchise_id')
      .eq('id', params.id)
      .single()
    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!isSuperAdmin && existing.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Booking deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
  }
}