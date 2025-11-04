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
} from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from "@/hooks/use-data"
import { useToast } from "@/hooks/use-toast"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { BookingBarcodes } from "@/components/bookings/booking-barcodes"
import type { Booking } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"
import { ItemsDisplayDialog, ItemsSelectionDialog, CompactItemsDisplayDialog } from "@/components/shared"
import type { SelectedItem, Product, PackageSet } from "@/components/shared/types/items"
import { createClient } from "@/lib/supabase/client"
import { InventoryAvailabilityPopup } from "@/components/bookings/inventory-availability-popup"

import { formatVenueWithCity, getCityForExport, getVenueNameForExport } from "@/lib/city-extractor"
import ManageOffersDialog from "@/components/ManageOffersDialog"

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
  // Pending filters (UI staging)
  const [pendingFilters, setPendingFilters] = useState<{status:string; type:string; products:string}>({ status:'all', type:'all', products:'all' })
  const applyFilters = () => { setStatusFilter(pendingFilters.status); setTypeFilter(pendingFilters.type); setProductFilter(pendingFilters.products); toast({ title:'Filters applied' }) }
  const resetFilters = () => { setPendingFilters({status:'all', type:'all', products:'all'}); setStatusFilter('all'); setTypeFilter('all'); setProductFilter('all') }
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

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
              const url = `/api/bookings/${bookingId}/items?source=${normalizedSource}`
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
                console.log(`[Bookings] ✓ Loaded ${data.items.length} items for ${bookingNumber} (source: ${normalizedSource}, took ${data.duration_ms}ms)`)
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

  // Save selected items to database
  const saveSelectedItems = async (bookingId: string, items: SelectedItem[], source: 'product_orders' | 'package_bookings') => {
    try {
      console.log(`[Bookings] Saving ${items.length} items for booking ${bookingId}`)
      console.log('[Bookings] Items to save:', JSON.stringify(items, null, 2))
      
      // Transform items to ensure they have the correct structure
      const itemsToSave = items.map((item: any, idx: number) => {
        console.log(`[Bookings] Item ${idx}:`, { 
          has_product_id: !!item.product_id, 
          product_id: item.product_id,
          has_package_id: !!item.package_id,
          package_id: item.package_id,
          item_keys: Object.keys(item)
        })
        
        if (source === 'product_orders') {
          // For product orders
          return {
            product_id: item.product_id,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: (item.unit_price || 0) * (item.quantity || 1),
          }
        } else {
          // For package bookings - now supporting individual products
          // Check if this is a product item or package item
          if (item.product_id) {
            // Individual product in package booking
            console.log(`[Bookings] Item ${idx} is PRODUCT:`, item.product_id)
            return {
              product_id: item.product_id,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: (item.unit_price || 0) * (item.quantity || 1),
            }
          } else {
            // Package item (legacy - if ever used)
            console.log(`[Bookings] Item ${idx} is PACKAGE:`, item.package_id)
            return {
              package_id: item.package_id,
              variant_id: item.variant_id,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: (item.unit_price || 0) * (item.quantity || 1),
              extra_safas: item.extra_safas || 0,
            }
          }
        }
      })
      
      console.log('[Bookings] Transformed items to save:', JSON.stringify(itemsToSave, null, 2))
      
      const response = await fetch(`/api/bookings/${bookingId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToSave,
          source,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[Bookings] Error saving items:', error)
        throw new Error(error.error || 'Failed to save items')
      }

      const result = await response.json()
      console.log('[Bookings] Items saved successfully:', result)
      
      // Immediately mark this booking as having items (UI update)
      setBookingsWithItems(prev => new Set([...prev, bookingId]))
      console.log('[Bookings] Marked booking as having items:', bookingId)
      
      // Adjust inventory - reserve items for this booking
      if (source === 'product_orders' && itemsToSave.length > 0) {
        const inventoryItems = itemsToSave
          .filter((item: any) => item.product_id)
          .map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity || 0
          }))

        if (inventoryItems.length > 0) {
          console.log('[Bookings] Reserving inventory for products:', inventoryItems)
          
          const inventoryResponse = await fetch('/api/inventory/reserve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: 'reserve',
              items: inventoryItems,
              bookingId
            })
          })

          if (!inventoryResponse.ok) {
            const invError = await inventoryResponse.json()
            console.warn('[Bookings] Inventory reservation failed:', invError)
            // Don't fail the entire operation if inventory fails, but warn user
            toast({
              title: 'Items saved but inventory warning',
              description: invError.error || 'Could not reserve inventory. Please check stock levels.',
              variant: 'destructive',
            })
          } else {
            const invResult = await inventoryResponse.json()
            console.log('[Bookings] Inventory reserved successfully:', invResult)
          }
        }
      }
      
      // Refresh booking items to show the saved data
      const itemsResponse = await fetch(`/api/bookings/${bookingId}/items?source=${source}`)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        console.log('[Bookings] Fetched updated items from DB:', itemsData)
        setBookingItems(prev => ({
          ...prev,
          [bookingId]: itemsData.items || []
        }))
        
        // Also update selectedItems for the display dialog
        const transformedItems = itemsData.items.map((item: any) => ({
          id: item.id || `item-${Math.random()}`,
          product_id: item.product_id || item.package_id,
          package_id: item.package_id,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          product: item.product,
          package: item.package,
          variant_name: item.variant_name,
        }))
        setSelectedItems(transformedItems)
        console.log('[Bookings] Updated selectedItems state:', transformedItems)
      }

      // Refresh the bookings list to update has_items flag
      refresh()

      toast({
        title: 'Items saved successfully!',
        description: `${itemsToSave.length} item(s) saved and inventory reserved`,
      })

      return true
    } catch (error: any) {
      console.error('[Bookings] Error saving items:', error)
      toast({
        title: 'Error saving items',
        description: error.message || 'Failed to save items',
        variant: 'destructive',
      })
      return false
    }
  }

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

  // Always sort by created_at (newest first)
  const sortedBookings = [...filteredBookings].sort((a,b)=>{
    const aDate = new Date(a.created_at).getTime()
    const bDate = new Date(b.created_at).getTime()
    return bDate - aDate // Descending order (newest first)
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

  // Helper function to fetch and load items for a booking into the compact display
  const handleOpenCompactDisplay = async (booking: Booking) => {
    try {
      console.log('[Bookings] Opening compact display for booking:', booking.id)
      
      // Determine source
      const bookingType = (booking as any).type || 'product'
      const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
      
      // Fetch latest items from database
      const response = await fetch(`/api/bookings/${booking.id}/items?source=${source}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[Bookings] Fetched items from database:', data.items)
      
      // Update state with fresh data from database
      setCurrentBookingForItems(booking)
      setSelectedItems(data.items || [])
      setShowCompactDisplay(true)
      
    } catch (err) {
      console.error('[Bookings] Error opening compact display:', err)
      toast({
        title: 'Error loading items',
        description: 'Failed to fetch booking items',
        variant: 'destructive',
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
    )
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
              {loading ? (
                <TableSkeleton rows={10} />
              ) : paginatedBookings.length === 0 ? (
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Created At</TableHead>
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
                            
                            // Check if there are actually no items in the fetched data
                            // Priority: actual items array > has_items flag
                            const actuallyHasItems = items.length > 0
                            
                            if (!hasItems || !actuallyHasItems) {
                              return (
                                <Badge 
                                  variant="outline" 
                                  className="text-orange-600 border-orange-300 cursor-pointer hover:bg-orange-50"
                                  onClick={() => {
                                    // Open product selection directly
                                    setCurrentBookingForItems(booking)
                                    setSelectedItems([])
                                    setShowItemsSelection(true)
                                  }}
                                >
                                  ⏳ Selection Pending
                                </Badge>
                              )
                            }
                            
                            // For product sales and rentals: show just "items"
                            if (bookingType === 'sale' || bookingType === 'rental') {
                              return (
                                <Badge 
                                  variant="default"
                                  className="bg-blue-600 cursor-pointer hover:bg-blue-700"
                                  onClick={() => {
                                    setProductDialogBooking(booking)
                                    setProductDialogType('items')
                                    setShowProductDialog(true)
                                  }}
                                >
                                  📦 Items
                                </Badge>
                              )
                            }
                            
                            // For packages: show just "items"
                            if (items.length === 0) {
                              return (
                                <Badge 
                                  variant="default"
                                  className="cursor-pointer hover:bg-primary/80"
                                  onClick={() => handleOpenCompactDisplay(booking)}
                                >
                                  Items
                                </Badge>
                              )
                            }
                            
                            return (
                              <Badge 
                                variant="outline"
                                className="cursor-pointer hover:bg-gray-100 border-gray-300"
                                onClick={() => handleOpenCompactDisplay(booking)}
                              >
                                Items
                              </Badge>
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
                        <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setShowViewDialog(true)
                              }}
                              title="View Booking"
                            >
                              <Eye className="h-4 w-4"/>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditBooking(booking.id, (booking as any).source)}
                              title="Edit Booking"
                            >
                              <Edit className="h-4 w-4"/>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBooking(booking.id, (booking as any).source)}
                              title="Delete Booking"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
                            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium mt-1">🕒 {(selectedBooking as any).delivery_time}</p>
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
                            <p className="text-sm text-orange-600 dark:text-orange-300 font-medium mt-1">🕒 {(selectedBooking as any).return_time}</p>
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

              {/* Booking Items - New Reusable Dialog */}
              {selectedBooking && bookingItems[selectedBooking.id] && bookingItems[selectedBooking.id].length > 0 && (
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
                              } as any
                            } else {
                              // Product item
                              return {
                                id: item.product_id || item.id || `item-${Math.random()}`,
                                product_id: item.product_id || item.id,
                                product: {
                                  id: item.product_id || item.id,
                                  name: item.product_name || 'Item',
                                  product_code: item.product_code,
                                  category: item.category_name,
                                  image_url: item.product?.image_url,
                                },
                                quantity: item.quantity || 1,
                                unit_price: item.unit_price || item.price || 0,
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

              {/* Assigned Barcodes */}
              <BookingBarcodes 
                bookingId={selectedBooking.id} 
                bookingType={(selectedBooking as any).source === 'package_bookings' ? 'package' : 'product'}
                franchiseId={currentUser?.franchise_id}
                userId={currentUser?.id}
              />

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
                    variant_name: item.variant_name,
                    base_price: item.unit_price || item.price || 0,
                    package_id: item.package_id,
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
                    product_code: item.product?.product_code || item.product_code,
                    category: item.product?.category || item.category_name,
                    image_url: item.product?.image_url,
                    price: item.product?.price || item.price,
                    rental_price: item.product?.rental_price || item.unit_price || item.price || 0,
                    sale_price: item.unit_price || item.price || 0,
                    stock_available: item.product?.stock_available,
                    category_id: item.product?.category_id,
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
            if (!open && selectedItems.length > 0) {
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
            if (!open) {
              // Dialog is closing - save the updated items to database
              console.log('[Bookings] Compact dialog closing, saving items count:', selectedItems.length)
              if (currentBookingForItems) {
                // Save current items to database (even if 0 items - to clear them)
                const bookingType = (currentBookingForItems as any).type || 'product'
                const source = bookingType === 'package' ? 'package_bookings' : 'product_orders'
                
                // Transform items for saving
                const itemsToSave = selectedItems.map((item: any) => {
                  if (source === 'product_orders') {
                    return {
                      product_id: item.product_id,
                      quantity: item.quantity || 1,
                      unit_price: item.unit_price || 0,
                      total_price: (item.unit_price || 0) * (item.quantity || 1),
                    }
                  } else {
                    // Package booking
                    if (item.product_id) {
                      return {
                        product_id: item.product_id,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.unit_price || 0) * (item.quantity || 1),
                      }
                    } else {
                      return {
                        package_id: item.package_id,
                        variant_id: item.variant_id,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.unit_price || 0) * (item.quantity || 1),
                        extra_safas: item.extra_safas || 0,
                      }
                    }
                  }
                })

                try {
                  console.log('[Bookings] Saving to API:', { itemsToSave, source })
                  const response = await fetch(`/api/bookings/${currentBookingForItems.id}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      items: itemsToSave,
                      source,
                    }),
                  })

                  if (!response.ok) {
                    const error = await response.json()
                    console.error('[Bookings] Error saving items:', error)
                    toast({
                      title: 'Error saving items',
                      description: error.error || 'Failed to save changes',
                      variant: 'destructive',
                    })
                  } else {
                    const result = await response.json()
                    console.log('[Bookings] Items saved successfully from compact dialog:', result)
                    
                    // Update bookingsWithItems based on actual count
                    if (selectedItems.length > 0) {
                      setBookingsWithItems(prev => new Set([...prev, currentBookingForItems.id]))
                    } else {
                      setBookingsWithItems(prev => {
                        const updated = new Set(prev)
                        updated.delete(currentBookingForItems.id)
                        return updated
                      })
                    }
                    
                    // Refresh bookings to get updated data
                    await refresh()
                    
                    toast({
                      title: 'Items updated',
                      description: `${selectedItems.length} item(s) saved`,
                    })
                  }
                } catch (err) {
                  console.error('[Bookings] Error in compact dialog save:', err)
                  toast({
                    title: 'Error',
                    description: 'Failed to save items',
                    variant: 'destructive',
                  })
                }
              }
            }
            setShowCompactDisplay(open)
          }}
          items={selectedItems}
          title={`📦 ${(currentBookingForItems as any).booking_number || 'Booking'}`}
          onEditProducts={() => {
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
