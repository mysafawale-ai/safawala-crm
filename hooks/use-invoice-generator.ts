import { InvoiceData, InvoiceGenerator } from '@/lib/invoice-generator'

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

export function useInvoiceGenerator() {
  const generateInvoiceData = (booking: BookingData, items: BookingItem[]): InvoiceData => {
    const totalAmount = Number(booking.total_amount || 0)
    const paidAmount = Number(booking.paid_amount || 0)
    const securityDeposit = Number(booking.security_deposit || 0)
    const subtotal = Number(booking.subtotal_amount || booking.total_amount || 0)
    const pendingAmount = Math.max(0, (totalAmount + securityDeposit) - paidAmount)

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

    return {
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
      
      // Customer
      customerName: booking.customer?.name || 'N/A',
      customerPhone: booking.customer?.phone || 'N/A',
      customerEmail: booking.customer?.email,
      customerAddress: booking.customer?.address,
      customerCity: booking.customer?.city,
      customerState: booking.customer?.state,
      customerPincode: booking.customer?.pincode,
      
      // Event
      eventType: booking.event_type,
      eventFor: booking.event_for,
      venueName: booking.venue_name,
      venueAddress: booking.venue_address,
      groomName: booking.groom_name,
      brideName: booking.bride_name,
      deliveryDate: booking.delivery_date,
      returnDate: booking.return_date,
      
      // Financial
      subtotal,
      discountAmount: booking.discount_amount,
      discountPercentage: booking.discount_percentage,
      couponCode: booking.coupon_code,
      couponDiscount: booking.coupon_discount,
      distanceAmount: booking.distance_amount,
      taxAmount: booking.tax_amount,
      taxPercentage: booking.gst_percentage,
      totalAmount,
      paidAmount,
      securityDeposit: booking.security_deposit,
      pendingAmount,
      paymentMethod: booking.payment_method,
      
      // Items
      items: invoiceItems,
      
      // Company (can be populated from settings)
      companyName: 'SAFAWALA',
      companyPhone: '+91-XXXXXXXXXX',
      companyEmail: 'support@safawala.com',
      companyAddress: 'Your Address Here',
      companyGST: 'XX AAXXXXXXX XXXXX'
    }
  }

  const generateAndDownload = (booking: BookingData, items: BookingItem[], filename?: string) => {
    const invoiceData = generateInvoiceData(booking, items)
    const pdf = InvoiceGenerator.generatePDF(invoiceData)
    const finalFilename = filename || `Invoice_${booking.booking_number}_${new Date().toISOString().split('T')[0]}.pdf`
    InvoiceGenerator.downloadPDF(pdf, finalFilename)
  }

  const generatePDFObject = (booking: BookingData, items: BookingItem[]) => {
    const invoiceData = generateInvoiceData(booking, items)
    return InvoiceGenerator.generatePDF(invoiceData)
  }

  return {
    generateInvoiceData,
    generateAndDownload,
    generatePDFObject
  }
}
