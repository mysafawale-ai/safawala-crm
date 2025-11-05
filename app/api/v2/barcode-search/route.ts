/**
 * Simple Barcode Search API (v2)
 * 
 * SIMPLIFIED approach:
 * 1. Search barcodes table directly (indexed by barcode_number)
 * 2. Get product ID from barcode record
 * 3. Fetch product details in separate query
 * 4. Return combined result
 * 
 * This is more reliable than complex joins
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

    console.log("[Barcode Search V2] Looking up barcode:", barcode)

    const supabase = createServerComponentClient({ cookies })

    // Step 1: Search in barcodes table (fast indexed lookup)
    console.log("[Barcode Search V2] Step 1: Searching barcodes table...")
    const { data: barcodeRecord, error: barcodeError } = await supabase
      .from("barcodes")
      .select("*")
      .eq("barcode_number", barcode)
      .eq("is_active", true)
      .single()

    if (barcodeError || !barcodeRecord) {
      console.log("[Barcode Search V2] ❌ Barcode not found in barcodes table")
      
      // Fallback: Search in product_code or alternate barcodes
      console.log("[Barcode Search V2] Step 2: Fallback search in product_code...")
      const { data: productRecord, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("product_code", barcode)
        .eq("is_active", true)
        .single()

      if (productError || !productRecord) {
        console.log("[Barcode Search V2] ❌ Product not found anywhere")
        return NextResponse.json({ error: "Barcode not found" }, { status: 404 })
      }

      console.log("[Barcode Search V2] ✅ Found via product_code:", productRecord.name)
      return NextResponse.json({
        success: true,
        source: "product_code",
        product: {
          id: productRecord.id,
          name: productRecord.name,
          product_code: productRecord.product_code,
          price: productRecord.price || 0,
          rental_price: productRecord.rental_price || 0,
          cost_price: productRecord.cost_price || 0,
          security_deposit: productRecord.security_deposit || 0,
          stock_available: productRecord.stock_available || 0,
          category_id: productRecord.category_id,
          franchise_id: productRecord.franchise_id,
          image_url: productRecord.image_url,
        },
      })
    }

    // Step 2: Get the product ID from barcode record
    const productId = barcodeRecord.product_id
    console.log("[Barcode Search V2] Step 2: Found product_id:", productId)

    // Step 3: Fetch product details
    console.log("[Barcode Search V2] Step 3: Fetching product details...")
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.log("[Barcode Search V2] ❌ Product details not found")
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[Barcode Search V2] ✅ Found product:", product.name)

    // Return success with product details
    return NextResponse.json({
      success: true,
      source: "barcodes_table",
      barcode: {
        id: barcodeRecord.id,
        barcode_number: barcodeRecord.barcode_number,
        barcode_type: barcodeRecord.barcode_type,
      },
      product: {
        id: product.id,
        name: product.name,
        product_code: product.product_code,
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
    console.error("[Barcode Search V2] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
