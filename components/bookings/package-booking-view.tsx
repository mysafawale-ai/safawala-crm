"use client"

import { Badge } from "@/components/ui/badge"
import { formatTime12Hour } from "@/lib/utils"

interface PackageBookingViewProps {
  booking: any
  bookingItems?: any[]
}

export function PackageBookingView({ booking, bookingItems = [] }: PackageBookingViewProps) {
  const totalAmount = Number(booking.total_amount || 0)
  const paidAmount = Number(booking.paid_amount || 0)
  const securityDeposit = Number(booking.security_deposit || 0)
  const customAmount = Number(booking.custom_amount || 0)
  const paymentType: 'full' | 'advance' | 'partial' | string = booking.payment_type || 'full'
  const pendingAmount = Math.max(0, (totalAmount + securityDeposit) - paidAmount)
  
  // Extract package details from booking
  const packageDetails = (booking as any).package_details
  const packageName = packageDetails?.name
  const packageDescription = packageDetails?.description
  
  // Extract package category name from booking items
  const packageCategoryName = bookingItems && bookingItems.length > 0 && bookingItems[0]?.category_name 
    ? bookingItems[0].category_name 
    : null
  
  // Extract variant name and extra safas from booking
  const variantName = (booking as any).variant_name
  const extraSafas = (booking as any).extra_safas || 0
  
  // Helper function to extract and format time with multiple fallbacks
  const getFormattedTime = (timeValue: any, dateFieldFallback?: any): string | null => {
    // Try primary time value first
    if (timeValue) {
      try {
        if (typeof timeValue === 'string') {
          // If it's already a time string like "14:30:00" or "14:30"
          if (timeValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
            return formatTime12Hour(timeValue)
          }
          // If it's a full ISO datetime, extract time part
          if (timeValue.includes('T')) {
            const timePart = timeValue.split('T')[1]?.split('.')[0]
            if (timePart) return formatTime12Hour(timePart)
          }
        }
        
        // Try to format directly
        return formatTime12Hour(timeValue)
      } catch (e) {
        console.warn('Time formatting error:', e)
      }
    }
    
    // Fallback: Extract time from date field (for old bookings that stored time in date)
    if (dateFieldFallback && typeof dateFieldFallback === 'string' && dateFieldFallback.includes('T')) {
      try {
        const timePart = dateFieldFallback.split('T')[1]?.split('.')[0]
        if (timePart && timePart !== '00:00:00') {
          return formatTime12Hour(timePart)
        }
      } catch (e) {
        console.warn('Date field time extraction error:', e)
      }
    }
    
    return null
  }
  
  // Extract times with fallbacks (try time column first, then extract from date field)
  const eventTime = getFormattedTime(booking.event_time, booking.event_date)
  const deliveryTime = getFormattedTime(booking.delivery_time, booking.delivery_date)
  const returnTime = getFormattedTime(booking.return_time, booking.return_date)
  
  // Debug logging to see what time values we're receiving
  console.log('[PackageBookingView] Time values:', {
    event_time_raw: booking.event_time,
    delivery_time_raw: booking.delivery_time,
    return_time_raw: booking.return_time,
    event_time_formatted: eventTime,
    delivery_time_formatted: deliveryTime,
    return_time_formatted: returnTime
  })
  
  // --- Payment breakdown calculations (display only) ---
  const halfAdvance = totalAmount / 2
  let display = {
    payableNowLabel: 'Payable Now',
    payableNow: 0,
    remainingPackage: 0,
    depositDueNow: 0,
    depositLater: 0,
    remainingTotal: 0,
    notes: [] as string[],
  }

  if (paymentType === 'partial') {
    // We collect only the package partial now; deposit is collected later
    display.payableNow = Math.max(0, customAmount)
    display.depositDueNow = 0
    display.depositLater = securityDeposit
    display.remainingPackage = Math.max(0, totalAmount - display.payableNow)
    display.remainingTotal = display.remainingPackage + display.depositLater
    display.notes.push('Security deposit will be collected later with the remaining payment.')
  } else if (paymentType === 'advance') {
    // Expected policy: ~50% of package now + deposit; rest later
    display.payableNow = Math.max(0, halfAdvance) + securityDeposit
    display.depositDueNow = securityDeposit
    display.depositLater = 0
    display.remainingPackage = Math.max(0, totalAmount - halfAdvance)
    display.remainingTotal = display.remainingPackage
    display.notes.push('Advance is approximately 50% of package amount. Deposit collected now.')
  } else {
    // Full payment: package + deposit now
    display.payableNow = totalAmount + securityDeposit
    display.depositDueNow = securityDeposit
    display.depositLater = 0
    display.remainingPackage = 0
    display.remainingTotal = 0
    display.notes.push('Full payment includes refundable security deposit collected now.')
  }

  return (
    <div className="space-y-6 py-2 text-sm">
      
      {/* Booking Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">
            {booking.booking_number || booking.package_number || 'N/A'}
          </h3>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={booking.status === 'confirmed' ? 'default' : 'warning'}>
              {booking.status === 'confirmed' ? 'Confirmed' : 'Payment Pending'}
            </Badge>
            {pendingAmount > 0 && paymentType !== 'full' && (
              <span className="text-xs text-amber-600 font-medium">
                ₹{pendingAmount.toLocaleString()} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <span>
            {booking.source === 'package_bookings' ? '📦 Package Booking' : '🛍️ Product Order'}
          </span>
          <span>
            Created: {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN') : 'N/A'}
          </span>
          {booking.is_quote && <Badge variant="secondary" className="h-5">Quote</Badge>}
        </div>
      </div>

      {/* Customer */}
      <div>
        <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">👤 CUSTOMER INFORMATION</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          {/* Row 1: Customer Code & Name */}
          {booking.customer?.customer_code && (
            <div><span className="text-muted-foreground">Customer Code:</span> <span className="font-medium">{booking.customer.customer_code}</span></div>
          )}
          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{booking.customer?.name || 'N/A'}</span></div>
          
          {/* Row 2: Phone & WhatsApp */}
          <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{booking.customer?.phone || 'N/A'}</span></div>
          <div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{booking.customer?.whatsapp || booking.customer?.phone || 'N/A'}</span></div>
          
          {/* Row 3: Email - ALWAYS SHOW */}
          <div className="col-span-2">
            <span className="text-muted-foreground">Email:</span>{' '}
            <span className="font-medium">{booking.customer?.email || 'N/A'}</span>
          </div>
          
          {/* Row 4: Address - ALWAYS SHOW */}
          <div className="col-span-2">
            <span className="text-muted-foreground">Address:</span>{' '}
            <span className="font-medium">{booking.customer?.address || 'N/A'}</span>
          </div>
          
          {/* Row 5: City, State, Pincode - ALWAYS SHOW */}
          <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{booking.customer?.city || 'N/A'}</span></div>
          <div><span className="text-muted-foreground">State:</span> <span className="font-medium">{booking.customer?.state || 'N/A'}</span></div>
          <div><span className="text-muted-foreground">Pincode:</span> <span className="font-medium">{booking.customer?.pincode || 'N/A'}</span></div>
          
          {/* Row 6: Customer Registration Date (optional) */}
          {booking.customer?.created_at && (
            <div className="col-span-2"><span className="text-muted-foreground">Customer Since:</span> <span className="font-medium">{new Date(booking.customer.created_at).toLocaleDateString('en-IN')}</span></div>
          )}
        </div>
      </div>

      {/* Package Details - Dedicated Section */}
      {(packageName || packageCategoryName || variantName || extraSafas > 0) && (
        <div>
          <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">📦 PACKAGE DETAILS</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {/* Package Name */}
            {packageName && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Package Name:</span>{' '}
                <span className="font-medium text-green-700 dark:text-green-400 text-lg">{packageName}</span>
                {packageDescription && (
                  <div className="text-sm text-muted-foreground mt-1">{packageDescription}</div>
                )}
              </div>
            )}
            
            {/* Package Category */}
            {packageCategoryName && (
              <div>
                <span className="text-muted-foreground">Category:</span>{' '}
                <span className="font-medium">{packageCategoryName}</span>
              </div>
            )}
            
            {/* Variant Name */}
            {variantName && (
              <div>
                <span className="text-muted-foreground">Variant:</span>{' '}
                <span className="font-medium">{variantName}</span>
              </div>
            )}
            
            {/* Extra Safas */}
            {extraSafas > 0 && (
              <div>
                <span className="text-muted-foreground">Extra Safas:</span>{' '}
                <span className="font-medium text-orange-600">{extraSafas}</span>
              </div>
            )}
            
            {/* Total Safas */}
            {(booking as any).total_safas && (
              <div>
                <span className="text-muted-foreground">Total Safas:</span>{' '}
                <span className="font-medium text-blue-600">{(booking as any).total_safas}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details */}
      <div>
        <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">🎉 EVENT DETAILS</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{booking.event_type?.replace('_', ' ') || 'N/A'}</span></div>
          {booking.event_participant && (
            <div><span className="text-muted-foreground">Participant:</span> <span className="font-medium capitalize">{booking.event_participant}</span></div>
          )}
          <div className="col-span-2">
            <span className="text-muted-foreground">Event Date & Time:</span>{' '}
            <span className="font-medium">
              {booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
              {eventTime && ` at ${eventTime}`}
            </span>
          </div>
          
          {/* Groom Details */}
          {booking.groom_name && (
            <>
              <div className="col-span-2 mt-2 font-medium text-muted-foreground">🤵 Groom</div>
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{booking.groom_name}</span></div>
              {(booking.groom_additional_whatsapp || booking.groom_whatsapp) && (
                <div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{booking.groom_additional_whatsapp || booking.groom_whatsapp}</span></div>
              )}
              {(booking.groom_home_address || booking.groom_address) && (
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{booking.groom_home_address || booking.groom_address}</span></div>
              )}
            </>
          )}

          {/* Bride Details */}
          {booking.bride_name && (
            <>
              <div className="col-span-2 mt-2 font-medium text-muted-foreground">👰 Bride</div>
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{booking.bride_name}</span></div>
              {(booking.bride_additional_whatsapp || booking.bride_whatsapp) && (
                <div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{booking.bride_additional_whatsapp || booking.bride_whatsapp}</span></div>
              )}
              {booking.bride_address && (
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{booking.bride_address}</span></div>
              )}
            </>
          )}

          {/* Venue */}
          {(booking.venue_name || booking.venue_address) && (
            <>
              <div className="col-span-2 mt-2 font-medium text-muted-foreground">📍 Venue</div>
              {booking.venue_name && (
                <div className="col-span-2"><span className="font-medium">{booking.venue_name}</span></div>
              )}
              {booking.venue_address && (
                <div className="col-span-2"><span className="text-muted-foreground">{booking.venue_address}</span></div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Logistics */}
      {(booking.delivery_date || booking.return_date) && (
        <div>
          <h4 className="font-semibold mb-2 text-indigo-700 dark:text-indigo-400">🚚 DELIVERY & RETURN</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {booking.delivery_date && (
              <div>
                <span className="text-muted-foreground">Delivery:</span>{' '}
                <span className="font-medium">
                  {new Date(booking.delivery_date).toLocaleDateString('en-IN')}
                  {deliveryTime && ` at ${deliveryTime}`}
                </span>
              </div>
            )}
            {booking.return_date && (
              <div>
                <span className="text-muted-foreground">Return:</span>{' '}
                <span className="font-medium">
                  {new Date(booking.return_date).toLocaleDateString('en-IN')}
                  {returnTime && ` at ${returnTime}`}
                </span>
              </div>
            )}
            {booking.distance_km && booking.distance_km > 0 && (
              <div>
                <span className="text-muted-foreground">Distance:</span> <span className="font-medium">{booking.distance_km} km</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div>
        <h4 className="font-semibold mb-2 text-amber-700 dark:text-amber-400">💰 FINANCIAL SUMMARY</h4>
        <div className="space-y-1.5">
          {/* Package Price Breakdown */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Package Price{booking.distance_km && booking.distance_km > 0 && (
                <span className="text-xs ml-1"> (incl. {booking.distance_km}km delivery)</span>
              )}:
            </span>
            <span className="font-medium">₹{((booking.subtotal_amount || booking.total_amount) || 0).toLocaleString()}</span>
          </div>
          
          {booking.discount_amount && booking.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-₹{booking.discount_amount.toLocaleString()}</span>
            </div>
          )}
          
          {booking.coupon_discount && booking.coupon_discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon ({booking.coupon_code}):</span>
              <span className="font-medium">-₹{booking.coupon_discount.toLocaleString()}</span>
            </div>
          )}
          
          {booking.tax_amount && booking.tax_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST {booking.gst_percentage ? `(${booking.gst_percentage}%)` : ''}:</span>
              <span className="font-medium">₹{booking.tax_amount.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t font-bold text-base">
            <span>Total Amount:</span>
            <span>₹{(booking.total_amount || 0).toLocaleString()}</span>
          </div>
          
          {booking.security_deposit && booking.security_deposit > 0 && (
            <div className="flex justify-between text-purple-600">
              <span>Security Deposit:</span>
              <span className="font-medium">₹{booking.security_deposit.toLocaleString()}</span>
            </div>
          )}
          
          {/* Payment Breakdown */}
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Payment Type</span>
              <span className="font-medium capitalize">{paymentType}</span>
            </div>
            {paymentType === 'partial' && (
              <div className="flex items-center justify-between text-xs text-purple-700">
                <span>Custom Amount (paid at booking)</span>
                <span className="font-semibold">₹{customAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold text-sm border-t pt-2 mt-2 text-amber-800">
              <span>{display.payableNowLabel}</span>
              <span>₹{display.payableNow.toLocaleString()}</span>
            </div>
            {paymentType !== 'partial' && securityDeposit > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-700">
                <span>Includes Security Deposit</span>
                <span>₹{securityDeposit.toLocaleString()}</span>
              </div>
            )}
            {paymentType === 'partial' && securityDeposit > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-700">
                <span>Security Deposit (collected later)</span>
                <span>₹{securityDeposit.toLocaleString()}</span>
              </div>
            )}
            {paymentType !== 'full' && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t mt-2 pt-2">
                  <span>Remaining Package</span>
                  <span>₹{display.remainingPackage.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Remaining (Total)</span>
                  <span>₹{display.remainingTotal.toLocaleString()}</span>
                </div>
              </>
            )}
            {display.notes.length > 0 && (
              <ul className="mt-2 text-[11px] text-amber-700 list-disc list-inside space-y-0.5">
                {display.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
            <div className="flex items-center justify-between text-xs border-t mt-2 pt-2">
              <span className="text-green-700 font-medium">Paid So Far</span>
              <span className="font-bold text-green-700">₹{paidAmount.toLocaleString()}</span>
            </div>
            {pendingAmount > 0 && paymentType !== 'full' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700 font-medium">Pending Now</span>
                <span className="font-bold text-orange-700">₹{pendingAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {booking.payment_type && (
            <div className="flex justify-between text-xs pt-2">
              <span className="text-muted-foreground">Payment Type:</span>
              <Badge variant="outline" className="h-5">
                {booking.payment_type === 'full' ? 'Full Payment' : 
                 booking.payment_type === 'advance' ? 'Advance' : 
                 booking.payment_type === 'partial' ? 'Partial' : 
                 booking.payment_type}
              </Badge>
            </div>
          )}
          
          {booking.payment_method && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{booking.payment_method}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div>
          <h4 className="font-semibold mb-2">📝 NOTES</h4>
          <p className="text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
        </div>
      )}

    </div>
  )
}
