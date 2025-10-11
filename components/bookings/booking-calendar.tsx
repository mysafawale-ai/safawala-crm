"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isBefore, startOfDay } from "date-fns"
import { Search, CalendarIcon } from "lucide-react"

interface BookingData {
  id: string
  booking_number: string
  customer_name: string
  customer_phone: string
  event_date: string
  delivery_date: string
  return_date: string
  event_type: string
  venue_name: string
  venue_address: string
  total_amount: number
  status: string
  assigned_staff_name?: string
  booking_items: {
    product_name: string
    quantity: number
  }[]
  customer: {
    name: string
    city: string
    address: string
  }
}

interface BookingCalendarProps {
  franchiseId?: string
  compact?: boolean
  mini?: boolean // ultra-compact size
}

export function BookingCalendar({ franchiseId, compact = false, mini = false }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>()
  const [showDateDetails, setShowDateDetails] = React.useState(false)
  const [bookings, setBookings] = React.useState<BookingData[]>([])
  const [dateBookings, setDateBookings] = React.useState<BookingData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    fetchBookings()
  }, [franchiseId])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      // Always use server API which applies franchise isolation via session.
      const res = await fetch('/api/bookings', { cache: 'no-store' })
      if (!res.ok) {
        console.error('[v0] Error fetching bookings via /api/bookings:', res.status, await res.text().catch(()=>''))
        return
      }
      const json = await res.json()
      const rows: any[] = json?.data || []

      const formattedBookings: BookingData[] = rows.map((r: any) => ({
        id: r.id,
        booking_number: r.booking_number,
        customer_name: r.customer?.name || 'Unknown Customer',
        customer_phone: r.customer?.phone || '',
        event_date: r.event_date,
        delivery_date: r.delivery_date,
        return_date: r.pickup_date, // API field name
        event_type: r.event_type,
        venue_name: r.venue_name || 'Not Specified',
        venue_address: r.venue_address || '',
        total_amount: Number(r.total_amount) || 0,
        status: r.status,
        assigned_staff_name: undefined,
        booking_items: [],
        customer: {
          name: r.customer?.name || 'Unknown Customer',
          city: r.customer?.city || 'Not Specified',
          address: r.customer?.address || 'Not Specified',
        },
      }))

      setBookings(formattedBookings)
    } catch (error) {
      console.error("[v0] Error in fetchBookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return bookings.filter(
      (booking) =>
        booking.event_date === dateStr || booking.delivery_date === dateStr || booking.return_date === dateStr,
    )
  }

  const getDateStatus = (date: Date) => {
    const today = startOfDay(new Date())
    const currentDate = startOfDay(date)

    // Past dates
    if (isBefore(currentDate, today)) {
      return "past"
    }

    const bookingCount = getBookingsForDate(date).length

    if (bookingCount === 0) {
      return "zero" // Zero bookings = green per requirement
    } else if (bookingCount >= 20) {
      return "full" // 20+ bookings = red
    } else {
      return "mid" // 1-20 bookings = blue
    }
  }

  const handleDateClick = (date: Date) => {
    console.log("[v0] Date clicked:", format(date, "yyyy-MM-dd"))
    setSelectedDate(date)
    const dayBookings = getBookingsForDate(date)
    console.log("[v0] Bookings found for date:", dayBookings.length)
    setDateBookings(dayBookings)
    setShowDateDetails(true)
    console.log("[v0] Popup should open, showDateDetails:", true)
  }

  const filteredDateBookings = dateBookings.filter(
    (booking) =>
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const dayModifiers = React.useMemo(() => {
    const modifiers: Record<string, Date[]> = {
      past: [],
      zero: [], // 0 bookings (green)
      mid: [], // 1-20 bookings (blue)
      full: [], // 20+ bookings (red)
    }

    // Generate dates for the current month and next few months
    const today = new Date()
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0) // 3 months ahead

    for (let d = new Date(today.getFullYear(), today.getMonth() - 1, 1); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d)
      const status = getDateStatus(currentDate)
      if (modifiers[status]) modifiers[status].push(new Date(currentDate))
    }

    return modifiers
  }, [bookings])

  const dayClassNames = {
    past: "!bg-muted !text-muted-foreground opacity-60",
    // 0 bookings → green
    zero: "!bg-emerald-600 !text-white hover:!bg-emerald-700",
    // 1-20 bookings → blue
    mid: "!bg-blue-600 !text-white hover:!bg-blue-700",
    // 20+ bookings → red
    full: "!bg-red-600 !text-white hover:!bg-red-700",
  }

  return (
    <Card className={`shadow-sm w-full ${compact ? 'p-2' : ''}`}>
      <CardHeader className={`${compact ? 'py-2' : 'pb-2'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${compact ? 'text-base' : 'text-xl'}`}>Booking Calendar</CardTitle>
          {!compact && (
            <div className="flex items-center gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-muted ring-1 ring-muted-foreground/30" />
                <span className="text-muted-foreground">Past Date</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-primary/70 ring-1 ring-primary/40" />
                <span className="text-muted-foreground">0 Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-emerald-600 ring-1 ring-emerald-700/40" />
                <span className="text-muted-foreground">1-20 Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-destructive ring-1 ring-destructive/40" />
                <span className="text-muted-foreground">20+ Bookings</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="w-full">
        <div className={`mx-auto ${compact ? (mini ? 'max-w-xs' : 'max-w-sm') : 'md:w-[70%]'} w-full`}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              console.log("[v0] Calendar onSelect triggered with date:", date)
              if (date) {
                handleDateClick(date)
              }
            }}
            modifiers={dayModifiers}
            modifiersClassNames={dayClassNames}
            renderDayBadge={(date)=>{
              const count = getBookingsForDate(date).length
              return count>0 ? count : null
            }}
            className={`rounded-md border w-full ${compact ? (mini ? '[--cell-size:1rem]' : '[--cell-size:1.25rem]') : '[--cell-size:2.2rem] md:[--cell-size:2.4rem]'}`}
          />
          {/* Always show a small legend for reference */}
          <div className={`mt-3 flex items-center ${mini ? 'gap-3 text-[11px]' : 'gap-4 text-xs'} text-muted-foreground justify-center`}>
            <span className="inline-flex items-center gap-2"><span className={`inline-block ${mini ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded bg-emerald-600`} /> 0 Bookings</span>
            <span className="inline-flex items-center gap-2"><span className={`inline-block ${mini ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded bg-blue-600`} /> 1-20 Bookings</span>
            <span className="inline-flex items-center gap-2"><span className={`inline-block ${mini ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded bg-red-600`} /> 20+ Bookings</span>
          </div>
        </div>
      </CardContent>

      <Dialog
        open={showDateDetails}
        onOpenChange={(open) => {
          console.log("[v0] Dialog onOpenChange:", open)
          setShowDateDetails(open)
        }}
      >
        <DialogContent className={`${compact ? 'max-w-md' : 'max-w-7xl'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Event Details - {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
              <Badge variant="secondary">{dateBookings.length} bookings</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${compact ? 'hidden' : ''}`}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, booking number, venue, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {dateBookings.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-muted-foreground">No bookings for this date</div>
                <div className="flex items-center justify-center gap-3">
                  <a href="/create-product-order" className="inline-flex items-center px-3 py-2 rounded-md border bg-background hover:bg-muted text-sm font-medium">
                    + Book Product Order
                  </a>
                  <a href="/book-package" className="inline-flex items-center px-3 py-2 rounded-md border bg-background hover:bg-muted text-sm font-medium">
                    + Book a Package
                  </a>
                </div>
              </div>
            ) : filteredDateBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings match your search</div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[150px]">
                        Customer Name
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[120px]">
                        Phone Number
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[160px]">
                        Event Date & Time
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[200px]">
                        Total Safas
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[150px]">
                        Venue Name
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[100px]">
                        Area
                      </th>
                      <th className="border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[100px]">
                        City
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDateBookings.map((booking, index) => (
                      <tr
                        key={booking.id}
                        className={`border-b hover:bg-muted/40 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                      >
                        <td className="border-r border-muted px-4 py-3 text-sm font-medium text-foreground">
                          {booking.customer_name}
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          {booking.customer_phone || "N/A"}
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          <div>
                            <div className="font-medium">
                              {format(new Date(booking.event_date), "dd-MMM-yyyy HH:mm a")}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{booking.event_type}</div>
                          </div>
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          {booking.booking_items.length > 0 ? (
                            <div className="text-center">
                              <span className="text-2xl font-bold text-primary">
                                {booking.booking_items.reduce((sum, item) => sum + item.quantity, 0)}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">Total Safas</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-xl font-semibold text-muted-foreground">0</span>
                              <div className="text-xs text-muted-foreground mt-1">No Items</div>
                            </div>
                          )}
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          <div>
                            <div className="font-medium">{booking.venue_name}</div>
                            {booking.venue_address && (
                              <div className="text-xs text-muted-foreground mt-1">{booking.venue_address}</div>
                            )}
                          </div>
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          {booking.customer.address}
                        </td>
                        <td className="border-muted px-4 py-3 text-sm text-foreground">{booking.customer.city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
