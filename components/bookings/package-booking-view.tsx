"use client"

import { Badge } from "@/components/ui/badge"
import { formatTime12Hour } from "@/lib/utils"

interface PackageBookingViewProps {
  booking: any
  bookingItems?: any[]
}

export function PackageBookingView({ booking, bookingItems = [] }: PackageBookingViewProps) {
  const pendingAmount = (booking.total_amount || 0) - (booking.paid_amount || 0)
  
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
            {pendingAmount > 0 && (
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

      {/* Event Details */}
      <div>
        <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">🎉 EVENT DETAILS</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{booking.event_type?.replace('_', ' ') || 'N/A'}</span></div>
          {booking.event_for && (
            <div><span className="text-muted-foreground">Participant:</span> <span className="font-medium capitalize">{booking.event_for}</span></div>
          )}
          <div className="col-span-2">
            <span className="text-muted-foreground">Event Date & Time:</span>{' '}
            <span className="font-medium">
              {booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
              {booking.event_time && ` at ${formatTime12Hour(booking.event_time)}`}
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
                  {booking.delivery_time && ` at ${formatTime12Hour(booking.delivery_time)}`}
                </span>
              </div>
            )}
            {booking.return_date && (
              <div>
                <span className="text-muted-foreground">Return:</span>{' '}
                <span className="font-medium">
                  {new Date(booking.return_date).toLocaleDateString('en-IN')}
                  {booking.return_time && ` at ${formatTime12Hour(booking.return_time)}`}
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">₹{((booking.subtotal_amount || booking.total_amount) || 0).toLocaleString()}</span>
          </div>
          
          {booking.distance_amount && booking.distance_amount > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Distance Charges:</span>
              <span className="font-medium">+₹{booking.distance_amount.toLocaleString()}</span>
            </div>
          )}
          
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
          
          <div className="flex justify-between pt-1.5 border-t">
            <span className="text-green-700 font-medium">Amount Paid:</span>
            <span className="font-bold text-green-700">₹{(booking.paid_amount || 0).toLocaleString()}</span>
          </div>
          
          {pendingAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Pending Amount:</span>
              <span className="font-bold text-orange-700">₹{pendingAmount.toLocaleString()}</span>
            </div>
          )}
          
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
