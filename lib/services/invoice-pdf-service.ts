import { supabaseServer as defaultSupabase } from "@/lib/supabase-server-simple"
import { htmlToPdfBuffer } from "@/lib/puppeteer-pdf"
import { generateInvoiceHTML } from "@/lib/invoice-html-template"
import { mapToInvoiceData } from "@/lib/map-invoice-data"
import { format } from "date-fns"

/**
 * Generates an invoice PDF server-side from HTML, uploads it to Supabase Storage,
 * and saves the resulting URL to the order record.
 */
export async function generateAndSaveInvoicePDF(
  orderId: string,
  orderType: string,
  supabaseClient = defaultSupabase
): Promise<string> {
  console.log(`[PDF Service] Generating PDF for ${orderType} ${orderId}...`)

  // 1. Fetch order/booking data
  const orderData = await fetchOrderData(orderId, orderType, supabaseClient)
  if (!orderData) {
    throw new Error(`Order/Booking not found: ${orderId} (${orderType})`)
  }

  // 2. Fetch customer data
  const { data: customer, error: customerErr } = await supabaseClient
    .from("customers")
    .select("*")
    .eq("id", orderData.customer_id)
    .single()

  if (customerErr || !customer) {
    throw new Error(`Customer not found for this order: ${customerErr?.message || 'No record'}`)
  }

  // 3. Fetch order items
  const items = await fetchOrderItems(orderId, orderType, supabaseClient)
  console.log(`[PDF Service] Fetched ${items.length} items for ${orderType} ${orderId}`)

  // 4. Fetch company settings
  const companySettings = await fetchCompanySettings(orderData.franchise_id, supabaseClient)

  // 5. Map to standard InvoiceData format
  const invoiceData = mapToInvoiceData(orderData, customer, items, companySettings, orderType)

  // 6. Generate HTML content
  const htmlContent = generateInvoiceHTML(invoiceData)

  // 7. Convert HTML directly to PDF Buffer using Puppeteer (no live page navigation)
  console.log("[PDF Service] Converting HTML template to PDF buffer...")
  const pdfBuffer = await htmlToPdfBuffer(htmlContent)

  // 8. Determine file name and storage paths
  const invoiceNumber =
    orderData.order_number ||
    orderData.package_number ||
    orderData.sale_number ||
    orderData.booking_number ||
    orderId

  const customerName = customer.name || "Customer"
  const eventDate = orderData.event_date
    ? format(new Date(orderData.event_date), "dd/MM/yy")
    : ""

  const safeFileName = [
    invoiceNumber,
    customerName.replace(/[^a-zA-Z0-9]/g, "_"),
    eventDate?.replace(/[^a-zA-Z0-9-]/g, "")
  ].filter(Boolean).join("_")

  const bucket = process.env.NEXT_PUBLIC_INVOICES_BUCKET || "uploads"
  const filePath = `invoices/whatsapp/${safeFileName}_${Date.now()}.pdf`

  // 9. Upload the PDF buffer to Supabase Storage
  console.log(`[PDF Service] Uploading PDF to storage: ${bucket}/${filePath}...`)
  const { error: uploadErr } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (uploadErr) {
    console.error("[PDF Service] Upload error:", uploadErr)
    throw new Error(`Failed to upload invoice PDF: ${uploadErr.message}`)
  }

  // 10. Retrieve the public URL for the uploaded PDF
  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(bucket).getPublicUrl(filePath)

  if (!publicUrl) {
    throw new Error("Failed to get public URL for uploaded invoice PDF")
  }

  console.log(`[PDF Service] Public URL generated: ${publicUrl}`)

  // 11. Save the public URL to the order table
  const tableName = getTableName(orderType)
  if (tableName) {
    console.log(`[PDF Service] Saving PDF URL to ${tableName}.${orderId}...`)
    const { error: updateErr } = await supabaseClient
      .from(tableName)
      .update({ pdf_url: publicUrl })
      .eq("id", orderId)

    if (updateErr) {
      console.error(`[PDF Service] Database update error on table ${tableName}:`, updateErr)
      throw new Error(`Failed to update order with PDF URL: ${updateErr.message}`)
    }
    console.log(`[PDF Service] Successfully updated ${tableName} with pdf_url.`)
  } else {
    console.warn(`[PDF Service] Unknown orderType "${orderType}", skipped database update.`)
  }

  return publicUrl
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function getTableName(orderType: string): string | null {
  switch (orderType) {
    case "product_order":
    case "product_orders":
      return "product_orders"
    case "package_booking":
    case "package_bookings":
      return "package_bookings"
    case "direct_sale":
    case "direct_sales_orders":
      return "direct_sales_orders"
    case "booking":
    case "bookings":
      return "bookings"
    default:
      return null
  }
}

async function fetchOrderData(orderId: string, orderType: string, supabase: any) {
  const tableName = getTableName(orderType)
  if (!tableName) return null

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", orderId)
    .single()

  if (error || !data) {
    console.warn(`[PDF Service] Error fetching order data from ${tableName}:`, error)
    return null
  }
  return data
}

async function fetchOrderItems(orderId: string, orderType: string, supabase: any) {
  if (orderType === "product_order" || orderType === "product_orders") {
    const { data, error } = await supabase
      .from("product_order_items")
      .select(`
        id, quantity, unit_price, total_price,
        products ( id, name, category, product_code )
      `)
      .eq("order_id", orderId)

    if (error) {
      console.warn(`[PDF Service] Items fetch error from product_order_items:`, error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.product_name || item.products?.name || item.products?.category || "Item",
      category: item.category || item.products?.category,
    }))
  }

  if (orderType === "package_booking" || orderType === "package_bookings") {
    const { data, error } = await supabase
      .from("package_booking_items")
      .select(`
        id, quantity, unit_price, total_price,
        variant_name, variant_inclusions, reserved_products
      `)
      .eq("booking_id", orderId)

    if (error) {
      console.warn(`[PDF Service] Items fetch error from package_booking_items:`, error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.variant_name || "Package Item",
      inclusions: item.variant_inclusions,
      reserved_products: item.reserved_products,
    }))
  }

  if (orderType === "direct_sale" || orderType === "direct_sales_orders") {
    const { data, error } = await supabase
      .from("direct_sales_order_items")
      .select("*")
      .eq("order_id", orderId)

    if (error) {
      console.warn(`[PDF Service] Items fetch error from direct_sales_order_items:`, error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.product_name || item.name || item.category || "Item",
    }))
  }

  if (orderType === "booking" || orderType === "bookings") {
    const { data, error } = await supabase
      .from("booking_items")
      .select(`
        id, quantity, unit_price, total_price,
        products ( id, name, category, product_code )
      `)
      .eq("booking_id", orderId)

    if (error) {
      console.warn(`[PDF Service] Items fetch error from booking_items:`, error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.products?.name || item.products?.category || "Item",
      category: item.products?.category,
    }))
  }

  return []
}

async function fetchCompanySettings(franchiseId: string | undefined, supabase: any) {
  if (!franchiseId) return null

  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("franchise_id", franchiseId)
    .single()

  return data
}
