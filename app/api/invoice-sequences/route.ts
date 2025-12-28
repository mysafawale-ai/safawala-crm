import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const franchiseId = request.nextUrl.searchParams.get("franchise_id")

  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id is required" },
      { status: 400 }
    )
  }

  try {
    // Get the last invoice sequence for this franchise
    const { data, error } = await supabase
      .from("invoice_sequences")
      .select("*")
      .eq("franchise_id", franchiseId)
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

  const { franchise_id, invoice_number } = body

  if (!franchise_id || !invoice_number) {
    return NextResponse.json(
      { error: "franchise_id and invoice_number are required" },
      { status: 400 }
    )
  }

  try {
    // Extract prefix and last number from invoice_number
    // e.g., "ORD001" -> prefix: "ORD", last_number: 1
    const match = invoice_number.match(/^([A-Za-z-]+?)(\d+)$/)
    
    if (!match) {
      return NextResponse.json(
        { error: "Invalid invoice number format. Use format like ORD001 or INV-2025-001" },
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
          prefix,
          last_number: lastNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "franchise_id" }
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

  const { franchise_id } = body

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
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    let nextInvoiceNumber: string

    if (!sequence) {
      // No sequence yet, return default
      nextInvoiceNumber = "ORD001"
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
