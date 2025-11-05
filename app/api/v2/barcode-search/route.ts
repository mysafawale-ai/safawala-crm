/**
 * Simple Barcode Search API (v2)
 * 
 * ULTRA-SIMPLIFIED approach:
 * - Search by products.barcode (primary, 11-digit numeric string)
 * - This is the main field used for barcode scanning across the app
 * - No complex joins, just direct product lookup
 * 
 * Why this works:
 * - barcode field is unique and indexed
 * - Already populated for all products via migration/trigger
 * - No dependency on separate barcodes table
 * - Simple, reliable, debuggable
 */

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = body.barcode?.trim()

    if (!barcode) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 })
    }

    console.log("[Barcode Search V2] 🔍 Searching for barcode:", barcode)

    const supabase = createServerComponentClient({ cookies })

    // Direct search by products.barcode (simple and effective)
    console.log("[Barcode Search V2] Querying products by barcode...")
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        barcode,
        price,
        rental_price,
        cost_price,
        security_deposit,
        stock_available,
        category_id,
        franchise_id,
        image_url
      `
      )
      .eq("barcode", barcode)
      .limit(1)

    if (error) {
      console.error("[Barcode Search V2] ❌ Query error:", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.log("[Barcode Search V2] ❌ Product not found for barcode:", barcode)
      return NextResponse.json({ error: "Barcode not found" }, { status: 404 })
    }

    const product = products[0]
    console.log("[Barcode Search V2] ✅ Found product:", product.name)

    // Return success with product details
    return NextResponse.json({
      success: true,
      source: "barcode",
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price || 0,
        rental_price: product.rental_price || 0,
        cost_price: product.cost_price || 0,
        security_deposit: product.security_deposit || 0,
        stock_available: product.stock_available || 0,
        category_id: product.category_id,
        franchise_id: product.franchise_id,
        image_url: product.image_url,
      },
    })
  } catch (error) {
    console.error("[Barcode Search V2] ❌ Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
