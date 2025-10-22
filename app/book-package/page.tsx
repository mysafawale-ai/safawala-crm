"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft, ArrowRight, User, Package, FileText, Search, X, Plus,
  CalendarIcon, Gift, ShoppingCart, Loader2, CheckCircle
} from "lucide-react"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"
import { computeDistanceAddonForVariant } from "@/lib/distance-pricing"

interface Customer { id: string; name: string; phone: string; email?: string; pincode?: string }
interface PackageCategory { id: string; name: string; description?: string; security_deposit?: number }
interface PackageVariant { id: string; package_id: string; name: string; variant_name?: string; base_price: number; security_deposit?: number; inclusions?: string[] | string }
interface PackageSet { id: string; category_id: string; name: string; base_price: number; extra_safa_price: number; security_deposit?: number; package_variants: PackageVariant[] }
interface BookingItem { id: string; pkg: PackageSet; variant: PackageVariant; quantity: number; unit_price: number; total_price: number; extra_safas: number; distance_addon?: number; security_deposit?: number; products_pending?: boolean }
interface StaffMember { id: string; name: string; email: string; role: string; franchise_id: string }

// Currency formatter for Indian Rupees
const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)

const STEPS = [
  { id: 1, name: "Customer & Event", icon: User },
  { id: 2, name: "Package Selection", icon: Package },
  { id: 3, name: "Review", icon: FileText },
]

export default function BookPackageWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editQuoteId = searchParams.get('edit')
  const [isEditMode, setIsEditMode] = useState(false)
  const [loadingQuoteData, setLoadingQuoteData] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)  // ✅ Store logged-in user
  const [basePincode, setBasePincode] = useState<string>('390007') // Default fallback
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [packages, setPackages] = useState<PackageSet[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | null>(null)
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [distanceKm, setDistanceKm] = useState<number>(0)
  const [customerSearch, setCustomerSearch] = useState("")
  const [packageSearch, setPackageSearch] = useState("")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [eventDateOpen, setEventDateOpen] = useState(false)
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false)
  const [returnDateOpen, setReturnDateOpen] = useState(false)
  const [useCustomPricing, setUseCustomPricing] = useState(false)
  const [customPricing, setCustomPricing] = useState({
    package_price: 0,
    deposit: 0,
  })
  const [formData, setFormData] = useState({
    event_type: "Wedding",
    event_participant: "Both" as "Groom" | "Bride" | "Both",
    event_date: "",
    event_time: "10:00",
    delivery_date: "",
    delivery_time: "09:00",
    return_date: "",
    return_time: "18:00",
    venue_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    notes: "",
    payment_type: "full" as "full" | "advance" | "partial",
    custom_amount: 0,
    discount_type: "flat" as "flat" | "percentage",
    discount_amount: 0,
    coupon_code: "",
    coupon_discount: 0
  })
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [selectedPackageForVariants, setSelectedPackageForVariants] = useState<PackageSet | null>(null)
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponError, setCouponError] = useState("")

  // Deposit policy: where to collect refundable security deposit
  // booking: collect now; delivery: collect later; none: do not collect
  const DEPOSIT_POLICY = {
    collectAt: 'booking' as 'booking' | 'delivery' | 'none',
    label: 'Security Deposit (Refundable)'
  }
  
  // Product selection dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productDialogContext, setProductDialogContext] = useState<{ pkg: PackageSet; variant: PackageVariant; eventDate?: string; itemId?: string; distanceKm?: number; pincode?: string } | null>(null)

  useEffect(() => { loadData() }, [])

  // Load quote data for editing
  useEffect(() => {
    if (editQuoteId && !loadingQuoteData && customers.length > 0 && packages.length > 0) {
      loadQuoteForEdit(editQuoteId)
    }
  }, [editQuoteId, customers, packages])

  const loadData = async () => {
    setCustomersLoading(true)
    try {
      // Fetch current user first for franchise filtering
      console.log("Fetching current user...")
      const userRes = await fetch("/api/auth/user")
      const userData = await userRes.json()
      setCurrentUser(userData)  // ✅ Store user in state for later use
      console.log("Current user:", userData)
      
      // Fetch company settings to get base pincode
      if (userData.franchise_id) {
        try {
          console.log("Fetching company settings for franchise:", userData.franchise_id)
          const settingsRes = await fetch(`/api/settings/company?franchise_id=${userData.franchise_id}`)
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json()
            const pincode = settingsData.data?.pincode
            if (pincode) {
              setBasePincode(pincode)
              console.log('✅ Base pincode loaded from company settings:', pincode)
            } else {
              console.log('⚠️ No pincode in company settings, using default')
            }
          } else {
            console.warn('Failed to fetch company settings, using default pincode')
          }
        } catch (err) {
          console.warn('Error loading company settings, using default pincode:', err)
        }
      }
      
      // Fetch staff members - filter by franchise for non-super-admins
      console.log("Fetching staff members...")
      let staffQuery = supabase
        .from("users")
        .select("id,name,email,role,franchise_id")
        .in("role", ["staff", "franchise_admin"])
        .order("name")
      
      // Add franchise filter for non-super-admins
      if (userData.role !== "super_admin" && userData.franchise_id) {
        console.log("Filtering staff by franchise_id:", userData.franchise_id)
        staffQuery = staffQuery.eq("franchise_id", userData.franchise_id)
      } else {
        console.log("Super admin - showing all staff")
      }
      
      console.log("Staff query:", staffQuery)
      const staffRes = await staffQuery
      
      console.log("Staff query result:", {
        data: staffRes.data,
        error: staffRes.error,
        count: staffRes.data?.length
      })
      
      // Prepare customer query with franchise filter
      let customersQuery = supabase
        .from("customers")
        .select("id,name,phone,email,pincode")
        .order("name")
      
      // Apply franchise filter for non-super-admins
      if (userData.role !== "super_admin" && userData.franchise_id) {
        console.log("Filtering customers by franchise_id:", userData.franchise_id)
        customersQuery = customersQuery.eq("franchise_id", userData.franchise_id)
      } else {
        console.log("Super admin - showing all customers")
      }
      
      const [custRes, catRes, pkgRes, variantRes] = await Promise.all([
        customersQuery,
        supabase.from("packages_categories").select("*").eq("is_active", true).order("display_order"),
        supabase.from("package_sets").select("*").eq("is_active", true).order("name"),
        supabase.from("package_variants").select("*").eq("is_active", true),
      ])
      
      if (custRes.error) {
        console.error("Error loading customers:", custRes.error)
      }
      if (catRes.error) {
        console.error("Error loading categories:", catRes.error)
      }
      if (pkgRes.error) {
        console.error("Error loading packages:", pkgRes.error)
      }
      if (variantRes.error) {
        console.error("Error loading variants:", variantRes.error)
      }
      if (staffRes.error) {
        console.error("Error loading staff - Full error object:", JSON.stringify(staffRes.error, null, 2))
        console.error("Error code:", staffRes.error.code)
        console.error("Error message:", staffRes.error.message)
        console.error("Error details:", staffRes.error.details)
        toast.error(`Failed to load staff members: ${staffRes.error.message}`)
      } else {
        console.log("✅ Staff members loaded successfully:", staffRes.data?.length || 0)
        console.table(staffRes.data)
      }
      
      if (custRes.error || catRes.error || pkgRes.error || variantRes.error) throw new Error("Error loading data")
      
      const packagesWithVariants: PackageSet[] = (pkgRes.data || []).map((p: any) => ({
        ...p,
        package_variants: (variantRes.data || []).filter((v: any) => v.package_id === p.id),
      }))
      setCustomers(custRes.data || [])
      setCategories(catRes.data || [])
      setPackages(packagesWithVariants)
      setStaffMembers(staffRes.data || [])
      
      console.log("Final staffMembers state:", staffRes.data || [])
      
      // Auto-select current user as sales staff if they are in the staff list
      if (userData && staffRes.data) {
        const currentUserInStaff = staffRes.data.find((s: any) => s.id === userData.id)
        if (currentUserInStaff) {
          setSelectedStaff(userData.id)
          console.log('✅ Auto-selected current user as sales staff:', currentUserInStaff.name)
        }
      }
    } catch (e) {
      console.error("Error in loadData:", e)
      toast.error("Error loading data")
    } finally {
      setCustomersLoading(false)
    }
  }

  const loadQuoteForEdit = async (quoteId: string) => {
    try {
      setLoadingQuoteData(true)
      setIsEditMode(true)

      // Load quote header from package_bookings
      const { data: quote, error: quoteError } = await supabase
        .from('package_bookings')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError

      // Load quote items
      const { data: items, error: itemsError } = await supabase
        .from('package_booking_items')
        .select('*')
        .eq('booking_id', quoteId)

      if (itemsError) throw itemsError

      // Find and set customer
      const customer = customers.find(c => c.id === quote.customer_id)
      if (customer) {
        setSelectedCustomer(customer)
      }

      // Set sales staff
      if (quote.sales_staff_id) {
        setSelectedStaff(quote.sales_staff_id)
      }

      // Set distance
      if (quote.distance_km) {
        setDistanceKm(quote.distance_km)
      }

      // Pre-fill form data
      const eventDateTime = quote.event_date ? new Date(quote.event_date) : null
      const deliveryDateTime = quote.delivery_date ? new Date(quote.delivery_date) : null
      const returnDateTime = quote.return_date ? new Date(quote.return_date) : null

      setFormData({
        event_type: quote.event_type || "Wedding",
        event_participant: quote.event_participant || "Both",
        payment_type: quote.payment_type || "full",
        custom_amount: quote.custom_amount || 0,
        discount_type: "flat" as "flat" | "percentage",
        discount_amount: quote.discount_amount || 0,
        coupon_code: quote.coupon_code || "",
        coupon_discount: quote.coupon_discount || 0,
        event_date: eventDateTime ? format(eventDateTime, "yyyy-MM-dd") : "",
        event_time: eventDateTime ? format(eventDateTime, "HH:mm") : "10:00",
        delivery_date: deliveryDateTime ? format(deliveryDateTime, "yyyy-MM-dd") : "",
        delivery_time: deliveryDateTime ? format(deliveryDateTime, "HH:mm") : "09:00",
        return_date: returnDateTime ? format(returnDateTime, "yyyy-MM-dd") : "",
        return_time: returnDateTime ? format(returnDateTime, "HH:mm") : "18:00",
        venue_address: quote.venue_address || "",
        groom_name: quote.groom_name || "",
        groom_whatsapp: quote.groom_whatsapp || "",
        groom_address: quote.groom_address || "",
        bride_name: quote.bride_name || "",
        bride_whatsapp: quote.bride_whatsapp || "",
        notes: quote.notes || "",
      })

      // Pre-fill booking items - reconstruct BookingItem[]
      const loadedItems: BookingItem[] = []
      for (const item of items) {
        // Find package
        const pkg = packages.find(p => p.id === item.package_id)
        if (pkg) {
          // Find variant
          const variant = pkg.package_variants.find(v => v.id === item.variant_id)
          if (variant) {
            loadedItems.push({
              id: Math.random().toString(36).substr(2, 9),
              pkg,
              variant,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              extra_safas: item.extra_safas || 0,
              distance_addon: item.distance_addon || 0,
              security_deposit: item.security_deposit || 0,
              products_pending: false,
            })
          }
        }
      }
      setBookingItems(loadedItems)

      // Move to review step if items loaded
      if (loadedItems.length > 0) {
        setCurrentStep(3)
      }

      toast.success("Quote loaded successfully")
    } catch (error) {
      console.error("Error loading quote:", error)
      toast.error("Failed to load quote data")
      router.push('/quotes')
    } finally {
      setLoadingQuoteData(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers
    const search = customerSearch.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search))
  }, [customers, customerSearch])

  const filteredPackages = useMemo(() => {
    let filtered = packages
    if (selectedCategory) filtered = filtered.filter(p => p.category_id === selectedCategory.id)
    if (packageSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(packageSearch.toLowerCase()))
    return filtered
  }, [packages, selectedCategory, packageSearch])

  // Auto-select the first category when categories load
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0])
    }
  }, [categories, selectedCategory])

  const totals = useMemo(() => {
    // If custom pricing is enabled, use custom values
    if (useCustomPricing) {
      const packagePrice = customPricing.package_price || 0
      const gst = packagePrice * 0.05
      const grand = packagePrice + gst
      // Advance/partial aren't used in custom mode; treat deposit field as upfront payment if entered
      const advanceDue = customPricing.deposit || 0
      const payable = advanceDue
      const remaining = grand - advanceDue
      const securityDeposit = bookingItems.reduce((s, i) => s + (i.security_deposit || 0) * i.quantity, 0)
      const depositDueNow = DEPOSIT_POLICY.collectAt === 'booking' ? securityDeposit : 0
      const depositDueLater = DEPOSIT_POLICY.collectAt === 'delivery' ? securityDeposit : 0
      const payableNowTotal = payable + depositDueNow
      const remainingPackage = remaining
      const remainingTotal = remainingPackage + depositDueLater
      
      return {
        subtotal: packagePrice,
        baseSubtotal: packagePrice,
        distanceSurcharge: 0,
        manualDiscount: 0,
        couponDiscount: 0,
        gst,
        grand,
        payable, // package portion due now
        remaining: remainingPackage, // package portion remaining
        advanceDue,
        securityDeposit,
        depositDueNow,
        depositDueLater,
        payableNowTotal,
        remainingTotal,
        isCustom: true
      }
    }
    
    // Standard calculated pricing
    const subtotal = bookingItems.reduce((s, i) => s + i.total_price, 0)
    const distanceSurcharge = bookingItems.reduce((s, i) => s + (i.distance_addon || 0) * i.quantity, 0)
    const baseSubtotal = Math.max(0, subtotal - distanceSurcharge)
    
    // Apply manual discount
    let manualDiscount = 0
    if (formData.discount_type === "flat") {
      manualDiscount = Math.min(subtotal, formData.discount_amount || 0)
    } else if (formData.discount_type === "percentage") {
      const percentage = Math.min(100, Math.max(0, formData.discount_amount || 0))
      manualDiscount = subtotal * (percentage / 100)
    }
    
    const subtotalAfterDiscount = Math.max(0, subtotal - manualDiscount)
    
    // Apply coupon discount (on subtotal after manual discount)
    const couponDiscount = Math.min(subtotalAfterDiscount, formData.coupon_discount || 0)
    const subtotalAfterCoupon = Math.max(0, subtotalAfterDiscount - couponDiscount)
    
    const gst = subtotalAfterCoupon * 0.05
    const grand = subtotalAfterCoupon + gst
    
    let payable = grand // package portion due now
    const advanceDue = formData.payment_type === "advance" ? grand * 0.5 : 0
    if (formData.payment_type === "advance") payable = advanceDue
    else if (formData.payment_type === "partial") payable = Math.min(grand, Math.max(0, formData.custom_amount))
    
    const securityDeposit = bookingItems.reduce((s, i) => s + (i.security_deposit || 0) * i.quantity, 0)
    const depositDueNow = DEPOSIT_POLICY.collectAt === 'booking' ? securityDeposit : 0
    const depositDueLater = DEPOSIT_POLICY.collectAt === 'delivery' ? securityDeposit : 0
    const payableNowTotal = payable + depositDueNow
    const remainingPackage = grand - payable
    const remainingTotal = remainingPackage + depositDueLater
    
    return {
      subtotal,
      baseSubtotal,
      distanceSurcharge,
      manualDiscount,
      subtotalAfterDiscount,
      couponDiscount,
      subtotalAfterCoupon,
      gst,
      grand,
      payable, // package portion due now
      remaining: remainingPackage, // package portion remaining
      advanceDue,
      securityDeposit,
      depositDueNow,
      depositDueLater,
      payableNowTotal,
      remainingTotal,
      isCustom: false
    }
  }, [bookingItems, formData, useCustomPricing, customPricing])

  const computeDistanceAddon = async (variantId: string, km: number, baseAmount: number): Promise<number> => {
    return computeDistanceAddonForVariant(variantId, km, baseAmount)
  }

  const addPackageItem = async (pkg: PackageSet, variant: PackageVariant, extraSafas: number): Promise<BookingItem> => {
    const baseUnit = pkg.base_price + variant.base_price + extraSafas * (pkg.extra_safa_price || 0)
    const distanceAddon = await computeDistanceAddon(variant.id, Number(distanceKm) || 0, baseUnit)
    const unit = baseUnit + distanceAddon
    // Determine security deposit precedence: variant > package > category
    const catDeposit = categories.find(c => c.id === pkg.category_id)?.security_deposit || 0
    const secDepositUnit = (typeof variant.security_deposit === 'number' ? variant.security_deposit : undefined)
      ?? (typeof pkg.security_deposit === 'number' ? pkg.security_deposit : undefined)
      ?? catDeposit
    const item: BookingItem = {
      id: `pkg-${pkg.id}-${variant.id}-${Date.now()}`,
      pkg,
      variant,
      quantity: 1,
      unit_price: unit,
      total_price: unit,
      extra_safas: extraSafas,
      distance_addon: distanceAddon,
      security_deposit: secDepositUnit || 0,
      products_pending: false,
    }
    setBookingItems(prev => [...prev, item])
    const vName = (variant?.name || variant?.variant_name || '').trim()
    toast.success(vName ? `Added ${pkg.name} – ${vName}` : `Added ${pkg.name}`)
    return item
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) { setBookingItems(prev => prev.filter(i => i.id !== id)); return }
  setBookingItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, total_price: i.unit_price * qty } : i))
  }

  const removeItem = (id: string) => { setBookingItems(prev => prev.filter(i => i.id !== id)); toast.success("Item removed") }

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(c => [...c, newCustomer])
    setSelectedCustomer(newCustomer)
    setShowNewCustomer(false)
    toast.success("Customer created!")
  }

  const canGoNext = () => {
    if (currentStep === 1) return selectedCustomer !== null && formData.event_date !== ""
    if (currentStep === 2) return bookingItems.length > 0
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      if (currentStep === 1) toast.error("Please select customer and event date")
      else if (currentStep === 2) toast.error("Please add at least one package")
      return
    }
    setCurrentStep(s => Math.min(s + 1, 3))
  }

  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1))

  // Recalculate distance surcharges for existing items when effective distance changes
  useEffect(() => {
    const recalc = async () => {
      if (!bookingItems.length) return
      const km = Number(distanceKm) || 0
      const updated: BookingItem[] = []
      for (const i of bookingItems) {
        const baseUnit = (i.unit_price - (i.distance_addon || 0))
        const addon = await computeDistanceAddon(i.variant.id, km, baseUnit)
        const unit = baseUnit + addon
        updated.push({ ...i, unit_price: unit, total_price: unit * i.quantity, distance_addon: addon })
      }
      setBookingItems(updated)
    }
    recalc()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceKm])

  // Listen for product selection skip to flag 'products_pending' on a specific item
  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.itemId as string | undefined
      if (!id) return
      setBookingItems(prev => prev.map(i => i.id === id ? { ...i, products_pending: true } : i))
    }
    window.addEventListener('pkg-products-skipped', handler as any)
    return () => window.removeEventListener('pkg-products-skipped', handler as any)
  }, [])

  // Resolve effective km from selected customer's pincode using optional mapping tables
  useEffect(() => {
    const resolveKm = async () => {
      const pin = selectedCustomer?.pincode?.trim()
      if (!pin) { setDistanceKm(0); return }
      // Use dynamic base pincode from company settings
      const basePin = basePincode
      
      // Same pincode = 0 km
      if (pin === basePin) { setDistanceKm(0); return }
      
      // 1) Check exact distance table first (highest priority - cached distances)
      try {
        const { data: exactData, error: exactError } = await supabase
          .from('pincode_distances_exact')
          .select('distance_km, method')
          .eq('from_pincode', basePin)
          .eq('to_pincode', pin)
          .limit(1)
        
        if (!exactError && exactData && exactData.length > 0) {
          console.log(`Distance from cache: ${exactData[0].distance_km} km (${exactData[0].method})`)
          setDistanceKm(Number(exactData[0].distance_km))
          return
        }
      } catch (error) {
        console.warn('Cache lookup error:', error)
      }
      
      // 2) Distance not in cache - fetch from API and cache it
      try {
        console.log(`Fetching distance for ${pin} from API...`)
        const response = await fetch(`/api/calculate-distance?from=${basePin}&to=${pin}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.distanceKm) {
            console.log(`Distance from API: ${data.distanceKm} km (${data.method})`)
            setDistanceKm(data.distanceKm)
            
            // Cache the result in database for future use
            await supabase.from('pincode_distances_exact').insert({
              from_pincode: basePin,
              to_pincode: pin,
              distance_km: data.distanceKm,
              method: data.method || 'api',
              source: data.method === 'geolocation' ? 'OpenStreetMap API' : 'Estimation',
              verified: data.method === 'geolocation'
            }).then(() => {
              console.log(`Cached distance ${basePin} → ${pin}: ${data.distanceKm} km`)
            }).catch((err: any) => {
              console.warn('Failed to cache distance:', err)
            })
            
            return
          }
        }
      } catch (error) {
        console.warn('Distance API error:', error)
      }
      
      // Fallback: Use improved region-based estimation
      const basePincodeNum = 390001
      const customerPincode = parseInt(pin)
      if (!isNaN(customerPincode)) {
        const fromRegion = Math.floor(basePincodeNum / 10000)
        const toRegion = Math.floor(customerPincode / 10000)
        
        let estimatedKm: number
        if (fromRegion === toRegion) {
          // Same sub-region (39xxxx to 39xxxx)
          estimatedKm = Math.abs(customerPincode - basePincodeNum) / 100
        } else {
          // Different regions - use larger multiplier
          const regionDiff = Math.abs(fromRegion - toRegion)
          estimatedKm = regionDiff * 200 // ~200 km per region
        }
        setDistanceKm(Math.round(estimatedKm))
      } else {
        setDistanceKm(0)
      }
    }
    resolveKm()
  }, [selectedCustomer?.pincode, basePincode])

  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    if (!formData.coupon_code.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setCouponValidating(true)
    setCouponError("")

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.coupon_code,
          orderValue: totals.subtotalAfterDiscount || totals.subtotal, // Apply coupon after manual discount
          customerId: selectedCustomer?.id,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        setFormData({
          ...formData,
          coupon_discount: data.discount,
        })
        toast.success(data.message || 'Coupon applied successfully!')
        setCouponError("")
      } else {
        setCouponError(data.message || data.error || 'Invalid coupon')
        setFormData({ ...formData, coupon_discount: 0 })
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Failed to validate coupon')
      setFormData({ ...formData, coupon_discount: 0 })
    } finally {
      setCouponValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    setFormData({
      ...formData,
      coupon_code: "",
      coupon_discount: 0,
    })
    setCouponError("")
    toast.success('Coupon removed')
  }

  const handleSubmit = async (asQuote: boolean = false) => {
    if (!selectedCustomer || bookingItems.length === 0 || !formData.event_date) {
      toast.error("Missing required information")
      return
    }
    setLoading(true)
    try {
      // ==================================================================
      // EDIT MODE: Update existing quote
      // ==================================================================
      if (isEditMode && editQuoteId) {
        // Resolve event date/time
        const eventDate = new Date(formData.event_date)
        const [hours, minutes] = formData.event_time.split(":")
        eventDate.setHours(parseInt(hours), parseInt(minutes))

        // Combine delivery/return dates with times
        const deliveryDateISO = formData.delivery_date ? (() => {
          const d = new Date(formData.delivery_date)
          const [hh, mm] = (formData.delivery_time || '00:00').split(':')
          d.setHours(parseInt(hh||'0'), parseInt(mm||'0'))
          return d.toISOString()
        })() : null
        const returnDateISO = formData.return_date ? (() => {
          const d = new Date(formData.return_date)
          const [hh, mm] = (formData.return_time || '00:00').split(':')
          d.setHours(parseInt(hh||'0'), parseInt(mm||'0'))
          return d.toISOString()
        })() : null

        // 1. Update quote header
        const { error: updateError } = await supabase
          .from("package_bookings")
          .update({
            customer_id: selectedCustomer.id,
            event_type: formData.event_type,
            event_participant: formData.event_participant,
            payment_type: formData.payment_type,
            custom_amount: formData.custom_amount,
            discount_amount: formData.discount_amount,
            coupon_code: formData.coupon_code || null,
            coupon_discount: formData.coupon_discount || 0,
            event_date: eventDate.toISOString(),
            delivery_date: deliveryDateISO,
            return_date: returnDateISO,
            venue_address: formData.venue_address,
            groom_name: formData.groom_name || null,
            groom_whatsapp: formData.groom_whatsapp || null,
            groom_address: formData.groom_address || null,
            bride_name: formData.bride_name || null,
            bride_whatsapp: formData.bride_whatsapp || null,
            notes: formData.notes || null,
            distance_km: distanceKm,
            distance_amount: (totals as any).distanceSurcharge || 0,
            tax_amount: totals.gst,
            subtotal_amount: totals.subtotal,
            total_amount: totals.grand,
            security_deposit: (totals as any).baseDeposit || 0,
            amount_paid: totals.payable + ((totals as any).baseDeposit || 0),
            pending_amount: totals.remaining,
            sales_closed_by_id: selectedStaff || null,
            use_custom_pricing: useCustomPricing || false,
            custom_package_price: useCustomPricing ? customPricing.package_price : null,
            custom_deposit: useCustomPricing ? customPricing.deposit : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editQuoteId)

        if (updateError) throw updateError

        // 2. Delete existing items
        const { error: deleteError } = await supabase
          .from("package_booking_items")
          .delete()
          .eq('booking_id', editQuoteId)

        if (deleteError) throw deleteError

        // 3. Insert updated items
        const itemRows = bookingItems.map((itm) => ({
          booking_id: editQuoteId,
          package_id: itm.pkg.id,
          variant_id: itm.variant.id,
          variant_name: itm.variant.variant_name || itm.variant.name,
          variant_inclusions: itm.variant.inclusions || [],
          quantity: itm.quantity,
          unit_price: itm.unit_price,
          total_price: itm.total_price,
          security_deposit: itm.security_deposit,
          extra_safas: itm.extra_safas || 0,
          distance_addon: itm.distance_addon || 0,
        }))

        const { error: itemsErr } = await supabase
          .from("package_booking_items")
          .insert(itemRows)

        if (itemsErr) throw itemsErr

        toast.success("Quote updated successfully")
        router.push(`/quotes?refresh=${Date.now()}`)
        router.refresh()
        setLoading(false)
        return
      }

      // ==================================================================
      // CREATE MODE: Create new booking/quote
      // ==================================================================
      // Resolve event date/time
      const eventDate = new Date(formData.event_date)
      const [hours, minutes] = formData.event_time.split(":")
      eventDate.setHours(parseInt(hours), parseInt(minutes))

      // ✅ BUG FIX #1: Validate user session loaded and use dynamic franchise_id
      if (!currentUser?.franchise_id) {
        toast.error("Session error: Please refresh the page")
        setLoading(false)
        return
      }
      const franchiseId = currentUser.franchise_id  // ✅ Use logged-in user's franchise directly

      // Generate number (quote vs booking)
      let numberStr = ''
      if (asQuote) {
        const { data: qn, error: qnErr } = await supabase.rpc('generate_quote_number')
        if (qnErr) throw qnErr
        numberStr = (qn as any) || `QT-${Date.now()}`
      } else {
        // Reuse booking number generator as a unique string for package_number
        const { data: bn } = await supabase.rpc('generate_booking_number')
        numberStr = (bn as any) || `PKG-${Date.now()}`
      }

      // Combine delivery/return dates with times if provided
      const deliveryDateISO = formData.delivery_date ? (() => {
        const d = new Date(formData.delivery_date)
        const [hh, mm] = (formData.delivery_time || '00:00').split(':')
        d.setHours(parseInt(hh||'0'), parseInt(mm||'0'))
        return d.toISOString()
      })() : null
      const returnDateISO = formData.return_date ? (() => {
        const d = new Date(formData.return_date)
        const [hh, mm] = (formData.return_time || '00:00').split(':')
        d.setHours(parseInt(hh||'0'), parseInt(mm||'0'))
        return d.toISOString()
      })() : null

      const insertPayload: any = {
        package_number: numberStr,
        is_quote: asQuote,
        customer_id: selectedCustomer.id,
        franchise_id: franchiseId,
        event_type: formData.event_type,
        event_participant: formData.event_participant,
        payment_type: formData.payment_type,
        event_date: eventDate.toISOString(),
        delivery_date: deliveryDateISO,
        return_date: returnDateISO,
        venue_address: formData.venue_address,
  groom_name: formData.groom_name || null,
  // Optional columns (may not exist in some DBs): groom_whatsapp, groom_address, bride_whatsapp, bride_address
  // Persist only name fields for broad compatibility
  bride_name: formData.bride_name || null,
        // bride_address not captured; leave null
        notes: formData.notes || null,
        tax_amount: totals.gst,
        subtotal_amount: totals.subtotal,
        total_amount: totals.grand,
        amount_paid: asQuote ? 0 : totals.payable,  // ✅ BUG FIX #2: Use calculated payment
        pending_amount: asQuote ? totals.grand : totals.remaining,  // ✅ BUG FIX #2: Use calculated remaining
        status: asQuote ? 'quote' : 'confirmed',
        sales_closed_by_id: selectedStaff || null,
        use_custom_pricing: useCustomPricing || false,
        custom_package_price: useCustomPricing ? customPricing.package_price : null,
        custom_deposit: useCustomPricing ? customPricing.deposit : null,
        coupon_code: formData.coupon_code || null,
        coupon_discount: formData.coupon_discount || 0,
        discount_amount: formData.discount_amount || 0,
      }

      // Resilient insert: handle unknown columns and duplicate package_number conflicts
      const safeInsert = async (payload: any) => {
        let attemptPayload = { ...payload }
        const tried = new Set<string>()
        for (let i = 0; i < 8; i++) {
          const { data, error } = await supabase
            .from("package_bookings")
            .insert(attemptPayload)
            .select()
            .single()
          if (!error) return { data, error: null as any }
          const msg = (error as any)?.message || ''
          const code = (error as any)?.code || ''
          // 1) Unknown column -> drop and retry
          const match = msg.match(/Could not find the '(.*?)' column of 'package_bookings'/)
          if (match && match[1] && !tried.has(match[1])) {
            const col = match[1]
            tried.add(col)
            // Drop the offending column and retry
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [col]: _, ...rest } = attemptPayload
            attemptPayload = rest
            continue
          }
          // 2) Duplicate package_number -> regenerate and retry
          if (
            code === '23505' ||
            /duplicate key value violates unique constraint\s+"package_bookings_package_number_key"/i.test(msg)
          ) {
            const uniq = `${Date.now()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`
            attemptPayload = {
              ...attemptPayload,
              package_number: `PKG-${uniq}`
            }
            continue
          }
          // No parsable unknown column -> stop
          return { data: null as any, error }
        }
        return { data: null as any, error: new Error('Failed to insert booking after stripping columns') }
      }

      const { data: booking, error: bookingError } = await safeInsert(insertPayload)

      if (bookingError) throw bookingError

      const itemsData = bookingItems.map(item => ({
        booking_id: booking.id,
        package_id: item.pkg.id,
        variant_id: item.variant.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        extra_safas: item.extra_safas
      }))

      const { error: itemsError } = await supabase.from("package_booking_items").insert(itemsData)
      if (itemsError) throw itemsError

      // Track coupon usage if coupon was applied
      if (formData.coupon_code && formData.coupon_discount > 0 && !asQuote) {
        try {
          // Increment usage count
          const { data: couponData } = await supabase
            .from('coupons')
            .select('id, usage_count')
            .eq('code', formData.coupon_code)
            .single()
          
          if (couponData) {
            await supabase
              .from('coupons')
              .update({ usage_count: (couponData.usage_count || 0) + 1 })
              .eq('id', couponData.id)
            
            // Log usage
            await supabase.from('coupon_usage').insert({
              coupon_id: couponData.id,
              customer_id: selectedCustomer.id,
              booking_id: booking.id,
              discount_applied: formData.coupon_discount
            }).catch((err: any) => {
              console.warn('Failed to log coupon usage:', err)
            })
          }
        } catch (couponError) {
          console.error('Error tracking coupon usage:', couponError)
          // Don't fail the whole operation if coupon tracking fails
        }
      }

  toast.success(asQuote ? "Quote created!" : "Order created!")
  
  // Add timestamp to force page reload and refetch
  const redirectPath = asQuote ? "/quotes" : "/bookings"
  router.push(`${redirectPath}?refresh=${Date.now()}`)
  router.refresh() // Force refresh to ensure data is reloaded
    } catch (err: any) {
      toast.error(err.message || "Error creating booking")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while quote data is being loaded
  if (loadingQuoteData) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-green-700 mb-4" />
              <p className="text-xl font-medium text-gray-700">Loading quote data...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the quote details</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4">
  <CustomerFormDialog open={showNewCustomer} onOpenChange={setShowNewCustomer} onCustomerCreated={handleCustomerCreated} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-green-800">
            {isEditMode ? 'Edit Package Quote' : 'Create Package Booking'}
          </h1>
          {isEditMode && (
            <p className="text-sm text-gray-600 mt-1">Update package details and settings</p>
          )}
        </div>

        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.id
                const isComplete = currentStep > step.id
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? "bg-green-700 text-white" : isComplete ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                        {isComplete ? <CheckCircle className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                      </div>
                      <div className={`mt-2 text-sm font-medium ${isActive ? "text-green-700" : isComplete ? "text-green-600" : "text-gray-400"}`}>{step.name}</div>
                    </div>
                    {idx < STEPS.length - 1 && <div className={`h-1 flex-1 mx-4 rounded ${isComplete ? "bg-green-500" : "bg-gray-200"}`} />}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <Button
                      key={cat.id}
                      size="sm"
                      variant={selectedCategory?.id === cat.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search packages..."
                      value={packageSearch}
                      onChange={e => setPackageSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredPackages.length === 0 && (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-8 border rounded">No packages found.</div>
                  )}
                  {filteredPackages.map(pkg => (
                    <Card key={pkg.id} className="border hover:shadow-sm transition group">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => { setSelectedPackageForVariants(pkg); setVariantDialogOpen(true) }}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="font-semibold group-hover:text-blue-600 transition-colors">{pkg.name}</span>
                            <div className="flex items-center gap-2">
                              {/* Show chip if any booking item for this pkg has products pending */}
                              {bookingItems.some(b => b.pkg.id === pkg.id && b.products_pending) && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Products pending</Badge>
                              )}
                              <Badge variant="secondary">{formatCurrency(pkg.base_price)}</Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-500">
                          {pkg.package_variants.length > 0 ? (
                            <span>{pkg.package_variants.length} variants</span>
                          ) : (
                            <span>No variants</span>
                          )}
                          <div className="mt-2 text-green-700 text-[11px] font-medium">Click to view details & variants</div>
                        </CardContent>
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Customer Selection (mirrored from Product Order page) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Customer
                      <Button size="sm" variant="outline" onClick={() => setShowNewCustomer(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {selectedCustomer ? (
                      <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start justify-between">
                        <div>
                          <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                          <div className="text-xs text-blue-700">{selectedCustomer.phone}</div>
                          {selectedCustomer.pincode && (
                            <div className="text-[11px] text-blue-700">Pincode: {selectedCustomer.pincode}</div>
                          )}
                          {selectedCustomer.email && (
                            <div className="text-xs text-blue-600">{selectedCustomer.email}</div>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(null)} aria-label="Clear selection">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-md max-h-56 overflow-y-auto text-sm">
                        {customersLoading ? (
                          // Skeleton loading state
                          <div className="space-y-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="p-3 border-b last:border-b-0">
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {(customerSearch ? filteredCustomers : customers.slice(0, 5)).map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setSelectedCustomer(c)}
                                className="w-full text-left p-3 border-b last:border-b-0 hover:bg-muted"
                              >
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.phone}</div>
                              </button>
                            ))}
                            {customerSearch && filteredCustomers.length === 0 && (
                              <div className="p-3 text-xs text-muted-foreground">No matches</div>
                            )}
                            {!customerSearch && customers.length > 5 && (
                              <div className="p-3 text-xs text-muted-foreground text-center bg-muted/30">
                                Showing first 5 of {customers.length} customers. Type to search more...
                              </div>
                            )}
                            {!customerSearch && customers.length === 0 && (
                              <div className="p-3 text-xs text-muted-foreground">No customers found</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Event & Wedding Details - mirrored from product booking (without Booking Type) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event & Wedding Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* Row 1: Event Type, Event Participant */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Event Type</Label>
                        <Select value={formData.event_type} onValueChange={(v) => setFormData(f => ({ ...f, event_type: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Wedding">Wedding</SelectItem>
                            <SelectItem value="Engagement">Engagement</SelectItem>
                            <SelectItem value="Reception">Reception</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Event Participant</Label>
                        <Select value={formData.event_participant} onValueChange={(v) => setFormData(f => ({ ...f, event_participant: v as any }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Groom">Groom Only</SelectItem>
                            <SelectItem value="Bride">Bride Only</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Dates & Times */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Event Date & Time *</Label>
                        <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.event_date ? format(new Date(formData.event_date), "dd/MM/yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.event_date ? new Date(formData.event_date) : undefined}
                              onSelect={(d: any) => { setFormData(f => ({ ...f, event_date: d?.toISOString() || "" })); setEventDateOpen(false) }}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" value={formData.event_time} onChange={e => setFormData(f => ({ ...f, event_time: e.target.value }))} className="text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Delivery Date & Time</Label>
                        <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.delivery_date ? format(new Date(formData.delivery_date), "dd/MM/yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.delivery_date ? new Date(formData.delivery_date) : undefined}
                              onSelect={(d: any) => { setFormData(f => ({ ...f, delivery_date: d?.toISOString() || "" })); setDeliveryDateOpen(false) }}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" value={formData.delivery_time} onChange={e => setFormData(f => ({ ...f, delivery_time: e.target.value }))} className="text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Return Date & Time</Label>
                        <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.return_date ? format(new Date(formData.return_date), "dd/MM/yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.return_date ? new Date(formData.return_date) : undefined}
                              onSelect={(d: any) => { setFormData(f => ({ ...f, return_date: d?.toISOString() || "" })); setReturnDateOpen(false) }}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" value={formData.return_time} onChange={e => setFormData(f => ({ ...f, return_time: e.target.value }))} className="text-sm" />
                      </div>
                    </div>

                    {/* Distance (km) removed; pricing will use customer pincode */}

                    {/* Venue Address moved below in Bride Information */}
                  </CardContent>
                </Card>

                {/* Groom Information */}
                {(formData.event_participant === "Groom" || formData.event_participant === "Both") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Groom Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Groom Name</Label>
                          <Input value={formData.groom_name} onChange={(e) => setFormData(f => ({ ...f, groom_name: e.target.value }))} className="mt-1" placeholder="Enter groom's full name" />
                        </div>
                        <div>
                          <Label className="text-xs">Additional WhatsApp Number</Label>
                          <Input value={formData.groom_whatsapp} onChange={(e) => setFormData(f => ({ ...f, groom_whatsapp: e.target.value }))} className="mt-1" placeholder="WhatsApp number" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Home Address</Label>
                        <Textarea rows={2} value={formData.groom_address} onChange={(e) => setFormData(f => ({ ...f, groom_address: e.target.value }))} className="mt-1" placeholder="Full address with locality and pin code" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bride Information (Venue Address moved here) */}
                {(formData.event_participant === "Bride" || formData.event_participant === "Both") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bride Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Bride Name</Label>
                          <Input value={formData.bride_name} onChange={(e) => setFormData(f => ({ ...f, bride_name: e.target.value }))} className="mt-1" placeholder="Enter bride's full name" />
                        </div>
                        <div>
                          <Label className="text-xs">Additional WhatsApp Number</Label>
                          <Input value={formData.bride_whatsapp} onChange={(e) => setFormData(f => ({ ...f, bride_whatsapp: e.target.value }))} className="mt-1" placeholder="WhatsApp number" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Venue Address</Label>
                        <Textarea rows={2} value={formData.venue_address} onChange={(e) => setFormData(f => ({ ...f, venue_address: e.target.value }))} className="mt-1" placeholder="Enter venue address (e.g., Grand Palace Banquet, Connaught Place, Delhi - 110001)" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea rows={3} value={formData.notes} onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions or requirements" />
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Review & Confirm</h2>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Customer:</span> {selectedCustomer ? selectedCustomer.name : "—"}</div>
                  {selectedCustomer?.pincode && (
                    <div><span className="font-medium">Pincode:</span> {selectedCustomer.pincode}</div>
                  )}
                  <div><span className="font-medium">Event:</span> {formData.event_type} on {formData.event_date ? format(new Date(formData.event_date), "PPP p") : "—"}</div>
                  <div><span className="font-medium">Venue:</span> {formData.venue_address || "—"}</div>
                  {totals.securityDeposit > 0 && (
                    <div>
                      <span className="font-medium">{DEPOSIT_POLICY.label}:</span> {formatCurrency(totals.securityDeposit)}
                      <span className="ml-1 text-[11px] text-gray-500">{DEPOSIT_POLICY.collectAt === 'booking' ? '(collected now)' : DEPOSIT_POLICY.collectAt === 'delivery' ? '(collect at delivery)' : '(not collected)'}</span>
                    </div>
                  )}
                  {formData.payment_type === 'advance' && (
                    <div><span className="font-medium">Advance (50%):</span> {formatCurrency(totals.advanceDue)}</div>
                  )}
                </div>
                <div className="border rounded overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingItems.map(i => {
                        // Get category name
                        const category = categories.find(c => c.id === i.pkg.category_id)
                        return (
                        <tr key={i.id} className="border-t">
                          <td className="p-2">
                            <div className="space-y-2">
                              {/* Category name in green badge */}
                              {category && (
                                <div className="text-xs font-semibold text-green-800 bg-green-50 px-2 py-1 rounded inline-block border border-green-200">
                                  {category.name}
                                </div>
                              )}
                              
                              {/* Package name */}
                              <div className="font-bold text-base text-gray-900">{i.pkg.name}</div>
                              
                              {/* Variant and inclusions */}
                              {(i.variant?.name || i.variant?.variant_name) && (
                                <div className="space-y-1.5">
                                  <div className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-200">
                                    ◆ {i.variant.name || i.variant.variant_name}
                                  </div>
                                  {/* Show variant inclusions */}
                                  {(() => {
                                    const inclusions: string[] = Array.isArray(i.variant?.inclusions)
                                      ? i.variant.inclusions
                                      : typeof i.variant?.inclusions === 'string'
                                        ? JSON.parse(i.variant.inclusions)
                                        : []
                                    if (inclusions.length > 0) {
                                      return (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {inclusions.map((inc, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                                              ✓ {inc}
                                            </span>
                                          ))}
                                        </div>
                                      )
                                    } else {
                                      // Show message when no inclusions specified
                                      return (
                                        <div className="text-[10px] text-gray-500 italic mt-1">
                                          Standard package inclusions apply
                                        </div>
                                      )
                                    }
                                  })()}
                                </div>
                              )}
                              
                              {/* Extra safas calculation */}
                              {i.extra_safas > 0 && (
                                <div className="text-xs text-gray-700 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                  + Extra Safas: <span className="font-semibold">{i.extra_safas}</span> × {formatCurrency(i.pkg.extra_safa_price)} = <span className="font-bold text-orange-700">{formatCurrency(i.extra_safas * i.pkg.extra_safa_price)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right">{i.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(i.total_price * i.quantity)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Items ({bookingItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-72 overflow-auto pr-1">
                  {bookingItems.length === 0 && <div className="text-xs text-gray-500">No items added.</div>}
                  {bookingItems.map(i => {
                    // Get category name for sidebar
                    const category = categories.find(c => c.id === i.pkg.category_id)
                    return (
                    <div key={i.id} className="border rounded p-3 space-y-2 text-xs relative">
                      <button onClick={() => removeItem(i.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500" aria-label="Remove"><X className="h-4 w-4" /></button>
                      <div className="space-y-1.5 pr-6">
                        {/* Category badge */}
                        {category && (
                          <div className="text-[9px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded inline-block border border-green-200">
                            {category.name}
                          </div>
                        )}
                        
                        {/* Package name */}
                        <div className="font-bold text-sm text-gray-900">{i.pkg.name}</div>
                        
                        {/* Variant and inclusions */}
                        {(i.variant?.name || i.variant?.variant_name) && (
                          <div className="space-y-1">
                            <div className="text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded inline-block border border-blue-200">
                              ◆ {i.variant.name || i.variant.variant_name}
                            </div>
                            {/* Show variant inclusions in sidebar */}
                            {(() => {
                              const inclusions: string[] = Array.isArray(i.variant?.inclusions)
                                ? i.variant.inclusions
                                : typeof i.variant?.inclusions === 'string'
                                  ? JSON.parse(i.variant.inclusions)
                                  : []
                              if (inclusions.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-0.5 mt-1">
                                    {inclusions.slice(0, 2).map((inc, idx) => (
                                      <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        ✓ {inc}
                                      </span>
                                    ))}
                                    {inclusions.length > 2 && (
                                      <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        +{inclusions.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                )
                              } else {
                                return (
                                  <div className="text-[8px] text-gray-400 italic mt-0.5">
                                    Standard inclusions
                                  </div>
                                )
                              }
                            })()}
                          </div>
                        )}
                        {i.products_pending && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px]">Products pending</Badge>
                        )}
                        {/* Extra safas with calculation */}
                        {i.extra_safas > 0 && (
                          <div className="text-[9px] text-orange-700 font-medium bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            + {i.extra_safas} Extra × {formatCurrency(i.pkg.extra_safa_price)} = <span className="font-bold">{formatCurrency(i.extra_safas * i.pkg.extra_safa_price)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(i.id, i.quantity - 1)}>-</Button>
                          <span className="px-2">{i.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(i.id, i.quantity + 1)}>+</Button>
                        </div>
                        <div className="font-bold text-sm">{formatCurrency(i.total_price * i.quantity)}</div>
                      </div>
                    </div>
                  )})}
                </div>
                <div className="border-t pt-3 space-y-1 text-sm">
                  {/* Subtle context: resolved distance in km, for internal clarity */}
                  {selectedCustomer?.pincode ? (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Distance (from pincode {basePincode})</span>
                      <span>{Number(distanceKm) || 0} km</span>
                    </div>
                  ) : null}
                  {/* Hide explicit distance surcharge; show combined subtotal */}
                  {useCustomPricing && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      <div className="flex items-center gap-1 font-medium mb-1">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Custom Pricing</Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between"><span>Items Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                  
                  {!useCustomPricing && totals.manualDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formData.discount_type === 'percentage' ? `${formData.discount_amount}%` : 'Flat'})</span>
                      <span>-{formatCurrency(totals.manualDiscount)}</span>
                    </div>
                  )}
                  
                  {!useCustomPricing && totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({formData.coupon_code})</span>
                      <span>-{formatCurrency(totals.couponDiscount)}</span>
                    </div>
                  )}
                  
                  {!useCustomPricing && (totals.manualDiscount > 0 || totals.couponDiscount > 0) && (
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-medium">After Discounts</span>
                      <span className="font-medium">{formatCurrency(totals.subtotalAfterCoupon || totals.subtotal)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between"><span>GST (5%)</span><span>{formatCurrency(totals.gst)}</span></div>
                  
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                    <span>Grand Total</span>
                    <span>{formatCurrency(totals.grand)}</span>
                  </div>
                  
                  {!useCustomPricing && totals.securityDeposit > 0 && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      {DEPOSIT_POLICY.collectAt === 'booking' ? (
                        <div className="flex justify-between text-amber-700">
                          <span>{DEPOSIT_POLICY.label}</span>
                          <span>{formatCurrency(totals.depositDueNow)}</span>
                        </div>
                      ) : DEPOSIT_POLICY.collectAt === 'delivery' ? (
                        <div className="flex justify-between text-amber-700">
                          <span>{DEPOSIT_POLICY.label} (at delivery)</span>
                          <span>{formatCurrency(totals.depositDueLater)}</span>
                        </div>
                      ) : null}
                    </>
                  )}
                  
                  {!useCustomPricing && formData.payment_type === 'advance' && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="flex justify-between text-blue-600">
                        <span>Advance (50%)</span>
                        <span>{formatCurrency(totals.advanceDue)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Discount & Coupon Section */}
                <div className="space-y-4 pt-3 border-t">
                    {/* Manual Discount */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Discount (Optional)</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={formData.discount_type} 
                          onValueChange={(v: "flat" | "percentage") => setFormData(f => ({ ...f, discount_type: v }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">₹ Flat</SelectItem>
                            <SelectItem value="percentage">% Percent</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={formData.discount_amount || ""}
                          onChange={(e) => setFormData(f => ({ ...f, discount_amount: Number(e.target.value) || 0 }))}
                          placeholder={formData.discount_type === "flat" ? "Enter amount" : "Enter percentage"}
                          min={0}
                          max={formData.discount_type === "percentage" ? 100 : undefined}
                        />
                      </div>
                      {formData.discount_amount > 0 && (
                        <p className="text-xs text-green-600">
                          Discount: -{formatCurrency(totals.manualDiscount || 0)}
                        </p>
                      )}
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Coupon Code (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={formData.coupon_code}
                          onChange={(e) => {
                            setFormData(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))
                            setCouponError("")
                          }}
                          placeholder="Enter coupon code"
                          maxLength={50}
                          disabled={formData.coupon_discount > 0}
                        />
                        {formData.coupon_discount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemoveCoupon}
                            className="whitespace-nowrap"
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponValidating || !formData.coupon_code.trim()}
                            className="whitespace-nowrap"
                          >
                            {couponValidating ? "Validating..." : "Apply"}
                          </Button>
                        )}
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-600">{couponError}</p>
                      )}
                      {formData.coupon_discount > 0 && (
                        <p className="text-xs text-green-600">
                          Coupon Applied: -{formatCurrency(formData.coupon_discount)}
                        </p>
                      )}
                    </div>
                  </div>
                
                <div className="space-y-2 pt-3 border-t">
                    <Label className="text-xs">Payment Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["full","advance","partial"] as const).map(pt => (
                      <Button
                        key={pt}
                        size="sm"
                        type="button"
                        variant={formData.payment_type === pt ? "default" : "outline"}
                        onClick={() => setFormData(f => ({ ...f, payment_type: pt }))}
                      >
                        {pt.charAt(0).toUpperCase() + pt.slice(1)}
                      </Button>
                    ))}
                  </div>
                  {formData.payment_type === "partial" && (
                    <div className="mt-2">
                      <Label className="text-xs">Custom Amount</Label>
                      <Input
                        type="number"
                        value={formData.custom_amount}
                        onChange={e => setFormData(f => ({ ...f, custom_amount: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>
                  )}
                  <div className="mt-2 text-sm space-y-1">
                    <div className="flex justify-between text-xs text-gray-600"><span>Package now</span><span>{formatCurrency(totals.payable)}</span></div>
                    {totals.depositDueNow > 0 && (
                      <div className="flex justify-between text-xs text-gray-600"><span>{DEPOSIT_POLICY.label} now</span><span>{formatCurrency(totals.depositDueNow)}</span></div>
                    )}
                    <div className="flex justify-between"><span>Payable Now</span><span className="font-semibold">{formatCurrency(totals.payableNowTotal)}</span></div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between text-xs text-gray-600"><span>Package later</span><span>{formatCurrency(totals.remaining)}</span></div>
                    {totals.depositDueLater > 0 && (
                      <div className="flex justify-between text-xs text-amber-700"><span>{DEPOSIT_POLICY.label} at delivery</span><span>{formatCurrency(totals.depositDueLater)}</span></div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500"><span>Remaining</span><span>{formatCurrency(totals.remainingTotal)}</span></div>
                  </div>
                </div>
                {currentStep === 3 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Label className="text-xs">Sales Closed By</Label>
                    <Select 
                      value={selectedStaff || "none"} 
                      onValueChange={(val) => setSelectedStaff(val === "none" ? "" : val)}
                      onOpenChange={(open) => {
                        if (open) {
                          console.log("Staff dropdown opened, staffMembers:", staffMembers)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {staffMembers.length === 0 && (
                          <SelectItem value="no-staff" disabled>No staff members found</SelectItem>
                        )}
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role === 'franchise_admin' ? 'Admin' : 'Staff'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-gray-500 mt-1">Track which team member closed this sale for incentives</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="space-y-2">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" className="flex-1" onClick={handleBack} disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                {currentStep < 3 && (
                  <Button className="flex-1" onClick={handleNext} disabled={!canGoNext()}>
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
              {currentStep === 3 && (
                <div className="space-y-2">
                  <Button className="w-full" disabled={loading} onClick={() => handleSubmit(false)}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isEditMode ? 'Update Quote' : 'Create Booking'}
                  </Button>
                  {!isEditMode && (
                    <Button variant="outline" className="w-full" disabled={loading} onClick={() => handleSubmit(true)}>
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save as Quote
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Variant selection dialog (portal-like simple overlay) */}
      {variantDialogOpen && selectedPackageForVariants && (
        <VariantDialog
          pkg={selectedPackageForVariants!}
          onClose={() => { setVariantDialogOpen(false); setSelectedPackageForVariants(null) }}
          onAdd={(variant, extraSafas) => {
            if (selectedPackageForVariants) {
              addPackageItem(selectedPackageForVariants, variant, extraSafas).then((created) => {
                // Open product selection dialog after adding a variant
                setProductDialogContext({
                  pkg: selectedPackageForVariants,
                  variant,
                  eventDate: formData.event_date,
                  itemId: created.id,
                  distanceKm: Number(distanceKm) || 0,
                  pincode: selectedCustomer?.pincode
                })
                setProductDialogOpen(true)
              })
            }
            setVariantDialogOpen(false)
            setSelectedPackageForVariants(null)
          }}
        />
      )}

      {/* Product Selection Dialog */}
      {productDialogOpen && productDialogContext && (
        <ProductSelectionDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          context={productDialogContext}
        />
      )}
    </div>
  )
}

interface VariantDialogProps { pkg: PackageSet; onClose: () => void; onAdd: (variant: PackageVariant, extraSafas: number) => void }
function VariantDialog({ pkg, onClose, onAdd }: VariantDialogProps) {
  const [extraSafas, setExtraSafas] = useState<Record<string, number>>({})
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{pkg.name}</h2>
            <p className="text-xs text-gray-500 mt-1">Base Price: {formatCurrency(pkg.base_price)} • Extra Safa: {formatCurrency(pkg.extra_safa_price)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {pkg.package_variants.length === 0 && (
            <div className="text-sm text-gray-500">No variants available.</div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {pkg.package_variants.map(v => {
              const safas = extraSafas[v.id] || 0
              const inclusions: string[] = Array.isArray((v as any).inclusions)
                ? ((v as any).inclusions as string[])
                : typeof (v as any).inclusions === 'string'
                  ? ((v as any).inclusions as string).split(',').map(s => s.trim()).filter(Boolean)
                  : []
              return (
                <div key={v.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-base text-green-800">{v.name || v.variant_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Variant Price: {formatCurrency(v.base_price)}</div>
                    </div>
                    <Badge variant="outline" className="text-sm font-medium">{formatCurrency(pkg.base_price + v.base_price)}</Badge>
                  </div>
                  {inclusions.length > 0 && (
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium mb-1">Includes:</div>
                      <div className="flex flex-wrap gap-1">
                        {inclusions.map((inc, idx) => (
                          <span key={idx} className="px-2 py-0.5 border rounded text-[10px] bg-gray-50 truncate max-w-[180px]" title={inc}>{inc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px]">
                    <Input
                      type="number"
                      min={0}
                      value={safas}
                      onChange={e => setExtraSafas(prev => ({ ...prev, [v.id]: Math.max(0, Number(e.target.value)) }))}
                      className="h-8 w-20"
                      placeholder="Extra"
                    />
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setExtraSafas(prev => ({ ...prev, [v.id]: safas + 10 }))}>+10</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setExtraSafas(prev => ({ ...prev, [v.id]: safas + 20 }))}>+20</Button>
                    </div>
                    {pkg.extra_safa_price > 0 && <span className="text-gray-500">{formatCurrency(pkg.extra_safa_price)} per extra safa</span>}
                  </div>
                  <Button size="sm" className="w-full" onClick={() => onAdd(v, safas)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Variant
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// --- Product Selection Dialog ---
interface ProductSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: { pkg: PackageSet; variant: PackageVariant; eventDate?: string; itemId?: string; distanceKm?: number; pincode?: string } | null
}

function ProductSelectionDialog({ open, onOpenChange, context }: ProductSelectionDialogProps) {
  if (!context) return null
  type ProductRow = { id: string; name: string; image_url?: string; category?: string; category_id?: string | null; subcategory?: string | null; subcategory_id?: string | null; stock_available?: number; price?: number; rental_price?: number; barcode?: string | null; product_code?: string | null }
  const [products, setProducts] = useState<ProductRow[]>([])
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; label: string }[]>([])
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null)
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true)
  const [availabilityModalFor, setAvailabilityModalFor] = useState<{ id: string; name: string } | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityRows, setAvailabilityRows] = useState<{ date: string; kind: 'order' | 'package'; ref?: string; qty: number; returnStatus?: 'returned' | 'in_progress'; returnDate?: string }[]>([])

  useEffect(() => {
    const load = async () => {
      // Load products with images and categories (no hard dependency on is_active column)
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,category,category_id,subcategory,subcategory_id,stock_available,price,rental_price,barcode,product_code")
        .order("name")
      let rows: ProductRow[] = (data || []) as any
      // Normalize: if legacy 'category' holds a UUID, treat it as category_id
      rows = rows.map(r => {
        const looksUUID = typeof r.category === 'string' && /^[0-9a-fA-F\-]{32,36}$/.test(r.category)
        return looksUUID && !r.category_id ? { ...r, category_id: r.category } : r
      })
      // Map subcategory_id -> subcategory name when text is missing
      const subIds = Array.from(new Set(rows.map(r => r.subcategory_id).filter(Boolean))) as string[]
      if (subIds.length > 0) {
        const { data: subRows } = await supabase.from('product_categories').select('id,name').in('id', subIds)
        const subMap = new Map<string, string>((subRows || []).map((s: any) => [s.id as string, (s as any).name as string]))
        rows = rows.map(r => (!r.subcategory && r.subcategory_id && subMap.get(r.subcategory_id)) ? { ...r, subcategory: subMap.get(r.subcategory_id)! } : r)
      }
      setProducts(rows)

      // Build category options from category_ids and legacy text categories
      const ids = Array.from(new Set(rows.map(r => r.category_id).filter(Boolean))) as string[]
      const legacyLabels = Array.from(
        new Set(
          rows
            .filter(r => r.category && (!r.category_id))
            .map(r => r.category as string)
        )
      )
      let options: { key: string; label: string }[] = []
      if (ids.length > 0) {
  const { data: catRows } = await supabase.from('product_categories').select('id,name').in('id', ids)
  const mapped = (catRows || []).map((c: any) => ({ key: c.id as string, label: (c as any).name as string }))
        options = options.concat(mapped)
      }
      if (legacyLabels.length > 0) {
        options = options.concat(legacyLabels.map(l => ({ key: `legacy:${l}`, label: l })))
      }
      // Dedupe and sort
      const seen = new Set<string>()
      options = options.filter(o => {
        const k = `${o.key}|${o.label}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      }).sort((a, b) => a.label.localeCompare(b.label))
      setCategoryOptions(options)
      if (options.length > 0 && !selectedCategoryKey) setSelectedCategoryKey(options[0].key)

      // Build subcategory options for current category
      const subSet = new Set<string>()
      const consider = selectedCategoryKey
        ? rows.filter(r => selectedCategoryKey.startsWith('legacy:')
            ? (r.category || '') === selectedCategoryKey.substring('legacy:'.length) && !r.category_id
            : (r.category_id || (typeof r.category === 'string' && /^[0-9a-fA-F\-]{32,36}$/.test(r.category) ? r.category : '')) === selectedCategoryKey)
        : rows
      consider.forEach(r => { if (r.subcategory) subSet.add(r.subcategory) })
      setSubCategoryOptions(Array.from(subSet).sort((a,b) => a.localeCompare(b)))

    }
    if (open) load()
  }, [open])

  // Recompute subcategory options whenever category selection or products change
  useEffect(() => {
    if (!open) return
    const subSet = new Set<string>()
    const rows = products
    const consider = selectedCategoryKey
      ? rows.filter(r => selectedCategoryKey.startsWith('legacy:')
          ? (r.category || '') === selectedCategoryKey.substring('legacy:'.length) && !r.category_id
          : (r.category_id || (typeof r.category === 'string' && /^[0-9a-fA-F\-]{32,36}$/.test(r.category) ? r.category : '')) === selectedCategoryKey)
      : rows
    consider.forEach(r => { if (r.subcategory) subSet.add(r.subcategory) })
    const options = Array.from(subSet).sort((a,b) => a.localeCompare(b))
    setSubCategoryOptions(options)
    if (selectedSubCategory && !options.includes(selectedSubCategory)) {
      setSelectedSubCategory(null)
    }
  }, [open, selectedCategoryKey, products])

  // On-demand availability fetch for a single product around event date (5-day window)
  const checkAvailability = async (productId: string, productName: string) => {
    setAvailabilityModalFor({ id: productId, name: productName })
    setAvailabilityLoading(true)
    setAvailabilityRows([])
    try {
      const base = context?.eventDate ? new Date(context.eventDate) : new Date()
      const start = new Date(base); start.setDate(start.getDate() - 2)
      const end = new Date(base); end.setDate(end.getDate() + 2)
      const startISO = start.toISOString(); const endISO = end.toISOString()

      const { data: orderItems } = await supabase
        .from('product_order_items')
        .select('product_id, quantity, order:product_orders(id, event_date, delivery_date, return_date, order_number, status)')
        .eq('product_id', productId)

      // Get order IDs for barcode status check
      const orderIds = (orderItems || [])
        .map((item: any) => item.order?.id)
        .filter(Boolean)

      console.log('[Book Package Availability] Order IDs:', orderIds)

      // Fetch barcode assignments to determine return status
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('booking_barcode_assignments')
        .select('booking_id, status, returned_at')
        .in('booking_id', orderIds)
        .eq('booking_type', 'product')

      console.log('[Book Package Availability] Barcode data:', barcodeData)
      console.log('[Book Package Availability] Barcode error:', barcodeError)

      // Create return status map
      const returnStatusMap = new Map<string, { returned: number; pending: number; returnDate?: string }>()
      barcodeData?.forEach((bc: any) => {
        if (!returnStatusMap.has(bc.booking_id)) {
          returnStatusMap.set(bc.booking_id, { returned: 0, pending: 0 })
        }
        const stats = returnStatusMap.get(bc.booking_id)!
        if (bc.status === 'returned' || bc.status === 'completed') {
          stats.returned++
        } else {
          stats.pending++
        }
      })

      console.log('[Book Package Availability] Return status map:', Array.from(returnStatusMap.entries()))

      const rows: { date: string; kind: 'order' | 'package'; ref?: string; qty: number; returnStatus?: 'returned' | 'in_progress'; returnDate?: string }[] = []
      const within = (iso?: string | null) => iso ? (new Date(iso) >= new Date(startISO) && new Date(iso) <= new Date(endISO)) : false
      const overlap = (a?: string | null, b?: string | null) => {
        const s = a ? new Date(a) : null; const e = b ? new Date(b) : null
        const S = new Date(startISO); const E = new Date(endISO)
        if (!s && !e) return false
        const from = s ?? e!; const to = e ?? s!
        return from <= E && to >= S
      }
      for (const r of (orderItems || []) as any[]) {
        const st = r.order?.status
        if (!st || ['cancelled'].includes(st)) continue
        const d = r.order?.event_date
        const hit = d ? within(d) : overlap(r.order?.delivery_date, r.order?.return_date)
        if (!hit) continue
        
        // Determine return status
        const orderId = r.order?.id
        const barcodeStats = orderId ? returnStatusMap.get(orderId) : undefined
        let returnStatus: 'returned' | 'in_progress' | undefined
        if (barcodeStats) {
          if (barcodeStats.pending > 0) {
            returnStatus = 'in_progress'
          } else if (barcodeStats.returned > 0) {
            returnStatus = 'returned'
          }
        }
        
        console.log('[Book Package Availability] Order:', r.order?.order_number, 'Status:', returnStatus, 'Stats:', barcodeStats)
        
        rows.push({ 
          date: d || r.order?.delivery_date || r.order?.return_date, 
          kind: 'order', 
          ref: r.order?.order_number, 
          qty: Number(r.quantity)||0,
          returnStatus,
          returnDate: r.order?.return_date
        })
      }
      rows.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      console.log('[Book Package Availability] Final rows:', rows)
      setAvailabilityRows(rows)
    } catch (e) {
      setAvailabilityRows([])
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const setQty = (id: string, qty: number) => setSelection(prev => ({ ...prev, [id]: Math.max(0, qty) }))

  const filtered = useMemo(() => {
    let rows = products
    if (selectedCategoryKey) {
      if (selectedCategoryKey.startsWith('legacy:')) {
        const label = selectedCategoryKey.substring('legacy:'.length)
        rows = rows.filter(p => (p.category || '') === label && !p.category_id)
      } else {
        rows = rows.filter(p => (p.category_id || (typeof p.category === 'string' && /^[0-9a-fA-F\-]{32,36}$/.test(p.category) ? p.category : '')) === selectedCategoryKey)
      }
    }
    if (selectedSubCategory) {
      rows = rows.filter(p => (p.subcategory || '') === selectedSubCategory)
    }
    if (onlyInStock) rows = rows.filter(p => (p.stock_available ?? 0) > 0)
    if (search) {
      const q = search.toLowerCase().trim()
      rows = rows.filter(p => (
        p.name.toLowerCase().includes(q) ||
        (p.barcode ? String(p.barcode).toLowerCase().includes(q) : false) ||
        (p.product_code ? String(p.product_code).toLowerCase().includes(q) : false)
      ))
    }
    return rows
  }, [products, selectedCategoryKey, selectedSubCategory, onlyInStock, search])

  const totalSelected = Object.values(selection).reduce((a, b) => a + (b || 0), 0)

  const selectedList = useMemo(() => {
    const map: { id: string; name: string; qty: number; image_url?: string }[] = []
    for (const [pid, qty] of Object.entries(selection)) {
      if (!qty) continue
      const p = products.find(x => x.id === pid)
      if (!p) continue
      map.push({ id: pid, name: p.name, qty, image_url: p.image_url })
    }
    return map
  }, [selection, products])

  const handleSave = async () => {
    if (totalSelected === 0) { onOpenChange(false); return }
    setSaving(true)
    try {
      // NOTE: Inventory update is temporarily disabled here
      // TODO: Implement proper product-booking linkage and only update inventory for confirmed bookings
      // For now, products are informational only and don't affect inventory
      toast.success("Products selected successfully (inventory not affected)")
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e.message || "Unable to save selection")
    } finally {
      setSaving(false)
    }
  }

  const variantInclusions: string[] = Array.isArray((context.variant as any).inclusions)
    ? ((context.variant as any).inclusions as string[])
    : typeof (context.variant as any).inclusions === "string"
      ? ((context.variant as any).inclusions as string).split(",").map((s: string) => s.trim()).filter(Boolean)
      : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[1400px]">
        <DialogHeader>
          <DialogTitle>
            {`Select Products for ${context.pkg.name}${(context.variant as any)?.name || (context.variant as any)?.variant_name ? ` – ${(context.variant as any).name || (context.variant as any).variant_name}` : ''}`}
            {context.eventDate ? (
              <span className="ml-2 text-xs text-gray-500">Availability window: {new Date(new Date(context.eventDate).setDate(new Date(context.eventDate).getDate()-2)).toLocaleDateString()} → {new Date(new Date(context.eventDate).setDate(new Date(context.eventDate).getDate()+2)).toLocaleDateString()}</span>
            ) : (
              <span className="ml-2 text-xs text-orange-600">Set event date to check availability</span>
            )}
            {/* Show pincode and distance context for pricing */}
            <span className="block mt-1 text-xs text-gray-600">
              Pricing context: Pincode-driven distance applied
              {typeof context.distanceKm === 'number' && context.pincode ? (
                <>
                  {" "}• {context.distanceKm} km (from pincode {context.pincode})
                </>
              ) : null}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Products pane */}
          <div className="lg:col-span-2 flex flex-col min-h-[70vh]">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border rounded-md p-3 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {categoryOptions.map(opt => {
                    const count = products.filter(p => {
                      if (opt.key.startsWith('legacy:')) {
                        const label = opt.key.substring('legacy:'.length)
                        return (p.category || '') === label && !p.category_id
                      }
                      const cid = (p.category_id || (typeof p.category === 'string' && /^[0-9a-fA-F\-]{32,36}$/.test(p.category) ? p.category : ''))
                      return cid === opt.key
                    }).length
                    return (
                      <Button key={opt.key} size="sm" variant={selectedCategoryKey === opt.key ? "default" : "outline"} onClick={() => setSelectedCategoryKey(opt.key)}>
                        {opt.label}
                        <span className="ml-1 text-[10px] px-1 rounded bg-gray-100 text-gray-700">{count}</span>
                      </Button>
                    )
                  })}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
                    <input type="checkbox" className="accent-black" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                    Only in stock
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-8 w-56"
                      placeholder="Search products / barcode / code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const q = search.trim().toLowerCase()
                          if (!q) return
                          const exact = products.find(p => (p.barcode && String(p.barcode).toLowerCase() === q) || (p.product_code && String(p.product_code).toLowerCase() === q))
                          if (exact) {
                            setSelection(prev => ({ ...prev, [exact.id]: (prev[exact.id] || 0) + 1 }))
                            setSearch("")
                            toast.success(`Added ${exact.name}`)
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              {subCategoryOptions.length > 0 && (
                <div className="mt-3 flex items-center gap-2 overflow-x-auto">
                  <Button size="sm" variant={!selectedSubCategory ? 'default' : 'outline'} onClick={() => setSelectedSubCategory(null)}>All Subcategories</Button>
                  {subCategoryOptions.map(sc => (
                    <Button key={sc} size="sm" variant={selectedSubCategory === sc ? 'default' : 'outline'} onClick={() => setSelectedSubCategory(sc)}>{sc}</Button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-auto pr-1">
              {filtered.map(p => {
                const qty = selection[p.id] || 0
                return (
                  <Card key={p.id} className="group p-0 overflow-hidden">
                    <div className="aspect-square w-full bg-gray-50 border-b overflow-hidden">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[11px] text-gray-400">No Image</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate" title={p.name}>{p.name}</div>
                          <div className="text-[11px] text-gray-500">Stock: {p.stock_available ?? 0}</div>
                        </div>
                        <div className="text-xs font-medium whitespace-nowrap"></div>
                      </div>
                      <div className="text-[11px] flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => checkAvailability(p.id, p.name)}>Check availability</Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-gray-600">Qty</div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 0}>-</Button>
                          <Input className="h-8 w-16 text-center" type="number" min={0} value={qty} onChange={e => setQty(p.id, Math.max(0, Number(e.target.value)))} />
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p.id, qty + 1)}>+</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
              {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No matching products.</div>}
            </div>
          </div>

          {/* Right: Inclusions & summary */}
          <div className="space-y-4 min-h-[60vh] flex flex-col">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Variant Inclusions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {variantInclusions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {variantInclusions.map((inc, idx) => (
                      <span key={idx} className="px-2 py-1 border rounded text-xs bg-gray-50">{inc}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No inclusions listed for this variant.</div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Selected Items ({totalSelected})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-auto pr-1">
                {selectedList.length > 0 ? (
                  selectedList.map(item => (
                    <div key={item.id} className="flex items-center gap-3 border rounded p-2">
                      <div className="h-10 w-10 rounded bg-gray-50 overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" title={item.name}>{item.name}</div>
                        <div className="text-[11px] text-gray-500">Qty: {item.qty}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelection(prev => { const { [item.id]:_, ...rest } = prev; return rest })} title="Remove">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No items selected yet.</div>
                )}
              </CardContent>
              <div className="px-6 py-3 border-t flex items-center justify-between">
                <button className="text-xs text-gray-600 underline" onClick={() => setSelection({})} disabled={totalSelected === 0}>Clear</button>
                <div className="text-sm text-gray-500">&nbsp;</div>
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.message("Product selection skipped", { description: "You can add items later from the package wizard." })
                  // Mark the related booking item as products pending (if known)
                  if (context?.itemId) {
                    // update bookingItems state in parent via custom event
                    const ev = new CustomEvent('pkg-products-skipped', { detail: { itemId: context.itemId } })
                    window.dispatchEvent(ev)
                  }
                  onOpenChange(false)
                }}
              >
                Skip
              </Button>
              <Button onClick={handleSave} disabled={saving || totalSelected === 0}>
                {saving ? "Saving..." : `Reserve ${totalSelected} Item${totalSelected>1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      {/* Availability Modal */}
      {availabilityModalFor && (
        <Dialog open={true} onOpenChange={() => setAvailabilityModalFor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Availability for {availabilityModalFor.name}</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <div className="text-xs text-gray-600">Checking 5-day window around event date.</div>
              {availabilityLoading ? (
                <div className="text-sm">Loading...</div>
              ) : availabilityRows.length === 0 ? (
                <div className="text-sm text-green-700">Great choice! No bookings in the last/next 2 days. You can select this product.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {availabilityRows.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[12px] flex-wrap bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{new Date(r.date).toLocaleDateString()} • {r.kind === 'order' ? 'Order' : 'Package'} {r.ref || ''}</span>
                        <span className="font-medium">×{r.qty}</span>
                        
                        {/* Return Status Badges */}
                        {r.returnStatus === 'returned' && (
                          <Badge variant="default" className="bg-green-500 text-white text-[10px] px-1.5 py-0 h-4">
                            Returned
                          </Badge>
                        )}
                        {r.returnStatus === 'in_progress' && (
                          <>
                            <Badge variant="secondary" className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">
                              In Progress
                            </Badge>
                            {r.returnDate && (
                              <span className="text-[10px] text-orange-600 font-medium">
                                Return: {new Date(r.returnDate).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            )}
                          </>
                        )}
                        
                        {/* Debug: Show if no barcode data */}
                        {!r.returnStatus && (
                          <span className="text-[9px] text-gray-400 italic">No tracking</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setAvailabilityModalFor(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
