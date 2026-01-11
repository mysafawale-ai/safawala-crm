/**
 * WhatsApp Notification Triggers
 * Call these functions when business events occur
 */

import { supabaseServer as supabase } from "@/lib/supabase-server-simple"
import {
  sendBookingConfirmation,
  sendPaymentReceived,
  sendDeliveryReminder,
  sendReturnReminder,
} from "@/lib/services/wati-service"
import { format } from "date-fns"

interface NotificationSettings {
  booking_confirmation: boolean
  payment_received: boolean
  delivery_reminder: boolean
  return_reminder: boolean
  invoice_sent: boolean
  delivery_reminder_hours: number
  return_reminder_hours: number
  business_hours_only: boolean
  business_start_time: string
  business_end_time: string
}

/**
 * Get notification settings for a franchise
 */
async function getNotificationSettings(franchiseId: string): Promise<NotificationSettings | null> {
  try {
    const { data, error } = await supabase
      .from("whatsapp_notification_settings")
      .select("*")
      .eq("franchise_id", franchiseId)
      .single()

    if (error || !data) {
      // Return defaults if no settings exist
      return {
        booking_confirmation: true,
        payment_received: true,
        delivery_reminder: true,
        return_reminder: true,
        invoice_sent: true,
        delivery_reminder_hours: 24,
        return_reminder_hours: 24,
        business_hours_only: true,
        business_start_time: "09:00:00",
        business_end_time: "18:00:00",
      }
    }

    return data as NotificationSettings
  } catch (error) {
    console.error("[WhatsApp Triggers] Error fetching settings:", error)
    return null
  }
}

/**
 * Check if we're within business hours
 */
function isWithinBusinessHours(settings: NotificationSettings): boolean {
  if (!settings.business_hours_only) return true

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = settings.business_start_time.split(":").map(Number)
  const [endHour, endMinute] = settings.business_end_time.split(":").map(Number)

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Trigger: New booking created
 */
export async function onBookingCreated(params: {
  bookingId: string
  bookingNumber: string
  customerPhone: string
  customerName: string
  eventDate: string
  totalAmount: number
  franchiseId: string
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings(params.franchiseId)
    if (!settings?.booking_confirmation) {
      return { sent: false, error: "Booking confirmation notifications disabled" }
    }

    if (!isWithinBusinessHours(settings)) {
      console.log("[WhatsApp Triggers] Outside business hours, skipping notification")
      return { sent: false, error: "Outside business hours" }
    }

    const result = await sendBookingConfirmation({
      phone: params.customerPhone,
      customerName: params.customerName,
      bookingNumber: params.bookingNumber,
      bookingDate: format(new Date(params.eventDate), "dd MMM yyyy"),
      totalAmount: params.totalAmount,
    })

    // Update message with booking reference
    if (result.success && result.messageId) {
      await supabase.from("whatsapp_messages")
        .update({ booking_id: params.bookingId, franchise_id: params.franchiseId })
        .eq("wati_message_id", result.messageId)
    }

    return { sent: result.success, error: result.error }
  } catch (error: any) {
    console.error("[WhatsApp Triggers] onBookingCreated error:", error)
    return { sent: false, error: error.message }
  }
}

/**
 * Trigger: Payment received
 */
export async function onPaymentReceived(params: {
  bookingId: string
  bookingNumber: string
  customerPhone: string
  customerName: string
  amountPaid: number
  remainingBalance: number
  franchiseId: string
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings(params.franchiseId)
    if (!settings?.payment_received) {
      return { sent: false, error: "Payment notifications disabled" }
    }

    if (!isWithinBusinessHours(settings)) {
      return { sent: false, error: "Outside business hours" }
    }

    const result = await sendPaymentReceived({
      phone: params.customerPhone,
      customerName: params.customerName,
      bookingNumber: params.bookingNumber,
      amountPaid: params.amountPaid,
      remainingBalance: params.remainingBalance,
    })

    if (result.success && result.messageId) {
      await supabase.from("whatsapp_messages")
        .update({ booking_id: params.bookingId, franchise_id: params.franchiseId })
        .eq("wati_message_id", result.messageId)
    }

    return { sent: result.success, error: result.error }
  } catch (error: any) {
    console.error("[WhatsApp Triggers] onPaymentReceived error:", error)
    return { sent: false, error: error.message }
  }
}

/**
 * Trigger: Delivery upcoming (called by cron job)
 */
export async function onDeliveryUpcoming(params: {
  bookingId: string
  bookingNumber: string
  customerPhone: string
  customerName: string
  deliveryDate: string
  deliveryTime: string
  franchiseId: string
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings(params.franchiseId)
    if (!settings?.delivery_reminder) {
      return { sent: false, error: "Delivery reminder notifications disabled" }
    }

    const result = await sendDeliveryReminder({
      phone: params.customerPhone,
      customerName: params.customerName,
      bookingNumber: params.bookingNumber,
      deliveryDate: format(new Date(params.deliveryDate), "dd MMM yyyy"),
      deliveryTime: params.deliveryTime,
    })

    if (result.success && result.messageId) {
      await supabase.from("whatsapp_messages")
        .update({ booking_id: params.bookingId, franchise_id: params.franchiseId })
        .eq("wati_message_id", result.messageId)
    }

    return { sent: result.success, error: result.error }
  } catch (error: any) {
    console.error("[WhatsApp Triggers] onDeliveryUpcoming error:", error)
    return { sent: false, error: error.message }
  }
}

/**
 * Trigger: Return due (called by cron job)
 */
export async function onReturnDue(params: {
  bookingId: string
  bookingNumber: string
  customerPhone: string
  customerName: string
  returnDate: string
  franchiseId: string
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const settings = await getNotificationSettings(params.franchiseId)
    if (!settings?.return_reminder) {
      return { sent: false, error: "Return reminder notifications disabled" }
    }

    const result = await sendReturnReminder({
      phone: params.customerPhone,
      customerName: params.customerName,
      bookingNumber: params.bookingNumber,
      returnDate: format(new Date(params.returnDate), "dd MMM yyyy"),
    })

    if (result.success && result.messageId) {
      await supabase.from("whatsapp_messages")
        .update({ booking_id: params.bookingId, franchise_id: params.franchiseId })
        .eq("wati_message_id", result.messageId)
    }

    return { sent: result.success, error: result.error }
  } catch (error: any) {
    console.error("[WhatsApp Triggers] onReturnDue error:", error)
    return { sent: false, error: error.message }
  }
}

/**
 * Process delivery reminders for bookings due tomorrow
 */
export async function processDeliveryReminders(): Promise<{ processed: number; sent: number; errors: string[] }> {
  const errors: string[] = []
  let processed = 0
  let sent = 0

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd")

    // Get bookings with delivery tomorrow
    const { data: bookings, error } = await supabase
      .from("package_bookings")
      .select(`
        id, package_number, delivery_date, delivery_time, franchise_id,
        customer:customers(name, phone)
      `)
      .eq("delivery_date", tomorrowStr)
      .eq("is_archived", false)
      .is("delivery_reminder_sent", null)

    if (error) {
      console.error("[WhatsApp Triggers] Error fetching bookings:", error)
      return { processed: 0, sent: 0, errors: [error.message] }
    }

    for (const booking of bookings || []) {
      processed++
      
      if (!booking.customer?.phone) {
        errors.push(`${booking.package_number}: No phone number`)
        continue
      }

      const result = await onDeliveryUpcoming({
        bookingId: booking.id,
        bookingNumber: booking.package_number,
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name || "Customer",
        deliveryDate: booking.delivery_date,
        deliveryTime: booking.delivery_time || "As scheduled",
        franchiseId: booking.franchise_id,
      })

      if (result.sent) {
        sent++
        // Mark as sent
        await supabase.from("package_bookings")
          .update({ delivery_reminder_sent: new Date().toISOString() })
          .eq("id", booking.id)
      } else {
        errors.push(`${booking.package_number}: ${result.error}`)
      }
    }
  } catch (error: any) {
    errors.push(error.message)
  }

  return { processed, sent, errors }
}

/**
 * Process return reminders for bookings due tomorrow
 */
export async function processReturnReminders(): Promise<{ processed: number; sent: number; errors: string[] }> {
  const errors: string[] = []
  let processed = 0
  let sent = 0

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd")

    // Get bookings with return tomorrow
    const { data: bookings, error } = await supabase
      .from("package_bookings")
      .select(`
        id, package_number, return_date, franchise_id,
        customer:customers(name, phone)
      `)
      .eq("return_date", tomorrowStr)
      .eq("is_archived", false)
      .is("return_reminder_sent", null)

    if (error) {
      console.error("[WhatsApp Triggers] Error fetching bookings:", error)
      return { processed: 0, sent: 0, errors: [error.message] }
    }

    for (const booking of bookings || []) {
      processed++
      
      if (!booking.customer?.phone) {
        errors.push(`${booking.package_number}: No phone number`)
        continue
      }

      const result = await onReturnDue({
        bookingId: booking.id,
        bookingNumber: booking.package_number,
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name || "Customer",
        returnDate: booking.return_date,
        franchiseId: booking.franchise_id,
      })

      if (result.sent) {
        sent++
        // Mark as sent
        await supabase.from("package_bookings")
          .update({ return_reminder_sent: new Date().toISOString() })
          .eq("id", booking.id)
      } else {
        errors.push(`${booking.package_number}: ${result.error}`)
      }
    }
  } catch (error: any) {
    errors.push(error.message)
  }

  return { processed, sent, errors }
}
