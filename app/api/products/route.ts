import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/products
 * Create a new product (franchise-specific)
 * Body: {
 *   name: string
 *   category: string
 *   description?: string
 *   rental_price?: number
 *   sale_price?: number
 *   security_deposit?: number
 *   stock_available?: number
 *   franchise_id: string
 *   is_custom?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      category,
      description,
      rental_price = 0,
      sale_price = 0,
      security_deposit = 0,
      stock_available = 999,
      franchise_id,
      is_custom = true,
      image_url,
    } = body

    if (!name || !franchise_id) {
      return NextResponse.json(
        { error: "Name and franchise_id are required" },
        { status: 400 }
      )
    }

    // Normalize values and provide safe defaults expected by inventory UI
    const normalizedRental = Number.isFinite(Number(rental_price)) ? Number(rental_price) : 0
    const normalizedSale = Number.isFinite(Number(sale_price)) ? Number(sale_price) : 0
    const normalizedStock = Number.isFinite(Number(stock_available)) ? Number(stock_available) : 0

    // Create product in database
    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          category,
          description,
          rental_price: normalizedRental,
          sale_price: normalizedSale,
          // Inventory table expects `price` (sale price) and `stock_total`
          price: normalizedSale,
          security_deposit,
          stock_available: normalizedStock,
          stock_total: normalizedStock,
          reorder_level: 0,
          franchise_id,
          is_custom,
          is_active: true,
          image_url,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Failed to create product:", error)
      return NextResponse.json(
        { error: error.message || "Failed to create product" },
        { status: 500 }
      )
    }

    console.log("✅ Custom product created:", product)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/products
 * Fetch products (with optional franchise filter)
 */
export async function GET(req: NextRequest) {
  try {
    const franchiseId = req.nextUrl.searchParams.get("franchise_id")

    let query = supabase.from("products").select("*").order("name")

    if (franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    const { data: products, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch products" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
