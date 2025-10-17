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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  User,
  FileText,
  Clock,
  Shield,
  Share2,
  Download,
  AlertCircle,
} from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import type { Booking } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"
import { AnimatedBackButton } from "@/components/ui/animated-back-button"
import { formatVenueWithCity, getCityForExport, getVenueNameForExport } from "@/lib/city-extractor"
import ManageOffersDialog from "@/components/ManageOffersDialog"

export default function BookingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [searchTerm, setSearchTerm] = useState("")
  // Applied filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  // Pending filters (UI staging)
  const [pendingFilters, setPendingFilters] = useState<{status:string; type:string; products:string}>({ status:'all', type:'all', products:'all' })
  const applyFilters = () => { setStatusFilter(pendingFilters.status); setTypeFilter(pendingFilters.type); setProductFilter(pendingFilters.products); toast({ title:'Filters applied' }) }
  const resetFilters = () => { setPendingFilters({status:'all', type:'all', products:'all'}); setStatusFilter('all'); setTypeFilter('all'); setProductFilter('all') }
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sort, setSort] = useState<{field:'date'|'amount'; dir:'asc'|'desc'}>({ field:'date', dir:'desc'})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const { data: bookings = [], loading, error, refresh } = useData<Booking[]>("bookings")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [bookingItems, setBookingItems] = useState<Record<string, any[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [itemsError, setItemsError] = useState<Record<string, string>>({})
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [productDialogBooking, setProductDialogBooking] = useState<Booking | null>(null)
  const [productDialogType, setProductDialogType] = useState<'pending' | 'items'>('items')

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

  // Fetch booking items for display with comprehensive error handling
  useEffect(() => {
    const fetchBookingItems = async () => {
      if (!bookings || bookings.length === 0) {
        console.log('[Bookings] No bookings to fetch items for')
        return
      }
      
      console.log(`[Bookings] Fetching items for ${bookings.length} bookings...`)
      
      try {
        const items: Record<string, any[]> = {}
        const errors: Record<string, string> = {}
        const loading: Record<string, boolean> = {}
        
        // Fetch items for each booking with retry logic
        const fetchWithRetry = async (booking: any, retries = 2): Promise<void> => {
          const source = booking.source
          const bookingId = booking.id
          const bookingNumber = booking.booking_number
          
          if (!source) {
            console.warn(`[Bookings] Booking ${bookingNumber} has no source field`)
            errors[bookingId] = 'No source specified'
            return
          }
          
          console.log(`[Bookings] Fetching items for ${bookingNumber} (${source})...`)
          loading[bookingId] = true
          
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              const url = `/api/bookings/${bookingId}/items?source=${source}`
              console.log(`[Bookings] Attempt ${attempt + 1}/${retries + 1}: GET ${url}`)
              
              const res = await fetch(url)
              
              if (!res.ok) {
                const errorText = await res.text()
                console.error(`[Bookings] HTTP ${res.status} for ${bookingNumber}:`, errorText)
                
                if (attempt === retries) {
                  errors[bookingId] = `HTTP ${res.status}: ${errorText.substring(0, 100)}`
                  break
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
                continue
              }
              
              const data = await res.json()
              
              if (data.success && Array.isArray(data.items)) {
                items[bookingId] = data.items
                console.log(`[Bookings] ✓ Loaded ${data.items.length} items for ${bookingNumber}`)
                loading[bookingId] = false
                return
              } else {
                console.warn(`[Bookings] Invalid response format for ${bookingNumber}:`, data)
                if (attempt === retries) {
                  errors[bookingId] = 'Invalid response format'
                }
              }
            } catch (error: any) {
              console.error(`[Bookings] Fetch error for ${bookingNumber} (attempt ${attempt + 1}):`, error)
              
              if (attempt === retries) {
                errors[bookingId] = error.message || 'Network error'
              } else {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
              }
            }
          }
          
          loading[bookingId] = false
        }
        
        // Fetch items in parallel with concurrency limit
        const BATCH_SIZE = 10
        for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
          const batch = bookings.slice(i, i + BATCH_SIZE)
          await Promise.all(batch.map(booking => fetchWithRetry(booking)))
        }
        
        setBookingItems(items)
        setItemsLoading(loading)
        setItemsError(errors)
        
        const successCount = Object.keys(items).length
        const errorCount = Object.keys(errors).length
        console.log(`[Bookings] Items fetch complete: ${successCount} success, ${errorCount} errors`)
        
        if (errorCount > 0) {
          console.warn('[Bookings] Failed bookings:', errors)
          toast({
            title: 'Some items failed to load',
            description: `${errorCount} booking(s) had errors loading items`,
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('[Bookings] Fatal error fetching booking items:', error)
        toast({
          title: 'Failed to load booking items',
          description: 'Please refresh the page to try again',
          variant: 'destructive',
        })
      }
    }
    
    fetchBookingItems()
  }, [bookings, toast])
  const { data: statsData } = useData<any>("booking-stats")
  const stats = statsData || {}

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_selection: { label: "Pending Selection", variant: "info" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      delivered: { label: "Delivered", variant: "success" as const },
      returned: { label: "Returned", variant: "secondary" as const },
      order_complete: { label: "Order Complete", variant: "success" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
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
    
    const matchesProducts = productFilter === 'all' || 
      (productFilter === 'selected' && (booking as any).has_items) ||
      (productFilter === 'pending' && !(booking as any).has_items)

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
  // booking.type: 'rental' | 'sale' for product orders, 'package' for packages
  const matchesType = typeFilter === "all" || (booking as any).type === typeFilter

    return matchesSearch && matchesStatus && matchesType && matchesProducts
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
    // Route to the appropriate create page with edit parameter
    if (source === 'package_bookings') {
      router.push(`/book-package?edit=${bookingId}`)
    } else if (source === 'product_orders') {
      router.push(`/create-product-order?edit=${bookingId}`)
    } else {
      // Fallback - try to detect from booking type
      toast({ 
        title: "Cannot edit", 
        description: "Unable to determine booking type. Please try again.",
        variant: "destructive"
      })
    }
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
      const header = ['Booking#','Customer','Phone','Type','Status','Amount','Event Date','Venue Name','City']
      const lines = rows.map(b=>[
        b.booking_number,
        (b.customer?.name||'').replace(/,/g,' '),
        b.customer?.phone||'',
        (b as any).type || '',
        b.status,
        b.total_amount||0,
        new Date(b.event_date).toLocaleDateString(),
        getVenueNameForExport(b.venue_name).replace(/,/g,' '),
        getCityForExport(b.venue_address)
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
        formatVenueWithCity(b.venue_name, b.venue_address).slice(0,30)
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
            <AnimatedBackButton onClick={() => router.push("/dashboard")} />
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
          <AnimatedBackButton onClick={() => router.push("/dashboard")} />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
            <p className="text-muted-foreground">Manage your customer bookings and orders</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ManageOffersDialog />
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
            <Select value={pendingFilters.products} onValueChange={(v)=>setPendingFilters(p=>({...p,products:v}))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Product Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="selected">Products Selected</SelectItem>
                <SelectItem value="pending">Selection Pending</SelectItem>
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
                      <TableHead>Products</TableHead>
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
                        <TableCell>
                          {(() => {
                            const items = bookingItems[booking.id] || []
                            const hasItems = (booking as any).has_items
                            
                            if (!hasItems) {
                              return (
                                <Badge 
                                  variant="outline" 
                                  className="text-orange-600 border-orange-300 cursor-pointer hover:bg-orange-50"
                                  onClick={() => {
                                    setProductDialogBooking(booking)
                                    setProductDialogType('pending')
                                    setShowProductDialog(true)
                                  }}
                                >
                                  Selection Pending
                                </Badge>
                              )
                            }
                            
                            if (items.length === 0) {
                              return (
                                <Badge 
                                  variant="default"
                                  className="cursor-pointer hover:bg-primary/80"
                                  onClick={() => {
                                    setProductDialogBooking(booking)
                                    setProductDialogType('items')
                                    setShowProductDialog(true)
                                  }}
                                >
                                  {(booking as any).total_safas || 0} items
                                </Badge>
                              )
                            }
                            
                            return (
                              <div 
                                className="flex flex-wrap gap-1 max-w-xs cursor-pointer hover:opacity-80"
                                onClick={() => {
                                  setProductDialogBooking(booking)
                                  setProductDialogType('items')
                                  setShowProductDialog(true)
                                }}
                              >
                                {items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                                    {item.product?.image_url && (
                                      <img 
                                        src={item.product.image_url} 
                                        alt={item.product?.name || 'Product'}
                                        className="w-6 h-6 rounded object-cover"
                                      />
                                    )}
                                    <span className="text-xs font-medium">
                                      {item.product?.name || item.variant_name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ×{item.quantity || 0}
                                    </span>
                                  </div>
                                ))}
                                {items.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{items.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start">
                            <span>₹{booking.total_amount?.toLocaleString() || 0}</span>
                            {typeof (booking as any).security_deposit === 'number' && (booking as any).security_deposit > 0 && (
                              <span className="text-xs text-muted-foreground">Payable Now: ₹{(((booking as any).total_amount || 0) + ((booking as any).security_deposit || 0)).toLocaleString()}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {booking.status === 'pending_selection' && (
                              <Button variant="secondary" size="sm" onClick={() => router.push(`/bookings/${booking.id}/select-products`)}>
                                Select Products
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedBooking(booking)
                              setShowViewDialog(true)
                            }}>
                              <Eye className="h-4 w-4 mr-1"/>View
                            </Button>
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

      {/* Full-Featured Booking View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📋 Booking Details</DialogTitle>
            <DialogDescription>Complete booking information and timeline</DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Customer Information */}
              <Card>
                <CardHeader className="bg-blue-50 dark:bg-blue-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    👤 Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedBooking.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedBooking.customer?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{(selectedBooking.customer as any)?.whatsapp_number || selectedBooking.customer?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedBooking.customer?.email || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[
                          selectedBooking.customer?.address,
                          selectedBooking.customer?.city,
                          selectedBooking.customer?.state,
                          selectedBooking.customer?.pincode
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Information */}
              <Card>
                <CardHeader className="bg-purple-50 dark:bg-purple-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    🎉 Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium capitalize">{selectedBooking.event_type?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Participant</p>
                      <p className="font-medium capitalize">{selectedBooking.event_for || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Event Date & Time</p>
                      <p className="font-medium">
                        {selectedBooking.event_date ? new Date(selectedBooking.event_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                        {(selectedBooking as any).event_time && ` at ${(selectedBooking as any).event_time}`}
                      </p>
                    </div>
                    {selectedBooking.groom_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">🤵 Groom</p>
                        <p className="font-medium">{selectedBooking.groom_name}</p>
                        {selectedBooking.groom_additional_whatsapp && (
                          <p className="text-xs text-muted-foreground">📱 {selectedBooking.groom_additional_whatsapp}</p>
                        )}
                        {selectedBooking.groom_home_address && (
                          <p className="text-xs text-muted-foreground">📍 {selectedBooking.groom_home_address}</p>
                        )}
                      </div>
                    )}
                    {selectedBooking.bride_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">👰 Bride</p>
                        <p className="font-medium">{selectedBooking.bride_name}</p>
                        {selectedBooking.bride_additional_whatsapp && (
                          <p className="text-xs text-muted-foreground">📱 {selectedBooking.bride_additional_whatsapp}</p>
                        )}
                        {(selectedBooking as any).bride_address && (
                          <p className="text-xs text-muted-foreground">📍 {(selectedBooking as any).bride_address}</p>
                        )}
                      </div>
                    )}
                    {((selectedBooking as any).venue_name || selectedBooking.venue_address) && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">📍 Venue</p>
                        {(selectedBooking as any).venue_name && (
                          <p className="font-medium">{(selectedBooking as any).venue_name}</p>
                        )}
                        {selectedBooking.venue_address && (
                          <p className="text-sm text-muted-foreground">{selectedBooking.venue_address}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Information */}
              <Card>
                <CardHeader className="bg-orange-50 dark:bg-orange-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    📝 Booking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Number</p>
                      <p className="font-medium">{selectedBooking.booking_number || (selectedBooking as any).order_number || (selectedBooking as any).package_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant={(selectedBooking as any).source === 'package_booking' ? 'default' : 'secondary'}>
                        {(selectedBooking as any).source === 'package_booking' ? '📦 Package' : '🛍️ Product Order'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created Date</p>
                      <p className="font-medium">
                        {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    {(selectedBooking as any).payment_type && (
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Type</p>
                        <Badge variant="outline" className="mt-1">
                          {(selectedBooking as any).payment_type === 'full' ? '💰 Full Payment' : 
                           (selectedBooking as any).payment_type === 'advance' ? '💵 Advance Payment' : 
                           (selectedBooking as any).payment_type === 'partial' ? '💳 Partial Payment' : 
                           (selectedBooking as any).payment_type}
                        </Badge>
                      </div>
                    )}
                    {selectedBooking.paid_amount !== undefined && selectedBooking.paid_amount > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="font-medium text-green-600">₹{selectedBooking.paid_amount.toLocaleString()}</p>
                      </div>
                    )}
                    {((selectedBooking.total_amount || 0) - (selectedBooking.paid_amount || 0)) > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Amount</p>
                        <p className="font-medium text-orange-600">₹{((selectedBooking.total_amount || 0) - (selectedBooking.paid_amount || 0)).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader className="bg-indigo-50 dark:bg-indigo-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    🚚 Delivery & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedBooking.delivery_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">📦 Delivery Date</p>
                        <p className="font-medium">
                          {new Date(selectedBooking.delivery_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {(selectedBooking as any).delivery_time && ` at ${(selectedBooking as any).delivery_time}`}
                        </p>
                      </div>
                    )}
                    {(selectedBooking as any).return_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">↩️ Return Date</p>
                        <p className="font-medium">
                          {new Date((selectedBooking as any).return_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {(selectedBooking as any).return_time && ` at ${(selectedBooking as any).return_time}`}
                        </p>
                      </div>
                    )}
                    {selectedBooking.special_instructions && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">📝 Special Instructions</p>
                        <p className="font-medium">{selectedBooking.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Items */}
              {selectedBooking && bookingItems[selectedBooking.id] && bookingItems[selectedBooking.id].length > 0 && (
                <Card>
                  <CardHeader className="bg-green-50 dark:bg-green-950">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      🛍️ Booking Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {bookingItems[selectedBooking.id].map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          {/* Category Badge */}
                          {item.category_name && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs font-semibold">
                                {item.category_name}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Package/Product Name */}
                          <div>
                            <h4 className="font-bold text-lg">{item.package_name || item.product_name || 'Item'}</h4>
                            {item.package_description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.package_description}</p>
                            )}
                          </div>

                          {/* Variant Information */}
                          {item.variant_name && (
                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  Variant: {item.variant_name}
                                </span>
                                {item.extra_safas > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.extra_safas} Extra Safas
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Variant Inclusions */}
                              {item.variant_inclusions && item.variant_inclusions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Inclusions:</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {item.variant_inclusions.map((inc: any, i: number) => (
                                      <div key={i} className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <span className="mr-1">•</span>
                                        <span>{inc.product_name} × {inc.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Price Details */}
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span>Quantity: {item.quantity || 1}</span>
                              {item.unit_price && (
                                <span className="ml-3">Unit Price: ₹{item.unit_price.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Line Total</div>
                              <div className="font-bold text-lg">₹{(item.price || item.total_price || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Financial Summary */}
              <Card>
                <CardHeader className="bg-amber-50 dark:bg-amber-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    💰 Financial Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Base Amount */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{(selectedBooking.total_amount || 0).toLocaleString()}</span>
                    </div>

                    {/* Distance Charges */}
                    {(selectedBooking as any).distance_amount && (selectedBooking as any).distance_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">🚗 Distance Charges</span>
                        <span className="font-medium text-blue-600">+₹{(selectedBooking as any).distance_amount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Discounts */}
                    {selectedBooking.discount_amount && selectedBooking.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">💸 Discount</span>
                        <span className="font-medium text-green-600">-₹{selectedBooking.discount_amount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Coupon Discount */}
                    {selectedBooking.coupon_discount && selectedBooking.coupon_discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">🎟️ Coupon ({selectedBooking.coupon_code})</span>
                        <span className="font-medium text-green-600">-₹{selectedBooking.coupon_discount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* After Discounts Line */}
                    {((selectedBooking.discount_amount && selectedBooking.discount_amount > 0) || 
                      (selectedBooking.coupon_discount && selectedBooking.coupon_discount > 0)) && (
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span>After Discounts</span>
                        <span>₹{(
                          (selectedBooking.total_amount || 0) + 
                          ((selectedBooking as any).distance_amount || 0) - 
                          (selectedBooking.discount_amount || 0) - 
                          (selectedBooking.coupon_discount || 0)
                        ).toLocaleString()}</span>
                      </div>
                    )}

                    {/* GST */}
                    {selectedBooking.tax_amount && selectedBooking.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">📊 GST ({(selectedBooking as any).gst_percentage || 18}%)</span>
                        <span className="font-medium">+₹{selectedBooking.tax_amount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="border-t pt-2 mt-2" />

                    {/* Grand Total */}
                    <div className="flex justify-between font-bold text-lg bg-green-50 dark:bg-green-950 p-3 rounded">
                      <span>Grand Total</span>
                      <span className="text-green-700 dark:text-green-400">₹{(selectedBooking.total_amount || 0).toLocaleString()}</span>
                    </div>

                    {/* Total with Security Deposit */}
                    {selectedBooking.security_deposit && selectedBooking.security_deposit > 0 && (
                      <div className="flex justify-between font-bold text-base bg-purple-50 dark:bg-purple-950 p-3 rounded border-2 border-purple-200 dark:border-purple-800">
                        <span>💎 Total with Security Deposit</span>
                        <span className="text-purple-700 dark:text-purple-400">
                          ₹{((selectedBooking.total_amount || 0) + selectedBooking.security_deposit).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Payment Method */}
                    {(selectedBooking as any).payment_method && (
                      <div className="flex justify-between text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <span className="font-medium">💳 Payment Method:</span>
                        <span className="font-medium text-blue-700 dark:text-blue-400">{(selectedBooking as any).payment_method}</span>
                      </div>
                    )}

                    <div className="border-t pt-3 mt-3 space-y-2">
                      {/* Security Deposit */}
                      {selectedBooking.security_deposit && selectedBooking.security_deposit > 0 && (
                        <div className="flex justify-between text-sm bg-purple-50 dark:bg-purple-950 p-2 rounded">
                          <span className="font-medium">🔒 Security Deposit</span>
                          <span className="font-bold text-purple-600">₹{selectedBooking.security_deposit.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Amount Paid */}
                      <div className="flex justify-between text-sm bg-green-50 dark:bg-green-950 p-2 rounded">
                        <span className="font-medium">✅ Amount Paid</span>
                        <span className="font-bold text-green-600">₹{(selectedBooking.paid_amount || 0).toLocaleString()}</span>
                      </div>

                      {/* Pending Amount */}
                      <div className="flex justify-between text-sm bg-orange-50 dark:bg-orange-950 p-2 rounded">
                        <span className="font-medium">⏳ Pending Amount</span>
                        <span className="font-bold text-orange-600">
                          ₹{((selectedBooking.total_amount || 0) - (selectedBooking.paid_amount || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedBooking.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📝 Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedBooking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement PDF download
                    console.log('Download PDF for booking:', selectedBooking.id)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const bookingNumber = selectedBooking.booking_number || (selectedBooking as any).order_number || (selectedBooking as any).package_number
                    navigator.clipboard.writeText(bookingNumber || '')
                    // TODO: Add toast notification
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {productDialogType === 'pending' ? '⏳ Selection Pending' : '📦 Booking Items'}
            </DialogTitle>
            <DialogDescription>
              {productDialogType === 'pending' 
                ? 'Customer needs to select products for this booking' 
                : 'Complete list of items in this booking'}
            </DialogDescription>
          </DialogHeader>
          
          {productDialogBooking && (
            <div className="space-y-4">
              {/* Booking Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Booking #</p>
                      <p className="font-medium">{productDialogBooking.booking_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{productDialogBooking.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event Date</p>
                      <p className="font-medium">
                        {new Date(productDialogBooking.event_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-medium">₹{productDialogBooking.total_amount?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              {productDialogType === 'pending' ? (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Product Selection Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      The customer hasn't selected specific products yet. This booking is waiting for product selection.
                    </p>
                    
                    {(productDialogBooking as any).total_safas > 0 && (
                      <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm font-medium mb-2">Booking Capacity</p>
                        <Badge variant="default" className="text-base px-3 py-1">
                          {(productDialogBooking as any).total_safas} Safas
                        </Badge>
                      </div>
                    )}
                    
                    <div className="pt-3 space-y-2">
                      <p className="text-sm font-medium">Next Steps:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Customer will select products from available inventory</li>
                        <li>Once selected, items will appear in this booking</li>
                        <li>You'll be able to track delivery and returns</li>
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => {
                        setShowProductDialog(false)
                        router.push(`/bookings/${productDialogBooking.id}/select-products`)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Help Customer Select Products
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Items List ({bookingItems[productDialogBooking.id]?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const bookingId = productDialogBooking.id
                      const items = bookingItems[bookingId] || []
                      const isLoading = itemsLoading[bookingId]
                      const error = itemsError[bookingId]
                      
                      // Show loading state
                      if (isLoading) {
                        return (
                          <div className="text-center py-8">
                            <RefreshCw className="h-12 w-12 mx-auto mb-2 animate-spin text-blue-500" />
                            <p className="font-medium">Loading items...</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Fetching from database
                            </p>
                          </div>
                        )
                      }
                      
                      // Show error state
                      if (error) {
                        return (
                          <div className="text-center py-8">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                              <p className="font-medium text-red-700">Failed to load items</p>
                              <p className="text-sm text-red-600 mt-1">{error}</p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Total Safas: {(productDialogBooking as any).total_safas || 0}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                  // Force refresh
                                  window.location.reload()
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Page
                              </Button>
                            </div>
                          </div>
                        )
                      }
                      
                      // Show empty state
                      if (items.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No items loaded yet</p>
                            <p className="text-sm mt-1">
                              Total Safas: {(productDialogBooking as any).total_safas || 0}
                            </p>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-3">
                          {items.map((item: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {item.product?.image_url ? (
                                <img 
                                  src={item.product.image_url} 
                                  alt={item.product?.name || 'Product'}
                                  className="w-16 h-16 rounded-lg object-cover border"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {item.product?.name || item.package_name || item.variant_name || 'Unknown Item'}
                                </h4>
                                {item.variant_name && item.variant_name !== item.product?.name && (
                                  <p className="text-xs text-muted-foreground">
                                    Variant: {item.variant_name}
                                  </p>
                                )}
                                {item.category_name && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {item.category_name}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <p className="font-medium">×{item.quantity || 1}</p>
                                {item.price && (
                                  <p className="text-sm text-muted-foreground">
                                    ₹{item.price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Total Summary */}
                          <div className="border-t pt-3 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Items</span>
                              <span className="font-bold text-lg">
                                {items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)} pieces
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  )
}
