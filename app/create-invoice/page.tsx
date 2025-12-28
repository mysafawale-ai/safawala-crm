"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Download,
  Save,
  Printer,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Package,
  AlertTriangle,
  Check,
  Loader2,
  Send,
  X,
  Minus,
  Tag,
  FileCheck,
  Camera,
  ImageIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import Link from "next/link"
import { ProductSelector } from "@/components/products/product-selector"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase as supabaseClient } from "@/lib/supabase"
import { fetchProductsWithBarcodes } from "@/lib/product-barcode-service"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

interface Product {
  id: string
  name: string
  barcode?: string
  product_code?: string
  category?: string
  category_id?: string
  subcategory_id?: string
  image_url?: string
  rental_price: number
  sale_price?: number
  security_deposit: number
  stock_available: number
  all_barcode_numbers?: string[]
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
}

interface InvoiceItem {
  id: string
  product_id: string
  product_name: string
  barcode?: string
  category?: string
  image_url?: string
  quantity: number
  unit_price: number
  total_price: number
  is_damaged?: boolean
  damage_charge?: number
  is_lost?: boolean
  lost_charge?: number
}

interface LostDamagedItem {
  id: string
  product_id: string
  product_name: string
  barcode?: string
  type: "lost" | "damaged"
  quantity: number
  charge_per_item: number
  total_charge: number
  notes?: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Mode: 'new' | 'edit' | 'quote' | 'final-bill'
  const mode = searchParams.get("mode") || "new"
  const orderId = searchParams.get("id")

  // Company Settings for PDF
  const [companySettings, setCompanySettings] = useState<any>(null)

  // Franchise ID for data isolation
  const [franchiseId, setFranchiseId] = useState<string | null>(null)

  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [lostDamagedProductSearch, setLostDamagedProductSearch] = useState<string | null>(null) // ID of item being searched
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [subcategories, setSubcategories] = useState<Array<{id: string, name: string, parent_id: string}>>([])
  const [showCustomProductDialog, setShowCustomProductDialog] = useState(false)
  const [customProductData, setCustomProductData] = useState({ name: '', category_id: '', image_url: '', price: '' })
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [skipProductSelection, setSkipProductSelection] = useState(false)
  const [useCustomPackagePrice, setUseCustomPackagePrice] = useState(false)
  const [customPackagePrice, setCustomPackagePrice] = useState(0)
  const [isDepositRefunded, setIsDepositRefunded] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  
  // Selection Mode: "products" = individual products, "package" = package with products inside
  const [selectionMode, setSelectionMode] = useState<"products" | "package">("products")
  
  // Package Selection State
  const [packages, setPackages] = useState<any[]>([])
  const [packagesCategories, setPackagesCategories] = useState<any[]>([])
  const [selectedPackageCategory, setSelectedPackageCategory] = useState<string>("")
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null)
  const [selectedPackageVariant, setSelectedPackageVariant] = useState<any | null>(null)
  const [packagesLoading, setPackagesLoading] = useState(false)

  // Invoice Data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [lostDamagedItems, setLostDamagedItems] = useState<LostDamagedItem[]>([])
  
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: "",
    invoice_type: "rental" as "rental" | "sale",
    event_type: "wedding" as "wedding" | "engagement" | "reception" | "other",
    event_participant: "both" as "both" | "groom" | "bride",
    event_date: "",
    event_time: "",
    delivery_date: "",
    delivery_time: "",
    return_date: "",
    return_time: "",
    venue_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    bride_address: "",
    payment_method: "Cash / Offline Payment" as "UPI / QR Payment" | "Bank Transfer" | "Debit / Credit Card" | "Cash / Offline Payment" | "International Payment",
    amount_paid: 0,
    security_deposit: 0,
    gst_percentage: 5,
    discount_amount: 0,
    discount_type: "fixed" as "fixed" | "percentage",
    coupon_code: "",
    coupon_discount: 0,
    sales_closed_by_id: "",
    notes: "",
  })

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  })

  // Generate invoice number based on stored sequences
  useEffect(() => {
    if (mode === "new" && !invoiceData.invoice_number) {
      loadNextInvoiceNumber()
    }
  }, [mode])

  // Load next invoice number from sequence
  const loadNextInvoiceNumber = async () => {
    try {
      // Get current user to get franchise_id
      const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
      const user = userRes.ok ? await userRes.json() : null
      const userFranchiseId = user?.franchise_id
      setFranchiseId(userFranchiseId) // Store in state for later use

      if (!userFranchiseId) {
        console.warn("[CreateInvoice] No franchise_id found, using default ORD001")
        setInvoiceData(prev => ({
          ...prev,
          invoice_number: "ORD001"
        }))
        return
      }

      const response = await fetch(`/api/invoice-sequences?franchise_id=${userFranchiseId}`, {
        cache: "no-store"
      })

      if (!response.ok) {
        console.warn("[CreateInvoice] Failed to load sequence, using default ORD001")
        setInvoiceData(prev => ({
          ...prev,
          invoice_number: "ORD001"
        }))
        return
      }

      const { next_invoice_number } = await response.json()
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: next_invoice_number || "ORD001"
      }))
    } catch (error) {
      console.error("[CreateInvoice] Error loading next invoice number:", error)
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: "ORD001"
      }))
    }
  }

  // Load customers and products
  useEffect(() => {
    loadCustomers()
    loadProductsAndCategories()
    loadStaffMembers()
    loadCompanySettings()
  }, [])

  // Load company settings for PDF header
  const loadCompanySettings = async () => {
    try {
      const response = await fetch("/api/company-settings", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      }
    } catch (error) {
      console.error("[CreateInvoice] Failed to load company settings:", error)
    }
  }

  // Load existing order if editing
  useEffect(() => {
    if (orderId && mode !== "new") {
      loadExistingOrder(orderId)
    }
  }, [orderId, mode])

  const loadCustomers = async () => {
    setCustomersLoading(true)
    try {
      // Try without basic=1 first (respects permissions)
      let response = await fetch("/api/customers", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      })

      // If 403 (permission denied), try with basic=1
      if (response.status === 403) {
        console.log("[CreateInvoice] Permission denied, trying with ?basic=1")
        response = await fetch("/api/customers?basic=1", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        })
      }

      if (!response.ok) {
        console.error("[CreateInvoice] Failed to fetch customers:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("[CreateInvoice] Error response:", errorText)
        setCustomers([])
        return
      }

      const result = await response.json()
      console.log("[CreateInvoice] Raw API response:", result)
      // Handle multiple response formats
      let data = []
      if (result?.data && Array.isArray(result.data)) {
        data = result.data
      } else if (Array.isArray(result)) {
        data = result
      }
      console.log("[CreateInvoice] Loaded customers:", Array.isArray(data) ? data.length : 0)
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[CreateInvoice] Error loading customers:", error)
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }

  const loadProductsAndCategories = async () => {
    try {
      // Get current user to get franchise_id
      const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
      const user = userRes.ok ? await userRes.json() : null
      const franchiseId = user?.franchise_id

      console.log("[CreateInvoice] Loading products for franchise:", franchiseId)

      // Fetch products with barcodes (same as create-product-order)
      const productsWithBarcodes = await fetchProductsWithBarcodes(franchiseId)
      
      // Map to Product interface
      const mappedProducts = productsWithBarcodes.map(p => ({
        id: p.id,
        name: p.name,
        category: '', // Will fill from category_id lookup
        category_id: p.category_id,
        subcategory_id: undefined,
        rental_price: p.rental_price || 0,
        sale_price: p.sale_price || 0,
        security_deposit: p.security_deposit || 0,
        stock_available: p.stock_available || 0,
        image_url: (p as any).image_url || undefined,
        barcode: (p as any).barcode || (p as any).barcode_number || null || undefined,
        product_code: p.product_code || undefined,
        all_barcode_numbers: p.all_barcode_numbers || []
      }))

      setProducts(mappedProducts)
      console.log("[CreateInvoice] Loaded products:", mappedProducts.length)

      // Fetch categories
      const { data: categoriesData } = await supabaseClient
        .from('product_categories')
        .select('*')
        .order('name')

      if (categoriesData) {
        const mainCats = categoriesData.filter((c: any) => !c.parent_id) || []
        const subCats = categoriesData.filter((c: any) => c.parent_id) || []
        setCategories(mainCats.map((c: any) => ({ id: c.id, name: c.name })))
        setSubcategories(subCats.map((c: any) => ({ id: c.id, name: c.name, parent_id: c.parent_id })))
        console.log("[CreateInvoice] Loaded categories:", mainCats.length, "subcategories:", subCats.length)
      }
    } catch (error) {
      console.error("[CreateInvoice] Error loading products and categories:", error)
    }
  }

  // Load packages for package selection mode (using same APIs as book-package)
  const loadPackages = async () => {
    setPackagesLoading(true)
    try {
      // Get current user to get franchise_id
      const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
      const user = userRes.ok ? await userRes.json() : null
      const franchiseId = user?.franchise_id
      
      console.log("[CreateInvoice] Loading packages for franchise:", franchiseId)

      // Fetch categories and variants using the same APIs as book-package
      const [catResponse, variantResponse] = await Promise.all([
        fetch('/api/packages/categories', { cache: 'no-store' }),
        fetch('/api/packages/variants', { cache: 'no-store' }),
      ])

      // Process variants first to know which categories have packages for this franchise
      let filteredVariants: any[] = []
      const categoryIdsWithPackages = new Set<string>()
      
      if (variantResponse.ok) {
        const variantJson = await variantResponse.json()
        filteredVariants = variantJson?.data || []
        
        // Collect category IDs that have variants for this franchise
        filteredVariants.forEach((variant: any) => {
          if (variant.category_id) {
            categoryIdsWithPackages.add(variant.category_id)
          }
        })
        
        console.log("[CreateInvoice] Loaded package variants:", filteredVariants.length)
        console.log("[CreateInvoice] Categories with packages:", Array.from(categoryIdsWithPackages))
        
        if (filteredVariants.length === 0) {
          console.warn("[CreateInvoice] ⚠️ No packages returned from API. This could mean:")
          console.warn("  1. No package variants exist for your franchise")
          console.warn("  2. All variants have a different franchise_id")
          console.warn("  3. Variants API returned an error")
        }
        
        // Debug log
        if (filteredVariants.length > 0) {
          console.log("[CreateInvoice] Sample variant:", filteredVariants[0])
          console.log("[CreateInvoice] Variant columns:", Object.keys(filteredVariants[0]).join(", "))
        }
      } else {
        console.error("[CreateInvoice] Error loading package variants:", variantResponse.status)
        const errText = await variantResponse.text().catch(() => "")
        console.error("[CreateInvoice] Response:", errText)
      }

      // Process categories - filter to only show categories that have packages for this franchise
      if (catResponse.ok) {
        const catJson = await catResponse.json()
        const allCategories = catJson?.data || []
        
        // Only keep categories that have packages/variants for this franchise
        const filteredCategories = allCategories.filter((cat: any) => 
          categoryIdsWithPackages.has(cat.id)
        )
        
        setPackagesCategories(filteredCategories)
        console.log(
          "[CreateInvoice] Loaded package categories:", 
          filteredCategories.length, 
          "out of", 
          allCategories.length, 
          "total"
        )
      } else {
        console.error("[CreateInvoice] Error loading package categories:", catResponse.status)
      }
      
      // Set the packages/variants
      setPackages(filteredVariants)
    } catch (error) {
      console.error("[CreateInvoice] Error loading packages:", error)
    } finally {
      setPackagesLoading(false)
    }
  }

  // Load packages when selection mode changes to "package" and for rentals
  useEffect(() => {
    if (selectionMode === "package" && invoiceData.invoice_type === "rental") {
      loadPackages()
    }
  }, [selectionMode, invoiceData.invoice_type])

  // Create custom product
  const handleCreateCustomProduct = async () => {
    if (!customProductData.name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" })
      return
    }
    if (!customProductData.category_id) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" })
      return
    }
    if (!customProductData.price || parseFloat(customProductData.price) <= 0) {
      toast({ title: "Error", description: "Please enter a valid price", variant: "destructive" })
      return
    }
    
    setCreatingProduct(true)
    try {
      let imageUrl: string | null = customProductData.image_url

      // Upload image to storage if it's a base64 string
      if (imageUrl && imageUrl.startsWith('data:image')) {
        try {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(7)
          const fileExt = blob.type.split('/')[1] || 'jpg'
          const fileName = `product-${timestamp}-${randomStr}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, blob, {
              contentType: blob.type,
              cacheControl: '3600',
              upsert: true
            })
          
          if (uploadError) throw uploadError
          
          const { data: { publicUrl } } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName)
          
          imageUrl = publicUrl
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError)
          imageUrl = null
        }
      }

      const productCode = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`

      let createdByFranchiseId: string | null = null
      try {
        const ures = await fetch('/api/auth/user', { cache: 'no-store' })
        if (ures.ok) {
          const ujson = await ures.json()
          createdByFranchiseId = ujson?.franchise_id || null
        }
      } catch (e) {
        console.error('Failed to get user franchise:', e)
      }

      const priceValue = parseFloat(customProductData.price) || 0

      const basePayload: any = {
        name: customProductData.name.trim(),
        category_id: customProductData.category_id,
        image_url: imageUrl || null,
        rental_price: priceValue,
        sale_price: priceValue,
        price: priceValue,
        security_deposit: 0,
        stock_available: 100,
        is_active: true,
        product_code: productCode,
        description: 'Custom product',
        franchise_id: createdByFranchiseId
      }

      const { data: product, error } = await supabaseClient
        .from('products')
        .insert(basePayload)
        .select()
        .single()
      
      if (error) throw error
      
      // Add to products list and immediately add to invoice
      setProducts(prev => [...prev, product as any])
      addProduct(product as Product)
      
      toast({ title: "Success", description: `Product "${product.name}" created and added!` })
      
      setCustomProductData({ name: '', category_id: '', image_url: '', price: '' })
      setShowCustomProductDialog(false)
    } catch (e: any) {
      console.error('Failed to create product:', e)
      toast({ title: "Error", description: e.message || "Failed to create product", variant: "destructive" })
    } finally {
      setCreatingProduct(false)
    }
  }

  const loadStaffMembers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, name, email, role")
      .in("role", ["admin", "staff", "manager"])
      .order("name")
    if (data) setStaffMembers(data)
  }

  const loadExistingOrder = async (id: string) => {
    setLoading(true)
    try {
      console.log("[EditOrder] Loading order:", id)
      
      // Fetch order first (without joins that might fail)
      const { data: order, error: orderError } = await supabase
        .from("product_orders")
        .select("*")
        .eq("id", id)
        .single()

      if (orderError) {
        console.error("[EditOrder] Error fetching order:", orderError)
        toast({ title: "Error", description: "Failed to load order", variant: "destructive" })
        setLoading(false)
        return
      }

      if (!order) {
        console.error("[EditOrder] Order not found:", id)
        toast({ title: "Error", description: "Order not found", variant: "destructive" })
        setLoading(false)
        return
      }

      console.log("[EditOrder] Order data:", order)

      // Fetch customer separately
      let customer = null
      if (order.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, phone, email, address, city, state, pincode")
          .eq("id", order.customer_id)
          .single()
        
        if (!customerError && customerData) {
          customer = customerData
          console.log("[EditOrder] Customer loaded:", customerData.name)
        } else {
          console.warn("[EditOrder] Could not load customer:", customerError)
        }
      }

      // Fetch order items separately
      const { data: orderItems, error: itemsError } = await supabase
        .from("product_order_items")
        .select(`
          id, product_id, quantity, unit_price, total_price,
          products (id, name, barcode, product_code, category, image_url, rental_price, sale_price, stock_available)
        `)
        .eq("order_id", order.id)

      if (itemsError) {
        console.warn("[EditOrder] Could not load items:", itemsError)
      }

      // Set customer
      if (customer) {
        setSelectedCustomer(customer)
      }
        
      // Auto-fill all invoice data from existing order
      setInvoiceData({
        invoice_number: order.order_number || "",
        invoice_type: order.booking_type || "rental",
        event_type: order.event_type || "wedding",
        event_participant: order.event_participant || "both",
        event_date: order.event_date || "",
        event_time: order.event_time || "",
        delivery_date: order.delivery_date || "",
        delivery_time: order.delivery_time || "",
        return_date: order.return_date || "",
        return_time: order.return_time || "",
        venue_address: order.venue_address || "",
        groom_name: order.groom_name || "",
        groom_whatsapp: order.groom_whatsapp || "",
        groom_address: order.groom_address || "",
        bride_name: order.bride_name || "",
        bride_whatsapp: order.bride_whatsapp || "",
        bride_address: order.bride_address || "",
        payment_method: order.payment_method || "Cash / Offline Payment",
        amount_paid: order.amount_paid || 0,
        security_deposit: order.security_deposit || 0,
        gst_percentage: order.gst_percentage || 5,
        discount_amount: order.discount_amount || 0,
        discount_type: "fixed",
        coupon_code: order.coupon_code || "",
        coupon_discount: order.coupon_discount || 0,
        sales_closed_by_id: order.sales_closed_by_id || "",
        notes: order.notes || "",
      })
      
      // Map order items to invoice items
      const items = (orderItems || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || "Unknown Product",
        barcode: item.products?.barcode,
        category: item.products?.category,
        image_url: item.products?.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))
      setInvoiceItems(items)
      
      // Store franchise_id from order
      if (order.franchise_id) {
        setFranchiseId(order.franchise_id)
      }
      
      console.log("[EditOrder] Successfully loaded order:", order.order_number, "Customer:", customer?.name, "Items:", items.length)
      toast({ title: "Order Loaded", description: `Editing ${order.order_number}` })
      
    } catch (error: any) {
      console.error("[EditOrder] Error loading order:", error)
      toast({ title: "Error", description: error.message || "Failed to load order", variant: "destructive" })
    }
    setLoading(false)
  }

  // Calculations
  const itemsSubtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0)
  // Include package price if a package is selected (package is now a variant directly)
  const packagePrice = selectionMode === "package" && selectedPackage 
    ? (useCustomPackagePrice && customPackagePrice > 0 ? customPackagePrice : (selectedPackage.base_price || 0))
    : 0
  const baseSubtotal = itemsSubtotal + packagePrice
  // Use override price if enabled, otherwise use calculated subtotal
  const subtotal = (useCustomPackagePrice && customPackagePrice > 0) ? customPackagePrice : baseSubtotal
  const discountAmount = invoiceData.discount_type === "percentage" 
    ? (subtotal * invoiceData.discount_amount / 100)
    : invoiceData.discount_amount
  const afterDiscount = subtotal - discountAmount
  const gstAmount = (afterDiscount * invoiceData.gst_percentage) / 100
  const lostDamagedTotal = lostDamagedItems.reduce((sum, item) => sum + item.total_charge, 0)
  // Include package security deposit if selected (package is now a variant directly)
  const packageSecurityDeposit = selectionMode === "package" && selectedPackage
    ? (selectedPackage.security_deposit || 0)
    : 0
  const securityDeposit = invoiceData.invoice_type === "rental" 
    ? (invoiceData.security_deposit + packageSecurityDeposit) 
    : 0
  const depositRefundAmount = isDepositRefunded && invoiceData.invoice_type === "rental" ? securityDeposit : 0
  const grandTotal = (afterDiscount + gstAmount + securityDeposit + lostDamagedTotal) - depositRefundAmount
  const pendingAmount = grandTotal - invoiceData.amount_paid

  // Filter customers - show all if no search term, otherwise filter
  const filteredCustomers = customerSearch.trim() === "" 
    ? customers 
    : customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
      )

  // Filter products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Add product to invoice
  const addProduct = (product: Product) => {
    const existingIndex = invoiceItems.findIndex(item => item.product_id === product.id)
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...invoiceItems]
      updated[existingIndex].quantity += 1
      updated[existingIndex].total_price = updated[existingIndex].quantity * updated[existingIndex].unit_price
      setInvoiceItems(updated)
    } else {
      // Add new item
      const unitPrice = invoiceData.invoice_type === "rental" ? product.rental_price : (product.sale_price || product.rental_price)
      const newItem: InvoiceItem = {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        category: product.category,
        image_url: product.image_url,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
      }
      setInvoiceItems([...invoiceItems, newItem])
    }
    
    setProductSearch("")
    setShowProductDropdown(false)
    toast({ title: "Item Added", description: `${product.name} added to invoice` })
  }

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }
    setInvoiceItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
          : item
      )
    )
  }

  // Remove item
  const removeItem = (itemId: string) => {
    setInvoiceItems(items => items.filter(item => item.id !== itemId))
  }

  // Add lost/damaged item
  const addLostDamagedItem = (product?: Product) => {
    const newItem: LostDamagedItem = {
      id: `ld-${Date.now()}`,
      product_id: product?.id || "",
      product_name: product?.name || "",
      barcode: product?.barcode || "",
      type: "damaged",
      quantity: 1,
      charge_per_item: product?.rental_price || 0,
      total_charge: product?.rental_price || 0,
    }
    setLostDamagedItems([...lostDamagedItems, newItem])
  }

  // Update lost/damaged item product selection
  const updateLostDamagedItemProduct = (id: string, product: Product) => {
    setLostDamagedItems(items =>
      items.map(item => {
        if (item.id !== id) return item
        return {
          ...item,
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          charge_per_item: product.rental_price || 0,
          total_charge: (product.rental_price || 0) * item.quantity,
        }
      })
    )
  }

  // Update lost/damaged item
  const updateLostDamagedItem = (id: string, field: string, value: any) => {
    setLostDamagedItems(items =>
      items.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "charge_per_item") {
          updated.total_charge = updated.quantity * updated.charge_per_item
        }
        return updated
      })
    )
  }

  // Remove lost/damaged item
  const removeLostDamagedItem = (id: string) => {
    setLostDamagedItems(items => items.filter(item => item.id !== id))
  }

  // Create new customer via API (respects franchise + validation)
  // Pincode auto-fill for city and state
  const handlePincodeChange = async (value: string) => {
    // Update pincode value
    setNewCustomer(prev => ({ ...prev, pincode: value }))
    
    // Only lookup if 6 digits
    if (value.length !== 6 || !/^\d{6}$/.test(value)) {
      setPincodeStatus("idle")
      return
    }

    setPincodeStatus("loading")
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${value}`)
      const data = await response.json()

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0]
        setNewCustomer(prev => ({
          ...prev,
          pincode: value,
          city: postOffice.District || "",
          state: postOffice.State || "",
        }))
        setPincodeStatus("success")
        toast({
          title: "Pincode Verified",
          description: `${postOffice.District}, ${postOffice.State}`,
        })
      } else {
        setPincodeStatus("error")
        toast({
          title: "Invalid Pincode",
          description: "Please enter a valid 6-digit pincode",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Pincode lookup error:", error)
      setPincodeStatus("error")
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address || undefined,
          city: newCustomer.city || undefined,
          state: newCustomer.state || undefined,
          pincode: newCustomer.pincode || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const friendly =
          result?.error?.message || result?.error || result?.message || "Failed to create customer"
        throw new Error(friendly)
      }

      const created = result.data
      if (created) {
        setSelectedCustomer(created)
        setCustomers((prev) => [created, ...prev])
      }

      setShowNewCustomerDialog(false)
      setNewCustomer({ name: "", phone: "", address: "", city: "", state: "", pincode: "" })
      setPincodeStatus("idle")
      toast({ title: "Success", description: result.message || "Customer created" })
    } catch (error) {
      console.error("[CreateInvoice] Error creating customer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive",
      })
    }
  }

  // Save as Quote
  const handleSaveAsQuote = async () => {
    if (!selectedCustomer) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" })
      return
    }
    // Items are optional - save skeleton quote first, add items later

    setSaving(true)
    try {
      // Get franchise_id fresh from user session
      let currentFranchiseId = franchiseId
      if (!currentFranchiseId) {
        const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
        const user = userRes.ok ? await userRes.json() : null
        currentFranchiseId = user?.franchise_id
        if (currentFranchiseId) setFranchiseId(currentFranchiseId)
      }
      
      if (!currentFranchiseId) {
        toast({ title: "Error", description: "Session expired. Please refresh the page.", variant: "destructive" })
        setSaving(false)
        return
      }

      const orderData = {
        order_number: invoiceData.invoice_number.replace("ORD", "QTE").replace("SAL", "QTE"),
        customer_id: selectedCustomer.id,
        franchise_id: currentFranchiseId,
        booking_type: invoiceData.invoice_type || 'rental',
        event_type: invoiceData.event_type || 'wedding',
        event_participant: invoiceData.event_participant || 'both',
        event_date: invoiceData.event_date || new Date().toISOString().split('T')[0], // Default to today if empty
        event_time: invoiceData.event_time || null,
        delivery_date: invoiceData.delivery_date || null,
        delivery_time: invoiceData.delivery_time || null,
        return_date: invoiceData.return_date || null,
        return_time: invoiceData.return_time || null,
        venue_address: invoiceData.venue_address || '',
        groom_name: invoiceData.groom_name || '',
        groom_whatsapp: invoiceData.groom_whatsapp || null,
        groom_address: invoiceData.groom_address || null,
        bride_name: invoiceData.bride_name || '',
        bride_whatsapp: invoiceData.bride_whatsapp || null,
        bride_address: invoiceData.bride_address || null,
        payment_method: invoiceData.payment_method || 'Cash / Offline Payment',
        amount_paid: 0,
        total_amount: grandTotal || 0,
        subtotal: subtotal || 0,
        subtotal_amount: subtotal || 0,
        tax_amount: gstAmount || 0,
        gst_amount: gstAmount || 0,
        gst_percentage: invoiceData.gst_percentage || 5,
        discount_amount: discountAmount || 0,
        security_deposit: securityDeposit || 0,
        coupon_code: invoiceData.coupon_code || null,
        coupon_discount: invoiceData.coupon_discount || 0,
        sales_closed_by_id: invoiceData.sales_closed_by_id || null,
        status: 'quote',
        pending_amount: grandTotal || 0,
        notes: selectedPackage 
          ? `[PACKAGE: ${selectedPackage.name || selectedPackage.variant_name} @ ₹${packagePrice}]${invoiceData.notes ? '\n' + invoiceData.notes : ''}`
          : (invoiceData.notes || ''),
        is_quote: true,
      }

      const { data: order, error } = await supabase
        .from("product_orders")
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      // Insert items (only if there are items)
      if (invoiceItems.length > 0) {
        const itemsData = invoiceItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))

        await supabase.from("product_order_items").insert(itemsData)
      }

      toast({ title: "Quote Saved", description: `Quote ${order.order_number} created` })
      router.push("/bookings")
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setSaving(false)
  }

  // Create or Update Order
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" })
      return
    }
    // Products/packages are now optional - allow saving skeleton/header first
    // Users can add items later during editing

    setSaving(true)
    try {
      // Get franchise_id fresh from user session
      let currentFranchiseId = franchiseId
      if (!currentFranchiseId) {
        const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
        const user = userRes.ok ? await userRes.json() : null
        currentFranchiseId = user?.franchise_id
        if (currentFranchiseId) setFranchiseId(currentFranchiseId)
      }
      
      if (!currentFranchiseId) {
        toast({ title: "Error", description: "Session expired. Please refresh the page.", variant: "destructive" })
        setSaving(false)
        return
      }

      const orderData = {
        order_number: invoiceData.invoice_number,
        customer_id: selectedCustomer.id,
        franchise_id: currentFranchiseId,
        booking_type: invoiceData.invoice_type || 'rental',
        event_type: invoiceData.event_type || 'wedding',
        event_participant: invoiceData.event_participant || 'both',
        event_date: invoiceData.event_date || new Date().toISOString().split('T')[0], // Default to today if empty
        event_time: invoiceData.event_time || null,
        delivery_date: invoiceData.delivery_date || null,
        delivery_time: invoiceData.delivery_time || null,
        return_date: invoiceData.return_date || null,
        return_time: invoiceData.return_time || null,
        venue_address: invoiceData.venue_address || '',
        groom_name: invoiceData.groom_name || '',
        groom_whatsapp: invoiceData.groom_whatsapp || null,
        groom_address: invoiceData.groom_address || null,
        bride_name: invoiceData.bride_name || '',
        bride_whatsapp: invoiceData.bride_whatsapp || null,
        bride_address: invoiceData.bride_address || null,
        payment_method: invoiceData.payment_method || 'Cash / Offline Payment',
        amount_paid: invoiceData.amount_paid || 0,
        total_amount: grandTotal || 0,
        subtotal: subtotal || 0,
        subtotal_amount: subtotal || 0,
        tax_amount: gstAmount || 0,
        gst_amount: gstAmount || 0,
        gst_percentage: invoiceData.gst_percentage || 5,
        discount_amount: discountAmount || 0,
        security_deposit: securityDeposit || 0,
        coupon_code: invoiceData.coupon_code || null,
        coupon_discount: invoiceData.coupon_discount || 0,
        sales_closed_by_id: invoiceData.sales_closed_by_id || null,
        status: 'confirmed',
        pending_amount: Math.max(0, (grandTotal || 0) - (invoiceData.amount_paid || 0)),
        notes: selectedPackage 
          ? `[PACKAGE: ${selectedPackage.name || selectedPackage.variant_name} @ ₹${packagePrice}]${invoiceData.notes ? '\n' + invoiceData.notes : ''}`
          : (invoiceData.notes || ''),
        is_quote: false,
      }

      let order: any
      let isUpdate = false

      if (orderId && mode === "edit") {
        // Update existing order
        const { error: updateError } = await supabase
          .from("product_orders")
          .update(orderData)
          .eq("id", orderId)

        if (updateError) throw updateError

        // Delete existing items
        await supabase
          .from("product_order_items")
          .delete()
          .eq("order_id", orderId)

        order = { id: orderId, order_number: invoiceData.invoice_number }
        isUpdate = true
      } else {
        // Create new order
        const { data: newOrder, error } = await supabase
          .from("product_orders")
          .insert([orderData])
          .select()
          .single()

        if (error) throw error
        order = newOrder
      }

      // Insert/re-insert items (only if there are items)
      if (invoiceItems.length > 0) {
        const itemsData = invoiceItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))

        await supabase.from("product_order_items").insert(itemsData)
      }

      // Handle lost/damaged items - archive products from inventory
      if (lostDamagedItems.length > 0) {
        for (const ldItem of lostDamagedItems) {
          if (ldItem.product_id) {
            // Get current product stock
            const { data: product } = await supabase
              .from("products")
              .select("stock_available, stock_total")
              .eq("id", ldItem.product_id)
              .single()

            if (product) {
              const newStockAvailable = Math.max(0, (product.stock_available || 0) - ldItem.quantity)
              const newStockTotal = Math.max(0, (product.stock_total || 0) - ldItem.quantity)
              
              // Update product stock
              await supabase
                .from("products")
                .update({
                  stock_available: newStockAvailable,
                  stock_total: newStockTotal,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", ldItem.product_id)

              // Log to archive/activity (if table exists) - ignore errors
              try {
                await supabase.from("product_archive_log").insert({
                  product_id: ldItem.product_id,
                  order_id: order.id,
                  type: ldItem.type, // lost or damaged
                  quantity: ldItem.quantity,
                  charge_amount: ldItem.total_charge,
                  notes: `${ldItem.type === "lost" ? "Lost" : "Damaged"} - ${ldItem.product_name}`,
                  created_at: new Date().toISOString(),
                })
              } catch {} // Ignore if table doesn't exist
            }
          }
        }
      }

      const message = isUpdate 
        ? `Booking ${order.order_number} updated successfully`
        : `Booking ${order.order_number} created successfully`
      
      // Save invoice number sequence (only for new orders, not updates)
      if (!isUpdate) {
        try {
          const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
          const user = userRes.ok ? await userRes.json() : null
          const franchiseId = user?.franchise_id

          if (franchiseId) {
            await fetch('/api/invoice-sequences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                franchise_id: franchiseId,
                invoice_number: invoiceData.invoice_number
              })
            }).catch(err => console.warn("[CreateInvoice] Failed to save sequence:", err))
          }
        } catch (err) {
          console.warn("[CreateInvoice] Error saving invoice sequence:", err)
        }
      }
      
      toast({ title: isUpdate ? "Booking Updated" : "Booking Created", description: message })
      router.push("/bookings")
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setSaving(false)
  }

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!invoiceData.coupon_code.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setValidatingCoupon(true)
    setCouponError(null)

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: invoiceData.coupon_code,
          invoice_type: invoiceData.invoice_type,
          subtotal: baseSubtotal
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setCouponError(error.message || "Invalid or expired coupon")
        setInvoiceData(prev => ({ ...prev, coupon_discount: 0 }))
        setAppliedCoupon(null)
        return
      }

      const data = await response.json()
      setInvoiceData(prev => ({
        ...prev,
        coupon_discount: data.discount || 0
      }))
      setAppliedCoupon(invoiceData.coupon_code)
      toast({ title: "Coupon Applied", description: `Discount: ₹${data.discount?.toLocaleString() || 0}` })
    } catch (error: any) {
      setCouponError("Failed to validate coupon")
      console.error("Coupon validation error:", error)
    } finally {
      setValidatingCoupon(false)
    }
  }

  // Print/Download
  const handlePrint = () => {
    window.print()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      {/* Header - Hidden on print */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {mode === "final-bill" ? "Final Bill" : mode === "edit" ? "Edit Booking" : "New Booking"}
              </h1>
              {mode === "edit" && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                  EDITING
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {mode === "edit" 
                ? `Order: ${invoiceData.invoice_number || "Loading..."}` 
                : "Fill in the details below to create a booking"}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/bookings">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              All Bookings
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveAsQuote} disabled={saving}>
            <FileText className="h-4 w-4 mr-2" />
            Save as Quote
          </Button>
          <Button size="sm" onClick={handleCreateOrder} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {mode === "edit" ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none print:max-w-full">
        
        {/* ========== PRINT-ONLY HEADER ========== */}
        <div className="hidden print:block bg-amber-50 border-b-4 border-amber-500 p-4">
          <div className="flex justify-between items-start">
            {/* Company Logo & Details */}
            <div className="flex items-start gap-4">
              {companySettings?.logo_url ? (
                <img src={companySettings.logo_url} alt="Logo" className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-16 w-16 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-amber-800">{companySettings?.company_name || "SAFAWALA"}</h1>
                <p className="text-sm text-gray-600">Premium Wedding Turbans & Accessories</p>
                <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                  {companySettings?.phone && <div>📞 {companySettings.phone}</div>}
                  {companySettings?.email && <div>✉️ {companySettings.email}</div>}
                  {companySettings?.website && <div>🌐 {companySettings.website}</div>}
                  {companySettings?.address && <div>📍 {companySettings.address}{companySettings?.city ? `, ${companySettings.city}` : ''}</div>}
                </div>
              </div>
            </div>
            {/* Invoice Info */}
            <div className="text-right">
              <div className="text-xl font-bold text-amber-700 uppercase">
                {mode === "final-bill" ? "Final Bill" : invoiceData.invoice_type === "rental" ? "Rental Invoice" : "Sale Invoice"}
              </div>
              <div className="mt-2 text-sm">
                <div><span className="text-gray-500">Invoice #:</span> <strong>{invoiceData.invoice_number}</strong></div>
                <div><span className="text-gray-500">Date:</span> <strong>{format(new Date(), "dd MMM yyyy")}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== WEB-ONLY HEADER ========== */}
        <div className="print:hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">SAFAWALA</h2>
              <p className="text-orange-100 text-sm mt-1">Premium Wedding Accessories</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {mode === "final-bill" ? "FINAL BILL" : invoiceData.invoice_type === "rental" ? "RENTAL INVOICE" : "SALE INVOICE"}
              </div>
              <div className="mt-2">
                <Select
                  value={invoiceData.invoice_type}
                  onValueChange={(v) => setInvoiceData({ ...invoiceData, invoice_type: v as any })}
                >
                  <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PRINT-ONLY COMPREHENSIVE SECTION ================= */}
        <div className="hidden print:block p-6 space-y-4 border-b-2 border-amber-200">
          {/* Invoice Info Row */}
          <div className="flex justify-between items-start border-b border-amber-100 pb-3">
            <div>
              <div className="text-xs text-amber-700 font-medium">Invoice Number</div>
              <div className="font-mono font-bold text-lg text-gray-900">{invoiceData.invoice_number}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-700 font-medium">Date</div>
              <div className="font-semibold text-gray-900">{format(new Date(), "dd MMM yyyy")}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-700 font-medium">Type</div>
              <div className="font-semibold text-amber-600 uppercase">{mode === "final-bill" ? "Final Bill" : invoiceData.invoice_type === "rental" ? "Rental" : "Sale"}</div>
            </div>
          </div>

          {/* Customer Info */}
          {selectedCustomer && (
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-xs text-amber-700 font-medium mb-1">Customer</div>
              <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
              <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
              {selectedCustomer.email && <div className="text-sm text-gray-600">{selectedCustomer.email}</div>}
            </div>
          )}

          {/* Event Details - Rental Only */}
          {invoiceData.invoice_type === "rental" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-amber-700 font-medium mb-2 border-b border-amber-200 pb-1">Event Details</div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-500">Event:</span> <span className="font-medium capitalize">{invoiceData.event_type}</span></div>
                  <div><span className="text-gray-500">For:</span> <span className="font-medium capitalize">{invoiceData.event_participant}</span></div>
                  {invoiceData.event_date && <div><span className="text-gray-500">Event Date:</span> <span className="font-medium">{format(new Date(invoiceData.event_date), "dd MMM yyyy")}</span></div>}
                  {invoiceData.event_time && <div><span className="text-gray-500">Event Time:</span> <span className="font-medium">{invoiceData.event_time}</span></div>}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-amber-700 font-medium mb-2 border-b border-amber-200 pb-1">Delivery & Return</div>
                <div className="space-y-1 text-sm">
                  {invoiceData.delivery_date && <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{format(new Date(invoiceData.delivery_date), "dd MMM yyyy")} {invoiceData.delivery_time}</span></div>}
                  {invoiceData.return_date && <div><span className="text-gray-500">Return:</span> <span className="font-medium">{format(new Date(invoiceData.return_date), "dd MMM yyyy")} {invoiceData.return_time}</span></div>}
                  {invoiceData.venue_address && <div><span className="text-gray-500">Venue:</span> <span className="font-medium">{invoiceData.venue_address}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Sale Details */}
          {invoiceData.invoice_type === "sale" && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-amber-700 font-medium mb-2 border-b border-amber-200 pb-1">Delivery Details</div>
              <div className="space-y-1 text-sm">
                {invoiceData.delivery_date && <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{format(new Date(invoiceData.delivery_date), "dd MMM yyyy")} {invoiceData.delivery_time}</span></div>}
              </div>
            </div>
          )}

          {/* Groom & Bride Details - Rental Only */}
          {invoiceData.invoice_type === "rental" && (
            <div className="grid grid-cols-2 gap-4">
              {(invoiceData.event_participant === "groom" || invoiceData.event_participant === "both") && invoiceData.groom_name && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-2 border-b border-blue-200 pb-1">Groom Details</div>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-gray-900">{invoiceData.groom_name}</div>
                    {invoiceData.groom_whatsapp && <div className="text-gray-600">📱 {invoiceData.groom_whatsapp}</div>}
                    {invoiceData.groom_address && <div className="text-gray-600">📍 {invoiceData.groom_address}</div>}
                  </div>
                </div>
              )}
              {(invoiceData.event_participant === "bride" || invoiceData.event_participant === "both") && invoiceData.bride_name && (
                <div className="bg-pink-50 p-3 rounded-lg">
                  <div className="text-xs text-pink-700 font-medium mb-2 border-b border-pink-200 pb-1">Bride Details</div>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-gray-900">{invoiceData.bride_name}</div>
                    {invoiceData.bride_whatsapp && <div className="text-gray-600">📱 {invoiceData.bride_whatsapp}</div>}
                    {invoiceData.bride_address && <div className="text-gray-600">📍 {invoiceData.bride_address}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ================= END PRINT-ONLY SECTION ================= */}

        {/* ================= WEB-ONLY CONTENT START ================= */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 print:hidden">
          {/* Company Logo & Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            {/* Logo & Company Name */}
            <div className="flex items-center gap-3">
              {companySettings?.logo_url ? (
                <img 
                  src={companySettings.logo_url} 
                  alt="Logo" 
                  className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-lg" 
                />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-white">S</span>
                </div>
              )}
              <div>
                <div className="font-bold text-base md:text-lg text-gray-800">
                  {companySettings?.company_name || "SAFAWALA"}
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">
                  {companySettings?.phone && <span>📞 {companySettings.phone}</span>}
                </div>
              </div>
            </div>
            {/* Invoice Info */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex-1">
                <Label className="text-[10px] md:text-xs text-gray-500 block mb-1">Invoice #</Label>
                <Input
                  value={invoiceData.invoice_number}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  className="font-mono font-bold text-sm md:text-base h-8 md:h-9"
                  placeholder="e.g., ORD001"
                />
              </div>
              <div className="text-right">
                <Label className="text-[10px] md:text-xs text-gray-500 block mb-1">Date</Label>
                <div className="font-medium text-sm md:text-base mt-1">{format(new Date(), "dd MMM yyyy")}</div>
              </div>
            </div>
          </div>

          {/* Customer & Event Section - Improved Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Customer Details Card */}
            <Card className="p-4 shadow-sm border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-semibold text-gray-800">Customer</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="print:hidden h-8 text-xs border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  onClick={() => setShowNewCustomerDialog(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New
                </Button>
              </div>

              {/* Customer Search */}
              <div className="print:hidden mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              {/* Customer List or Selected Customer */}
              {selectedCustomer ? (
                <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-orange-900">
                      {selectedCustomer.name}
                    </div>
                    <div className="text-sm text-orange-700 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone}
                    </div>
                    {selectedCustomer.email && (
                      <div className="text-xs text-orange-600">
                        {selectedCustomer.email}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="print:hidden h-7 w-7 p-0 hover:bg-orange-200"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg max-h-48 overflow-y-auto text-sm print:hidden bg-white">
                  {customersLoading ? (
                    <div className="space-y-0">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 border-b last:border-b-0">
                          <div className="h-4 w-28 mb-1.5 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(customerSearch ? filteredCustomers : customers.slice(0, 4)).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className="w-full text-left p-2.5 border-b last:border-b-0 hover:bg-orange-50 transition-colors group"
                        >
                          <div className="font-medium text-gray-800 group-hover:text-orange-700">{c.name}</div>
                          <div className="text-xs text-gray-500">
                            {c.phone}
                          </div>
                        </button>
                      ))}
                      {customerSearch && filteredCustomers.length === 0 && (
                        <div className="p-3 text-xs text-gray-500 text-center">
                          No matches found
                        </div>
                      )}
                      {!customerSearch && customers.length > 4 && (
                        <div className="p-2 text-xs text-gray-500 text-center bg-gray-50 border-t">
                          Type to search {customers.length} customers...
                        </div>
                      )}
                      {!customerSearch && customers.length === 0 && !customersLoading && (
                        <div className="p-3 text-xs text-gray-500 text-center">
                          No customers found
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Event / Delivery Details */}
            {invoiceData.invoice_type === "rental" ? (
              <>
                {/* Full event details for rentals - spans 2 columns */}
                <Card className="p-4 shadow-sm border-l-4 border-l-blue-500 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Event Details</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Event Type</Label>
                      <Select
                        value={invoiceData.event_type}
                        onValueChange={(v) => setInvoiceData({ ...invoiceData, event_type: v as any })}
                      >
                        <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 print:border-0 print:p-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="reception">Reception</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">For</Label>
                      <Select
                        value={invoiceData.event_participant}
                        onValueChange={(v) => setInvoiceData({ ...invoiceData, event_participant: v as any })}
                      >
                        <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 print:border-0 print:p-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Both</SelectItem>
                          <SelectItem value="groom">Groom Only</SelectItem>
                          <SelectItem value="bride">Bride Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Event Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={invoiceData.event_date}
                          onChange={(e) => setInvoiceData({ ...invoiceData, event_date: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 pr-8 print:border-0 print:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Event Time</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          value={invoiceData.event_time}
                          onChange={(e) => setInvoiceData({ ...invoiceData, event_time: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 print:border-0 print:p-0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Delivery Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={invoiceData.delivery_date}
                          onChange={(e) => setInvoiceData({ ...invoiceData, delivery_date: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 pr-8 print:border-0 print:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Delivery Time</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          value={invoiceData.delivery_time}
                          onChange={(e) => setInvoiceData({ ...invoiceData, delivery_time: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 print:border-0 print:p-0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Return Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={invoiceData.return_date}
                          onChange={(e) => setInvoiceData({ ...invoiceData, return_date: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 pr-8 print:border-0 print:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Return Time</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          value={invoiceData.return_time}
                          onChange={(e) => setInvoiceData({ ...invoiceData, return_time: e.target.value })}
                          className="h-8 md:h-9 text-xs md:text-sm bg-gray-50 border-gray-200 print:border-0 print:p-0"
                        />
                      </div>
                    </div>
                    {/* Venue Address - full width at bottom */}
                    <div className="col-span-2 md:col-span-4 pt-2 border-t border-gray-100 mt-1">
                      <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Venue Address
                      </Label>
                      <Textarea
                        value={invoiceData.venue_address}
                        onChange={(e) => setInvoiceData({ ...invoiceData, venue_address: e.target.value })}
                        placeholder="Enter venue address..."
                        rows={2}
                        className="bg-gray-50 border-gray-200 resize-none print:border-0 print:p-0"
                      />
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              /* Direct sale layout: only delivery details + address */
              <Card className="p-4 shadow-sm border-l-4 border-l-green-500 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-800">Direct Sale Details</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Delivery Date</Label>
                    <Input
                      type="date"
                      value={invoiceData.delivery_date}
                      onChange={(e) => setInvoiceData({ ...invoiceData, delivery_date: e.target.value })}
                      className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Delivery Time</Label>
                    <Input
                      type="time"
                      value={invoiceData.delivery_time}
                      onChange={(e) => setInvoiceData({ ...invoiceData, delivery_time: e.target.value })}
                      className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Groom & Bride Details - separate section, only for rentals */}
          {invoiceData.invoice_type === "rental" && (
            <div className={`grid gap-4 ${
              invoiceData.event_participant === "both" 
                ? "grid-cols-1 md:grid-cols-2" 
                : "grid-cols-1 md:max-w-md"
            }`}>
              {/* Groom Details - show for "groom" or "both" */}
              {(invoiceData.event_participant === "groom" || invoiceData.event_participant === "both") && (
                <Card className="p-4 shadow-sm border-l-4 border-l-sky-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-sky-100 rounded-lg">
                      <User className="h-4 w-4 text-sky-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Groom Details</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Name</Label>
                      <Input
                        value={invoiceData.groom_name}
                        onChange={(e) => setInvoiceData({ ...invoiceData, groom_name: e.target.value })}
                        placeholder="Groom's name"
                        className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">WhatsApp</Label>
                      <Input
                        value={invoiceData.groom_whatsapp}
                        onChange={(e) => setInvoiceData({ ...invoiceData, groom_whatsapp: e.target.value })}
                        placeholder="WhatsApp number"
                        className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Address</Label>
                      <Textarea
                        value={invoiceData.groom_address}
                        onChange={(e) => setInvoiceData({ ...invoiceData, groom_address: e.target.value })}
                        placeholder="Address"
                        rows={2}
                        className="bg-gray-50 border-gray-200 resize-none print:border-0 print:p-0"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Bride Details - show for "bride" or "both" */}
              {(invoiceData.event_participant === "bride" || invoiceData.event_participant === "both") && (
                <Card className="p-4 shadow-sm border-l-4 border-l-pink-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-pink-100 rounded-lg">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Bride Details</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Name</Label>
                      <Input
                        value={invoiceData.bride_name}
                        onChange={(e) => setInvoiceData({ ...invoiceData, bride_name: e.target.value })}
                        placeholder="Bride's name"
                        className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">WhatsApp</Label>
                      <Input
                        value={invoiceData.bride_whatsapp}
                        onChange={(e) => setInvoiceData({ ...invoiceData, bride_whatsapp: e.target.value })}
                        placeholder="WhatsApp number"
                        className="h-9 bg-gray-50 border-gray-200 print:border-0 print:p-0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Address</Label>
                      <Textarea
                        value={invoiceData.bride_address}
                        onChange={(e) => setInvoiceData({ ...invoiceData, bride_address: e.target.value })}
                        placeholder="Address"
                        rows={2}
                        className="bg-gray-50 border-gray-200 resize-none print:border-0 print:p-0"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}



          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">Items</span>
                <Badge variant="secondary">{invoiceItems.length}</Badge>
              </div>
            </div>

            {/* Selection Mode Toggle & Options - Only for rentals */}
            <Card className="p-4 mb-4 print:hidden bg-gray-50">
              {/* Selection Mode Toggle - Only for rental */}
              {invoiceData.invoice_type === "rental" && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <Label className="text-sm font-medium mb-2 block">Selection Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={selectionMode === "products" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectionMode("products")
                        setSelectedPackage(null)
                        setSelectedPackageVariant(null)
                        setSelectedPackageCategory("")
                        setUseCustomPackagePrice(false)
                        setCustomPackagePrice(0)
                      }}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Individual Products
                    </Button>
                    <Button
                      type="button"
                      variant={selectionMode === "package" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectionMode("package")}
                      className="flex-1"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Package
                    </Button>
                  </div>
                </div>
              )}

            </Card>

            {/* Package Selector - Show when package mode is selected (rental only) */}
            {!skipProductSelection && selectionMode === "package" && invoiceData.invoice_type === "rental" && (
              <Card className="p-4 mb-4 print:hidden">
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs bg-gray-100 p-2 rounded mb-3 font-mono">
                    📦 Categories: {packagesCategories.length} | Packages: {packages.length}
                    {packages.length > 0 && packages[0].category_id && (
                      <span> | Sample category_id: {packages[0].category_id}</span>
                    )}
                    {selectedPackageCategory && (
                      <span> | Selected: {selectedPackageCategory}</span>
                    )}
                  </div>
                )}
                {packagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading packages...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Package Category Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Step 1: Select Package Category</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {packagesCategories.map((cat) => (
                          <Button
                            key={cat.id}
                            type="button"
                            variant={selectedPackageCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              console.log("[CreateInvoice] Category clicked:", cat.name, cat.id)
                              console.log("[CreateInvoice] Total packages in state:", packages.length)
                              const filtered = packages.filter(pkg => pkg.category_id === cat.id || (pkg as any).package_id === cat.id)
                              console.log("[CreateInvoice] Filtered packages for category:", filtered.length)
                              if (packages.length > 0 && filtered.length === 0) {
                                console.log("[CreateInvoice] No match! Sample package:", packages[0])
                                console.log("[CreateInvoice]   category_id:", packages[0].category_id)
                                console.log("[CreateInvoice]   package_id:", (packages[0] as any).package_id)
                              }
                              setSelectedPackageCategory(cat.id)
                              setSelectedPackage(null)
                              setSelectedPackageVariant(null)
                              setUseCustomPackagePrice(false)
                              setCustomPackagePrice(0)
                            }}
                            className="justify-start"
                          >
                            {cat.name}
                          </Button>
                        ))}
                      </div>
                      {packagesCategories.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No package categories found</p>
                      )}
                    </div>

                    {/* Package/Variant Selection - Direct from category */}
                    {selectedPackageCategory && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Step 2: Select Package</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {packages
                            .filter(pkg => pkg.category_id === selectedPackageCategory || (pkg as any).package_id === selectedPackageCategory)
                            .map((pkg) => (
                              <div
                                key={pkg.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                  selectedPackage?.id === pkg.id
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => {
                                  setSelectedPackage(pkg)
                                  setSelectedPackageVariant(null)
                                  setUseCustomPackagePrice(false)
                                  setCustomPackagePrice(0)
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold">{pkg.name || pkg.variant_name}</h4>
                                    {pkg.inclusions && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(Array.isArray(pkg.inclusions) 
                                          ? pkg.inclusions 
                                          : typeof pkg.inclusions === 'string' 
                                            ? pkg.inclusions.split(',').map((s: string) => s.trim())
                                            : []
                                        ).slice(0, 3).map((inc: string, i: number) => (
                                          <Badge key={i} variant="outline" className="text-xs">{inc}</Badge>
                                        ))}
                                        {(Array.isArray(pkg.inclusions) ? pkg.inclusions.length : 0) > 3 && (
                                          <Badge variant="outline" className="text-xs">+{(Array.isArray(pkg.inclusions) ? pkg.inclusions.length : 0) - 3} more</Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">₹{pkg.base_price?.toLocaleString() || 0}</p>
                                    {pkg.security_deposit > 0 && (
                                      <p className="text-xs text-gray-500">+₹{pkg.security_deposit} deposit</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {packages.filter(pkg => pkg.category_id === selectedPackageCategory || (pkg as any).package_id === selectedPackageCategory).length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No packages in this category</p>
                            <p className="text-xs mt-1 text-gray-400">
                              Total packages loaded: {packages.length} | Category: {packagesCategories.find(c => c.id === selectedPackageCategory)?.name || selectedPackageCategory}
                            </p>
                            {packages.length === 0 && (
                              <p className="text-xs mt-2 text-amber-500">
                                ⚠️ No packages loaded. Check if package variants exist for your franchise.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Package Summary */}
                    {selectedPackage && (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-green-800">Selected: {selectedPackage.name || selectedPackage.variant_name}</h4>
                              {selectedPackage.inclusions && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(Array.isArray(selectedPackage.inclusions) 
                                    ? selectedPackage.inclusions 
                                    : typeof selectedPackage.inclusions === 'string' 
                                      ? selectedPackage.inclusions.split(',').map((s: string) => s.trim())
                                      : []
                                  ).map((inc: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{inc}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-700">
                                ₹{packagePrice.toLocaleString()}
                              </p>
                              {selectedPackage.security_deposit > 0 && (
                                <p className="text-xs text-gray-500">+₹{selectedPackage.security_deposit} deposit</p>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Add Products to Package */}
                    {selectedPackage && (
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium mb-2 block">
                          Add Products to Package (Optional)
                        </Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Select additional individual products to include with this package
                        </p>
                        <ProductSelector
                          products={products.map(p => ({
                            ...p,
                            category: p.category || '',
                            security_deposit: p.security_deposit || 0,
                            sale_price: p.sale_price || p.rental_price,
                          }))}
                          categories={categories}
                          subcategories={subcategories}
                          selectedItems={invoiceItems.map(item => ({
                            product_id: item.product_id,
                            quantity: item.quantity
                          }))}
                          bookingType={invoiceData.invoice_type}
                          eventDate={invoiceData.event_date}
                          onProductSelect={(product) => addProduct(product as Product)}
                          onOpenCustomProductDialog={() => setShowCustomProductDialog(true)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Product Selector - Show when products mode is selected (or for sales) */}
            {!skipProductSelection && (selectionMode === "products" || invoiceData.invoice_type === "sale") && (
              <div className="print:hidden mb-4">
                <ProductSelector
                  products={products.map(p => ({
                    ...p,
                    category: p.category || '',
                    security_deposit: p.security_deposit || 0,
                    sale_price: p.sale_price || p.rental_price,
                  }))}
                  categories={categories}
                  subcategories={subcategories}
                  selectedItems={invoiceItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                  }))}
                  bookingType={invoiceData.invoice_type}
                  eventDate={invoiceData.event_date}
                  onProductSelect={(product) => addProduct(product as Product)}
                  onOpenCustomProductDialog={() => setShowCustomProductDialog(true)}
                />
              </div>
            )}

            {/* Package Details Section - Show when package is selected in rental mode (ABOVE items table) */}
            {selectionMode === "package" && selectedPackage && invoiceData.invoice_type === "rental" && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-900">Package Details</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  {/* Package Name & Price */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Package</h4>
                    <p className="text-lg font-bold text-blue-700">{selectedPackage.name || selectedPackage.variant_name}</p>
                  </div>
                  
                  {/* Base Price */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Package Price</h4>
                    <p className="text-lg font-bold">₹{packagePrice.toLocaleString()}</p>
                    {useCustomPackagePrice && customPackagePrice > 0 && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Custom override price applied</p>
                    )}
                  </div>

                  {/* Security Deposit */}
                  {selectedPackage.security_deposit > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Security Deposit</h4>
                      <p className="text-lg font-bold text-red-600">₹{selectedPackage.security_deposit.toLocaleString()}</p>
                    </div>
                  )}

                  {/* Inclusions */}
                  {selectedPackage.inclusions && (
                    <div className={selectedPackage.security_deposit > 0 ? "" : "md:col-span-1"}>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Includes</h4>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(selectedPackage.inclusions) 
                          ? selectedPackage.inclusions 
                          : typeof selectedPackage.inclusions === 'string' 
                            ? selectedPackage.inclusions.split(',').map((s: string) => s.trim())
                            : []
                        ).map((inc: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{inc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-center p-3 font-medium w-36">Qty</th>
                    <th className="text-right p-3 font-medium w-24">Rate</th>
                    <th className="text-right p-3 font-medium w-28">Total</th>
                    <th className="w-12 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No items added yet</p>
                        <p className="text-xs mt-1">Products are optional - you can add them now or later during editing</p>
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, index) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="h-10 w-10 object-cover rounded print:hidden" />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center print:hidden">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.barcode && <div className="text-xs text-gray-500">#{item.barcode}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 print:hidden"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center h-7 print:border-0"
                              min={1}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 print:hidden"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                        <td className="p-3 print:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lost/Damaged Items Section - only for rentals */}
          {invoiceData.invoice_type === "rental" && (mode === "final-bill" || lostDamagedItems.length > 0) && (
            <div className="border-t pt-6 relative z-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-700">Lost / Damaged Items</span>
                  <Badge variant="destructive" className="text-xs">Stock will be reduced</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addLostDamagedItem()}
                  className="print:hidden"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {lostDamagedItems.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm border rounded-lg">
                  No lost or damaged items
                </div>
              ) : (
                <div className="border rounded-lg overflow-visible">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Select Product</th>
                        <th className="text-center p-3 font-medium w-28">Type</th>
                        <th className="text-center p-3 font-medium w-28">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Charge/Item</th>
                        <th className="text-right p-3 font-medium w-28">Total</th>
                        <th className="w-12 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      {lostDamagedItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 relative" style={{ overflow: 'visible' }}>
                            {item.product_name ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.product_name}</span>
                                {item.barcode && (
                                  <span className="text-xs text-gray-400">{item.barcode}</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 print:hidden"
                                  onClick={() => {
                                    updateLostDamagedItem(item.id, "product_id", "")
                                    updateLostDamagedItem(item.id, "product_name", "")
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="print:hidden relative">
                                <Input
                                  placeholder="Search product..."
                                  onFocus={() => setLostDamagedProductSearch(item.id)}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="text-sm"
                                />
                                {lostDamagedProductSearch === item.id && productSearch && (
                                  <div className="absolute z-[9999] left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                                    {products
                                      .filter(p => 
                                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                        p.barcode?.includes(productSearch)
                                      )
                                      .slice(0, 8)
                                      .map((product) => (
                                        <div
                                          key={product.id}
                                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                          onClick={() => {
                                            updateLostDamagedItemProduct(item.id, product)
                                            setLostDamagedProductSearch(null)
                                            setProductSearch("")
                                          }}
                                        >
                                          <div className="font-medium text-sm">{product.name}</div>
                                          <div className="text-xs text-gray-500 flex gap-2">
                                            {product.barcode && <span>{product.barcode}</span>}
                                            <span>Stock: {product.stock_available}</span>
                                            <span className="text-green-600">₹{product.rental_price}</span>
                                          </div>
                                        </div>
                                      ))}
                                    {products.filter(p => 
                                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                      p.barcode?.includes(productSearch)
                                    ).length === 0 && (
                                      <div className="p-2 text-sm text-gray-400">No products found</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <Select
                              value={item.type}
                              onValueChange={(v) => updateLostDamagedItem(item.id, "type", v)}
                            >
                              <SelectTrigger className="print:border-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="damaged">Damaged</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLostDamagedItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                              className="w-16 text-center print:border-0"
                              min={1}
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.charge_per_item}
                              onChange={(e) => updateLostDamagedItem(item.id, "charge_per_item", parseFloat(e.target.value) || 0)}
                              className="w-24 text-right print:border-0"
                              placeholder="₹0"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-red-600">
                            {formatCurrency(item.total_charge)}
                          </td>
                          <td className="p-3 print:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => removeLostDamagedItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Button to show Lost/Damaged section - only for rentals */}
          {invoiceData.invoice_type === "rental" && mode !== "final-bill" && lostDamagedItems.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addLostDamagedItem()}
              className="print:hidden text-red-600 border-red-200 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Add Lost/Damaged Items
            </Button>
          )}

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Payment Method & Discounts - Combined */}
            <Card className="p-4">
              <div className="font-semibold mb-3 underline">Payment Method & Discounts</div>
              <div className="space-y-3 text-sm">
                {/* Payment Method */}
                <div>
                  <Label className="text-xs text-gray-500">Payment Method</Label>
                  <Select
                    value={invoiceData.payment_method}
                    onValueChange={(v) => setInvoiceData({ ...invoiceData, payment_method: v as any })}
                  >
                    <SelectTrigger className="print:border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI / QR Payment">UPI / QR Payment</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Debit / Credit Card">Debit / Credit Card</SelectItem>
                      <SelectItem value="Cash / Offline Payment">Cash / Offline Payment</SelectItem>
                      <SelectItem value="International Payment">International Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Amount */}
                {/* Removed - use Override Package Price instead for package mode */}

                {/* Override Price - for both products and packages in rentals */}
                {invoiceData.invoice_type === "rental" && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        id="useCustomPackagePrice"
                        checked={useCustomPackagePrice}
                        onCheckedChange={(checked) => setUseCustomPackagePrice(checked as boolean)}
                      />
                      <Label htmlFor="useCustomPackagePrice" className="text-xs text-gray-500 cursor-pointer">Override price (₹)</Label>
                    </div>
                    <Input
                      type="number"
                      value={customPackagePrice || ''}
                      onChange={(e) => setCustomPackagePrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="print:border-0"
                      placeholder="Enter custom price"
                      disabled={!useCustomPackagePrice}
                    />
                    {useCustomPackagePrice && customPackagePrice > 0 && <p className="text-xs text-orange-500 mt-1">Overrides total price</p>}
                  </div>
                )}

                {/* Security Deposit - rental only */}
                {invoiceData.invoice_type === "rental" && (
                  <div>
                    <Label className="text-xs text-gray-500">Security Deposit (₹)</Label>
                    <Input
                      type="number"
                      value={invoiceData.security_deposit || ''}
                      onChange={(e) => setInvoiceData({ ...invoiceData, security_deposit: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                      className="print:border-0"
                      placeholder="Enter security deposit"
                    />
                  </div>
                )}

                {/* Discount Amount */}
                <div>
                  <Label className="text-xs text-gray-500">Discount Amount (₹)</Label>
                  <Input
                    type="number"
                    value={invoiceData.discount_amount || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="print:border-0"
                    placeholder="Enter discount amount"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <Label className="text-xs text-gray-500">Amount Paid (₹)</Label>
                  <Input
                    type="number"
                    value={invoiceData.amount_paid || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, amount_paid: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="print:border-0"
                    placeholder="Enter amount paid"
                  />
                  {invoiceData.amount_paid > 0 && (
                    <p className="text-xs text-blue-500 mt-1">Balance: {formatCurrency(Math.max(0, grandTotal - invoiceData.amount_paid))}</p>
                  )}
                </div>

                {/* Coupon Code - with Apply button */}
                <div className="print:hidden">
                  <Label className="text-xs text-gray-500">Coupon Code (Optional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={invoiceData.coupon_code}
                      onChange={(e) => {
                        setInvoiceData({ ...invoiceData, coupon_code: e.target.value.toUpperCase() })
                        setCouponError(null)
                        if (appliedCoupon !== invoiceData.coupon_code) {
                          setAppliedCoupon(null)
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="print:border-0"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={appliedCoupon ? "default" : "outline"}
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !invoiceData.coupon_code.trim()}
                      className="whitespace-nowrap"
                    >
                      {validatingCoupon ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Validating...
                        </>
                      ) : appliedCoupon ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-1">{couponError}</p>
                  )}
                  {appliedCoupon && invoiceData.coupon_discount > 0 && (
                    <p className="text-xs text-green-600 mt-1">✅ Coupon applied - Discount: ₹{invoiceData.coupon_discount.toLocaleString()}</p>
                  )}
                </div>

                {/* Sales Staff */}
                <div>
                  <Label className="text-xs text-gray-500">Sales Staff</Label>
                  <Select
                    value={invoiceData.sales_closed_by_id}
                    onValueChange={(v) => setInvoiceData({ ...invoiceData, sales_closed_by_id: v })}
                  >
                    <SelectTrigger className="print:border-0">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-4 bg-gray-50">
              <div className="font-semibold mb-3">Summary</div>
              <div className="space-y-2 text-sm">
                {/* Show package if selected */}
                {selectionMode === "package" && selectedPackage && (
                  <div className="flex justify-between text-blue-600">
                    <span>
                      Package: {selectedPackage.name || selectedPackage.variant_name}
                    </span>
                    <span>{formatCurrency(packagePrice)}</span>
                  </div>
                )}
                {/* Show items subtotal separately if there's a package */}
                {selectionMode === "package" && selectedPackage && itemsSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Items</span>
                    <span>{formatCurrency(itemsSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({invoiceData.gst_percentage}%)</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
                {invoiceData.invoice_type === "rental" && securityDeposit > 0 && (
                  <div className="space-y-2 p-2 bg-blue-50 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit</span>
                      <span>{formatCurrency(securityDeposit)}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id="depositRefunded"
                        checked={isDepositRefunded}
                        onCheckedChange={(checked) => setIsDepositRefunded(checked as boolean)}
                      />
                      <label
                        htmlFor="depositRefunded"
                        className="text-xs text-gray-600 cursor-pointer"
                      >
                        Refunded to Customer
                      </label>
                    </div>
                  </div>
                )}
                {lostDamagedTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Lost/Damaged Charges</span>
                    <span>{formatCurrency(lostDamagedTotal)}</span>
                  </div>
                )}
                {isDepositRefunded && invoiceData.invoice_type === "rental" && securityDeposit > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Security Deposit (Refunded)</span>
                    <span>-{formatCurrency(securityDeposit)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(invoiceData.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600">
                  <span>Balance Due</span>
                  <span>{formatCurrency(pendingAmount)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-gray-500">Notes</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="mt-1 print:border-0"
            />
          </div>

          {/* Terms & Conditions - Compact for print */}
          <Card className="p-3 bg-gray-50 print:bg-white print:p-2 print:hidden">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-4 w-4 text-orange-500 print:hidden" />
              <span className="font-semibold text-xs">Terms & Conditions</span>
            </div>
            <div className="text-[10px] text-gray-600 print:text-[9px]">
              {companySettings?.terms_conditions ? (
                <div className="whitespace-pre-wrap">{companySettings.terms_conditions}</div>
              ) : (
                invoiceData.invoice_type === "rental" ? (
                  <ul className="list-disc list-inside space-y-0.5 columns-2 print:columns-2">
                    <li>Items must be returned by agreed return date</li>
                    <li>Late returns incur additional charges</li>
                    <li>Return items in original condition</li>
                    <li>Customer responsible during rental period</li>
                    <li>Damage/loss: Repair or replacement cost charged</li>
                    <li>Security deposit covers damages</li>
                    <li>Advance payment required for confirmation</li>
                    <li>ID proof required at delivery</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 columns-2 print:columns-2">
                    <li>All sales are final, no returns</li>
                    <li>Check items before leaving</li>
                    <li>Warranty as per product terms</li>
                    <li>Receipt required for any claims</li>
                    <li>Prices inclusive of applicable taxes</li>
                    <li>Management decision final in disputes</li>
                  </ul>
                )
              )}
            </div>
          </Card>

          {/* Footer */}
          <div className="border-t pt-2 text-center text-[10px] text-gray-500 print:pt-1 print:hidden">
            <p>Thank you for choosing Safawala! | Terms & Conditions apply</p>
          </div>
        </div>
        {/* ================= END WEB-ONLY CONTENT ================= */}

        {/* ================= PRINT-ONLY ITEMS & SUMMARY SECTION ================= */}
        <div className="hidden print:block p-6 space-y-4">
          {/* Package Details - Print Only */}
          {selectionMode === "package" && selectedPackage && invoiceData.invoice_type === "rental" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="text-xs text-amber-700 font-semibold mb-2 uppercase tracking-wide">Package Selected</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg text-gray-900">{selectedPackage.name || selectedPackage.variant_name}</div>
                  {selectedPackage.inclusions && (
                    <div className="text-sm text-gray-600 mt-1">
                      Includes: {(Array.isArray(selectedPackage.inclusions) 
                        ? selectedPackage.inclusions.join(', ') 
                        : typeof selectedPackage.inclusions === 'string' 
                          ? selectedPackage.inclusions 
                          : ''
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-700">₹{packagePrice.toLocaleString()}</div>
                  {selectedPackage.security_deposit > 0 && (
                    <div className="text-xs text-gray-500">Deposit: ₹{selectedPackage.security_deposit.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items Table - Print Optimized */}
          {invoiceItems.length > 0 && (
            <div>
              <div className="text-xs text-amber-700 font-semibold mb-2 uppercase tracking-wide">
                {selectionMode === "package" && selectedPackage ? "Additional Products" : "Products"}
              </div>
              <table className="w-full text-sm border border-gray-200 rounded">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="text-left p-2 text-xs font-semibold text-amber-800 border-b border-amber-200">Item</th>
                    <th className="text-center p-2 text-xs font-semibold text-amber-800 border-b border-amber-200 w-20">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="p-2">
                        <div className="font-medium text-gray-900">{item.product_name}</div>
                        {item.barcode && <div className="text-xs text-gray-500">#{item.barcode}</div>}
                      </td>
                      <td className="p-2 text-center font-medium">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Lost/Damaged Items - Print Only */}
          {lostDamagedItems.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-red-700 font-semibold mb-2 uppercase tracking-wide">Lost / Damaged Items</div>
              <table className="w-full text-sm border border-red-200 rounded">
                <thead className="bg-red-50">
                  <tr>
                    <th className="text-left p-2 text-xs font-semibold text-red-800 border-b border-red-200">Item</th>
                    <th className="text-center p-2 text-xs font-semibold text-red-800 border-b border-red-200 w-20">Type</th>
                    <th className="text-center p-2 text-xs font-semibold text-red-800 border-b border-red-200 w-16">Qty</th>
                    <th className="text-right p-2 text-xs font-semibold text-red-800 border-b border-red-200 w-24">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {lostDamagedItems.map((item) => (
                    <tr key={item.id} className="border-b border-red-100">
                      <td className="p-2 font-medium text-gray-900">{item.product_name}</td>
                      <td className="p-2 text-center capitalize">{item.type}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right text-red-600 font-medium">{formatCurrency(item.total_charge)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Info & Summary - Print Only */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-amber-700 font-semibold mb-3 uppercase tracking-wide">Payment Information</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{invoiceData.payment_method}</span>
                </div>
                {invoiceData.coupon_code && invoiceData.coupon_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Code:</span>
                    <span className="font-medium">{invoiceData.coupon_code} (-₹{invoiceData.coupon_discount.toLocaleString()})</span>
                  </div>
                )}
                {staffMembers.find(s => s.id === invoiceData.sales_closed_by_id) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales Staff:</span>
                    <span className="font-medium">{staffMembers.find(s => s.id === invoiceData.sales_closed_by_id)?.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="text-xs text-amber-700 font-semibold mb-3 uppercase tracking-wide">Summary</div>
              <div className="space-y-1.5 text-sm">
                {selectionMode === "package" && selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package</span>
                    <span className="font-medium">{formatCurrency(packagePrice)}</span>
                  </div>
                )}
                {selectionMode === "package" && selectedPackage && itemsSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Items</span>
                    <span className="font-medium">{formatCurrency(itemsSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({invoiceData.gst_percentage}%)</span>
                  <span className="font-medium">{formatCurrency(gstAmount)}</span>
                </div>
                {invoiceData.invoice_type === "rental" && securityDeposit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">{formatCurrency(securityDeposit)}</span>
                  </div>
                )}
                {lostDamagedTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Lost/Damaged</span>
                    <span>+{formatCurrency(lostDamagedTotal)}</span>
                  </div>
                )}
                {isDepositRefunded && securityDeposit > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Deposit Refunded</span>
                    <span>-{formatCurrency(securityDeposit)}</span>
                  </div>
                )}
                <div className="border-t border-amber-300 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-amber-700">{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 mt-1">
                    <span>Paid</span>
                    <span>{formatCurrency(invoiceData.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600 mt-1">
                    <span>Balance Due</span>
                    <span>{formatCurrency(pendingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes - Print */}
          {invoiceData.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-amber-700 font-semibold mb-1 uppercase tracking-wide">Notes</div>
              <div className="text-sm text-gray-700">{invoiceData.notes}</div>
            </div>
          )}

          {/* Terms & Conditions - Print */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-amber-700 font-semibold mb-2 uppercase tracking-wide">Terms & Conditions</div>
            <div className="text-[9px] text-gray-600">
              {companySettings?.terms_conditions ? (
                <div className="whitespace-pre-wrap">{companySettings.terms_conditions}</div>
              ) : (
                invoiceData.invoice_type === "rental" ? (
                  <ul className="list-disc list-inside space-y-0.5 columns-2">
                    <li>Items must be returned by agreed return date</li>
                    <li>Late returns incur additional charges</li>
                    <li>Return items in original condition</li>
                    <li>Customer responsible during rental period</li>
                    <li>Damage/loss: Repair or replacement cost charged</li>
                    <li>Security deposit covers damages</li>
                    <li>Advance payment required for confirmation</li>
                    <li>ID proof required at delivery</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 columns-2">
                    <li>All sales are final, no returns</li>
                    <li>Check items before leaving</li>
                    <li>Warranty as per product terms</li>
                    <li>Receipt required for any claims</li>
                    <li>Prices inclusive of applicable taxes</li>
                    <li>Management decision final in disputes</li>
                  </ul>
                )
              )}
            </div>
          </div>

          {/* Footer - Print */}
          <div className="mt-4 pt-3 border-t border-amber-200 text-center">
            <p className="text-sm font-semibold text-amber-700">Thank you for choosing Safawala!</p>
            <p className="text-xs text-gray-500 mt-1">For queries: {companySettings?.phone || ''} | {companySettings?.email || ''}</p>
          </div>
        </div>
        {/* ================= END PRINT-ONLY ITEMS & SUMMARY ================= */}
      </div>

      {/* Bottom Action Bar - Mobile Friendly, Hidden on Print */}
      <div className="max-w-4xl mx-auto mt-4 print:hidden">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-bold text-lg">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleSaveAsQuote} disabled={saving}>
                <FileText className="h-4 w-4 mr-2" />
                Save as Quote
              </Button>
              <Button onClick={handleCreateOrder} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {mode === "edit" ? "Update Order" : "Create Order"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Pincode</Label>
                <div className="relative">
                  <Input
                    value={newCustomer.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6 digits"
                    maxLength={6}
                    className={pincodeStatus === "success" ? "border-green-500 pr-8" : pincodeStatus === "error" ? "border-red-500" : ""}
                  />
                  {pincodeStatus === "loading" && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {pincodeStatus === "success" && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">✓</div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  placeholder="Auto-filled"
                  className={pincodeStatus === "success" ? "bg-green-50" : ""}
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                  placeholder="Auto-filled"
                  className={pincodeStatus === "success" ? "bg-green-50" : ""}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer}>
                Create Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Product Dialog */}
      <Dialog open={showCustomProductDialog} onOpenChange={setShowCustomProductDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Product Name *</Label>
              <Input
                placeholder="Enter product name"
                value={customProductData.name}
                onChange={(e) => setCustomProductData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Category *</Label>
              <select
                value={customProductData.category_id}
                onChange={(e) => setCustomProductData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Price * (₹)</Label>
              <Input
                type="number"
                placeholder="Enter price"
                value={customProductData.price}
                onChange={(e) => setCustomProductData(prev => ({ ...prev, price: e.target.value }))}
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Product Image (optional)</Label>
              
              <div className="mt-2 flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setCustomProductData(prev => ({ ...prev, image_url: reader.result as string }))
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Choose Image</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs text-gray-500">or paste URL</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <Input
                placeholder="https://example.com/image.jpg"
                value={customProductData.image_url}
                onChange={(e) => setCustomProductData(prev => ({ ...prev, image_url: e.target.value }))}
              />
              
              {customProductData.image_url && (
                <div className="mt-2 border rounded-md overflow-hidden relative">
                  <img 
                    src={customProductData.image_url} 
                    alt="Preview" 
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.png'
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    onClick={() => setCustomProductData(prev => ({ ...prev, image_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCustomProductDialog(false)
                  setCustomProductData({ name: '', category_id: '', image_url: '', price: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateCustomProduct}
                disabled={creatingProduct}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {creatingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create & Add
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
