import { InvoiceData, InvoiceGenerator } from '@/lib/invoice-generator'
import { useEffect } from 'react'
import { useCompanySettings } from './use-company-settings'

interface BookingData {
  id: string
  booking_number: string
  created_at: string
  event_date?: string
  booking_type?: string
  booking_subtype?: string
  source?: string
  payment_type?: string
  
  // Customer
  customer?: {
    name: string
    phone: string
    email?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  
  // Financial
  total_amount?: number
  subtotal_amount?: number
  paid_amount?: number
  security_deposit?: number
  discount_amount?: number
  discount_percentage?: number
  coupon_code?: string
  coupon_discount?: number
  distance_amount?: number
  tax_amount?: number
  gst_percentage?: number
  payment_method?: string
  
  // Event details
  event_type?: string
  event_for?: string
  venue_name?: string
  venue_address?: string
  groom_name?: string
  bride_name?: string
  delivery_date?: string
  return_date?: string
}

interface BookingItem {
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
  category_name?: string
  barcode?: string
  product_name?: string
  package_name?: string
}

export function useInvoiceGenerator(franchiseId?: string) {
  const { settings, loading } = useCompanySettings(franchiseId)
  
  // DEBUG: Log settings changes
  useEffect(() => {
    console.log('🔄 [useInvoiceGenerator] Settings updated:', {
      loading,
      has_settings: !!settings,
      franchise_id: franchiseId,
      settings_keys: settings ? Object.keys(settings) : []
    })
    console.log('🔄 [useInvoiceGenerator] Settings data:', settings)
  }, [settings, loading, franchiseId])

  const generateInvoiceData = (booking: BookingData, items: BookingItem[]): InvoiceData => {
    const totalAmount = Number(booking.total_amount || 0)
    const paidAmount = Number(booking.paid_amount || 0)
    const securityDeposit = Number(booking.security_deposit || 0)
    const distanceAmount = Number(booking.distance_amount || 0)
    // Include distance charges in subtotal
    const baseSubtotal = Number(booking.subtotal_amount || booking.total_amount || 0)
    const subtotal = baseSubtotal + distanceAmount
    const pendingAmount = Math.max(0, (totalAmount + securityDeposit) - paidAmount)
    const customAmount = Number((booking as any).custom_amount || 0)

    // Format items for invoice
    const invoiceItems = items.map(item => ({
      name: item.product_name || item.package_name || item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      category: item.category_name,
      barcode: item.barcode
    }))

    // Extract extended booking details
    const bookingExtended = booking as any

    const invoiceData: InvoiceData = {
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      bookingDate: booking.created_at,
      eventDate: booking.event_date || '',
      bookingType: 
        booking.source === 'direct_sales' ? 'direct_sale' :
        booking.booking_type === 'sale' ? 'product_sale' :
        booking.source === 'product_orders' ? 'product_rental' :
        'package',
      paymentType: (booking.payment_type as 'full' | 'advance' | 'partial') || 'full',
      bookingStatus: bookingExtended.status,
      isQuote: bookingExtended.is_quote,
      
      // Customer - All fields
      customerName: booking.customer?.name || 'N/A',
      customerPhone: booking.customer?.phone || 'N/A',
      customerEmail: booking.customer?.email,
      customerWhatsApp: bookingExtended.customer?.whatsapp || booking.customer?.phone,
      customerAddress: booking.customer?.address,
      customerCity: booking.customer?.city,
      customerState: booking.customer?.state,
      customerPincode: booking.customer?.pincode,
      customerCode: bookingExtended.customer?.customer_code,
      
      // Event - All fields
      eventType: booking.event_type,
      eventParticipant: bookingExtended.event_participant,
      eventFor: booking.event_for,
      eventTime: bookingExtended.event_time,
      venueName: booking.venue_name,
      venueAddress: booking.venue_address,
      groomName: booking.groom_name,
      groomPhone: bookingExtended.groom_whatsapp || bookingExtended.groom_additional_whatsapp,
      groomAddress: bookingExtended.groom_address || bookingExtended.groom_home_address,
      brideName: bookingExtended.bride_name,
      bridePhone: bookingExtended.bride_whatsapp || bookingExtended.bride_additional_whatsapp,
      brideAddress: bookingExtended.bride_address || bookingExtended.bride_home_address,
      deliveryDate: booking.delivery_date,
      deliveryTime: bookingExtended.delivery_time,
      returnDate: booking.return_date,
      returnTime: bookingExtended.return_time,
      
      // Package details
      packageName: bookingExtended.package_details?.name,
      packageDescription: bookingExtended.package_details?.description,
      variantName: bookingExtended.variant_name,
      categoryName: items && items.length > 0 ? items[0]?.category_name : undefined,
      extraSafas: bookingExtended.extra_safas,
      
      // Financial - All fields (distance charge now included in subtotal)
      subtotal,
      discountAmount: booking.discount_amount,
      discountPercentage: booking.discount_percentage,
      couponCode: booking.coupon_code,
      couponDiscount: booking.coupon_discount,
      distanceAmount: 0, // Distance charge is now included in subtotal above
      customAmount,
      taxAmount: booking.tax_amount,
      taxPercentage: booking.gst_percentage,
      totalAmount,
      paidAmount,
      securityDeposit: booking.security_deposit,
      pendingAmount,
      paymentMethod: booking.payment_method,
      
      // Items
      items: invoiceItems,
      
      // Company - from settings with branding
      companyName: settings?.company_name || 'SAFAWALA',
      companyPhone: settings?.phone || '+91-XXXXXXXXXX',
      companyEmail: settings?.email || 'support@safawala.com',
      companyAddress: settings?.address || 'Your Address Here',
      companyCity: settings?.city,
      companyState: settings?.state,
      companyGST: settings?.gst_number || 'XX AAXXXXXXX XXXXX',
      companyWebsite: settings?.website || undefined,
      companyLogo: settings?.logo_url || undefined,
      companySignature: settings?.signature_url || undefined,
      primaryColor: settings?.primary_color || '#3B82F6',
      secondaryColor: settings?.secondary_color || '#EF4444',
      accentColor: settings?.accent_color || '#10B981',
      // Fetch terms from document_settings (default_terms_conditions) OR company_settings (terms_conditions) as fallback
      termsAndConditions: settings?.default_terms_conditions || settings?.terms_conditions || 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
    }

    // DEBUG: Log terms and conditions
    console.log('📋 DEBUG: Terms & Conditions')
    console.log('📋 Terms from settings:', settings?.default_terms_conditions)
    console.log('📋 Final terms in invoice data:', invoiceData.termsAndConditions)
    
    return invoiceData
  }

  const generateAndDownload = async (booking: BookingData, items: BookingItem[], filename?: string) => {
    const invoiceData = generateInvoiceData(booking, items)
    // Open print dialog - user can save as PDF from there
    await InvoiceGenerator.printInvoice(invoiceData)
  }

  const generatePDFObject = async (booking: BookingData, items: BookingItem[]) => {
    const invoiceData = generateInvoiceData(booking, items)
    // Generate and return HTML-based invoice object
    return await InvoiceGenerator.generatePDF(invoiceData)
  }

  const previewInvoice = (booking: BookingData, items: BookingItem[]) => {
    const invoiceData = generateInvoiceData(booking, items)
    InvoiceGenerator.previewInvoice(invoiceData)
  }

  return {
    generateInvoiceData,
    generateAndDownload,
    generatePDFObject,
    previewInvoice
  }
}
