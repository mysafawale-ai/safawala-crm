import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/deliveries/create
 * Simpler delivery creation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Deliveries Create API] Creating new delivery')

    // Validation
    if (!body.customer_id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    if (!body.delivery_address || body.delivery_address.trim() === "") {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 })
    }

    if (!body.delivery_date) {
      return NextResponse.json({ error: "Delivery date is required" }, { status: 400 })
    }

    // Generate delivery number
    let deliveryNumber: string
    try {
      const { data, error: numberError } = await supabaseServer.rpc('generate_delivery_number')
      if (numberError) {
        console.warn("[Deliveries Create API] RPC not available, using fallback numbering")
        deliveryNumber = `DEL-${Date.now().toString().slice(-8)}`
      } else {
        deliveryNumber = data
      }
    } catch (e) {
      console.warn("[Deliveries Create API] Using fallback delivery numbering")
      deliveryNumber = `DEL-${Date.now().toString().slice(-8)}`
    }

    const deliveryCharge = parseFloat(body.delivery_charge || 0)
    const fuelCost = parseFloat(body.fuel_cost || 0)

    // Handle staff IDs
    const staffIds = Array.isArray(body.assigned_staff_ids) 
      ? body.assigned_staff_ids.filter((id: any) => typeof id === 'string' && id.length > 0)
      : []

    const assignedStaffId = staffIds.length > 0 ? staffIds[0] : null

    // Create delivery
    const deliveryData = {
      delivery_number: deliveryNumber,
      customer_id: body.customer_id,
      booking_id: body.booking_id || null,
      booking_source: body.booking_source || null,
      delivery_type: body.delivery_type || 'standard',
      status: body.status || 'pending',
      pickup_address: body.pickup_address || null,
      delivery_address: body.delivery_address.trim(),
      delivery_date: body.delivery_date,
      delivery_time: body.delivery_time || null,
      driver_name: body.driver_name || null,
      vehicle_number: body.vehicle_number || null,
      assigned_staff_id: assignedStaffId,
      delivery_charge: deliveryCharge,
      fuel_cost: fuelCost,
      special_instructions: body.special_instructions || null,
    }

    const { data: delivery, error } = await supabaseServer
      .from("deliveries")
      .insert(deliveryData)
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .single()

    if (error) {
      console.error("[Deliveries Create API] Error creating delivery:", error)
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 })
    }

    // Insert staff assignments into junction table if we have staff IDs
    if (delivery && staffIds.length > 0) {
      try {
        const assignments = staffIds.map((staffId: string) => ({
          delivery_id: delivery.id,
          staff_id: staffId,
          role: 'assigned',
        }))
        await supabaseServer
          .from("delivery_staff")
          .insert(assignments)
      } catch (staffError) {
        console.warn("[Deliveries Create API] Could not create staff assignments:", staffError)
      }
    }

    console.log('[Deliveries Create API] Successfully created delivery:', delivery.id)
    return NextResponse.json({ success: true, data: delivery }, { status: 201 })
  } catch (error: any) {
    console.error("[Deliveries Create API] Exception:", error)
    return NextResponse.json({ 
      error: error.message || "Internal server error"
    }, { status: 500 })
  }
}
