import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let booking: any = null
    let error: any = null

    if (type === 'product_order') {
      const res = await supabase
        .from('product_orders')
        .select(`*, customer:customers(*)`)
        .eq('id', params.id)
        .single()
      booking = res.data; error = res.error
    } else if (type === 'package_booking') {
      const res = await supabase
        .from('package_bookings')
        .select(`*, customer:customers(*)`)
        .eq('id', params.id)
        .single()
      booking = res.data; error = res.error
    } else {
      const res = await supabase
        .from("bookings")
        .select(`
          *,
          customer:customers(*),
          items:booking_items(*, product:products(*))
        `)
        .eq("id", params.id)
        .single()
      booking = res.data; error = res.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let table = 'bookings'
    if (type === 'product_order') table = 'product_orders'
    if (type === 'package_booking') table = 'package_bookings'

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
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const type = request.nextUrl.searchParams.get('type') || 'unified'
    let table = 'bookings'
    if (type === 'product_order') table = 'product_orders'
    if (type === 'package_booking') table = 'package_bookings'

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Booking deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    )
  }
}