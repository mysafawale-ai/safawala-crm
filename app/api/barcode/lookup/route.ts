/**
 * Barcode Lookup API
 * 
 * Handles barcode scanning and lookup
 * Queries the dedicated barcodes table to find products
 * Supports multiple barcodes per product
 * 
 * Usage:
 * POST /api/barcode/lookup
 * {
 *   "barcode": "PROD-1761634543481-66-001",
 *   "franchiseId": "optional-franchise-id"
 * }
 */

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { barcode, franchiseId } = await request.json()

    if (!barcode || !barcode.trim()) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      )
    }

    const searchBarcode = barcode.trim()
    console.log('[API] Barcode lookup request:', { searchBarcode, franchiseId })

    const supabase = createServerComponentClient({ cookies })

    // ===== STEP 1: Search in dedicated barcodes table (BEST) =====
    // This table has proper indexes and is designed for fast lookups
    console.log('[API] Step 1: Searching dedicated barcodes table...')

    let barcodeQuery = supabase
      .from('barcodes')
      .select(`
        id,
        product_id,
        barcode_number,
        barcode_type,
        is_active,
        products!inner(
          id,
          name,
          product_code,
          category,
          category_id,
          subcategory_id,
          image_url,
          price,
          rental_price,
          security_deposit,
          stock_available,
          franchise_id
        )
      `)
      .eq('barcode_number', searchBarcode)
      .eq('is_active', true)
      .limit(1)
      .single()

    const { data: barcodeRecord, error: barcodeError } = await barcodeQuery

    if (barcodeRecord && barcodeRecord.products) {
      const product = barcodeRecord.products as any
      
      // If franchise filtering is enabled, check franchise match
      if (franchiseId && product.franchise_id !== franchiseId) {
        console.log('[API] Barcode found but franchise mismatch:', {
          barcodeProductFranchise: product.franchise_id,
          requestedFranchise: franchiseId
        })
        return NextResponse.json(
          { error: "Product not available for your franchise", details: null },
          { status: 404 }
        )
      }

      console.log('[API] ✅ Found in barcodes table:', {
        barcode: searchBarcode,
        product: product.name,
        productId: product.id,
        barcodeType: barcodeRecord.barcode_type
      })

      return NextResponse.json({
        success: true,
        source: 'barcodes_table',
        barcode: searchBarcode,
        product: {
          id: product.id,
          name: product.name,
          product_code: product.product_code,
          category: product.category,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          image_url: product.image_url,
          price: product.price,
          rental_price: product.rental_price,
          sale_price: product.price, // Use price field (no separate sale_price in schema)
          security_deposit: product.security_deposit,
          stock_available: product.stock_available,
          franchise_id: product.franchise_id
        },
        barcode_type: barcodeRecord.barcode_type
      })
    }

    if (barcodeError && barcodeError.code !== 'PGRST116') {
      console.warn('[API] Error querying barcodes table:', barcodeError)
    }

    // ===== STEP 2: Search in products table fields (FALLBACK) =====
    console.log('[API] Step 2: Searching products table fields...')

    let productsQuery = supabase
      .from('products')
      .select('*')
      .or(
        `product_code.eq.${searchBarcode},` +
        `barcode_number.eq.${searchBarcode},` +
        `alternate_barcode_1.eq.${searchBarcode},` +
        `alternate_barcode_2.eq.${searchBarcode},` +
        `sku.eq.${searchBarcode},` +
        `code.eq.${searchBarcode}`
      )
      .limit(1)

    if (franchiseId) {
      productsQuery = productsQuery.eq('franchise_id', franchiseId)
    }

    const { data: products } = await productsQuery

    if (products && products.length > 0) {
      const product = products[0] as any
      console.log('[API] ✅ Found in products table:', {
        barcode: searchBarcode,
        product: product.name
      })

      return NextResponse.json({
        success: true,
        source: 'products_table',
        barcode: searchBarcode,
        product: {
          id: product.id,
          name: product.name,
          product_code: product.product_code,
          category: product.category,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          image_url: product.image_url,
          price: product.price,
          rental_price: product.rental_price,
          sale_price: product.price, // Use price field (no separate sale_price in schema)
          security_deposit: product.security_deposit,
          stock_available: product.stock_available,
          franchise_id: product.franchise_id
        },
        barcode_type: 'unknown'
      })
    }

    // ===== NOT FOUND =====
    console.log('[API] ❌ Barcode not found:', searchBarcode)

    return NextResponse.json(
      {
        success: false,
        error: "Product not found",
        details: `No product found with barcode: ${searchBarcode}`,
        barcode: searchBarcode
      },
      { status: 404 }
    )

  } catch (error: any) {
    console.error('[API] Barcode lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Barcode lookup failed",
        details: error?.message || "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to get all barcodes for a product
 * Usage: GET /api/barcode/lookup?productId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      )
    }

    const supabase = createServerComponentClient({ cookies })

    // Get all barcodes for this product
    const { data: barcodes, error } = await supabase
      .from('barcodes')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('barcode_type', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[API] Error fetching barcodes:', error)
      return NextResponse.json(
        { error: "Failed to fetch barcodes", details: error.message },
        { status: 500 }
      )
    }

    console.log('[API] ✅ Retrieved barcodes for product:', {
      productId,
      count: barcodes?.length || 0
    })

    return NextResponse.json({
      success: true,
      productId,
      barcodes: barcodes || [],
      count: barcodes?.length || 0
    })

  } catch (error: any) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get barcodes",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}
