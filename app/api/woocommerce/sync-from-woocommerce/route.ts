import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { wooCommerceService } from "@/lib/woocommerce-service"

export async function POST(request: NextRequest) {
  try {
    const { syncType = "products" } = await request.json()

    // Get WooCommerce configuration
    const { data: config, error: configError } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("integration_name", "woocommerce")
      .eq("is_active", true)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: "WooCommerce integration not configured" }, { status: 400 })
    }

    let wooConfig
    if (config.settings) {
      wooConfig = {
        storeUrl: config.settings.store_url,
        consumerKey: config.settings.consumer_key,
        consumerSecret: config.settings.consumer_secret,
      }
    } else {
      wooConfig = {
        storeUrl: config.base_url,
        consumerKey: config.api_key,
        consumerSecret: config.secret,
      }
    }

    if (!wooConfig.storeUrl || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
      return NextResponse.json({ error: "WooCommerce configuration incomplete" }, { status: 400 })
    }

    // Configure WooCommerce service
    wooCommerceService.setConfig(wooConfig)

    // Test connection first
    const connectionTest = await wooCommerceService.testConnection()
    if (!connectionTest) {
      return NextResponse.json(
        { error: "Failed to connect to WooCommerce store. Please check your configuration." },
        { status: 400 },
      )
    }

    let syncResults = { success: 0, errors: 0, details: [] }

    if (syncType === "products") {
      syncResults = await syncProductsFromWooCommerce()
    } else if (syncType === "orders") {
      syncResults = await syncOrdersFromWooCommerce()
    } else if (syncType === "customers") {
      syncResults = await syncCustomersFromWooCommerce()
    }

    // Log sync results
    await supabase.from("integration_logs").insert({
      integration_name: "woocommerce",
      action: `sync_from_woocommerce_${syncType}`,
      success_count: syncResults.success,
      error_count: syncResults.errors,
      details: syncResults.details,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncResults.success} ${syncType} from WooCommerce`,
      data: syncResults,
    })
  } catch (error) {
    console.error("Error syncing from WooCommerce:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync from WooCommerce" },
      { status: 500 },
    )
  }
}

async function syncProductsFromWooCommerce() {
  const success = []
  const errors = []

  try {
    // Get all products from WooCommerce (paginated)
    let page = 1
    let hasMore = true

    while (hasMore) {
      const wooProducts = await wooCommerceService.getProducts(page, 50)

      if (!wooProducts || wooProducts.length === 0) {
        hasMore = false
        break
      }

      for (const wooProduct of wooProducts) {
        try {
          // Check if product already exists in CRM
          const { data: existingProduct } = await supabase
            .from("products")
            .select("id")
            .eq("product_code", wooProduct.sku)
            .single()

          const productData = {
            product_code: wooProduct.sku || `WOO-${wooProduct.id}`,
            name: wooProduct.name,
            description: wooProduct.description || wooProduct.short_description || "",
            price: Number.parseFloat(wooProduct.regular_price) || 0,
            rental_price: Number.parseFloat(wooProduct.sale_price) || 0,
            stock_total: wooProduct.stock_quantity || 0,
            stock_available: wooProduct.stock_quantity || 0,
            image_url: wooProduct.images?.[0]?.src || null,
            is_active: wooProduct.status === "publish",
            woocommerce_id: wooProduct.id,
            woocommerce_sync: true,
            updated_at: new Date().toISOString(),
          }

          if (existingProduct) {
            // Update existing product
            const { error } = await supabase.from("products").update(productData).eq("id", existingProduct.id)

            if (error) throw error
          } else {
            // Create new product
            const { error } = await supabase.from("products").insert({
              ...productData,
              created_at: new Date().toISOString(),
            })

            if (error) throw error
          }

          success.push({ name: wooProduct.name, sku: wooProduct.sku })
        } catch (error) {
          errors.push({
            product: wooProduct.name,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      page++
      if (wooProducts.length < 50) hasMore = false
    }
  } catch (error) {
    console.error("Error in syncProductsFromWooCommerce:", error)
    throw error
  }

  return {
    success: success.length,
    errors: errors.length,
    details: { success, errors },
  }
}

async function syncOrdersFromWooCommerce() {
  return { success: 0, errors: 0, details: [] }
}

async function syncCustomersFromWooCommerce() {
  return { success: 0, errors: 0, details: [] }
}
