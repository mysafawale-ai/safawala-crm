import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, getDefaultFranchiseId } from "@/lib/supabase-server-simple"

export async function GET(request: NextRequest) {
  try {
    // Remove JWT authentication for simplicity
    const franchiseId = await getDefaultFranchiseId()

    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get("product_id")
    const transaction_type = searchParams.get("transaction_type")

    let query = supabaseServer
      .from("inventory_transactions")
      .select(`
        *,
        products (
          id,
          name,
          product_code
        )
      `)
      .order("created_at", { ascending: false })
      .eq("franchise_id", franchiseId)

    if (product_id) {
      query = query.eq("product_id", product_id)
    }

    if (transaction_type) {
      query = query.eq("transaction_type", transaction_type)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error("Error fetching inventory transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })

  } catch (error) {
    console.error("Inventory transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Remove JWT authentication for simplicity
    const franchiseId = await getDefaultFranchiseId()

    const body = await request.json()
    const {
      product_id,
      transaction_type,
      quantity,
      unit_price,
      reference_type,
      reference_id,
      notes
    } = body

    // Validate required fields
    if (!product_id || !transaction_type || !quantity) {
      return NextResponse.json({ 
        error: "Missing required fields: product_id, transaction_type, quantity" 
      }, { status: 400 })
    }

    // Calculate total value
    const total_value = unit_price ? unit_price * Math.abs(quantity) : null

    // Insert the transaction
    const { data: transactionData, error: transactionError } = await supabaseServer
      .from("inventory_transactions")
      .insert({
        product_id,
        franchise_id: franchiseId,
        transaction_type,
        quantity,
        unit_price,
        total_value,
        reference_type,
        reference_id,
        notes,
        created_by: "system"
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Update product stock based on transaction type
    try {
      const { data: product, error: productFetchError } = await supabaseServer
        .from("products")
        .select("*")
        .eq("id", product_id)
        .single()

      if (productFetchError) {
        console.error("Error fetching product:", productFetchError)
      } else if (product) {
        let stockUpdate: any = {}
        
        switch (transaction_type) {
          case "in":
            stockUpdate = {
              stock_total: (product.stock_total || 0) + quantity,
              stock_available: (product.stock_available || 0) + quantity
            }
            break
          case "out":
            stockUpdate = {
              stock_available: Math.max(0, (product.stock_available || 0) - quantity)
            }
            break
          case "damage":
            stockUpdate = {
              stock_available: Math.max(0, (product.stock_available || 0) - quantity),
              stock_damaged: (product.stock_damaged || 0) + quantity,
              damage_count: (product.damage_count || 0) + 1
            }
            break
          case "repair":
            stockUpdate = {
              stock_available: (product.stock_available || 0) + quantity,
              stock_damaged: Math.max(0, (product.stock_damaged || 0) - quantity)
            }
            break
        }

        if (Object.keys(stockUpdate).length > 0) {
          const { error: updateError } = await supabaseServer
            .from("products")
            .update(stockUpdate)
            .eq("id", product_id)

          if (updateError) {
            console.error("Error updating product stock:", updateError)
          }
        }
      }
    } catch (stockUpdateError) {
      console.error("Stock update error:", stockUpdateError)
      // Don't fail the transaction creation, just log the error
    }

    return NextResponse.json({ success: true, data: transactionData })

  } catch (error) {
    console.error("Inventory transaction creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}