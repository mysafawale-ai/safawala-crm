"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Archive,
  RotateCcw,
} from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { BookingBarcodes } from "@/components/bookings/booking-barcodes"
import { DirectSalesBookingDetails } from "@/components/bookings/direct-sales-booking-details"
import { DirectSalesOrderDetails } from "@/components/bookings/direct-sales-order-details"
import type { Booking } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"
import { ItemsDisplayDialog, ItemsSelectionDialog, CompactItemsDisplayDialog } from "@/components/shared"
import type { SelectedItem, Product, PackageSet } from "@/components/shared/types/items"
import { createClient } from "@/lib/supabase/client"
import { formatTime12Hour } from "@/lib/utils"
import { InventoryAvailabilityPopup } from "@/components/bookings/inventory-availability-popup"

import { formatVenueWithCity, getCityForExport, getVenueNameForExport } from "@/lib/city-extractor"
import ManageOffersDialog from "@/components/ManageOffersDialog"
import { apiClient } from "@/lib/api-client"
import { archiveBooking, restoreBooking } from "@/lib/bookings"
import { PackageBookingView } from "@/components/bookings/package-booking-view"
import { BookingsTabs } from "@/components/bookings/bookings-tabs"

export default function BookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [searchTerm, setSearchTerm] = useState("")
  // Applied filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [safaQuantitySort, setSafaQuantitySort] = useState<string>("all")
  const [distanceSort, setDistanceSort] = useState<string>("all")
  // Pending filters (UI staging)
  const [pendingFilters, setPendingFilters] = useState<{status:string; type:string; products:string; safaSort:string; distanceSort:string}>({ status:'all', type:'all', products:'all', safaSort:'all', distanceSort:'all' })
  const applyFilters = () => { 
    setStatusFilter(pendingFilters.status)
    setTypeFilter(pendingFilters.type)
    setProductFilter(pendingFilters.products)
    setSafaQuantitySort(pendingFilters.safaSort)
    setDistanceSort(pendingFilters.distanceSort)
    toast({ title:'Filters applied' })
  }
  const resetFilters = () => { 
    setPendingFilters({status:'all', type:'all', products:'all', safaSort:'all', distanceSort:'all'})
    setStatusFilter('all')
    setTypeFilter('all')
    setProductFilter('all')
    setSafaQuantitySort('all')
    setDistanceSort('all')
  }
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const { data: bookings = [], loading, error, refresh } = useData<Booking[]>("bookings")
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Fetch products and categories for the selection dialog
  const [products, setProducts] = useState<Product[]>([])
  const [packages, setPackages] = useState<PackageSet[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [packagesCategories, setPackagesCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  
  const [bookingItems, setBookingItems] = useState<Record<string, any[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [itemsError, setItemsError] = useState<Record<string, string>>({})
  const [bookingsWithItems, setBookingsWithItems] = useState<Set<string>>(new Set())
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [productDialogBooking, setProductDialogBooking] = useState<Booking | null>(null)
  const [productDialogType, setProductDialogType] = useState<'pending' | 'items'>('items')
  // Barcode data for the currently viewed booking
  const [barcodeAssignmentsForView, setBarcodeAssignmentsForView] = useState<any[] | null>(null)
  const [barcodeStatsByProduct, setBarcodeStatsByProduct] = useState<Record<string, { returned: number; pending: number }>>({})
  
  // New reusable dialog states
  const [showItemsDisplay, setShowItemsDisplay] = useState(false)
  const [showItemsSelection, setShowItemsSelection] = useState(false)
  const [showCompactDisplay, setShowCompactDisplay] = useState(false)
  const [currentBookingForItems, setCurrentBookingForItems] = useState<Booking | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [showComprehensiveDialog, setShowComprehensiveDialog] = useState(false)

  // Archived bookings state
  const [archivedBookings, setArchivedBookings] = useState<Booking[]>([])
  const [showArchivedSection, setShowArchivedSection] = useState(false)

  // Auto-refresh when returning from booking creation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam) {
      refresh()
      // Clean up the URL by removing the refresh parameter
      router.replace('/bookings')
    }
  }, [searchParams, refresh, router])

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

  // Load inventory data (products, packages, categories)
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        const supabase = createClient()
        
        // Fetch products with franchise isolation
        let productsQuery = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
        
        // Apply franchise filter if user is not super_admin
        if (currentUser?.role !== 'super_admin' && currentUser?.franchise_id) {
          productsQuery = productsQuery.eq('franchise_id', currentUser.franchise_id)
        }
        
        const { data: productsData } = await productsQuery.order('name')
        
        // Fetch product_categories (for products) with franchise isolation
        let categoriesQuery = supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
        
        // Apply franchise filter if user is not super_admin
        if (currentUser?.role !== 'super_admin' && currentUser?.franchise_id) {
          categoriesQuery = categoriesQuery.eq('franchise_id', currentUser.franchise_id)
        }
        
        const { data: categoriesData } = await categoriesQuery.order('name')
        
        // Separate main categories and subcategories
        const mainCategories = categoriesData?.filter(c => !c.parent_id) || []
        const subCategories = categoriesData?.filter(c => c.parent_id) || []
        
        // Fetch package_sets with franchise isolation
        let packagesQuery = supabase
          .from('package_sets')
          .select('*')
          .eq('is_active', true)
        
        // Apply franchise filter if user is not super_admin
        if (currentUser?.role !== 'super_admin' && currentUser?.franchise_id) {
          packagesQuery = packagesQuery.eq('franchise_id', currentUser.franchise_id)
        }
        
        const { data: packagesData } = await packagesQuery.order('display_order')
        
        // Fetch packages_categories (for packages) with franchise isolation
        let packagesCategoriesQuery = supabase
          .from('packages_categories')
          .select('*')
          .eq('is_active', true)
        
        // Apply franchise filter if user is not super_admin
        if (currentUser?.role !== 'super_admin' && currentUser?.franchise_id) {
          packagesCategoriesQuery = packagesCategoriesQuery.eq('franchise_id', currentUser.franchise_id)
        }
        
        const { data: packagesCategoriesData } = await packagesCategoriesQuery.order('display_order')
        
        setProducts(productsData || [])
        setCategories(mainCategories)
        setSubcategories(subCategories)
        setPackages(packagesData || [])
        setPackagesCategories(packagesCategoriesData || [])
        
        console.log('[Bookings] Loaded inventory:', {
          products: productsData?.length || 0,
          categories: mainCategories.length,
          subcategories: subCategories.length,
          packages: packagesData?.length || 0,
          packagesCategories: packagesCategoriesData?.length || 0,
        })
      } catch (err) {
        console.error('[Bookings] Failed to load inventory:', err)
      }
    }
    
    if (currentUser) {
      loadInventoryData()
    }
  }, [currentUser])

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
          let source = booking.source
          const bookingId = booking.id
          const bookingNumber = booking.booking_number
          
          if (!source) {
            console.warn(`[Bookings] Booking ${bookingNumber} has no source field`)
            errors[bookingId] = 'No source specified'
            return
          }
          
          // Normalize source: ensure we send singular form to API
          const normalizedSource = source.endsWith('s') ? source.slice(0, -1) : source
          
          console.log(`[Bookings] Fetching items for ${bookingNumber} (source: ${source}, normalized: ${normalizedSource})...`)
          loading[bookingId] = true
          
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              const url = `/api/bookings-items?id=${bookingId}&source=${normalizedSource}`
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
              
              if (Array.isArray(data.items)) {
                items[bookingId] = data.items
                console.log(`[Bookings] ✓ Loaded ${data.items.length} items for ${bookingNumber} (source: ${normalizedSource})`)
                loading[bookingId] = false
                return
              } else {
                const errorDetail = data.details || data.error || 'Unknown error'
                console.warn(`[Bookings] API returned error for ${bookingNumber}:`, errorDetail, data)
                if (attempt === retries) {
                  errors[bookingId] = `API Error: ${errorDetail}`
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

  // Fetch archived bookings
  useEffect(() => {
    const fetchArchivedBookings = async () => {
      try {
        const res = await fetch('/api/bookings/archived', { cache: 'no-store' })
        if (!res.ok) {
          console.warn('[Bookings] Archived API error:', res.status, await res.text().catch(()=>''))
          return
        }
        const json = await res.json()
        
        // Log debug info
        if (json._debug) {
          console.log('[Bookings] Archived API debug:', json._debug)
        }
        
        // Log warnings if there are any (helps with debugging)
        if (json.warnings && json.warnings.length > 0) {
          console.warn('[Bookings] Archived API warnings:', json.warnings)
        }
        
        let archived = (json.data || []) as any[]

        // Fallback hydration: if no customer object but we have basic fields on row
        archived = archived.map(b => {
          if (!b.customer && (b.customer_name || b.customer_phone)) {
            b.customer = {
              id: b.customer_id,
              name: b.customer_name || null,
              phone: b.customer_phone || null,
              email: b.customer_email || null,
              address: b.customer_address || null,
              city: b.customer_city || null,
              state: b.customer_state || null,
              pincode: b.customer_pincode || null,
            }
          }
          return b
        })

        setArchivedBookings(archived as any)
        console.log(`[Bookings] Loaded ${archived.length} archived bookings (API)`)
      } catch (error) {
        console.error('[Bookings] Error fetching archived bookings:', error)
      }
    }
    
    if (currentUser) {
      fetchArchivedBookings()
    }
  }, [currentUser])

  const { data: statsData } = useData<any>("booking-stats")
  const stats = statsData || {}

  // Calculate smart stats based on business logic
  const smartStats = {
    total: (bookings || []).length,
    // Pending Selection: bookings without items (matching table logic)
    pendingSelection: (bookings || []).filter(b => !(b as any).has_items).length,
    pendingProductRental: (bookings || []).filter(b => !(b as any).has_items && (b as any).source === 'product_orders' && (b as any).type === 'rental').length,
    pendingProductSale: (bookings || []).filter(b => !(b as any).has_items && (b as any).source === 'product_orders' && (b as any).type === 'sale').length,
    pendingPackage: (bookings || []).filter(b => !(b as any).has_items && (b as any).source === 'package_bookings').length,
    // Confirmed with Items Selected: bookings that have items selected (regardless of status)
    confirmed: (bookings || []).filter(b => (b as any).has_items).length,
    confirmedProductRental: (bookings || []).filter(b => (b as any).has_items && (b as any).source === 'product_orders' && (b as any).type === 'rental').length,
    confirmedProductSale: (bookings || []).filter(b => (b as any).has_items && (b as any).source === 'product_orders' && (b as any).type === 'sale').length,
    confirmedPackage: (bookings || []).filter(b => (b as any).has_items && (b as any).source === 'package_bookings').length,
    delivered: (bookings || []).filter(b => {
      // For SALES: Delivered is FINAL
      // For RENTAL: Delivered is intermediate step
      const isSale = (b as any).type === 'sale'
      return b.status === 'delivered' || (isSale && b.status === 'order_complete')
    }).length,
    returned: (bookings || []).filter(b => {
      // For RENTAL: Returned is FINAL
      const isRental = (b as any).type === 'rental' || (b as any).type === 'package'
      return isRental && b.status === 'returned'
    }).length,
    revenue: (bookings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0),
    // Additional insights
    rentalCount: (bookings || []).filter(b => (b as any).type === 'rental' || (b as any).type === 'package').length,
    saleCount: (bookings || []).filter(b => (b as any).type === 'sale').length,
    productCount: (bookings || []).filter(b => (b as any).source === 'product_orders').length,
    packageCount: (bookings || []).filter(b => (b as any).source === 'package_bookings').length,
  }

  // Save selected items to local state (no API call needed)
  const saveSelectedItems = async (bookingId: string, items: SelectedItem[], source: 'product_orders' | 'package_bookings') => {
    try {
      console.log(`[Bookings] 💾 Saving ${items.length} items for booking ${bookingId}`)
      console.log(`[Bookings] Items to save:`, items.map((i: any) => ({
        product: i.product?.name || i.package?.name,
        qty: i.quantity,
        price: i.total_price
      })))
      
      const payload = {
        bookingId,
        items: items.map((item: any) => {
          const baseItem = {
            product_id: item.product_id || null,
            package_id: item.package_id || null,
            variant_id: item.variant_id || null,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
          }
          
          // Add security_deposit only for product_orders
          if (source === 'product_orders') {
            return {
              ...baseItem,
              security_deposit: item.security_deposit || 0,
            }
          }
          
          return baseItem
        }),
        source,
      }
      
      console.log(`[Bookings] API Payload:`, JSON.stringify(payload, null, 2))
      
      const response = await fetch('/api/bookings-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      console.log(`[Bookings] API Response:`, result)
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update items')
      }
      
      console.log(`[Bookings] ✓ Saved to DB successfully`)
      
      // Update local cache with full item data
      setBookingItems(prev => ({
        ...prev,
        [bookingId]: items.map((item: any) => ({
          ...item,
          id: item.id || `item-${Date.now()}-${Math.random()}`,
        }))
      }))
      
      setBookingsWithItems(prev => new Set([...prev, bookingId]))
      
      // Refresh bookings list to get updated data
      console.log(`[Bookings] Refreshing bookings list...`)
      await refresh()
      
      toast({
        title: 'Products updated successfully',
        description: `${items.length} product${items.length !== 1 ? 's' : ''} added to booking`,
      })
      
      return true
    } catch (error: any) {
      console.error('[Bookings] ✗ Save failed:', error)
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }
  }

  const getStatusBadge = (status: string, booking?: any) => {
    // Check if payment is incomplete (advance/partial payment)
    const totalAmount = booking?.total_amount || 0
    const paidAmount = booking?.paid_amount || 0
    const hasPartialPayment = paidAmount > 0 && paidAmount < totalAmount
    const pendingAmount = totalAmount - paidAmount
    const isFullyPaid = paidAmount >= totalAmount
    const isUnpaid = paidAmount === 0
    const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
    
    // Override status to "Payment Pending" if payment is incomplete
    let displayStatus = status
    if (status === 'confirmed' && hasPartialPayment) {
      displayStatus = 'pending_payment'
    }
    
    const statusConfig = {
      pending_payment: { label: "Payment Pending", variant: "warning" as const },
      pending_selection: { label: "Pending Selection", variant: "info" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      delivered: { label: "Delivered", variant: "success" as const },
      returned: { label: "Returned", variant: "secondary" as const },
      order_complete: { label: "Order Complete", variant: "success" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }
    const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.confirmed
    
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={config.variant}>{config.label}</Badge>
        
        {/* Enhanced Payment Status Display */}
        {displayStatus === 'pending_payment' && (
          <div className="text-xs space-y-1">
            {/* Amount Taken */}
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">✓ Paid:</span>
              <span className="text-green-700 font-bold">₹{paidAmount.toLocaleString()}</span>
              {paymentPercentage > 0 && (
                <span className="text-green-600">({Math.round(paymentPercentage)}%)</span>
              )}
            </div>
            
            {/* Amount Remaining */}
            <div className="flex items-center gap-1">
              <span className="text-amber-600 font-medium">⏳ Pending:</span>
              <span className="text-amber-700 font-bold">₹{pendingAmount.toLocaleString()}</span>
              {paymentPercentage < 100 && (
                <span className="text-amber-600">({100 - Math.round(paymentPercentage)}%)</span>
              )}
            </div>
            
            {/* Total for Reference */}
            <div className="flex items-center gap-1 border-t border-gray-200 pt-1">
              <span className="text-blue-600 font-medium">💰 Total:</span>
              <span className="text-blue-700 font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        {/* For fully paid bookings */}
        {isFullyPaid && paidAmount > 0 && (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">✅ Fully Paid:</span>
              <span className="text-green-700 font-bold">₹{paidAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        {/* For unpaid bookings */}
        {isUnpaid && totalAmount > 0 && (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-medium">❌ Unpaid:</span>
              <span className="text-red-700 font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Helper function to calculate ACTUAL payment status (based on real paid_amount)
  const getPaymentBreakdown = (booking: any) => {
    const totalAmount = booking?.total_amount || 0
    const paidAmount = booking?.paid_amount || 0
    const paymentType = booking?.payment_type || 'full'
    const customAmount = booking?.custom_amount || 0
    const securityDeposit = booking?.security_deposit || 0
    const pendingAmount = Math.max(0, totalAmount - paidAmount)

    // Determine ACTUAL payment status based on what was really paid
    const isFullyPaid = paidAmount >= totalAmount
    const isUnpaid = paidAmount === 0
    const isPartiallyPaid = paidAmount > 0 && paidAmount < totalAmount
    const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentType,
      customAmount,
      securityDeposit,
      isFullyPaid,
      isUnpaid,
      isPartiallyPaid,
      paymentPercentage,
      
      // Display breakdown based on ACTUAL paid amount, not theoretical payment type
      breakdown:
        isFullyPaid
          ? {
              label: '✅ Full Payment - Received',
              description: 'Complete amount received',
              paidNow: totalAmount,
              pendingNow: 0,
              icon: '💰',
              status: 'paid',
            }
          : isUnpaid
          ? {
              label: '❌ No Payment - Due',
              description: 'Full amount still pending',
              paidNow: 0,
              pendingNow: totalAmount,
              icon: '⏳',
              status: 'unpaid',
            }
          : paymentType === 'advance' && isPartiallyPaid
          ? {
              label: `⏳ Advance Payment - ${Math.round(paymentPercentage)}% Received`,
              description: `Half paid as advance (${Math.round(paymentPercentage)}% of total)`,
              paidNow: paidAmount,
              pendingNow: pendingAmount,
              icon: '💵',
              status: 'partial',
            }
          : paymentType === 'partial' && isPartiallyPaid
          ? {
              label: `⏳ Partial Payment - ${Math.round(paymentPercentage)}% Received`,
              description: `₹${paidAmount.toLocaleString()} received, ₹${pendingAmount.toLocaleString()} pending`,
              paidNow: paidAmount,
              pendingNow: pendingAmount,
              icon: '💳',
              status: 'partial',
            }
          : {
              label: `⏳ Partial Payment - ${Math.round(paymentPercentage)}% Received`,
              description: `₹${paidAmount.toLocaleString()} received out of ₹${totalAmount.toLocaleString()}`,
              paidNow: paidAmount,
              pendingNow: pendingAmount,
              icon: '💳',
              status: 'partial',
            },
    }
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

  // Helper: Extract safa count from booking items
  const getSafaQuantity = (booking: Booking): number => {
    const items = bookingItems[booking.id] || []
    return items.reduce((sum, item) => {
      const isSafa = item.category?.toUpperCase().includes('SAFA')
      return sum + (isSafa ? item.quantity || 0 : 0)
    }, 0)
  }

  // Helper: Calculate distance from pincode (using basic logic)
  const getDistanceFromPincode = (pincode: string): number => {
    // Simple hash-based distance calculation (in real app, use actual coordinates)
    if (!pincode) return 0
    let distance = 0
    for (let i = 0; i < pincode.length; i++) {
      distance += pincode.charCodeAt(i)
    }
    return distance % 100 // Returns 0-99 as proxy distance
  }

  // Sort bookings based on selected filters
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    // Primary sort: Safa Quantity if selected
    if (safaQuantitySort !== 'all') {
      const aSafa = getSafaQuantity(a)
      const bSafa = getSafaQuantity(b)
      if (safaQuantitySort === 'low-to-high') {
        if (aSafa !== bSafa) return aSafa - bSafa
      } else if (safaQuantitySort === 'high-to-low') {
        if (aSafa !== bSafa) return bSafa - aSafa
      }
    }
    
    // Secondary sort: Distance from pincode if selected
    if (distanceSort !== 'all') {
      const aPincode = (a as any).customer_pincode || (a as any).pincode || ''
      const bPincode = (b as any).customer_pincode || (b as any).pincode || ''
      const aDistance = getDistanceFromPincode(aPincode)
      const bDistance = getDistanceFromPincode(bPincode)
      if (distanceSort === 'low-to-high') {
        if (aDistance !== bDistance) return aDistance - bDistance
      } else if (distanceSort === 'high-to-low') {
        if (aDistance !== bDistance) return bDistance - aDistance
      }
    }
    
    // Default: sort by created_at (newest first)
    const aDate = new Date(a.created_at).getTime()
    const bDate = new Date(b.created_at).getTime()
    return bDate - aDate
  })

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
    // Route to the unified create-invoice page with edit parameter
    router.push(`/create-invoice?mode=edit&id=${bookingId}`)
  }

  // Helper function to load items for a booking into the compact display
  // Use already-fetched items from bookingItems state instead of re-fetching
  const handleOpenCompactDisplay = (booking: Booking) => {
    try {
      console.log('[Bookings] Opening compact display for booking:', booking.id)
      
      // Use the items that were already fetched during initial load
      const items = bookingItems[booking.id] || []
      console.log('[Bookings] Using cached items from bookingItems state:', items.length, 'items')
      
      // Transform items to SelectedItem format if needed
      const selectedItemsFormatted = items.map((item: any) => ({
        id: item.id || item.product_id || item.package_id || `item-${Math.random()}`,
        product_id: item.product_id,
        package_id: item.package_id,
        product: item.product,
        package: item.package,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        extra_safas: item.extra_safas || 0,
        variant_inclusions: item.variant_inclusions || [],
      }))
      
      // Update state with cached data
      setCurrentBookingForItems(booking)
      setSelectedItems(selectedItemsFormatted)
      setShowCompactDisplay(true)
      
    } catch (err) {
      console.error('[Bookings] Error opening compact display:', err)
      toast({
        title: 'Error loading items',
        description: 'Failed to load booking items',
        variant: 'destructive',
      })
    }
  }

  const handleArchiveBooking = async (bookingId: string, source?: string) => {
    showConfirmation({
      title: "Archive Booking",
      description: "This booking will be moved to the archived section. You can restore it anytime.",
      confirmText: "Archive",
      variant: "default",
      onConfirm: async () => {
        console.log('[Archive] Starting archive for:', bookingId, 'source:', source)
        
        try {
          // Map source to correct API type
          const type = source === 'package_bookings' ? 'package_booking' 
            : source === 'direct_sales_orders' || source === 'direct_sales' ? 'direct_sales'
            : source === 'bookings' ? 'unified'
            : source === 'product_orders' ? 'product_order'
            : 'unified'  // Default to unified for unknown sources
          
          console.log('[Archive] Sending request with type:', type)
          
          const response = await fetch('/api/bookings/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: bookingId, type })
          })
          
          const result = await response.json()
          console.log('[Archive] Response:', response.status, result)
          
          if (!response.ok || !result.success) {
            // Check if it's a database migration issue
            if (result.details?.includes('is_archived') || result.message?.includes('migration')) {
              throw new Error('Archive feature needs database update. Please run ADD_ARCHIVE_TO_ALL_TABLES.sql')
            }
            throw new Error(result.error || result.message || 'Failed to archive')
          }
          
          toast({ title: 'Archived', description: 'Booking archived successfully' })
          
          // Refresh both active and archived lists
          await refresh()
          
          // Also refresh archived bookings
          const archivedRes = await fetch('/api/bookings/archived', { cache: 'no-store' })
          if (archivedRes.ok) {
            const archivedJson = await archivedRes.json()
            setArchivedBookings(archivedJson.data || [])
            console.log('[Archive] Refreshed archived list, count:', archivedJson.data?.length || 0)
          }
          
        } catch (error: any) {
          console.error('[Archive] Error:', error)
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
      }
    })
  }

  const handleRestoreBooking = async (bookingId: string, source?: string) => {
    try {
      // Normalize source to singular form for API
      const normalized = source === 'package_bookings' ? 'package_booking'
        : source === 'product_orders' ? 'product_order'
        : source === 'direct_sales' || source === 'direct_sales_orders' ? 'direct_sales'
        : source === 'bookings' ? 'unified'
        : 'unified'
      const endpoint = `/api/bookings/restore`
      console.log('[Bookings] Restoring', bookingId, 'source:', source, 'normalized:', normalized, 'endpoint:', endpoint)
      
          // Use helper with PATCH→POST fallback
          const response = await restoreBooking(bookingId, normalized as any)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to restore booking')
      }
      
      toast({ title: 'Restored', description: 'Booking restored successfully' })
      
      // Fetch the restored booking data from Supabase to ensure we have complete information
      try {
        const supabase = createClient()
        const tableName = source === 'package_bookings' ? 'package_bookings'
          : source === 'product_orders' ? 'product_orders'
          : source === 'direct_sales_orders' || source === 'direct_sales' ? 'direct_sales_orders'
          : source === 'bookings' ? 'bookings'
          : 'bookings' // fallback to unified bookings table
        
        const { data: restoredBooking, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', bookingId)
          .eq('is_archived', false) // Ensure it's not archived
          .maybeSingle()
        
        if (!error && restoredBooking) {
          console.log('[Bookings] Fetched restored booking data:', restoredBooking)
          // The booking should now appear in the active list after refresh
        } else {
          console.warn('[Bookings] Could not fetch restored booking data:', error)
        }
      } catch (fetchError) {
        console.warn('[Bookings] Error fetching restored booking:', fetchError)
      }
      
      // Refresh both active and archived bookings
      await refresh()
      
      // Remove from archived bookings list
      setArchivedBookings(prev => prev.filter(b => b.id !== bookingId))
    } catch (error: any) {
      console.error('[Bookings] Restore error:', error)
      toast({ title: 'Error', description: error.message || 'Failed to restore booking', variant: 'destructive' })
    }
  }

  const handleDeleteBooking = async (bookingId: string, source?: string) => {
    showConfirmation({
      title: "Delete booking?",
      description: "This will permanently delete the booking and its items. This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          // Normalize source to singular form for API
          const normalized = source === 'package_bookings' ? 'package_booking'
            : source === 'product_orders' ? 'product_order'
            : source === 'direct_sales' || source === 'direct_sales_orders' ? 'direct_sales'
            : source === 'bookings' ? 'unified'
            : 'unified'
          const endpoint = `/api/bookings/${bookingId}${source ? `?type=${normalized}` : ''}`
          console.log('[Bookings] Deleting', bookingId, 'source:', source, 'normalized:', normalized, 'endpoint:', endpoint)
          
          // Use API client with proper authentication
          const response = await apiClient.delete(endpoint)
          
          if (!response.success) {
            throw new Error(response.error || 'Failed to delete booking')
          }
          
          toast({ title: 'Deleted', description: 'Booking deleted successfully' })
          refresh()
        } catch (error: any) {
          console.error('[Bookings] Delete error:', error)
          toast({ title: 'Error', description: error.message || 'Failed to delete booking', variant: 'destructive' })
        }
      }
    })
  }

  // When view dialog opens, fetch barcode assignments for the selected booking
  useEffect(() => {
    const loadBarcodesForView = async () => {
      if (!showViewDialog || !selectedBooking) {
        // Reset state when dialog closes
        setBarcodeAssignmentsForView([])
        setBarcodeStatsByProduct({})
        return
      }
      
      // Skip if no valid ID
      if (!selectedBooking.id) {
        console.warn('[View] No booking ID available')
        setBarcodeAssignmentsForView([])
        setBarcodeStatsByProduct({})
        return
      }

      try {
        const bookingType = (selectedBooking as any).source === 'package_bookings' ? 'package' : 'product'
        const res = await fetch(`/api/bookings/${selectedBooking.id}/barcodes?type=${bookingType}`)
        
        // If 404, just skip - booking might not have barcodes yet
        if (res.status === 404) {
          console.log('[View] No barcode data found for booking', selectedBooking.id)
          setBarcodeAssignmentsForView([])
          setBarcodeStatsByProduct({})
          return
        }
        
        if (!res.ok) {
          console.warn('[View] Failed to fetch barcodes:', res.status, res.statusText)
          setBarcodeAssignmentsForView([])
          setBarcodeStatsByProduct({})
          return
        }
        
        const data = await res.json()
        if (data.success) {
          setBarcodeAssignmentsForView(data.barcodes || [])
          const stats: Record<string, { returned: number; pending: number }> = {}
          ;(data.barcodes || []).forEach((b: any) => {
            const pid = b.product_id || 'unknown'
            if (!stats[pid]) stats[pid] = { returned: 0, pending: 0 }
            if (b.status === 'returned' || b.status === 'completed') stats[pid].returned++
            else stats[pid].pending++
          })
          setBarcodeStatsByProduct(stats)
          console.log('[View] Barcode stats loaded:', Object.keys(stats).length, 'products')
        } else {
          setBarcodeAssignmentsForView([])
          setBarcodeStatsByProduct({})
        }
      } catch (e) {
        // Silently handle errors - barcode data is optional
        console.log('[View] Skipping barcode fetch:', e instanceof Error ? e.message : 'Unknown error')
        setBarcodeAssignmentsForView([])
        setBarcodeStatsByProduct({})
      }
    }

    loadBarcodesForView()
  }, [showViewDialog, selectedBooking])

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
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}`, 14,20)
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
    );
  }

  if (error) {
    const isUnauthorized = typeof error === 'string' && (error.includes("Unauthorized") || error.includes("401"));
    
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center p-8 border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive mt-4">
              Error Loading Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/80 mb-6">"{error}"</p>
            {isUnauthorized ? (
              <Button onClick={() => router.push('/auth/login')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            ) : (
              <Button onClick={refresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
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
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
          <Link href="/create-invoice">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smartStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {smartStats.rentalCount} rental • {smartStats.saleCount} sale
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed (Selection Pending)</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{smartStats.pendingSelection}</div>
                <p className="text-xs text-muted-foreground">
                  Product Rent: {smartStats.pendingProductRental} • Sale: {smartStats.pendingProductSale} • Package: {smartStats.pendingPackage}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready for Delivery</CardTitle>
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{smartStats.confirmed}</div>
                <p className="text-xs text-muted-foreground">
                  Product Rent: {smartStats.confirmedProductRental} • Sale: {smartStats.confirmedProductSale} • Package: {smartStats.confirmedPackage}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{smartStats.delivered}</div>
                <p className="text-xs text-muted-foreground">Sales ✓ • Rentals in use</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returned</CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{smartStats.returned}</div>
                <p className="text-xs text-muted-foreground">Rentals completed ✓</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">₹{smartStats.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All bookings combined</p>
              </CardContent>
            </Card>
          </>
        )}
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
            <Select value={pendingFilters.safaSort} onValueChange={(v)=>setPendingFilters(p=>({...p,safaSort:v}))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Safa Quantity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Safa Quantities</SelectItem>
                <SelectItem value="low-to-high">Safa: Low to High</SelectItem>
                <SelectItem value="high-to-low">Safa: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pendingFilters.distanceSort} onValueChange={(v)=>setPendingFilters(p=>({...p,distanceSort:v}))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Distance (Pincode)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Distances</SelectItem>
                <SelectItem value="low-to-high">Distance: Low to High</SelectItem>
                <SelectItem value="high-to-low">Distance: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm" onClick={applyFilters}>Apply</Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
          </div>
        </div>

        <TabsContent value="table">
          <BookingsTabs 
            bookings={filteredBookings}
            loading={loading}
            paginatedBookings={paginatedBookings}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalPages={totalPages}
            getStatusBadge={getStatusBadge}
            bookingItems={bookingItems}
            bookingsWithItems={bookingsWithItems}
            getPageNumbers={getPageNumbers}
            goToPage={goToPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
            handleOpenCompactDisplay={handleOpenCompactDisplay}
            setProductDialogBooking={setProductDialogBooking}
            setProductDialogType={setProductDialogType}
            setShowProductDialog={setShowProductDialog}
            setCurrentBookingForItems={setCurrentBookingForItems}
            setSelectedItems={setSelectedItems}
            setShowItemsSelection={setShowItemsSelection}
            setSelectedBooking={setSelectedBooking}
            setShowViewDialog={setShowViewDialog}
            handleEditBooking={handleEditBooking}
            handleArchiveBooking={handleArchiveBooking}
            archivedBookings={archivedBookings}
            showArchivedSection={showArchivedSection}
            setShowArchivedSection={setShowArchivedSection}
            handleRestoreBooking={handleRestoreBooking}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <div className="w-full p-6">
            {loading ? (
              <div className="w-full h-96 flex items-center justify-center">
                <PageLoader />
              </div>
            ) : (
              <BookingCalendar franchiseId={currentUser?.role !== 'super_admin' ? currentUser?.franchise_id : undefined} />
            )}
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
                        {getStatusBadge(booking.status, booking)}
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
            <>
              {/* NEW: Direct Sales Order (DSL*) - Using New Dedicated DirectSalesOrderDetails Component */}
              {(selectedBooking as any).source === 'direct_sales' ? (
                <DirectSalesOrderDetails 
                  booking={{
                    ...selectedBooking,
                    bookingItems: bookingItems[selectedBooking.id] || []
                  }}
                />
              ) : /* Direct Sales Order - Using Rental Sales Component */
              ((selectedBooking as any).booking_type === 'sale' || (selectedBooking as any).booking_subtype === 'sale' || (selectedBooking as any).source === 'product_orders' || (selectedBooking.booking_number && (selectedBooking.booking_number as string).startsWith('ORD'))) ? (
                <DirectSalesBookingDetails 
                  booking={{
                    ...selectedBooking,
                    bookingItems: bookingItems[selectedBooking.id] || []
                  }}
                />
              ) : (
                /* Rental/Package Booking - Simplified View */
                <PackageBookingView 
                  booking={selectedBooking}
                  bookingItems={bookingItems[selectedBooking.id] || []}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* OLD CODE - TO BE REMOVED */}
      {false && (
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
                        {(selectedBooking as any).event_time && ` at ${formatTime12Hour((selectedBooking as any).event_time)}`}
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
                      {getStatusBadge(selectedBooking.status, selectedBooking)}
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

              {/* Delivery & Returns */}
              <Card>
                <CardHeader className="bg-indigo-50 dark:bg-indigo-950">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    🚚 Delivery & Returns
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBooking.delivery_date && (
                        <div className="border-l-4 border-blue-500 pl-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg p-3">
                          <p className="text-sm text-muted-foreground font-medium">📦 Delivery Date</p>
                          <p className="font-bold text-xl text-blue-700 dark:text-blue-400">
                            {new Date(selectedBooking.delivery_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {(selectedBooking as any).delivery_time && (
                            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium mt-1">🕒 {formatTime12Hour((selectedBooking as any).delivery_time)}</p>
                          )}
                        </div>
                      )}
                      {(selectedBooking as any).return_date && (
                        <div className="border-l-4 border-orange-500 pl-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-r-lg p-3">
                          <p className="text-sm text-muted-foreground font-medium">↩️ Return Date</p>
                          <p className="font-bold text-xl text-orange-700 dark:text-orange-400">
                            {new Date((selectedBooking as any).return_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {(selectedBooking as any).return_time && (
                            <p className="text-sm text-orange-600 dark:text-orange-300 font-medium mt-1">🕒 {formatTime12Hour((selectedBooking as any).return_time)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {selectedBooking.special_instructions && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-muted-foreground">📝 Special Instructions</p>
                        <p className="font-medium mt-1">{selectedBooking.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Items - New Reusable Dialog (Only for Rentals/Packages) */}
              {selectedBooking && bookingItems[selectedBooking.id] && bookingItems[selectedBooking.id].length > 0 && 
               (((selectedBooking as any).booking_type !== 'sale' && (selectedBooking as any).booking_subtype !== 'sale' && (selectedBooking as any).source !== 'product_orders')) && (
                <Card>
                  <CardHeader className="bg-green-50 dark:bg-green-950">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      🛍️ Booking Items ({bookingItems[selectedBooking.id].length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        View and manage all items in this booking with detailed information.
                      </p>
                      <Button 
                        onClick={() => {
                          setCurrentBookingForItems(selectedBooking)
                          // Convert booking items to SelectedItem format
                          const items: SelectedItem[] = bookingItems[selectedBooking.id].map((item: any) => {
                            if (item.package_name) {
                              // Package item
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
                              // Product item
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
                              } as any
                            }
                          })
                          setSelectedItems(items)
                          setShowItemsDisplay(true)
                        }}
                        className="w-full"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View All Items Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Barcodes (Only for Rentals/Packages) */}
              {((selectedBooking as any).booking_type !== 'sale' && (selectedBooking as any).booking_subtype !== 'sale' && (selectedBooking as any).source !== 'product_orders') && (
                <BookingBarcodes 
                  bookingId={selectedBooking.id} 
                  bookingType={(selectedBooking as any).source === 'package_bookings' ? 'package' : 'product'}
                  franchiseId={currentUser?.franchise_id}
                  userId={currentUser?.id}
                />
              )}

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

      {/* Items Display Dialog - Using Reusable Component */}
      {productDialogBooking && productDialogType === 'items' && !itemsLoading[productDialogBooking.id] && !itemsError[productDialogBooking.id] && bookingItems[productDialogBooking.id] && (
        <ItemsDisplayDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
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
          context={{
            bookingType: (productDialogBooking as any).source === 'package_bookings' ? 'sale' : 'rental',
            eventDate: productDialogBooking.event_date,
            isEditable: true,
            showPricing: true,
          }}
          title={`📦 Booking Items - ${productDialogBooking.booking_number}`}
          description={`${productDialogBooking.customer?.name} • ${new Date(productDialogBooking.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          onQuantityChange={() => {}}
          onRemoveItem={() => {}}
          onEditProducts={() => {
            setShowProductDialog(false)
            setCurrentBookingForItems(productDialogBooking)
            setShowItemsSelection(true)
          }}
          summaryData={{
            subtotal: productDialogBooking.total_amount || 0,
            discount: productDialogBooking.discount_amount || 0,
            gst: productDialogBooking.tax_amount || 0,
            securityDeposit: productDialogBooking.security_deposit || 0,
            total: productDialogBooking.total_amount || 0,
          }}
        />
      )}

      {/* Error State Dialog */}
      {productDialogBooking && productDialogType === 'items' && itemsError[productDialogBooking.id] && (
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Failed to load items</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                <p className="font-medium text-red-700">Error Loading Items</p>
                <p className="text-sm text-red-600 mt-1">{itemsError[productDialogBooking.id]}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Booking: {productDialogBooking.booking_number}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // Close and refresh to retry
                      setShowProductDialog(false)
                      refresh()
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => setShowProductDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Loading State Dialog */}
      {productDialogBooking && productDialogType === 'items' && itemsLoading[productDialogBooking.id] && (
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-md">
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto mb-2 animate-spin text-blue-500" />
              <p className="font-medium">Loading items...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Fetching from database
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationDialog />
      
      {/* Reusable Items Selection Dialog */}
      {currentBookingForItems && (
        <ItemsSelectionDialog
          open={showItemsSelection}
          onOpenChange={async (open) => {
            // When modal closes (open === false), save the selected items
            if (!open && currentBookingForItems) {
              // Determine source based on booking type
              const bookingType = (currentBookingForItems as any).type || 'product'
              const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
              await saveSelectedItems(currentBookingForItems.id, selectedItems, source)
            }
            
            setShowItemsSelection(open)
          }}
          mode={productDialogType === 'pending' ? 'select' : 'edit'}
          type="product"
          items={products}
          categories={categories}
          subcategories={subcategories}
          context={{
            bookingType: (currentBookingForItems as any).type === 'package' ? 'sale' : 'rental',
            eventDate: currentBookingForItems.event_date,
            deliveryDate: currentBookingForItems.delivery_date,
            returnDate: currentBookingForItems.pickup_date,
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
                    package: item as PackageSet,
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
                  const prod = item as Product
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
              // Update quantity for existing item
              setSelectedItems(prev => prev.map(si => {
                const id = 'product_id' in si ? si.product_id : si.package_id
                if (id === itemId) {
                  const unitPrice = 'product' in si ? (si as any).product?.rental_price || 0 : (si as any).package?.base_price || 0
                  return {
                    ...si,
                    quantity: qty,
                    total_price: unitPrice * qty
                  }
                }
                return si
              }))
            },
          }}
          selectedItems={selectedItems}
          title="Select Products for Booking"
          description="Choose products from your inventory to add to this booking"
        />
      )}

      {/* Compact Items Display Dialog */}
      {currentBookingForItems && (
        <CompactItemsDisplayDialog
          open={showCompactDisplay}
          onOpenChange={async (open) => {
            // When closing the dialog, save any changes made to items
            if (!open && currentBookingForItems) {
              console.log('[Bookings] CompactDialog closing - saving items...')
              const bookingType = (currentBookingForItems as any).type || 'product'
              const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
              const saved = await saveSelectedItems(currentBookingForItems.id, selectedItems, source)
              if (saved) {
                console.log('[Bookings] Items saved, dialog will close')
              }
            }
            setShowCompactDisplay(open)
          }}
          items={selectedItems}
          title={`📦 ${(currentBookingForItems as any).booking_number || 'Booking'}`}
          onEditProducts={() => {
            console.log('[Bookings] Add More clicked - current items:', selectedItems.length)
            setShowCompactDisplay(false)
            setShowItemsSelection(true)
          }}
          onRemoveItem={(itemId) => {
            console.log('[Bookings] Removing item from compact dialog:', itemId)
            setSelectedItems(prev => {
              const updated = prev.filter(item => item.id !== itemId)
              console.log('[Bookings] Updated selectedItems after delete:', updated.length, 'items remaining')
              return updated
            })
          }}
          showPricing={true}
        />
      )}
    </div>
  )
}
