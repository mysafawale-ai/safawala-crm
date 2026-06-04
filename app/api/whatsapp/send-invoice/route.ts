import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"
import { sendMessage, sendMedia, sendTemplateMessage } from "@/lib/services/wati-service"
import { htmlToPdfBuffer, urlToPdfBuffer } from "@/lib/puppeteer-pdf"
import { generateInvoiceHTML } from "@/lib/invoice-html-template"
import { mapToInvoiceData } from "@/lib/map-invoice-data"
import { generatePdfToken } from "@/lib/pdf-token"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

/**
 * POST /api/whatsapp/send-invoice
 *
 * Generates an invoice PDF server-side, uploads to Supabase Storage,
 * and sends it to the customer via WhatsApp (WATI).
 *
 * Body: { orderId: string, orderType: "product_order" | "package_booking" | "direct_sale" }
 */
export async function sendInvoicePDFAndWhatsAppInternal(params: {
  orderId: string
  orderType: "product_order" | "package_booking" | "direct_sale"
  franchiseId?: string
  extraPhones?: string[]
  sendConfirmation?: boolean
}) {
  const { orderId, orderType, extraPhones, franchiseId, sendConfirmation } = params

  // 1. Fetch order/booking data
  const orderData = await fetchOrderData(orderId, orderType)
  if (!orderData) {
    throw new Error("Order not found")
  }

  // 2. Fetch customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", orderData.customer_id)
    .single()

  if (!customer) {
    throw new Error("Customer not found for this order")
  }

  // Get phone number (prefer whatsapp field, then phone)
  const phone = customer.whatsapp || customer.phone
  if (!phone) {
    throw new Error("Customer has no phone/WhatsApp number")
  }

  // 3. Fetch order items
  const items = await fetchOrderItems(orderId, orderType)

  // 4. Fetch company settings
  const finalFranchiseId = orderData.franchise_id || franchiseId
  const companySettings = await fetchCompanySettings(finalFranchiseId)

  // -- If sendConfirmation is true, trigger the booking confirmation template message first --
  if (sendConfirmation) {
    try {
      const { onBookingCreated } = await import("@/lib/services/whatsapp-triggers")
      if (finalFranchiseId) {
        await onBookingCreated({
          bookingId: orderId,
          franchiseId: finalFranchiseId,
        })
      }
    } catch (err) {
      console.error("[WhatsApp Invoice] Failed to send booking confirmation template:", err)
    }
  }

  // 5. Generate PDF — render the EXACT same invoice page the user sees when they click Print
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mysafawala.com"
  const token = generatePdfToken(orderId, orderType)
  const invoicePageUrl = `${appBaseUrl}/create-invoice?mode=edit&id=${orderId}&pdfToken=${token}&print=true`

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await urlToPdfBuffer(invoicePageUrl)
    console.log("[WhatsApp Invoice] PDF generated from live invoice page:", invoicePageUrl)
  } catch (err) {
    // Fallback to HTML template if live-page render fails
    console.warn("[WhatsApp Invoice] Live-page failed, falling back to HTML template:", err)
    const invoiceData = mapToInvoiceData(orderData, customer, items, companySettings, orderType)
    const htmlContent = generateInvoiceHTML(invoiceData)
    pdfBuffer = await htmlToPdfBuffer(htmlContent)
  }

  // 6. Upload to Supabase Storage
  const invoiceNumber =
    orderData.order_number || orderData.package_number || orderData.sale_number || orderId
  const customerName = customer.name || "Customer"
  const eventDate = orderData.event_date
    ? format(new Date(orderData.event_date), "dd/MM/yy")
    : ""
  const customerPhone = customer.whatsapp || customer.phone || ""
  const invoiceLabel = [invoiceNumber, customerName, eventDate].filter(Boolean).join(" | ")
  const safeFileName = [invoiceNumber, customerName.replace(/[^a-zA-Z0-9]/g, "_"), eventDate?.replace(/[^a-zA-Z0-9-]/g, "")].filter(Boolean).join("_")
  const bucket = process.env.NEXT_PUBLIC_INVOICES_BUCKET || "uploads"
  const filePath = `invoices/whatsapp/${safeFileName}_${Date.now()}.pdf`

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (uploadErr) {
    console.error("[WhatsApp Invoice] Upload error:", uploadErr)
    throw new Error("Failed to upload invoice PDF")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)

  if (!publicUrl) {
    throw new Error("Failed to get public URL for invoice")
  }

  // 7. Send booking_invoice_document template (approved, with PDF as document header)
  const eventDateFormatted = orderData.event_date
    ? format(new Date(orderData.event_date), "dd MMM yyyy")
    : "TBD"
  const eventTime = orderData.delivery_time || orderData.event_time || "TBD"
  const venue = orderData.venue_name || orderData.venue_address || "TBD"
  let itemsSummary = ""
  if (orderType === "package_booking") {
    const { data: productItems } = await supabase
      .from("package_booking_product_items")
      .select(`
        quantity,
        products ( name, category )
      `)
      .eq("package_booking_id", orderId)

    itemsSummary = items.map((item: any) => {
      const inclusionsStr = Array.isArray(item.inclusions)
        ? item.inclusions.join(", ")
        : (typeof item.inclusions === "string" ? item.inclusions : "")

      let productsStr = ""
      const reserved = Array.isArray(item.reserved_products)
        ? item.reserved_products
        : (typeof item.reserved_products === "string" ? JSON.parse(item.reserved_products) : [])
      if (reserved.length > 0) {
        productsStr = reserved.map((p: any) => `${p.name} x${p.qty || p.quantity || 1}`).join(", ")
      } else if (productItems && productItems.length > 0) {
        productsStr = productItems.map((p: any) => `${p.products?.name || p.products?.category || "Item"} x${p.quantity}`).join(", ")
      }

      let summary = `${item.product_name || "Package Item"}`
      const details: string[] = []
      if (inclusionsStr) {
        details.push(`Inclusions: ${inclusionsStr}`)
      }
      if (productsStr) {
        details.push(`Products: ${productsStr}`)
      }
      if (details.length > 0) {
        summary += ` (${details.join("; ")})`
      }
      return summary
    }).join(", ")
  } else {
    if (orderData.package_id) {
      const { data: pkgSet } = await supabase.from("package_sets").select("name").eq("id", orderData.package_id).maybeSingle()
      const { data: pkgVar } = await supabase.from("package_variants").select("name, inclusions").eq("id", orderData.variant_id).maybeSingle()
      
      const pkgName = `${pkgSet?.name || "Package"} - ${pkgVar?.name || "Variant"}`
      const inclusionsStr = pkgVar?.inclusions ? (Array.isArray(pkgVar.inclusions) ? pkgVar.inclusions.join(", ") : String(pkgVar.inclusions)) : ""
      
      const productsStr = items.map((i: any) => `${i.product_name || "Item"} x${i.quantity || 1}`).join(", ")
      
      let summary = pkgName
      const details: string[] = []
      if (inclusionsStr) {
        details.push(`Inclusions: ${inclusionsStr}`)
      }
      if (productsStr) {
        details.push(`Products: ${productsStr}`)
      }
      if (details.length > 0) {
        summary += ` (${details.join("; ")})`
      }
      itemsSummary = summary
    } else {
      itemsSummary = items.length > 0
        ? items.map((i: any) => `${i.product_name || "Item"} x${i.quantity || 1}`).join(", ")
        : "Wedding Accessories"
    }
  }

  if (itemsSummary.length > 900) {
    itemsSummary = itemsSummary.slice(0, 900) + "..."
  }
  // Template body has: • Total Amount: {{7}}  (NO ₹ prefix in template)
  // So we include ₹ in the value we send
  const totalAmountStr = `₹${(orderData.total_amount || 0).toLocaleString("en-IN")}`
  const paymentStatus = orderData.amount_paid > 0
    ? `Advance ₹${orderData.amount_paid.toLocaleString("en-IN")} Paid`
    : "Pending"

  console.log("[WhatsApp Invoice] Sending booking_invoice_document template to:", phone)
  console.log("[WhatsApp Invoice] Parameters:", {
    customerName, invoiceNumber, eventDateFormatted, eventTime, venue,
    itemsSummary, totalAmountStr, paymentStatus, pdfUrl: publicUrl,
  })

  // Use the approved template. Try the newer UTILITY template (booking_invoice_document_v3) first.
  let templateResult = await sendTemplateMessage({
    phone,
    templateName: "booking_invoice_document_v3",
    parameters: [
      customerName,        // {{1}} - Customer name
      invoiceNumber,       // {{2}} - Booking/Invoice ID
      eventDateFormatted,  // {{3}} - Event Date
      eventTime,           // {{4}} - Event Time
      venue,               // {{5}} - Venue
      itemsSummary,        // {{6}} - Items summary
      totalAmountStr,      // {{7}} - Total amount
      paymentStatus,       // {{8}} - Payment status
    ],
    mediaUrl: publicUrl,   // PDF attached as document header
  })

  if (!templateResult.success) {
    console.log("[WhatsApp Invoice] booking_invoice_document_v3 failed/pending, trying booking_invoice_document_v2 fallback")
    templateResult = await sendTemplateMessage({
      phone,
      templateName: "booking_invoice_document_v2",
      parameters: [
        customerName,
        invoiceNumber,
        eventDateFormatted,
        eventTime,
        venue,
        itemsSummary,
        totalAmountStr,
        paymentStatus,
      ],
      mediaUrl: publicUrl,
    })
  }

  if (!templateResult.success) {
    console.log("[WhatsApp Invoice] booking_invoice_document_v2 failed/pending, trying booking_invoice_document fallback")
    templateResult = await sendTemplateMessage({
      phone,
      templateName: "booking_invoice_document",
      parameters: [
        customerName,
        invoiceNumber,
        eventDateFormatted,
        eventTime,
        venue,
        itemsSummary,
        totalAmountStr,
        paymentStatus,
      ],
      mediaUrl: publicUrl,
    })
  }

  console.log("[WhatsApp Invoice] Template message result:", templateResult)

  if (!templateResult.success) {
    throw new Error(templateResult.error || "Failed to send WhatsApp message")
  }


  // NOTE: No separate sendMedia needed — the PDF is attached as the DOCUMENT header
  // in the booking_invoice_document template (via mediaUrl in the receiver)


  // 8. Log the WhatsApp invoice send
  try {
    await supabase.from("whatsapp_messages").insert({
      phone: phone.replace(/\D/g, ""),
      message_type: "invoice",
      content: `${invoiceLabel} sent`,
      status: "sent",
      booking_id: orderId,
      franchise_id: finalFranchiseId,
      sent_at: new Date().toISOString(),
    })
  } catch (logErr) {
    console.warn("[WhatsApp Invoice] Failed to log message:", logErr)
  }

  // Also send to extra phone numbers (e.g. business owner)
  if (Array.isArray(extraPhones) && extraPhones.length > 0) {
    for (const extraPhone of extraPhones) {
      if (extraPhone && extraPhone.replace(/\D/g, "") !== phone.replace(/\D/g, "")) {
        try {
          await sendMedia({
            phone: extraPhone,
            mediaUrl: publicUrl,
            caption: `${invoiceLabel} - ${companySettings?.company_name || "Safawala"}`,
            mediaType: "document",
          })
        } catch (e) {
          console.warn(`[WhatsApp Invoice] Failed to send to extra phone ${extraPhone}:`, e)
        }
      }
    }
  }

  return {
    success: true,
    message: `${invoiceLabel} sent to ${phone} via WhatsApp`,
    pdfUrl: publicUrl,
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authResult = await requireAuth(req, "staff")
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 })
    }

    const body = await req.json()
    const { orderId, orderType, extraPhones, sendConfirmation } = body

    if (!orderId || !orderType) {
      return NextResponse.json(
        { error: "orderId and orderType are required" },
        { status: 400 }
      )
    }

    const validTypes = ["product_order", "package_booking", "direct_sale"]
    if (!validTypes.includes(orderType)) {
      return NextResponse.json(
        { error: `Invalid orderType. Use: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    const franchiseId =
      body.franchiseId ||
      authResult.authContext?.user?.franchise_id

    const result = await sendInvoicePDFAndWhatsAppInternal({
      orderId,
      orderType,
      franchiseId,
      extraPhones,
      sendConfirmation,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[WhatsApp Invoice] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send invoice via WhatsApp" },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function fetchOrderData(orderId: string, orderType: string) {
  let table: string
  switch (orderType) {
    case "product_order":
      table = "product_orders"
      break
    case "package_booking":
      table = "package_bookings"
      break
    case "direct_sale":
      table = "direct_sales_orders"
      break
    default:
      return null
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", orderId)
    .single()

  if (error || !data) return null
  return data
}

async function fetchOrderItems(orderId: string, orderType: string) {
  if (orderType === "product_order") {
    const { data, error } = await supabase
      .from("product_order_items")
      .select(`
        id, quantity, unit_price, total_price,
        products ( id, name, category )
      `)
      .eq("order_id", orderId)
    if (error) {
      console.warn(`[WhatsApp Invoice] Items fetch error from product_order_items:`, error)
      return []
    }
    // Flatten: expose product_name at top level
    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.products?.name || item.products?.category || "Item",
      category: item.products?.category,
    }))
  }

  if (orderType === "package_booking") {
    const { data, error } = await supabase
      .from("package_booking_items")
      .select(`
        id, quantity, unit_price, total_price,
        variant_name, variant_inclusions, reserved_products
      `)
      .eq("booking_id", orderId)
    if (error) {
      console.warn(`[WhatsApp Invoice] Items fetch error from package_booking_items:`, error)
      return []
    }
    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.variant_name || "Package Item",
      inclusions: item.variant_inclusions,
      reserved_products: item.reserved_products,
    }))
  }

  if (orderType === "direct_sale") {
    const { data, error } = await supabase
      .from("direct_sales_order_items")
      .select("*")
      .eq("order_id", orderId)
    if (error) {
      console.warn(`[WhatsApp Invoice] Items fetch error from direct_sales_order_items:`, error)
      return []
    }
    return (data || []).map((item: any) => ({
      ...item,
      product_name: item.product_name || item.name || item.category || "Item",
    }))
  }

  return []
}

async function fetchCompanySettings(franchiseId?: string) {
  if (!franchiseId) return null

  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("franchise_id", franchiseId)
    .single()

  return data
}

// ─────────────────────────────────────────────────────────────────────
// Server-side PDF generation with jsPDF
