import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: delivery, error } = await supabaseServer
      .from("deliveries")
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("[Deliveries API] Error fetching delivery:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: delivery })
  } catch (error) {
    console.error("[Deliveries API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Build update object (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.delivery_type !== undefined) updateData.delivery_type = body.delivery_type
    if (body.pickup_address !== undefined) updateData.pickup_address = body.pickup_address
    if (body.delivery_address !== undefined) updateData.delivery_address = body.delivery_address
    if (body.delivery_date !== undefined) updateData.delivery_date = body.delivery_date
    if (body.delivery_time !== undefined) updateData.delivery_time = body.delivery_time
    if (body.driver_name !== undefined) updateData.driver_name = body.driver_name
    if (body.vehicle_number !== undefined) updateData.vehicle_number = body.vehicle_number
    if (body.assigned_staff_id !== undefined) updateData.assigned_staff_id = body.assigned_staff_id
    // Handle assigned_staff_ids array (save as JSON if supported, otherwise use first ID)
    if (body.assigned_staff_ids !== undefined && Array.isArray(body.assigned_staff_ids)) {
      updateData.assigned_staff_id = body.assigned_staff_ids.length > 0 ? body.assigned_staff_ids[0] : null
    }
    if (body.delivery_charge !== undefined) updateData.delivery_charge = parseFloat(body.delivery_charge)
    if (body.fuel_cost !== undefined) updateData.fuel_cost = parseFloat(body.fuel_cost)
    if (body.special_instructions !== undefined) updateData.special_instructions = body.special_instructions

    const { data: delivery, error } = await supabaseServer
      .from("deliveries")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .single()

    if (error) {
      console.error("[Deliveries API] Error updating delivery:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: delivery })
  } catch (error) {
    console.error("[Deliveries API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseServer
      .from("deliveries")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("[Deliveries API] Error deleting delivery:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Delivery deleted successfully" })
  } catch (error) {
    console.error("[Deliveries API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
