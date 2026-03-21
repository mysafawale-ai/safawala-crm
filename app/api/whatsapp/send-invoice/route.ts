import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"
import { sendMessage, sendMedia, sendTemplateMessage } from "@/lib/services/wati-service"
import jsPDF from "jspdf"
import "jspdf-autotable"
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
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authResult = await requireAuth(req, "staff")
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 })
    }

    const body = await req.json()
    const { orderId, orderType } = body

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

    // 1. Fetch order/booking data
    const orderData = await fetchOrderData(orderId, orderType)
    if (!orderData) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // 2. Fetch customer data
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", orderData.customer_id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found for this order" },
        { status: 404 }
      )
    }

    // Get phone number (prefer whatsapp field, then phone)
    const phone = customer.whatsapp || customer.phone
    if (!phone) {
      return NextResponse.json(
        { error: "Customer has no phone/WhatsApp number" },
        { status: 400 }
      )
    }

    // 3. Fetch order items
    const items = await fetchOrderItems(orderId, orderType)

    // 4. Fetch company settings
    const franchiseId =
      orderData.franchise_id ||
      authResult.authContext?.user?.franchise_id
    const companySettings = await fetchCompanySettings(franchiseId)

    // 5. Generate PDF
    const pdfBuffer = generateInvoicePDF(orderData, customer, items, companySettings)

    // 6. Upload to Supabase Storage
    const invoiceNumber =
      orderData.order_number || orderData.package_number || orderData.sale_number || orderId
    const bucket = process.env.NEXT_PUBLIC_INVOICES_BUCKET || "uploads"
    const filePath = `invoices/whatsapp/${invoiceNumber}_${Date.now()}.pdf`

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (uploadErr) {
      console.error("[WhatsApp Invoice] Upload error:", uploadErr)
      return NextResponse.json(
        { error: "Failed to upload invoice PDF" },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Failed to get public URL for invoice" },
        { status: 500 }
      )
    }

    // 7. Send via WhatsApp (try template first, then session message + PDF)
    const customerName = customer.name || "Customer"
    let sendResult: { success: boolean; error?: string }

    // Try sending template message first (works outside 24hr window)
    const templateResult = await sendTemplateMessage({
      phone,
      templateName: "invoice_sent",
      parameters: [customerName, invoiceNumber],
    })

    if (templateResult.success) {
      // Template sent, now send the PDF document
      sendResult = await sendMedia({
        phone,
        mediaUrl: publicUrl,
        caption: `Invoice ${invoiceNumber} - ${companySettings?.company_name || "Safawala"}`,
        mediaType: "document",
      })
    } else {
      // Fallback: try session message with PDF
      console.log("[WhatsApp Invoice] Template failed, trying session message:", templateResult.error)

      const messageText = [
        `📄 *Invoice - ${companySettings?.company_name || "Safawala"}*`,
        "",
        `Dear ${customerName},`,
        "",
        `Your invoice *${invoiceNumber}* is ready.`,
        "",
        `💰 Total: ₹${(orderData.total_amount || 0).toLocaleString("en-IN")}`,
        orderData.amount_paid
          ? `✅ Paid: ₹${orderData.amount_paid.toLocaleString("en-IN")}`
          : "",
        orderData.pending_amount && orderData.pending_amount > 0
          ? `⏳ Balance: ₹${orderData.pending_amount.toLocaleString("en-IN")}`
          : "",
        "",
        "Thank you for your business! 🙏",
      ]
        .filter(Boolean)
        .join("\n")

      const msgResult = await sendMessage({ phone, message: messageText })

      // Send the PDF regardless of whether text message succeeded
      const mediaResult = await sendMedia({
        phone,
        mediaUrl: publicUrl,
        caption: `Invoice ${invoiceNumber}`,
        mediaType: "document",
      })

      sendResult = {
        success: msgResult.success || mediaResult.success,
        error:
          !msgResult.success && !mediaResult.success
            ? `Text: ${msgResult.error}; PDF: ${mediaResult.error}`
            : undefined,
      }
    }

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error: sendResult.error || "Failed to send WhatsApp message",
          pdfUrl: publicUrl,
        },
        { status: 500 }
      )
    }

    // 8. Log the WhatsApp invoice send
    try {
      await supabase.from("whatsapp_messages").insert({
        phone: phone.replace(/\D/g, ""),
        message_type: "invoice",
        content: `Invoice ${invoiceNumber} sent`,
        status: "sent",
        booking_id: orderId,
        franchise_id: franchiseId,
        sent_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.warn("[WhatsApp Invoice] Failed to log message:", logErr)
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceNumber} sent to ${phone} via WhatsApp`,
      pdfUrl: publicUrl,
    })
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
  let table: string
  let fkColumn: string
  switch (orderType) {
    case "product_order":
      table = "product_order_items"
      fkColumn = "order_id"
      break
    case "package_booking":
      table = "package_booking_items"
      fkColumn = "booking_id"
      break
    case "direct_sale":
      table = "direct_sales_order_items"
      fkColumn = "order_id"
      break
    default:
      return []
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(fkColumn, orderId)

  if (error) {
    console.warn(`[WhatsApp Invoice] Items fetch error from ${table}:`, error)
    return []
  }
  return data || []
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
// ─────────────────────────────────────────────────────────────────────

function generateInvoicePDF(
  order: any,
  customer: any,
  items: any[],
  company: any
): Uint8Array {
  const doc = new jsPDF()
  const green: [number, number, number] = [27, 94, 32]
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header ──
  doc.setFontSize(18)
  doc.setTextColor(green[0], green[1], green[2])
  doc.text(company?.company_name || "Safawala", 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  const companyLines: string[] = []
  if (company?.address) companyLines.push(company.address)
  if (company?.city || company?.state)
    companyLines.push([company.city, company.state, company.pincode].filter(Boolean).join(", "))
  if (company?.phone) companyLines.push(`Phone: ${company.phone}`)
  if (company?.email) companyLines.push(`Email: ${company.email}`)
  if (company?.gst_number) companyLines.push(`GST: ${company.gst_number}`)

  let y = 24
  companyLines.forEach((line) => {
    doc.text(line, 14, y)
    y += 4
  })

  // ── Invoice Title ──
  const invoiceNumber =
    order.order_number || order.package_number || order.sale_number || "N/A"
  doc.setFontSize(14)
  doc.setTextColor(green[0], green[1], green[2])
  doc.text("INVOICE", pageWidth - 14, 18, { align: "right" })

  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`#${invoiceNumber}`, pageWidth - 14, 24, { align: "right" })

  const invoiceDate = order.invoice_date || order.created_at
  if (invoiceDate) {
    try {
      doc.text(
        `Date: ${format(new Date(invoiceDate), "dd MMM yyyy")}`,
        pageWidth - 14,
        29,
        { align: "right" }
      )
    } catch {
      doc.text(`Date: ${invoiceDate}`, pageWidth - 14, 29, { align: "right" })
    }
  }

  // Status badge
  const status = order.status || "confirmed"
  doc.setFontSize(8)
  doc.setTextColor(green[0], green[1], green[2])
  doc.text(`Status: ${status.toUpperCase()}`, pageWidth - 14, 34, { align: "right" })

  // ── Divider ──
  y = Math.max(y, 40) + 4
  doc.setDrawColor(220, 220, 220)
  doc.line(14, y, pageWidth - 14, y)
  y += 8

  // ── Customer Info ──
  doc.setFontSize(10)
  doc.setTextColor(green[0], green[1], green[2])
  doc.text("Bill To:", 14, y)
  y += 5

  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(customer.name || "Customer", 14, y)
  y += 4
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 14, y)
    y += 4
  }
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 14, y)
    y += 4
  }
  if (customer.address) {
    doc.text(customer.address, 14, y)
    y += 4
  }
  const cityLine = [customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")
  if (cityLine) {
    doc.text(cityLine, 14, y)
    y += 4
  }

  // ── Event Details (right side) ──
  let ey = y - 20
  const ex = pageWidth / 2 + 10
  const eventDate = order.event_date
  const deliveryDate = order.delivery_date
  const returnDate = order.return_date

  doc.setFontSize(10)
  doc.setTextColor(green[0], green[1], green[2])
  doc.text("Event Details:", ex, ey)
  ey += 5
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)

  if (order.event_type) {
    doc.text(`Event: ${order.event_type}`, ex, ey)
    ey += 4
  }
  if (eventDate) {
    try {
      doc.text(`Event Date: ${format(new Date(eventDate), "dd MMM yyyy")}`, ex, ey)
    } catch {
      doc.text(`Event Date: ${eventDate}`, ex, ey)
    }
    ey += 4
  }
  if (deliveryDate) {
    try {
      doc.text(`Delivery: ${format(new Date(deliveryDate), "dd MMM yyyy")}`, ex, ey)
    } catch {
      doc.text(`Delivery: ${deliveryDate}`, ex, ey)
    }
    ey += 4
  }
  if (returnDate) {
    try {
      doc.text(`Return: ${format(new Date(returnDate), "dd MMM yyyy")}`, ex, ey)
    } catch {
      doc.text(`Return: ${returnDate}`, ex, ey)
    }
    ey += 4
  }
  if (order.groom_name) {
    doc.text(`Groom: ${order.groom_name}`, ex, ey)
    ey += 4
  }
  if (order.bride_name) {
    doc.text(`Bride: ${order.bride_name}`, ex, ey)
    ey += 4
  }

  y = Math.max(y, ey) + 6

  // ── Items Table ──
  if (items.length > 0) {
    const tableHead = [["#", "Item", "Qty", "Price", "Total"]]
    const tableBody = items.map((item, idx) => [
      String(idx + 1),
      item.product_name || item.product_name_copy || item.name || item.category || "Item",
      String(item.quantity || 1),
      `₹${(item.unit_price || 0).toLocaleString("en-IN")}`,
      `₹${(item.total_price || 0).toLocaleString("en-IN")}`,
    ])

    ;(doc as any).autoTable({
      head: tableHead,
      body: tableBody,
      startY: y,
      theme: "striped",
      headStyles: {
        fillColor: green,
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 12 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
    })

    y = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 8
      : y + 30
  } else {
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text("No items listed", 14, y)
    y += 10
  }

  // ── Financial Summary ──
  const summaryX = pageWidth - 80

  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)

  const addSummaryRow = (label: string, value: number, bold = false) => {
    if (bold) {
      doc.setFontSize(10)
      doc.setTextColor(green[0], green[1], green[2])
    }
    doc.text(label, summaryX, y)
    doc.text(`₹${value.toLocaleString("en-IN")}`, pageWidth - 14, y, {
      align: "right",
    })
    if (bold) {
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
    }
    y += 5
  }

  if (order.subtotal_amount || order.subtotal) {
    addSummaryRow("Subtotal:", order.subtotal_amount || order.subtotal || 0)
  }
  if (order.discount_amount && order.discount_amount > 0) {
    addSummaryRow("Discount:", order.discount_amount)
  }
  if (order.coupon_discount && order.coupon_discount > 0) {
    addSummaryRow(`Coupon (${order.coupon_code || ""})`, order.coupon_discount)
  }
  if (order.tax_amount && order.tax_amount > 0) {
    addSummaryRow("Tax/GST:", order.tax_amount)
  }
  if (order.security_deposit && order.security_deposit > 0) {
    addSummaryRow("Security Deposit:", order.security_deposit)
  }

  y += 2
  doc.setDrawColor(green[0], green[1], green[2])
  doc.line(summaryX, y, pageWidth - 14, y)
  y += 5

  addSummaryRow("Total:", order.total_amount || 0, true)

  if (order.amount_paid && order.amount_paid > 0) {
    addSummaryRow("Paid:", order.amount_paid)
  }
  if (order.pending_amount && order.pending_amount > 0) {
    doc.setTextColor(200, 100, 0)
    addSummaryRow("Balance Due:", order.pending_amount)
    doc.setTextColor(60, 60, 60)
  }

  // ── Payment Method ──
  if (order.payment_method) {
    y += 4
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Payment Method: ${order.payment_method}`, 14, y)
  }

  // ── Notes ──
  if (order.notes) {
    y += 8
    doc.setFontSize(9)
    doc.setTextColor(green[0], green[1], green[2])
    doc.text("Notes:", 14, y)
    y += 4
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(8)
    const noteLines = doc.splitTextToSize(order.notes, pageWidth - 28)
    doc.text(noteLines, 14, y)
    y += noteLines.length * 4
  }

  // ── Terms ──
  if (company?.terms_conditions) {
    y += 6
    doc.setFontSize(8)
    doc.setTextColor(green[0], green[1], green[2])
    doc.text("Terms & Conditions:", 14, y)
    y += 4
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7)
    const termLines = doc.splitTextToSize(company.terms_conditions, pageWidth - 28)
    doc.text(termLines.slice(0, 8), 14, y) // limit to 8 lines
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 12
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Generated by ${company?.company_name || "Safawala"} CRM`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  )

  // Return as Uint8Array for server-side upload
  const arrayBuffer = doc.output("arraybuffer")
  return new Uint8Array(arrayBuffer)
}
