import { InvoiceData, InvoiceItem } from "./invoice-generator"

export function mapToInvoiceData(
  order: any,
  customer: any,
  items: any[],
  company: any,
  orderType: string
): InvoiceData {
  let bookingType: 'package' | 'product_rental' | 'product_sale' | 'direct_sale' = 'product_rental';
  if (orderType === 'package_booking') bookingType = 'package';
  else if (orderType === 'direct_sale' || order.invoice_type === 'sale') bookingType = 'product_sale';

  const mappedItems: InvoiceItem[] = items.map((item: any) => {
    let name = item.product_name || item.name || "Item";
    let desc = "";
    if (orderType === 'package_booking') {
      const inclusionsStr = Array.isArray(item.inclusions)
        ? item.inclusions.join(", ")
        : (typeof item.inclusions === "string" ? item.inclusions : "");
      let productsStr = "";
      const reserved = Array.isArray(item.reserved_products)
        ? item.reserved_products
        : (typeof item.reserved_products === "string" ? JSON.parse(item.reserved_products) : []);
      if (reserved.length > 0) {
        productsStr = reserved.map((p: any) => `${p.name} x${p.qty || p.quantity || 1}`).join(", ");
      }
      desc = [inclusionsStr, productsStr].filter(Boolean).join(" | ");
    } else {
      desc = item.product_code || item.barcode || "";
    }
    return {
      name,
      description: desc,
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || item.price || 0,
      totalPrice: item.total_price || (item.quantity * (item.unit_price || item.price || 0)),
      category: item.category || ""
    };
  });

  return {
    bookingId: order.id,
    bookingNumber: order.order_number || order.package_number || order.sale_number || order.booking_number || "N/A",
    bookingDate: order.created_at || order.invoice_date || new Date().toISOString(),
    eventDate: order.event_date || "",
    bookingType,
    paymentType: order.amount_paid >= order.total_amount ? 'full' : (order.amount_paid > 0 ? 'partial' : 'advance'),
    bookingStatus: order.status || "confirmed",
    isQuote: false,

    customerName: customer.name || "Customer",
    customerPhone: customer.phone || "",
    customerWhatsApp: customer.whatsapp || customer.phone || "",
    customerEmail: customer.email || "",
    customerAddress: customer.address || "",
    customerCity: customer.city || "",
    customerState: customer.state || "",
    customerPincode: customer.pincode || "",
    
    eventType: order.event_type || "",
    eventFor: order.event_for || "",
    venueName: order.venue_name || "",
    venueAddress: order.venue_address || "",
    groomName: order.groom_name || "",
    brideName: order.bride_name || "",
    deliveryDate: order.delivery_date || order.event_date || "",
    deliveryTime: order.delivery_time || order.event_time || "",
    returnDate: order.return_date || "",
    
    packageName: orderType === 'package_booking' ? items[0]?.package_name || "Package" : undefined,
    
    subtotal: order.total_amount + (order.discount_amount || 0) + (order.coupon_discount || 0) - (order.distance_amount || 0),
    discountAmount: order.discount_amount || 0,
    couponCode: order.coupon_code || "",
    couponDiscount: order.coupon_discount || 0,
    distanceAmount: order.distance_amount || 0,
    taxPercentage: order.gst_percentage || 0,
    totalAmount: order.total_amount || 0,
    paidAmount: order.amount_paid || 0,
    securityDeposit: order.deposit_amount || order.security_deposit || 0,
    pendingAmount: Math.max(0, (order.total_amount || 0) - (order.amount_paid || 0)),
    paymentMethod: order.payment_method || "",

    items: mappedItems,

    companyName: company?.company_name || company?.name || "Safawala",
    companyPhone: "+91 97252 95691 | +91 97252 95692 | +91 95103 66393 (Office)",
    companyEmail: company?.email || "",
    companyAddress: "Delhi · Vadodara · Ahmedabad · Mumbai · Bangalore",
    companyCity: "",
    companyState: "",
    companyGST: company?.gst_number || "",
    companyLogo: company?.logo_url || "",
    termsAndConditions: company?.terms_conditions || (
      bookingType === 'product_sale' || bookingType === 'direct_sale'
        ? "1. Products purchased under the sale category are non-returnable and non-exchangeable.\n2. This agreement and any related matters shall be governed by the jurisdiction of Vadodara, Gujarat."
        : "1. All product selections and order details are considered approved by the customer at the time of booking. Any changes after confirmation may not be possible, especially close to the event date.\n2. For the best service experience, Safa Wale bookings should preferably be confirmed at least 30 days before the event.\n3. The remaining payment, including the Security Deposit, must be completed before the event date.\n4. Safas and rental items remain the customer's responsibility until collected by our team. Any lost, damaged, torn, burnt, or unreturned items will be charged as per the applicable lost/damage rates.\n5. Our team will arrange collection of safas after the event. If items are unavailable on the agreed date, additional rental charges may be adjusted from the Security Deposit.\n6. Safa Wale service includes up to 5 hours of assistance. Additional hours will be charged at Rs.1,500 per hour.\n7. Local city services include up to 1 hour; outstation services up to 4 hours and until 9:30 PM. Any additional time may be adjusted against the Security Deposit.\n8. Sold products are non-returnable and non-exchangeable. All bookings and services are subject to Vadodara jurisdiction."
    ),
    primaryColor: company?.primary_color || "#102516",
    secondaryColor: company?.secondary_color || "#FDECC8",
  };
}
