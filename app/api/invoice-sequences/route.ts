import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const franchiseId = request.nextUrl.searchParams.get("franchise_id")
  const type = request.nextUrl.searchParams.get("type") || "rental" // Default to rental

  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id is required" },
      { status: 400 }
    )
  }

  try {
    // Get the last invoice sequence for this franchise and type
    const { data, error } = await supabase
      .from("invoice_sequences")
      .select("*")
      .eq("franchise_id", franchiseId)
      .eq("type", type)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      throw error
    }

    return NextResponse.json({ data: data || null }, { status: 200 })
  } catch (error) {
    console.error("[Invoice Sequences] Error fetching sequence:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice sequence" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { franchise_id, invoice_number, type = "rental" } = body

  if (!franchise_id || !invoice_number) {
    return NextResponse.json(
      { error: "franchise_id and invoice_number are required" },
      { status: 400 }
    )
  }

  try {
    // Extract prefix and last number from invoice_number
    // e.g., "SALE001" -> prefix: "SALE", last_number: 1 or "RENT001" -> prefix: "RENT", last_number: 1
    const match = invoice_number.match(/^([A-Za-z-]+?)(\d+)$/)
    
    if (!match) {
      return NextResponse.json(
        { error: "Invalid invoice number format. Use format like SALE001 or RENT001" },
        { status: 400 }
      )
    }

    const prefix = match[1]
    const lastNumber = parseInt(match[2], 10)

    // Upsert the sequence
    const { data, error } = await supabase
      .from("invoice_sequences")
      .upsert(
        {
          franchise_id,
          type,
          prefix,
          last_number: lastNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "franchise_id,type" }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, success: true }, { status: 200 })
  } catch (error) {
    console.error("[Invoice Sequences] Error updating sequence:", error)
    return NextResponse.json(
      { error: "Failed to update invoice sequence" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { franchise_id, type = "rental" } = body

  if (!franchise_id) {
    return NextResponse.json(
      { error: "franchise_id is required" },
      { status: 400 }
    )
  }

  try {
    // Get the current sequence and generate the next invoice number
    const { data: sequence, error: fetchError } = await supabase
      .from("invoice_sequences")
      .select("*")
      .eq("franchise_id", franchise_id)
      .eq("type", type)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    let nextInvoiceNumber: string
    const typePrefix = type === "sale" ? "SALE" : "RENT"

    if (!sequence) {
      // No sequence yet, check the database for the last order number of this type
      const { data: lastOrder, error: orderError } = await supabase
        .from("product_orders")
        .select("order_number")
        .eq("franchise_id", franchise_id)
        .eq("booking_type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (orderError && orderError.code !== "PGRST116") {
        throw orderError
      }

      if (lastOrder && lastOrder.order_number) {
        // Extract number from last order and increment
        const match = lastOrder.order_number.match(/^([A-Za-z-]+?)(\d+)$/)
        if (match) {
          const prefix = match[1]
          const lastNumber = parseInt(match[2], 10)
          const nextNumber = lastNumber + 1
          const paddedNumber = String(nextNumber).padStart(String(lastNumber).length, "0")
          nextInvoiceNumber = `${prefix}${paddedNumber}`
        } else {
          nextInvoiceNumber = `${typePrefix}001`
        }
      } else {
        nextInvoiceNumber = `${typePrefix}001`
      }
    } else {
      // Generate next number based on stored prefix and last_number
      const nextNumber = sequence.last_number + 1
      const paddedNumber = String(nextNumber).padStart(String(sequence.last_number).length, "0")
      nextInvoiceNumber = `${sequence.prefix}${paddedNumber}`
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
