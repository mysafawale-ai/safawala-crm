/**
 * WATI WhatsApp API Service
 * Handles all WhatsApp messaging through WATI API
 */

import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

// WATI Configuration interface
interface WATIConfig {
  api_key: string
  base_url: string
  instance_id: string
  is_active: boolean
}

// Message types
export interface SendMessageParams {
  phone: string
  message: string
}

export interface SendTemplateParams {
  phone: string
  templateName: string
  parameters: string[]
  broadcastName?: string
}

export interface SendMediaParams {
  phone: string
  mediaUrl: string
  caption?: string
  mediaType: 'image' | 'document' | 'video'
}

// Response types
interface WATIResponse {
  result: boolean
  info?: string
  messageId?: string
}

// Cache for WATI config
let cachedConfig: WATIConfig | null = null
let configLastFetched: number = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get WATI configuration from database
 */
async function getWATIConfig(): Promise<WATIConfig | null> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - configLastFetched < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .select("api_key, base_url, instance_id, is_active")
      .eq("integration_name", "whatsapp-wati")
      .single()

    if (error || !data) {
      console.error("[WATI] Config not found:", error)
      return null
    }

    cachedConfig = data as WATIConfig
    configLastFetched = Date.now()
    return cachedConfig
  } catch (error) {
    console.error("[WATI] Error fetching config:", error)
    return null
  }
}

/**
 * Format phone number for WATI (remove +, spaces, etc.)
 */
function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Add country code if missing (assuming India)
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  
  return cleaned
}

/**
 * Send a text message via WATI
 */
export async function sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWATIConfig()
  
  if (!config || !config.is_active) {
    return { success: false, error: "WATI integration is not configured or inactive" }
  }

  const phone = formatPhone(params.phone)

  try {
    const response = await fetch(`${config.base_url}/api/v1/sendSessionMessage/${phone}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageText: params.message,
      }),
    })

    const data: WATIResponse = await response.json()

    if (!response.ok || !data.result) {
      console.error("[WATI] Send message failed:", data)
      return { success: false, error: data.info || "Failed to send message" }
    }

    // Log the message
    await logMessage({
      phone,
      type: 'text',
      content: params.message,
      status: 'sent',
      messageId: data.messageId,
    })

    return { success: true, messageId: data.messageId }
  } catch (error: any) {
    console.error("[WATI] Error sending message:", error)
    return { success: false, error: error.message || "Network error" }
  }
}

/**
 * Send a template message via WATI
 */
export async function sendTemplateMessage(params: SendTemplateParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWATIConfig()
  
  if (!config || !config.is_active) {
    return { success: false, error: "WATI integration is not configured or inactive" }
  }

  const phone = formatPhone(params.phone)

  try {
    const response = await fetch(`${config.base_url}/api/v1/sendTemplateMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsappNumber: phone,
        template_name: params.templateName,
        broadcast_name: params.broadcastName || `broadcast_${Date.now()}`,
        parameters: params.parameters.map((value, index) => ({
          name: `${index + 1}`,
          value,
        })),
      }),
    })

    const data: WATIResponse = await response.json()

    if (!response.ok || !data.result) {
      console.error("[WATI] Send template failed:", data)
      return { success: false, error: data.info || "Failed to send template message" }
    }

    // Log the message
    await logMessage({
      phone,
      type: 'template',
      content: `Template: ${params.templateName}`,
      templateName: params.templateName,
      status: 'sent',
      messageId: data.messageId,
    })

    return { success: true, messageId: data.messageId }
  } catch (error: any) {
    console.error("[WATI] Error sending template:", error)
    return { success: false, error: error.message || "Network error" }
  }
}

/**
 * Send media (image/document/video) via WATI
 */
export async function sendMedia(params: SendMediaParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWATIConfig()
  
  if (!config || !config.is_active) {
    return { success: false, error: "WATI integration is not configured or inactive" }
  }

  const phone = formatPhone(params.phone)

  try {
    const endpoint = params.mediaType === 'image' 
      ? 'sendSessionFile' 
      : params.mediaType === 'document'
      ? 'sendSessionFile'
      : 'sendSessionFile'

    const response = await fetch(`${config.base_url}/api/v1/${endpoint}/${phone}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: params.mediaUrl,
        caption: params.caption || '',
      }),
    })

    const data: WATIResponse = await response.json()

    if (!response.ok || !data.result) {
      console.error("[WATI] Send media failed:", data)
      return { success: false, error: data.info || "Failed to send media" }
    }

    // Log the message
    await logMessage({
      phone,
      type: params.mediaType,
      content: params.caption || params.mediaUrl,
      status: 'sent',
      messageId: data.messageId,
    })

    return { success: true, messageId: data.messageId }
  } catch (error: any) {
    console.error("[WATI] Error sending media:", error)
    return { success: false, error: error.message || "Network error" }
  }
}

/**
 * Get all message templates from WATI
 */
export async function getTemplates(): Promise<{ success: boolean; templates?: any[]; error?: string }> {
  const config = await getWATIConfig()
  
  if (!config || !config.is_active) {
    return { success: false, error: "WATI integration is not configured or inactive" }
  }

  try {
    const response = await fetch(`${config.base_url}/api/v1/getMessageTemplates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: "Failed to fetch templates" }
    }

    return { success: true, templates: data.messageTemplates || [] }
  } catch (error: any) {
    console.error("[WATI] Error fetching templates:", error)
    return { success: false, error: error.message || "Network error" }
  }
}

/**
 * Check if a contact has WhatsApp
 */
export async function checkWhatsAppNumber(phone: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  const config = await getWATIConfig()
  
  if (!config || !config.is_active) {
    return { success: false, error: "WATI integration is not configured or inactive" }
  }

  const formattedPhone = formatPhone(phone)

  try {
    const response = await fetch(`${config.base_url}/api/v1/getContacts?pageSize=1&pageNumber=0&whatsappNumber=${formattedPhone}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: "Failed to check number" }
    }

    return { success: true, exists: data.contact_list?.length > 0 }
  } catch (error: any) {
    console.error("[WATI] Error checking number:", error)
    return { success: false, error: error.message || "Network error" }
  }
}

/**
 * Log message to database for tracking
 */
async function logMessage(params: {
  phone: string
  type: string
  content: string
  templateName?: string
  status: string
  messageId?: string
}) {
  try {
    await supabase.from("whatsapp_messages").insert({
      phone: params.phone,
      message_type: params.type,
      content: params.content,
      template_name: params.templateName,
      status: params.status,
      wati_message_id: params.messageId,
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[WATI] Error logging message:", error)
    // Don't throw - logging failure shouldn't break message sending
  }
}

// ============================================
// BUSINESS NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send booking confirmation to customer
 */
export async function sendBookingConfirmation(params: {
  phone: string
  customerName: string
  bookingNumber: string
  bookingDate: string
  totalAmount: number
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateMessage({
    phone: params.phone,
    templateName: 'booking_confirmation',
    parameters: [
      params.customerName,
      params.bookingNumber,
      params.bookingDate,
      `₹${params.totalAmount.toLocaleString()}`,
    ],
  })
}

/**
 * Send payment received notification
 */
export async function sendPaymentReceived(params: {
  phone: string
  customerName: string
  bookingNumber: string
  amountPaid: number
  remainingBalance: number
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateMessage({
    phone: params.phone,
    templateName: 'payment_received',
    parameters: [
      params.customerName,
      params.bookingNumber,
      `₹${params.amountPaid.toLocaleString()}`,
      `₹${params.remainingBalance.toLocaleString()}`,
    ],
  })
}

/**
 * Send delivery reminder
 */
export async function sendDeliveryReminder(params: {
  phone: string
  customerName: string
  bookingNumber: string
  deliveryDate: string
  deliveryTime: string
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateMessage({
    phone: params.phone,
    templateName: 'delivery_reminder',
    parameters: [
      params.customerName,
      params.bookingNumber,
      params.deliveryDate,
      params.deliveryTime,
    ],
  })
}

/**
 * Send return reminder
 */
export async function sendReturnReminder(params: {
  phone: string
  customerName: string
  bookingNumber: string
  returnDate: string
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateMessage({
    phone: params.phone,
    templateName: 'return_reminder',
    parameters: [
      params.customerName,
      params.bookingNumber,
      params.returnDate,
    ],
  })
}

/**
 * Send invoice to customer
 */
export async function sendInvoice(params: {
  phone: string
  customerName: string
  bookingNumber: string
  invoiceUrl: string
}): Promise<{ success: boolean; error?: string }> {
  // First send the template message
  const templateResult = await sendTemplateMessage({
    phone: params.phone,
    templateName: 'invoice_sent',
    parameters: [
      params.customerName,
      params.bookingNumber,
    ],
  })

  if (!templateResult.success) {
    return templateResult
  }

  // Then send the PDF
  return sendMedia({
    phone: params.phone,
    mediaUrl: params.invoiceUrl,
    caption: `Invoice for booking ${params.bookingNumber}`,
    mediaType: 'document',
  })
}

/**
 * Send promotional message (bulk)
 */
export async function sendBulkPromotion(params: {
  phones: string[]
  templateName: string
  parameters: string[]
  broadcastName: string
}): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const phone of params.phones) {
    const result = await sendTemplateMessage({
      phone,
      templateName: params.templateName,
      parameters: params.parameters,
      broadcastName: params.broadcastName,
    })

    if (result.success) {
      sent++
    } else {
      failed++
      errors.push(`${phone}: ${result.error}`)
    }

    // Rate limiting - wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success: failed === 0, sent, failed, errors }
}
