import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, getDefaultFranchiseId } from "@/lib/supabase-server-simple"
import { createClient } from "@/lib/supabase-server"

async function validateAuth(request: NextRequest) {
  const franchiseId = await getDefaultFranchiseId()
  return { franchiseId, userId: "system", userRole: "admin" }
}

export async function GET(request: NextRequest) {
  try {
    const { franchiseId } = await validateAuth(request)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // Use anon client to respect RLS policies
    const supabase = createClient()

    let query = supabase
      .from("deliveries")
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .order("created_at", { ascending: false })

    // Optional status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Deliveries API] Error fetching deliveries:", error)
      
      // Check if the deliveries table doesn't exist (42P01 or explicit relation-not-found for deliveries)
      const msg = (error.message || "").toLowerCase()
      if (error.code === '42P01' || msg.includes('relation "deliveries" does not exist') || msg.includes('relation \"deliveries\" does not exist')) {
        return NextResponse.json({ 
          error: "Deliveries table not found. Please run MIGRATION_DELIVERIES_TABLE.sql",
          hint: "Run the migration to create the deliveries table",
          data: []
        }, { status: 404 })
      }
      
      // If the error is due to an optional join (e.g., staff) or missing relationship, fall back to a simpler select
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('deliveries')
          .select('*')
          .order('created_at', { ascending: false })

        if (!fallbackError) {
          return NextResponse.json({ success: true, data: fallbackData || [] })
        }
      } catch (e) {
        // ignore and return original error below
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error("[Deliveries API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { franchiseId, userId } = await validateAuth(request)
    const body = await request.json()

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

  // Generate delivery number (with fallback if RPC doesn't exist)
    let deliveryNumber: string
    
    try {
      const { data, error: numberError } = await supabaseServer.rpc('generate_delivery_number')
      
      if (numberError) {
        console.warn("[Deliveries API] RPC not available, using fallback numbering:", numberError.message)
        // Fallback: use timestamp-based number
        deliveryNumber = `DEL-${Date.now().toString().slice(-8)}`
      } else {
        deliveryNumber = data
      }
    } catch (e) {
      console.warn("[Deliveries API] Using fallback delivery numbering")
      deliveryNumber = `DEL-${Date.now().toString().slice(-8)}`
    }

    // Calculate total
    const deliveryCharge = parseFloat(body.delivery_charge || 0)
    const fuelCost = parseFloat(body.fuel_cost || 0)

    // Sanitize IDs (accept only valid UUIDs)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    const assignedStaffId =
      typeof body.assigned_staff_id === 'string' && uuidRegex.test(body.assigned_staff_id)
        ? body.assigned_staff_id
        : null
    const safeFranchiseId = typeof franchiseId === 'string' && uuidRegex.test(franchiseId) ? franchiseId : null
    const safeCreatedBy = typeof userId === 'string' && uuidRegex.test(userId) ? userId : null

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
      franchise_id: safeFranchiseId,
      created_by: safeCreatedBy,
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
      console.error("[Deliveries API] Error creating delivery:", error)
      
      // Check if deliveries table doesn't exist
      const msg = (error.message || "").toLowerCase()
      if (error.code === '42P01' || msg.includes('relation "deliveries" does not exist') || msg.includes('relation \"deliveries\" does not exist')) {
        return NextResponse.json({ 
          error: "Deliveries table not found. Please run MIGRATION_DELIVERIES_TABLE.sql to create the table.",
          hint: "Check DELIVERIES_BACKEND_COMPLETE.md for instructions"
        }, { status: 404 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: delivery }, { status: 201 })
  } catch (error: any) {
    console.error("[Deliveries API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
