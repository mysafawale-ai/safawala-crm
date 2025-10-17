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
  total_safas?: number
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

      const toDateOnly = (v: any) => (v ? format(new Date(v), 'yyyy-MM-dd') : '')
      const formattedBookings: BookingData[] = rows.map((r: any) => ({
        id: r.id,
        booking_number: r.booking_number,
        customer_name: r.customer?.name || 'Unknown Customer',
        customer_phone: r.customer?.phone || '',
        event_date: toDateOnly(r.event_date),
        delivery_date: toDateOnly(r.delivery_date),
        return_date: toDateOnly(r.pickup_date), // API field name
        event_type: r.event_type,
        venue_name: r.venue_name || 'Not Specified',
        venue_address: r.venue_address || '',
        total_amount: Number(r.total_amount) || 0,
        status: r.status,
        total_safas: Number(r.total_safas) || 0,
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

    // Past dates - grey
    if (isBefore(currentDate, today)) {
      return "past"
    }

    const dayBookings = getBookingsForDate(date)
    const bookingCount = dayBookings.length

    // Count-based coloring
    // bookingCount === 0 => zero
    // 1 <= bookingCount < 20 => low
    // bookingCount >= 20 => high
    if (bookingCount === 0) {
      return "zero" // 0 bookings
    }

    if (bookingCount >= 20) {
      return "high" // 20+ bookings = red
    }

    return "low" // 1-19 bookings
  }

  const handleDateClick = (date: Date) => {
    console.log("[v0] Date clicked:", format(date, "yyyy-MM-dd"))
    const dayBookings = getBookingsForDate(date)
    console.log("[v0] Bookings found for date:", dayBookings.length)
    setDateBookings(dayBookings)
    setShowDateDetails(true)
    console.log("[v0] Popup should open, showDateDetails:", true)
    // Clear selection immediately to prevent black selected state
    setTimeout(() => setSelectedDate(undefined), 0)
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
      past: [],    // Past dates (grey)
      zero: [],    // 0 bookings (green)
      low: [],     // 1-19 bookings (blue)
      high: [],    // 20+ bookings (red)
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
    // Past dates → grey
    past: "!bg-gray-300 !text-gray-600 !opacity-60 !cursor-not-allowed hover:!bg-gray-300 dark:!bg-gray-700 dark:!text-gray-400",
  // 0 bookings → blue (as requested)
  zero: "!bg-blue-500/90 !text-white hover:!bg-blue-600 !cursor-pointer !border !border-blue-600/30 shadow-sm font-semibold",
  // 1-19 bookings → green
  low: "!bg-green-500/90 !text-white hover:!bg-green-600 !cursor-pointer !border !border-green-600/30 shadow-sm font-semibold",
    // 20+ bookings → red
    high: "!bg-red-500/90 !text-white hover:!bg-red-600 !cursor-pointer !border !border-red-600/30 shadow-sm font-semibold",
  }

  return (
    <Card className={`shadow-md border-border/40 w-full ${compact ? 'p-2' : ''}`}>
      <CardHeader className={`${compact ? 'py-3 px-4' : 'pb-4 px-6'} border-b bg-gradient-to-br from-background to-muted/20`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${compact ? 'text-base' : 'text-xl'} font-semibold flex items-center gap-2`}>
            <CalendarIcon className="w-5 h-5 text-primary" />
            Booking Calendar
          </CardTitle>
          {!compact && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-blue-500 border border-blue-600/30 shadow-sm" />
                <span className="text-muted-foreground font-medium">0 Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500 border border-green-600/30 shadow-sm" />
                <span className="text-muted-foreground font-medium">1-20 Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-500 border border-red-600/30 shadow-sm" />
                <span className="text-muted-foreground font-medium">20+ Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-gray-400 border border-gray-500/30 shadow-sm" />
                <span className="text-muted-foreground font-medium">Past Date</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={`w-full ${compact ? 'p-3' : 'p-6'}`}>
        <div className={`mx-auto w-full ${compact ? (mini ? 'max-w-[420px] md:max-w-[680px]' : 'max-w-sm md:max-w-[800px]') : 'md:w-[70%]'}`}>
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
            squareCells={false}
            className={`rounded-lg border-2 border-border/50 w-full bg-background/50 ${compact ? (mini ? '[--cell-size:1.5rem]' : '[--cell-size:2rem]') : '[--cell-size:3.5rem] md:[--cell-size:4rem]'}`}
          />
          {/* Always show a small legend for reference */}
          <div className={`mt-4 flex items-center ${mini ? 'gap-3 text-[11px]' : 'gap-5 text-xs'} justify-center bg-muted/30 rounded-lg py-2.5 px-4 flex-wrap`}>
            <span className="inline-flex items-center gap-1.5 font-medium"><span className={`inline-block ${mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm bg-green-500 border border-green-600/30`} /> Confirmed</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><span className={`inline-block ${mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm bg-blue-500 border border-blue-600/30`} /> Delivered</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><span className={`inline-block ${mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm bg-orange-500 border border-orange-600/30`} /> Pending</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><span className={`inline-block ${mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm bg-purple-500 border border-purple-600/30`} /> Quote</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><span className={`inline-block ${mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm bg-gray-400 border border-gray-500/30`} /> Cancelled</span>
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
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <CalendarIcon className="w-5 h-5" />
              Event Details - {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
              <Badge variant="secondary" className="ml-2">{dateBookings.length} total</Badge>
              {dateBookings.filter(b => b.status === 'confirmed').length > 0 && (
                <Badge className="bg-green-500">{dateBookings.filter(b => b.status === 'confirmed').length} confirmed</Badge>
              )}
              {dateBookings.filter(b => b.status === 'delivered').length > 0 && (
                <Badge className="bg-blue-500">{dateBookings.filter(b => b.status === 'delivered').length} delivered</Badge>
              )}
              {dateBookings.filter(b => b.status === 'pending_payment').length > 0 && (
                <Badge className="bg-orange-500">{dateBookings.filter(b => b.status === 'pending_payment').length} pending</Badge>
              )}
              {dateBookings.filter(b => b.status === 'quote').length > 0 && (
                <Badge className="bg-purple-500">{dateBookings.filter(b => b.status === 'quote').length} quotes</Badge>
              )}
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
                          <div className="text-center">
                            <span className="text-2xl font-bold text-primary">
                              {booking.total_safas ?? booking.booking_items.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">Total Safas</div>
                          </div>
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
