import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/barcodes
 * Create a new barcode for a product
 * Body: {
 *   product_id: string
 *   barcode_number: string
 *   barcode_type?: string (default: "CUSTOM")
 *   is_active?: boolean (default: true)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      product_id,
      barcode_number,
      barcode_type = "CUSTOM",
      is_active = true,
    } = body

    if (!product_id || !barcode_number) {
      return NextResponse.json(
        { error: "product_id and barcode_number are required" },
        { status: 400 }
      )
    }

    // Create barcode in database
    const { data: barcode, error } = await supabase
      .from("barcodes")
      .insert([
        {
          product_id,
          barcode_number,
          barcode_type,
          is_active,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Failed to create barcode:", error)
      return NextResponse.json(
        { error: error.message || "Failed to create barcode" },
        { status: 500 }
      )
    }

    console.log("✅ Barcode created:", barcode)
    return NextResponse.json(barcode, { status: 201 })
  } catch (error) {
    console.error("Error creating barcode:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
