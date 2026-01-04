import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const franchiseId = request.nextUrl.searchParams.get("franchise_id")
  const type = request.nextUrl.searchParams.get("type") // Optional for backward compatibility

  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id is required" },
      { status: 400 }
    )
  }

  try {
    // HYBRID SYSTEM: Get the last invoice and extract next number
    // Ignores type - just reads the absolute last order created
    const { data: lastOrder, error: orderError } = await supabase
      .from("product_orders")
      .select("order_number, created_at")
      .eq("franchise_id", franchiseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (orderError && orderError.code !== "PGRST116") {
      console.error("[InvoiceSequences] DB Error:", orderError)
      throw orderError
    }

    let nextInvoiceNumber: string

    if (lastOrder && lastOrder.order_number) {
      console.log(`[InvoiceSequences] Found last order: ${lastOrder.order_number}`)
      // Extract and increment from last order number
      const match = lastOrder.order_number.match(/^([A-Za-z0-9-]+?)(\d+)$/)
      if (match) {
        const prefix = match[1]
        const numberStr = match[2]  // Original string e.g. "002"
        const lastNumber = parseInt(numberStr, 10)  // Parsed number e.g. 2
        const nextNumber = lastNumber + 1  // e.g. 3
        const paddedNumber = String(nextNumber).padStart(numberStr.length, "0")  // Pad to original length
        nextInvoiceNumber = `${prefix}${paddedNumber}`
        console.log(`[InvoiceSequences] Extracted: prefix="${prefix}", originalLen=${numberStr.length}, lastNum=${lastNumber}, next="${nextInvoiceNumber}"`) 
      nextInvoiceNumber = "ORD001"
    }

    return NextResponse.json({ next_invoice_number: nextInvoiceNumber }, { status: 200 })
  } catch (error) {
    console.error("[Invoice Sequences] Error generating next invoice number:", error)
    return NextResponse.json(
      { error: "Failed to generate next invoice number" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { franchise_id, invoice_number } = body

  if (!franchise_id || !invoice_number) {
    return NextResponse.json(
      { error: "franchise_id and invoice_number are required" },
      { status: 400 }
    )
  }

  try {
    // In hybrid system, we just validate the format but don't need to store sequences
    // The system reads directly from product_orders table
    const match = invoice_number.match(/^([A-Za-z0-9-]+?)(\d+)$/)
    
    if (!match) {
      return NextResponse.json(
        { error: "Invalid invoice number format. Use format like INV001, SALE001, ORD001, etc" },
        { status: 400 }
      )
    }

    console.log(`[Hybrid Invoice] Saved invoice number: ${invoice_number}`)
    return NextResponse.json({ success: true, invoice_number }, { status: 200 })
  } catch (error) {
    console.error("[Invoice Sequences] Error validating invoice number:", error)
    return NextResponse.json(
      { error: "Failed to validate invoice number" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { franchise_id } = body

  if (!franchise_id) {
    return NextResponse.json(
      { error: "franchise_id is required" },
      { status: 400 }
    )
  }

  try {
    // HYBRID SYSTEM: Read the LAST invoice from database and increment from it
    // This allows users to write ANY format (INV001, SALE001, CUSTOM100, etc)
    // and the system will increment from whatever they wrote
    
    const { data: lastOrder, error: orderError } = await supabase
      .from("product_orders")
      .select("order_number")
      .eq("franchise_id", franchise_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (orderError && orderError.code !== "PGRST116") {
      throw orderError
    }

    let nextInvoiceNumber: string

    if (lastOrder && lastOrder.order_number) {
      // Extract prefix and number from last order
      // Handles: INV001, SALE001, ORD001, RENT001, CUSTOM100, etc.
      const match = lastOrder.order_number.match(/^([A-Za-z0-9-]+?)(\d+)$/)
      
      if (match) {
        const prefix = match[1]
        const numberStr = match[2]  // Original string e.g. "001" or "002"
        const lastNumber = parseInt(numberStr, 10)  // Parsed number e.g. 1 or 2
        const nextNumber = lastNumber + 1  // e.g. 2 or 3
        // Preserve padding: if last was INV001, next is INV002; if INV0001, next is INV0002
        const paddedNumber = String(nextNumber).padStart(numberStr.length, "0")
        nextInvoiceNumber = `${prefix}${paddedNumber}`
        
        console.log(`[Hybrid Invoice] Last: ${lastOrder.order_number} → Next: ${nextInvoiceNumber} (padding: ${numberStr.length} digits)`)
      } else {
        // Fallback: can't parse, return default
        nextInvoiceNumber = "ORD001"
      }
    } else {
      // No orders found, default to ORD001
      nextInvoiceNumber = "ORD001"
    }

    return NextResponse.json({ next_invoice_number: nextInvoiceNumber }, { status: 200 })
  } catch (error) {
    console.error("[Invoice Sequences] Error generating next invoice number:", error)
    return NextResponse.json(
      { error: "Failed to generate next invoice number" },
      { status: 500 }
    )
  }
}
