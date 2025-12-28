"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, Archive, Plus, Package } from "lucide-react"
import Link from "next/link"
import type { Booking } from "@/lib/types"
import { TableSkeleton } from "@/components/ui/skeleton-loader"

interface BookingsTabsProps {
  bookings: Booking[]
  loading: boolean
  paginatedBookings?: Booking[]
  totalItems?: number
  currentPage?: number
  itemsPerPage?: number
  startIndex?: number
  endIndex?: number
  totalPages?: number
  getStatusBadge?: (status: string, booking: Booking) => React.ReactNode
  bookingItems?: Record<string, any[]>
  bookingsWithItems?: Set<string>
  getPageNumbers?: () => (number | string)[]
  goToPage?: (page: number) => void
  setItemsPerPage?: (value: number) => void
  setCurrentPage?: (page: number) => void
  handleOpenCompactDisplay?: (booking: Booking) => void
  setProductDialogBooking?: (booking: Booking) => void
  setProductDialogType?: (type: "pending" | "items") => void
  setShowProductDialog?: (show: boolean) => void
  setCurrentBookingForItems?: (booking: Booking | null) => void
  setSelectedItems?: (items: any[]) => void
  setShowItemsSelection?: (show: boolean) => void
  setSelectedBooking?: (booking: Booking | null) => void
  setShowViewDialog?: (show: boolean) => void
  handleEditBooking?: (id: string, source: string) => void
  handleArchiveBooking?: (id: string, source: string) => void
  archivedBookings?: Booking[]
  showArchivedSection?: boolean
  setShowArchivedSection?: (show: boolean) => void
  handleRestoreBooking?: (id: string, source: string) => void
  onTabChange?: (tab: string) => void
}

export function BookingsTabs({ 
  bookings, 
  loading,
  getStatusBadge,
  bookingItems = {},
  bookingsWithItems = new Set(),
  setSelectedBooking,
  setShowViewDialog,
  handleEditBooking,
  handleArchiveBooking,
  handleOpenCompactDisplay,
  setProductDialogBooking,
  setProductDialogType,
  setShowProductDialog,
  setCurrentBookingForItems,
  setSelectedItems,
  setShowItemsSelection,
  onTabChange 
}: BookingsTabsProps) {
  const [activeTab, setActiveTab] = useState("all")

  // Filter bookings by type
  const allBookings = bookings
  const productRentals = useMemo(() => 
    bookings.filter(b => (b as any).source === 'product_orders' && (b as any).type === 'rental'),
    [bookings]
  )
  const directSales = useMemo(() => 
    bookings.filter(b => (b as any).source === 'direct_sales'),
    [bookings]
  )
  const packageBookings = useMemo(() => 
    bookings.filter(b => (b as any).source === 'package_bookings'),
    [bookings]
  )

  // Get bookings for current tab
  const getTabBookings = () => {
    switch(activeTab) {
      case 'product-rental': return productRentals
      case 'direct-sale': return directSales
      case 'package': return packageBookings
      default: return allBookings
    }
  }

  const tabBookings = getTabBookings()

  const BookingsTableContent = ({ bookingsList }: { bookingsList: Booking[] }) => (
    <>
      {loading ? (
        <TableSkeleton rows={10} />
      ) : bookingsList.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground mb-6">Create your first booking to get started</p>
          <Link href="/book-package">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Created At</TableHead>
              {(activeTab === 'product-rental' || activeTab === 'package' || activeTab === 'direct-sale') && (
                <TableHead>Invoice</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsList.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.booking_number}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.customer?.name}</div>
                    <div className="text-sm text-muted-foreground">{booking.customer?.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const b: any = booking
                    if (b.type === 'package') {
                      const totalSafas = (b.total_safas || 0)
                      return (
                        <div className="flex flex-col gap-1">
                          <Badge variant="default">Package</Badge>
                          <span className="text-xs text-gray-600">{totalSafas} Safas</span>
                        </div>
                      )
                    }
                    if (b.type === 'sale') return <Badge variant="secondary">Product • Sale</Badge>
                    if (b.type === 'rental') return <Badge>Product • Rental</Badge>
                    return <Badge variant="outline">Unknown</Badge>
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const items = bookingItems[booking.id] || []
                    const hasItems = (booking as any).has_items || bookingsWithItems.has(booking.id)
                    const bookingType = (booking as any).type
                    
                    // For direct sales: show dash
                    if (bookingType === 'sale') {
                      return <span className="text-muted-foreground text-sm">—</span>
                    }
                    
                    const actuallyHasItems = items.length > 0
                    
                    if (!hasItems || !actuallyHasItems) {
                      return (
                        <Badge 
                          variant="outline" 
                          className="text-orange-600 border-orange-300"
                          title="Click Edit button to add products"
                        >
                          ⏳ Selection Pending
                        </Badge>
                      )
                    }
                    
                    // Show static "Items Selected" tag - no popup
                    return (
                      <Badge 
                        variant="default"
                        className="bg-green-600"
                        title={`${items.length} item(s) selected`}
                      >
                        ✓ Items Selected
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell>{getStatusBadge?.(booking.status, booking)}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start">
                    <span>₹{booking.total_amount?.toLocaleString() || 0}</span>
                    {typeof (booking as any).security_deposit === 'number' && (booking as any).security_deposit > 0 && (
                      <span className="text-xs text-muted-foreground">Payable Now: ₹{(((booking as any).total_amount || 0) + ((booking as any).security_deposit || 0)).toLocaleString()}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                
                {/* Invoice column for all booking types */}
                {(activeTab === 'product-rental' || activeTab === 'package' || activeTab === 'direct-sale') && (
                  <TableCell>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                      📄 View
                    </Badge>
                  </TableCell>
                )}
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedBooking?.(booking)
                        setShowViewDialog?.(true)
                      }}
                      title="View Booking"
                    >
                      <Eye className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditBooking?.(booking.id, (booking as any).source)}
                      title="Edit Booking"
                    >
                      <Edit className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-amber-600 hover:text-amber-700"
                      onClick={() => handleArchiveBooking?.(booking.id, (booking as any).source)}
                      title="Archive Booking"
                    >
                      <Archive className="h-4 w-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )

  return (
    <Tabs value={activeTab} onValueChange={(val) => {
      setActiveTab(val)
      onTabChange?.(val)
    }} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">
          All ({allBookings.length})
        </TabsTrigger>
        <TabsTrigger value="product-rental">
          Rentals ({productRentals.length})
        </TabsTrigger>
        <TabsTrigger value="direct-sale">
          Direct Sales ({directSales.length})
        </TabsTrigger>
        <TabsTrigger value="package">
          Packages ({packageBookings.length})
        </TabsTrigger>
      </TabsList>

      {/* All Bookings Tab */}
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Bookings ({allBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingsTableContent bookingsList={allBookings} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Product Rentals Tab */}
      <TabsContent value="product-rental">
        <Card>
          <CardHeader>
            <CardTitle>Product Rentals ({productRentals.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Shows Quote Status & Invoice</p>
          </CardHeader>
          <CardContent>
            <BookingsTableContent bookingsList={productRentals} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Direct Sales Tab */}
      <TabsContent value="direct-sale">
        <Card>
          <CardHeader>
            <CardTitle>Direct Sales ({directSales.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Shows Invoice only (no quotes)</p>
          </CardHeader>
          <CardContent>
            <BookingsTableContent bookingsList={directSales} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Package Bookings Tab */}
      <TabsContent value="package">
        <Card>
          <CardHeader>
            <CardTitle>Package Bookings ({packageBookings.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Shows Quote Status & Invoice</p>
          </CardHeader>
          <CardContent>
            <BookingsTableContent bookingsList={packageBookings} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
