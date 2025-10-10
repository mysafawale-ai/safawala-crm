interface WhatsAppMessage {
  to: string
  message: string
  attachment?: {
    filename: string
    content: string // base64 encoded
    mimetype: string
  }
}

interface BookingNotification {
  customerName: string
  bookingNumber: string
  totalAmount: number
  eventDate?: string
  deliveryDate?: string
  pickupDate?: string
  items: Array<{
    name: string
    quantity: number
  }>
}

interface WATIConfig {
  apiKey: string
  baseUrl: string
  instanceId: string
}

interface WATIMessage {
  to: string
  type: "text" | "media"
  text?: {
    body: string
  }
  media?: {
    type: "document" | "image"
    document?: {
      filename: string
      link: string
    }
    caption?: string
  }
}

class WhatsAppService {
  private config: WATIConfig | null = null

  constructor() {
    this.config = {
      apiKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMWU0YjA3NS03ZmUxLTQzYmUtOTBiMC04NTExMjQxNjEzYTQiLCJ1bmlxdWVfbmFtZSI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwibmFtZWlkIjoibXlzYWZhd2FsZUBnbWFpbC5jb20iLCJlbWFpbCI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDgvMTIvMjAyNSAyMDoxMjo1NSIsInRlbmFudF9pZCI6IjQ4MTQ1NSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.ZmgPg4ZTHPhSytUlT0s2BfmUIEkzlKdAbogvVNzHTek",
      baseUrl: "https://live-mt-server.wati.io/481455",
      instanceId: "481455",
    }
  }

  setConfig(config: WATIConfig) {
    this.config = config
  }

  async sendMessage(message: WATIMessage): Promise<boolean> {
    if (!this.config) {
      console.error("WATI configuration not set")
      return false
    }

    try {
      const phoneNumber = message.to.replace(/\D/g, "") // Remove non-digits
      const endpoint = `${this.config.baseUrl}/api/v1/sendSessionMessage/${phoneNumber}`

      console.log("[v0] WATI Request URL:", endpoint)

      const requestBody = {
        messageText: message.text?.body || "",
      }

      console.log("[v0] WATI Request Body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      console.log("[v0] WATI Response Status:", response.status)
      console.log("[v0] WATI Response Text:", responseText)

      if (!response.ok) {
        console.error(`WATI API Error: ${response.status} - ${responseText}`)
        return false
      }

      // Try to parse JSON if response is not empty
      let result = null
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText)
          console.log("[v0] WATI Response JSON:", result)
        } catch (parseError) {
          console.error("Failed to parse WATI response as JSON:", parseError)
          // If response is successful but not JSON, consider it success
          return response.ok
        }
      }

      return response.ok && result?.success !== false
    } catch (error) {
      console.error("Error sending WATI message:", error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage = {
        to: "919725295692", // Your phone number
        type: "text" as const,
        text: { body: "🎉 WATI Integration Test - Safawala CRM is now connected!" },
      }

      const result = await this.sendMessage(testMessage)
      console.log("[v0] WATI Test Result:", result)
      return result
    } catch (error) {
      console.error("WATI connection test failed:", error)
      return false
    }
  }

  async sendBookingConfirmation(phone: string, booking: any): Promise<boolean> {
    const customerName = booking.customerName || booking.customer_name || "Valued Customer"

    const message = `🎉 *Booking Confirmed - Safawala*

Dear ${customerName},

Your booking has been confirmed!

📋 *Booking Details:*
• Booking ID: ${booking.id}
• Total Amount: ₹${booking.totalAmount?.toLocaleString() || booking.total_amount?.toLocaleString() || 0}
${booking.eventDate || booking.event_date ? `• Event Date: ${new Date(booking.eventDate || booking.event_date).toLocaleDateString()}` : ""}
${booking.venue ? `• Venue: ${booking.venue}` : ""}

Thank you for choosing Safawala! 🙏

For any queries, please contact us.`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendBookingUpdate(phone: string, booking: any, status: string): Promise<boolean> {
    const statusEmoji =
      {
        confirmed: "✅",
        pending: "⏳",
        cancelled: "❌",
        completed: "🎉",
      }[status] || "📋"

    const message = `${statusEmoji} *Booking Update - Safawala*

Dear ${booking.customer_name},

Your booking status has been updated.

📋 *Booking Details:*
• Booking ID: ${booking.id}
• Status: ${status.toUpperCase()}
• Event Date: ${booking.event_date ? new Date(booking.event_date).toLocaleDateString() : "TBD"}

Thank you for choosing Safawala! 🙏`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendPaymentConfirmation(phone: string, payment: any): Promise<boolean> {
    const message = `💰 *Payment Confirmed - Safawala*

Dear ${payment.customerName},

Your payment has been received successfully!

💳 *Payment Details:*
• Amount: ₹${payment.amount?.toLocaleString() || 0}
• Booking ID: ${payment.bookingId}
• Transaction ID: ${payment.transactionId}
• Date: ${new Date().toLocaleDateString()}

Thank you for your payment! 🙏`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendInventoryAlert(phone: string, product: any): Promise<boolean> {
    const message = `⚠️ *Low Stock Alert - Safawala*

Inventory Alert:

📦 *Product Details:*
• Product: ${product.productName}
• Current Stock: ${product.currentStock}
• Minimum Required: ${product.minStock}

Please restock immediately to avoid service disruption.

Action required! 🚨`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendTaskAssignment(phone: string, task: any): Promise<boolean> {
    const priorityEmoji =
      {
        high: "🔴",
        medium: "🟡",
        low: "🟢",
      }[task.priority] || "📋"

    const message = `${priorityEmoji} *Task Assigned - Safawala*

Hello ${task.assigneeName},

A new task has been assigned to you.

📋 *Task Details:*
• Title: ${task.title}
• Priority: ${task.priority?.toUpperCase() || "MEDIUM"}
${task.dueDate ? `• Due Date: ${new Date(task.dueDate).toLocaleDateString()}` : ""}
${task.description ? `• Description: ${task.description}` : ""}

Please complete this task on time. 💪`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendDailySummary(phone: string, summary: any): Promise<boolean> {
    const message = `📊 *Daily Summary - Safawala*

Good evening! Here's today's business summary:

📈 *Today's Performance:*
• New Bookings: ${summary.newBookings || 0}
• Total Revenue: ₹${summary.totalRevenue?.toLocaleString() || 0}
• Payments Received: ₹${summary.paymentsReceived?.toLocaleString() || 0}
• Pending Payments: ₹${summary.pendingPayments?.toLocaleString() || 0}

📋 *Operational Updates:*
• Active Bookings: ${summary.activeBookings || 0}
• Completed Deliveries: ${summary.completedDeliveries || 0}
• Pending Tasks: ${summary.pendingTasks || 0}

Keep up the great work! 🎉`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }

  async sendQuoteReady(phone: string, quote: any): Promise<boolean> {
    const message = `📋 *Quote Ready - Safawala*

Dear ${quote.customerName},

Your quote is ready for review!

💰 *Quote Details:*
• Quote ID: ${quote.id}
• Total Amount: ₹${quote.totalAmount?.toLocaleString() || 0}
${quote.validUntil ? `• Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}` : ""}

Please review and let us know if you'd like to proceed with the booking.

Thank you! 🙏`

    return this.sendMessage({
      to: phone,
      type: "text",
      text: { body: message },
    })
  }
}

export const whatsappService = new WhatsAppService()

export const sendBookingConfirmationLegacy = async (phone: string, booking: BookingNotification): Promise<boolean> => {
  try {
    const message = `
🎉 *Booking Confirmed - Safawala*

Dear ${booking.customerName},

Your booking has been confirmed!

📋 *Booking Details:*
• Booking No: ${booking.bookingNumber}
• Total Amount: ₹${booking.totalAmount.toLocaleString()}
${booking.eventDate ? `• Event Date: ${new Date(booking.eventDate).toLocaleDateString()}` : ""}
${booking.deliveryDate ? `• Delivery Date: ${new Date(booking.deliveryDate).toLocaleDateString()}` : ""}
${booking.pickupDate ? `• Pickup Date: ${new Date(booking.pickupDate).toLocaleDateString()}` : ""}

📦 *Items:*
${booking.items.map((item) => `• ${item.name} (Qty: ${item.quantity})`).join("\n")}

Thank you for choosing Safawala! 🙏

For any queries, please contact us.
    `.trim()

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return false
  }
}

export const sendPaymentReminderLegacy = async (
  phone: string,
  customerName: string,
  bookingNumber: string,
  pendingAmount: number,
  dueDate?: string,
): Promise<boolean> => {
  try {
    const message = `
💰 *Payment Reminder - Safawala*

Dear ${customerName},

This is a friendly reminder about your pending payment.

📋 *Payment Details:*
• Booking No: ${bookingNumber}
• Pending Amount: ₹${pendingAmount.toLocaleString()}
${dueDate ? `• Due Date: ${new Date(dueDate).toLocaleDateString()}` : ""}

Please make the payment at your earliest convenience.

Thank you! 🙏
    `.trim()

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending payment reminder:", error)
    return false
  }
}

export const sendInvoiceWithPDFLegacy = async (
  phone: string,
  customerName: string,
  bookingNumber: string,
  pdfBlob: Blob,
): Promise<boolean> => {
  try {
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        resolve(base64String.split(",")[1]) // Remove data:application/pdf;base64, prefix
      }
      reader.readAsDataURL(pdfBlob)
    })

    const message = `
📄 *Invoice - Safawala*

Dear ${customerName},

Please find attached your invoice for booking ${bookingNumber}.

Thank you for your business! 🙏
    `.trim()

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        attachment: {
          filename: `Invoice_${bookingNumber}.pdf`,
          content: base64,
          mimetype: "application/pdf",
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending invoice via WhatsApp:", error)
    return false
  }
}

export const sendDeliveryNotificationLegacy = async (
  phone: string,
  customerName: string,
  bookingNumber: string,
  deliveryDate: string,
): Promise<boolean> => {
  try {
    const message = `
🚚 *Delivery Update - Safawala*

Dear ${customerName},

Your order is ready for delivery!

📋 *Delivery Details:*
• Booking No: ${bookingNumber}
• Scheduled Delivery: ${new Date(deliveryDate).toLocaleDateString()}

Our team will contact you shortly to confirm the delivery time.

Thank you! 🙏
    `.trim()

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending delivery notification:", error)
    return false
  }
}

export const sendPickupReminderLegacy = async (
  phone: string,
  customerName: string,
  bookingNumber: string,
  pickupDate: string,
): Promise<boolean> => {
  try {
    const message = `
📦 *Pickup Reminder - Safawala*

Dear ${customerName},

This is a reminder for your item pickup.

📋 *Pickup Details:*
• Booking No: ${bookingNumber}
• Pickup Date: ${new Date(pickupDate).toLocaleDateString()}

Please ensure items are ready for pickup at the scheduled time.

Thank you! 🙏
    `.trim()

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending pickup reminder:", error)
    return false
  }
}
