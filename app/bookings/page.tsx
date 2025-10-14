"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import {
  CalendarDays,
  DollarSign,
  Package,
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  RefreshCw,
  ArrowLeft,
  Calendar,
  List,
} from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { BookingDetailsDialog } from "@/components/bookings/booking-details-dialog"
import type { Booking } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"

export default function BookingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [searchTerm, setSearchTerm] = useState("")
  // Applied filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  // Pending filters (UI staging)
  const [pendingFilters, setPendingFilters] = useState<{status:string; type:string}>({ status:'all', type:'all' })
  const applyFilters = () => { setStatusFilter(pendingFilters.status); setTypeFilter(pendingFilters.type); toast({ title:'Filters applied' }) }
  const resetFilters = () => { setPendingFilters({status:'all', type:'all'}); setStatusFilter('all'); setTypeFilter('all') }
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sort, setSort] = useState<{field:'date'|'amount'; dir:'asc'|'desc'}>({ field:'date', dir:'desc'})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const { data: bookings = [], loading, error, refresh } = useData<Booking[]>("bookings")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/auth/user')
        if (res.ok) {
          const user = await res.json()
          setCurrentUser(user)
        }
      } catch {}
    })()
  }, [])
  const { data: statsData } = useData<any>("booking-stats")
  const stats = statsData || {}

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: "Pending Payment", variant: "warning" as const },
      pending_selection: { label: "Pending Selection", variant: "info" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      delivered: { label: "Delivered", variant: "success" as const },
      returned: { label: "Returned", variant: "secondary" as const },
      order_complete: { label: "Order Complete", variant: "success" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_payment
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredBookings = (bookings || []).filter((booking) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      booking.booking_number?.toLowerCase().includes(searchLower) ||
      booking.customer?.name?.toLowerCase().includes(searchLower) ||
      booking.customer?.phone?.includes(searchLower) ||
      booking.venue_name?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
  // booking.type: 'rental' | 'sale' for product orders, 'package' for packages
  const matchesType = typeFilter === "all" || (booking as any).type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const sortedBookings = [...filteredBookings].sort((a,b)=>{
    if(sort.field==='date'){
      const ad = new Date(a.event_date).getTime(); const bd = new Date(b.event_date).getTime();
      return sort.dir==='asc'? ad-bd : bd-ad
    } else {
      const aa = a.total_amount||0; const bb = b.total_amount||0
      return sort.dir==='asc'? aa-bb : bb-aa
    }
  })
  const toggleSort = (field:'date'|'amount') => {
    setSort(prev => prev.field===field ? { field, dir: prev.dir==='asc'?'desc':'asc'} : { field, dir:'asc'})
  }

  // Pagination calculations
  const totalItems = sortedBookings.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBookings = sortedBookings.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter])
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) pages.push('...')
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) pages.push('...')
      
      // Always show last page
      pages.push(totalPages)
    }
    return pages
  }

  const calendarData = (bookings || []).reduce(
    (acc, booking) => {
      const date = new Date(booking.event_date).toDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(booking)
      return acc
    },
    {} as Record<string, Booking[]>,
  )

  const handleViewBooking = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`)
  }

  const handleEditBooking = (bookingId: string, source?: string) => {
    const qs = source ? `?type=${source}` : ''
    router.push(`/bookings/${bookingId}/edit${qs}`)
  }

  const handleDeleteBooking = async (bookingId: string, source?: string) => {
    showConfirmation({
      title: "Delete booking?",
      description: "This will permanently delete the booking and its items. This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        const url = `/api/bookings/${bookingId}${source ? `?type=${source}` : ''}`
        const res = await fetch(url, { method: 'DELETE' })
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }))
          throw new Error(error || 'Failed to delete booking')
        }
        toast({ title: 'Deleted', description: 'Booking deleted successfully' })
        refresh()
      }
    })
  }

  const handleStatusUpdate = async (bookingId: string, newStatus: string, source?: string) => {
    try {
      const url = `/api/bookings/${bookingId}${source ? `?type=${source}` : ''}`
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update booking status")
      }

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      })

      // Fire-and-forget audit entry (non-blocking)
      try {
        fetch('/api/audit', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
            entity_type:'booking', entity_id: bookingId, action:'update', changes:{ after:{ status:newStatus } }
          })
        })
      } catch {}

      refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      })
    }
  }

  const exportBookings = async (format: 'csv'|'pdf') => {
    const rows = filteredBookings
    if(rows.length===0){
      toast({ title:'Nothing to export', description:'No bookings match current filters', variant:'destructive'})
      return
    }
    if(format==='csv'){
      const header = ['Booking#','Customer','Phone','Type','Status','Amount','Event Date','Venue']
      const lines = rows.map(b=>[
        b.booking_number,
        (b.customer?.name||'').replace(/,/g,' '),
        b.customer?.phone||'',
        (b as any).type || '',
        b.status,
        b.total_amount||0,
        new Date(b.event_date).toISOString().slice(0,10),
        (b.venue_name||'').replace(/,/g,' ')
      ])
      const csv = [header.join(','), ...lines.map(l=>l.join(','))].join('\n')
      const blob = new Blob([csv],{type:'text/csv'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`bookings-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
      toast({ title:'CSV exported', description:`${rows.length} bookings` })
    } else {
      let companyName='Company'
      try { const res = await fetch('/api/company-settings'); if(res.ok){ const json= await res.json(); companyName=json.company_name||companyName } } catch{}
      const doc = new jsPDF({orientation:'landscape'})
      doc.setFontSize(16); doc.text(`${companyName} - Bookings`, 14,14)
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14,20)
      autoTable(doc, { startY:26, head:[['Booking#','Customer','Type','Status','Amount','Event Date','Venue']], body: rows.map(b=>[
        b.booking_number,
        (b.customer?.name||'').slice(0,25),
        (b as any).type || '',
        b.status,
        (b.total_amount||0).toFixed(2),
        new Date(b.event_date).toISOString().slice(0,10),
        (b.venue_name||'').slice(0,25)
      ]), styles:{fontSize:8}, headStyles:{fillColor:[34,197,94]}, didDrawPage:(d)=>{ const pageCount=(doc as any).internal.getNumberOfPages(); doc.setFontSize(8); doc.text(`Page ${d.pageNumber}/${pageCount}`, d.settings.margin.left, doc.internal.pageSize.height-5) } })
      doc.save(`bookings-${new Date().toISOString().slice(0,10)}.pdf`)
      toast({ title:'PDF exported', description:`${rows.length} bookings` })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Package className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Error Loading Bookings</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={refresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
              <p className="text-muted-foreground">Manage your customer bookings and orders</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton rows={10} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
            <p className="text-muted-foreground">Manage your customer bookings and orders</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={()=>exportBookings('csv')}>CSV</Button>
          <Button variant="outline" size="sm" onClick={()=>exportBookings('pdf')}>PDF</Button>
          <Link href="/create-product-order">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Product Order
            </Button>
          </Link>
          <Link href="/book-package">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Book Package
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.paymentPendingBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmedBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deliveredBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Out for events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{((stats?.totalRevenue as number) || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From completed bookings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "calendar")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={pendingFilters.status} onValueChange={(v)=>setPendingFilters(p=>({...p,status:v}))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="pending_selection">Pending Selection</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="order_complete">Order Complete</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {/* Optional Type filter placeholder if type exists */}
            <Select value={pendingFilters.type} onValueChange={(v)=>setPendingFilters(p=>({...p,type:v}))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="package">Package</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm" onClick={applyFilters}>Apply</Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
          </div>
        </div>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first booking"}
                  </p>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={()=>toggleSort('amount')}>Amount {sort.field==='amount' && (sort.dir==='asc'?'▲':'▼')}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={()=>toggleSort('date')}>Event Date {sort.field==='date' && (sort.dir==='asc'?'▲':'▼')}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBookings.map((booking) => (
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
                            if (b.type === 'package') return <Badge variant="default">Package</Badge>
                            if (b.type === 'sale') return <Badge variant="secondary">Product • Sale</Badge>
                            if (b.type === 'rental') return <Badge>Product • Rental</Badge>
                            return <Badge variant="outline">Unknown</Badge>
                          })()}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>₹{booking.total_amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <BookingDetailsDialog
                              booking={booking}
                              onEdit={(booking) => handleEditBooking(booking.id, (booking as any).source)}
                              onStatusUpdate={(id, status) => handleStatusUpdate(id, status, (booking as any).source)}
                              trigger={<Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1"/>View</Button>}
                            />
                            <Button variant="outline" size="sm" onClick={() => handleEditBooking(booking.id, (booking as any).source)}>
                              <Edit className="h-4 w-4 mr-1"/>Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking.id, (booking as any).source)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page as number)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="w-full p-6">
            <BookingCalendar compact mini franchiseId={currentUser?.role !== 'super_admin' ? currentUser?.franchise_id : undefined} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bookings for {selectedDate && new Date(selectedDate).toLocaleDateString()}</DialogTitle>
          </DialogHeader>
          {selectedDate && calendarData[selectedDate] && (
            <div className="space-y-4">
              {calendarData[selectedDate].map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{booking.booking_number}</h4>
                        <p className="text-sm text-muted-foreground">{booking.customer?.name}</p>
                        <p className="text-sm">{booking.venue_name}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-sm mt-1">₹{booking.total_amount?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmationDialog />
    </div>
  )
}
