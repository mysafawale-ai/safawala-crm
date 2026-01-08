"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, isBefore, startOfDay } from "date-fns"
import { Search, CalendarIcon, Package, Eye, Wrench } from "lucide-react"
import { ItemsDisplayDialog, ItemsSelectionDialog, CompactItemsDisplayDialog } from "@/components/shared"
import type { SelectedItem } from "@/components/shared/types/items"
import { PincodeService } from "@/lib/pincode-service"

interface BookingData {
  id: string
  booking_number: string
  customer_name: string
  customer_phone: string
  event_date: string
  delivery_date: string
  return_date: string
  modification_date?: string
  modification_time?: string
  modification_details?: string
  has_modifications?: boolean
  event_type: string
  venue_name: string
  venue_address: string
  area_name?: string
  total_amount: number
  paid_amount?: number
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
  const [modificationBookings, setModificationBookings] = React.useState<BookingData[]>([])
  const [activeTab, setActiveTab] = React.useState<'events' | 'modifications'>('events')
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  // Items display dialog states - matching bookings page architecture
  const [showProductDialog, setShowProductDialog] = React.useState(false)
  const [productDialogBooking, setProductDialogBooking] = React.useState<BookingData | null>(null)
  const [productDialogType, setProductDialogType] = React.useState<'items' | 'pending'>('items')
  const [bookingItems, setBookingItems] = React.useState<Record<string, any[]>>({})
  const [itemsLoading, setItemsLoading] = React.useState<Record<string, boolean>>({})
  const [itemsError, setItemsError] = React.useState<Record<string, string>>({})
  
  // Product selection states
  const [showItemsSelection, setShowItemsSelection] = React.useState(false)
  const [currentBookingForItems, setCurrentBookingForItems] = React.useState<BookingData | null>(null)
  const [selectedItems, setSelectedItems] = React.useState<SelectedItem[]>([])
  
  // Product data states
  const [products, setProducts] = React.useState<any[]>([])
  const [packages, setPackages] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<any[]>([])
  const [subcategories, setSubcategories] = React.useState<any[]>([])

  React.useEffect(() => {
    fetchBookings()
    fetchProductsAndCategories()
  }, [franchiseId])

  // Fetch products and categories for items selection
  const fetchProductsAndCategories = async () => {
    try {
      // Fetch products
      const productsRes = await fetch('/api/products', { cache: 'no-store' })
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.data || [])
      }

      // Fetch categories
      const categoriesRes = await fetch('/api/categories', { cache: 'no-store' })
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }

      // Fetch subcategories
      const subcategoriesRes = await fetch('/api/subcategories', { cache: 'no-store' })
      if (subcategoriesRes.ok) {
        const data = await subcategoriesRes.json()
        setSubcategories(data.data || [])
      }

      // Fetch packages
      const packagesRes = await fetch('/api/packages', { cache: 'no-store' })
      if (packagesRes.ok) {
        const data = await packagesRes.json()
        setPackages(data.data || [])
      }
    } catch (error) {
      console.error('[Calendar] Error fetching products/categories:', error)
    }
  }

  // Helper to get payment status details
  const getPaymentStatus = (booking: BookingData) => {
    const totalAmount = booking.total_amount || 0
    const paidAmount = booking.paid_amount || 0
    const pendingAmount = Math.max(0, totalAmount - paidAmount)

    const isFullyPaid = paidAmount >= totalAmount
    const isUnpaid = paidAmount === 0
    const isPartiallyPaid = paidAmount > 0 && paidAmount < totalAmount
    const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    return {
      isFullyPaid,
      isUnpaid,
      isPartiallyPaid,
      paidAmount,
      pendingAmount,
      paymentPercentage,
    }
  }

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
      
      // Process bookings with area and venue extraction
      const formattedBookings: BookingData[] = await Promise.all(rows.map(async (r: any) => {
        let area_name = 'Not Specified'
        let venue_name = 'Not Specified'

        // 1. Get area from pincode using pincode API (silent - no toast)
        if (r.customer?.pincode) {
          try {
            const pincodeData = await PincodeService.lookup(r.customer.pincode, false)
            if (pincodeData) {
              area_name = pincodeData.area
            }
          } catch (error) {
            console.error(`Error looking up pincode ${r.customer.pincode}:`, error)
            area_name = 'Not Specified'
          }
        }

        // 2. Extract venue name from venue_address using venue extraction API
        if (r.venue_address) {
          try {
            const extractRes = await fetch('/api/venue-area-extractor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: r.venue_address }),
            })
            if (extractRes.ok) {
              const extractData = await extractRes.json()
              if (extractData.success && extractData.data) {
                venue_name = extractData.data.venue_name
              }
            }
          } catch (error) {
            console.error(`Error extracting venue from address "${r.venue_address}":`, error)
            venue_name = r.venue_address?.split(/[,\n]/)[0]?.trim() || 'Not Specified'
          }
        }

        return {
          id: r.id,
          booking_number: r.booking_number,
          customer_name: r.customer?.name || 'Unknown Customer',
          customer_phone: r.customer?.phone || '',
          event_date: toDateOnly(r.event_date),
          delivery_date: toDateOnly(r.delivery_date),
          return_date: toDateOnly(r.pickup_date), // API field name
          modification_date: r.modification_date ? toDateOnly(r.modification_date) : undefined,
          modification_time: r.modification_time || undefined,
          modification_details: r.modification_details || undefined,
          has_modifications: r.has_modifications || false,
          event_type: r.event_type,
          venue_name,
          venue_address: r.venue_address || '',
          area_name,
          total_amount: Number(r.total_amount) || 0,
          paid_amount: Number(r.paid_amount) || 0,
          status: r.status,
          total_safas: Number(r.total_safas) || 0,
          assigned_staff_name: undefined,
          booking_items: [],
          customer: {
            name: r.customer?.name || 'Unknown Customer',
            city: r.customer?.city || 'Not Specified',
            address: r.customer?.address || 'Not Specified',
          },
          has_items: r.has_items || false,
          source: r.source || 'product_orders',
          type: r.type || 'rental',
          package_details: r.package_details || null,
          variant_name: r.variant_name || null,
          extra_safas: r.extra_safas || 0,
        } as any
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
        booking.event_date === dateStr,
    )
  }

  const getModificationsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return bookings.filter(
      (booking) =>
        booking.has_modifications && booking.modification_date === dateStr,
    )
  }

  // Save selected items
  const saveSelectedItems = async (bookingId: string, items: SelectedItem[]) => {
    try {
      console.log(`[Calendar] Saving ${items.length} items for booking ${bookingId}`)
      
      const payload = {
        bookingId,
        items: items.map((item: any) => ({
          product_id: item.product_id || null,
          package_id: item.package_id || null,
          variant_id: item.variant_id || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          security_deposit: item.security_deposit || 0,
        })),
        source: 'product_orders',
      }
      
      const response = await fetch('/api/bookings-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save items')
      }
      
      // Refresh bookings to get updated data
      await fetchBookings()
      
      return true
    } catch (error: any) {
      console.error('[Calendar] Save failed:', error)
      return false
    }
  }
  // Fetch items for a specific booking when dialog opens - matching bookings page
  React.useEffect(() => {
    if (showProductDialog && productDialogBooking && productDialogType === 'items') {
      (async () => {
        const bookingId = productDialogBooking.id
        const bookingNumber = productDialogBooking.booking_number
        
        try {
          setItemsLoading(prev => ({ ...prev, [bookingId]: true }))
          console.log(`[Calendar] Fetching items for ${bookingNumber}...`)
          
          // Use the source field from booking to determine the API parameter
          const source = (productDialogBooking as any).source || 'product_order'
          const normalizedSource = source.endsWith('s') ? source.slice(0, -1) : source
          
          const url = `/api/bookings-items?id=${bookingId}&source=${normalizedSource}`
          console.log(`[Calendar] GET ${url}`)
          
          const res = await fetch(url)
          
          if (!res.ok) {
            const errorText = await res.text()
            console.error(`[Calendar] HTTP ${res.status}:`, errorText)
            setItemsError(prev => ({ ...prev, [bookingId]: `HTTP ${res.status}` }))
            setItemsLoading(prev => ({ ...prev, [bookingId]: false }))
            return
          }
          
          const data = await res.json()
          
          if (Array.isArray(data.items)) {
            setBookingItems(prev => ({ ...prev, [bookingId]: data.items }))
            console.log(`[Calendar] ✓ Loaded ${data.items.length} items for ${bookingNumber}`)
            setItemsError(prev => ({ ...prev, [bookingId]: '' }))
          } else {
            const errorDetail = data.details || data.error || 'Unknown error'
            console.warn(`[Calendar] API returned error:`, errorDetail)
            setItemsError(prev => ({ ...prev, [bookingId]: errorDetail }))
          }
        } catch (e: any) {
          console.error(`[Calendar] Fetch error for ${bookingNumber}:`, e)
          setItemsError(prev => ({ ...prev, [bookingId]: e.message || 'Network error' }))
        } finally {
          setItemsLoading(prev => ({ ...prev, [bookingId]: false }))
        }
      })()
    }
  }, [showProductDialog, productDialogBooking?.id, productDialogType])

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
    const dayModifications = getModificationsForDate(date)
    console.log("[v0] Bookings found for date:", dayBookings.length)
    console.log("[v0] Modifications found for date:", dayModifications.length)
    setDateBookings(dayBookings)
    setModificationBookings(dayModifications)
    setActiveTab(dayBookings.length > 0 ? 'events' : (dayModifications.length > 0 ? 'modifications' : 'events'))
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
              Bookings & Modifications - {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'events' | 'modifications')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Event Bookings ({dateBookings.length})
              </TabsTrigger>
              <TabsTrigger value="modifications" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Modifications ({modificationBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              {dateBookings.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{dateBookings.length} total</Badge>
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
                </div>
              )}

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
                    <a href="/create-invoice" className="inline-flex items-center px-3 py-2 rounded-md border bg-background hover:bg-muted text-sm font-medium">
                      + Create Booking
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
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[140px]">
                        Payment Status
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[150px]">
                        Venue Name
                      </th>
                      <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[120px]">
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
                            {(() => {
                              const bookingType = (booking as any).type
                              const totalSafas = booking.total_safas ?? booking.booking_items.reduce((sum, item) => sum + item.quantity, 0)
                              
                              // For packages: show category name with quantity
                              if (bookingType === 'package') {
                                const packageDetails = (booking as any).package_details
                                const variantName = (booking as any).variant_name
                                const categoryName = packageDetails?.name || 'Package'
                                
                                return (
                                  <>
                                    <div className="text-lg font-bold text-primary">{totalSafas}</div>
                                    <div className="text-xs text-gray-600 mt-1">{categoryName}</div>
                                    {variantName && <div className="text-xs text-muted-foreground mt-0.5">{variantName}</div>}
                                  </>
                                )
                              }
                              
                              // For product rentals: show total quantity
                              return (
                                <>
                                  <div className="text-2xl font-bold text-primary">{totalSafas}</div>
                                  <div className="text-xs text-gray-500 mt-1">Total Quantity</div>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          {(() => {
                            const payment = getPaymentStatus(booking)
                            if (payment.isFullyPaid) {
                              return <span className="text-green-600 font-semibold">✅ Confirmed</span>
                            } else {
                              return (
                                <div className="text-amber-600 font-semibold">
                                  <div>⏳ Pending Payment</div>
                                  <div className="text-xs text-amber-500">₹{payment.pendingAmount.toLocaleString()}</div>
                                </div>
                              )
                            }
                          })()}
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          <div className="font-medium">{booking.venue_name}</div>
                        </td>
                        <td className="border-r border-muted px-4 py-3 text-sm text-foreground">
                          {booking.area_name || 'Not Specified'}
                        </td>
                        <td className="border-muted px-4 py-3 text-sm text-foreground">
                          {booking.customer.city}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </TabsContent>

            <TabsContent value="modifications" className="space-y-4">
              {modificationBookings.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-amber-500">{modificationBookings.length} modifications pending</Badge>
                </div>
              )}

              {modificationBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <div className="text-muted-foreground">No modifications for this date</div>
                </div>
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
                        <th className="border-r border-muted px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[180px]">
                          Modification Date & Time
                        </th>
                        <th className="border-muted px-4 py-3 text-left text-sm font-semibold text-foreground">
                          Modification Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modificationBookings.map((booking, index) => (
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
                                {booking.modification_date ? format(new Date(booking.modification_date), "dd-MMM-yyyy") : "N/A"}
                              </div>
                              {booking.modification_time && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {booking.modification_time}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border-muted px-4 py-3 text-sm text-foreground max-w-sm">
                            <div className="text-xs bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
                              {booking.modification_details || "No details provided"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Compact Items Display Dialog - Matching Bookings Page */}
      {productDialogBooking && productDialogType === 'items' && !itemsLoading[productDialogBooking.id] && !itemsError[productDialogBooking.id] && bookingItems[productDialogBooking.id] && (
        <CompactItemsDisplayDialog
          open={showProductDialog}
          onOpenChange={async (open) => {
            if (!open && productDialogBooking) {
              // When closing, save any changes
              const bookingType = (productDialogBooking as any).type || 'rental'
              const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
              await saveSelectedItems(productDialogBooking.id, selectedItems)
            }
            setShowProductDialog(open)
          }}
          items={(() => {
            const items = bookingItems[productDialogBooking.id] || []
            return items.map((item: any) => {
              if (item.package_name) {
                return {
                  id: item.id || `item-${Math.random()}`,
                  package_id: item.package_id || item.id,
                  variant_id: item.variant_id,
                  package: {
                    id: item.package_id || item.id,
                    name: item.package_name,
                    description: item.package_description,
                  },
                  variant: item.variant_name ? {
                    id: item.variant_id,
                    name: item.variant_name,
                    price: item.unit_price || item.price || 0,
                  } : undefined,
                  quantity: item.quantity || 1,
                  extra_safas: item.extra_safas || 0,
                  variant_inclusions: item.variant_inclusions || [],
                  unit_price: item.unit_price || item.price || 0,
                  total_price: item.price || item.total_price || 0,
                } as any
              } else {
                return {
                  id: item.product_id || item.id || `item-${Math.random()}`,
                  product_id: item.product_id || item.id,
                  product: {
                    id: item.product_id || item.id,
                    name: item.product?.name || item.product_name || 'Item',
                    barcode: item.product?.barcode || item.barcode || item.product_code,
                    product_code: item.product?.product_code || item.product_code,
                    category: item.product?.category || item.category_name,
                    image_url: item.product?.image_url,
                  },
                  quantity: item.quantity || 1,
                  unit_price: item.unit_price || item.price || 0,
                  total_price: (item.unit_price || item.price || 0) * (item.quantity || 1),
                  variant_name: item.variant_name,
                } as any
              }
            })
          })()}
          title={`📦 ${productDialogBooking.booking_number}`}
          onEditProducts={() => {
            setShowProductDialog(false)
            setCurrentBookingForItems(productDialogBooking)
            const items = bookingItems[productDialogBooking.id] || []
            setSelectedItems(items.map((item: any) => {
              if (item.package_name) {
                return {
                  id: item.id || `item-${Math.random()}`,
                  package_id: item.package_id || item.id,
                  variant_id: item.variant_id,
                  package: {
                    id: item.package_id || item.id,
                    name: item.package_name,
                  },
                  variant: item.variant_name ? {
                    id: item.variant_id,
                    name: item.variant_name,
                  } : undefined,
                  quantity: item.quantity || 1,
                  extra_safas: item.extra_safas || 0,
                } as any
              } else {
                return {
                  id: item.product_id || item.id || `item-${Math.random()}`,
                  product_id: item.product_id || item.id,
                  product: {
                    id: item.product_id || item.id,
                    name: item.product?.name || item.product_name || 'Item',
                  },
                  quantity: item.quantity || 1,
                } as any
              }
            }))
            setShowItemsSelection(true)
          }}
          onRemoveItem={(itemId) => {
            setSelectedItems(prev => prev.filter(item => item.id !== itemId))
          }}
          showPricing={true}
        />
      )}

      {/* Product Selection Dialog - Matching Bookings Page */}
      {currentBookingForItems && (
        <ItemsSelectionDialog
          open={showItemsSelection}
          onOpenChange={async (open) => {
            if (!open && currentBookingForItems) {
              // When modal closes, save the selected items
              const bookingType = (currentBookingForItems as any).type || 'rental'
              const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
              await saveSelectedItems(currentBookingForItems.id, selectedItems)
            }
            setShowItemsSelection(open)
          }}
          mode="select"
          type="product"
          items={products}
          categories={categories}
          subcategories={subcategories}
          context={{
            bookingType: (currentBookingForItems as any).type === 'package' ? 'sale' : 'rental',
            eventDate: currentBookingForItems.event_date,
            deliveryDate: currentBookingForItems.delivery_date,
            returnDate: currentBookingForItems.return_date,
            onItemSelect: (item) => {
              // Check if item already exists in selectedItems
              const existingItem = selectedItems.find(si => {
                if ('variants' in item || 'package_variants' in item) {
                  return 'package_id' in si && si.package_id === item.id
                } else {
                  return 'product_id' in si && si.product_id === item.id
                }
              })

              if (existingItem) {
                // Item already selected, remove it
                setSelectedItems(prev => prev.filter(si => si.id !== existingItem.id))
              } else {
                // Add new item
                if ('variants' in item || 'package_variants' in item) {
                  // Package item
                  const newItem: SelectedItem = {
                    id: `pkg-${item.id}-${Date.now()}`,
                    package_id: item.id,
                    variant_id: undefined,
                    package: item as any,
                    variant: undefined,
                    quantity: (item as any).requestedQuantity || 1,
                    extra_safas: 0,
                    variant_inclusions: [],
                    unit_price: 0,
                    total_price: 0,
                  } as any
                  setSelectedItems(prev => [...prev, newItem])
                } else {
                  // Product item
                  const prod = item as any
                  const newItem: SelectedItem = {
                    id: `prod-${item.id}-${Date.now()}`,
                    product_id: item.id,
                    product: prod,
                    quantity: (item as any).requestedQuantity || 1,
                    unit_price: prod.rental_price || 0,
                    total_price: (prod.rental_price || 0) * ((item as any).requestedQuantity || 1),
                  } as any
                  setSelectedItems(prev => [...prev, newItem])
                }
              }
            },
            onQuantityChange: (itemId: string, qty: number) => {
              setSelectedItems(prev => prev.map(si => {
                const id = 'product_id' in si ? si.product_id : si.package_id
                if (id === itemId) {
                  return { ...si, quantity: qty, total_price: (si.unit_price || 0) * qty }
                }
                return si
              }))
            },
          }}
          selectedItems={selectedItems}
        />
      )}
    </Card>
  )
}
