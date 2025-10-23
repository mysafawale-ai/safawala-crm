import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * PATCH /api/deliveries/[id]/status
 * Update delivery status (start_transit, mark_delivered, cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const deliveryId = params.id
    const body = await request.json()
    
    const { status, notes } = body
    
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }
    
    // Validate status
    const validStatuses = ["pending", "in_transit", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }
    
    // Get current delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("id", deliveryId)
      .single()
    
    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      )
    }
    
    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      pending: ["in_transit", "cancelled"],
      in_transit: ["delivered", "cancelled"],
      delivered: [], // Cannot change from delivered
      cancelled: [] // Cannot change from cancelled
    }
    
    if (!allowedTransitions[delivery.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${delivery.status} to ${status}` },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    // Add notes if provided
    if (notes) {
      updateData.special_instructions = notes
    }
    
    // Set delivered_at timestamp if marking as delivered
    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString()
    }
    
    // Update delivery
    const { data: updatedDelivery, error: updateError } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq("id", deliveryId)
      .select()
      .single()
    
    if (updateError) {
      console.error("Error updating delivery:", updateError)
      return NextResponse.json(
        { error: "Failed to update delivery", details: updateError.message },
        { status: 500 }
      )
    }
    
    // 🎯 Update booking status in source table (product_orders or package_bookings)
    if (status === "delivered" && delivery.booking_id) {
      const bookingTable = delivery.booking_source === "product_order" 
        ? "product_orders" 
        : "package_bookings"
      
      // For SALES: delivered = order_complete (final status)
      // For RENTAL: delivered = intermediate status (will become 'returned' later)
      const newBookingStatus = delivery.booking_type === "sale" 
        ? "order_complete" 
        : "delivered"
      
      await supabase
        .from(bookingTable)
        .update({ status: newBookingStatus })
        .eq("id", delivery.booking_id)
      
      console.log(`✅ Updated ${bookingTable} status to '${newBookingStatus}' for booking ${delivery.booking_id}`)
    }
    
    // If status is delivered and booking_type is rental, return should be auto-created by trigger
    let returnCreated = false
    if (status === "delivered" && delivery.booking_type === "rental") {
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if return was created
      const { data: returnRecord } = await supabase
        .from("returns")
        .select("id, return_number")
        .eq("delivery_id", deliveryId)
        .single()
      
      if (returnRecord) {
        returnCreated = true
      }
    }
    
    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Delivery status updated to ${status}`,
      return_created: returnCreated
    })
    
  } catch (error: any) {
    console.error("Error in PATCH /api/deliveries/[id]/status:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
