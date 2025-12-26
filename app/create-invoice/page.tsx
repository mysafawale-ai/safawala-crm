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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import Link from "next/link"

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
  image_url?: string
  rental_price: number
  sale_price?: number
  stock_available: number
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

  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [lostDamagedProductSearch, setLostDamagedProductSearch] = useState<string | null>(null) // ID of item being searched

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
    delivery_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    bride_address: "",
    payment_method: "full" as "full" | "advance" | "partial",
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

  // Generate invoice number
  useEffect(() => {
    if (mode === "new" && !invoiceData.invoice_number) {
      const prefix = invoiceData.invoice_type === "rental" ? "ORD" : "SAL"
      const timestamp = Date.now().toString().slice(-8)
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: `${prefix}${timestamp}`
      }))
    }
  }, [mode, invoiceData.invoice_type])

  // Load customers and products
  useEffect(() => {
    loadCustomers()
    loadProducts()
    loadStaffMembers()
  }, [])

  // Load existing order if editing
  useEffect(() => {
    if (orderId && mode !== "new") {
      loadExistingOrder(orderId)
    }
  }, [orderId, mode])

  const loadCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone, email, address, city, state, pincode")
      .eq("is_deleted", false)
      .order("name")
      .limit(100)
    if (data) setCustomers(data)
  }

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, barcode, product_code, category, image_url, rental_price, sale_price, stock_available")
      .eq("is_active", true)
      .order("name")
    if (data) setProducts(data)
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
      // Try product_orders first
      let { data: order, error } = await supabase
        .from("product_orders")
        .select(`
          *,
          customers (id, name, phone, email, address, city, state, pincode),
          product_order_items (
            id, product_id, quantity, unit_price, total_price,
            products (id, name, barcode, product_code, category, image_url, rental_price, sale_price, stock_available)
          )
        `)
        .eq("id", id)
        .single()

      if (order) {
        setSelectedCustomer(order.customers)
        setInvoiceData({
          invoice_number: order.order_number || "",
          invoice_type: order.booking_subtype || "rental",
          event_type: order.event_type || "wedding",
          event_participant: order.event_participant || "both",
          event_date: order.event_date || "",
          event_time: order.event_time || "",
          delivery_date: order.delivery_date || "",
          delivery_time: order.delivery_time || "",
          return_date: order.return_date || "",
          return_time: order.return_time || "",
          venue_address: order.venue_address || "",
          delivery_address: order.delivery_address || "",
          groom_name: order.groom_name || "",
          groom_whatsapp: order.groom_whatsapp || "",
          groom_address: order.groom_address || "",
          bride_name: order.bride_name || "",
          bride_whatsapp: order.bride_whatsapp || "",
          bride_address: order.bride_address || "",
          payment_method: order.payment_method || "full",
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
        
        const items = (order.product_order_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || "Unknown",
          barcode: item.products?.barcode,
          category: item.products?.category,
          image_url: item.products?.image_url,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
        setInvoiceItems(items)
      }
    } catch (error) {
      console.error("Error loading order:", error)
    }
    setLoading(false)
  }

  // Calculations
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0)
  const discountAmount = invoiceData.discount_type === "percentage" 
    ? (subtotal * invoiceData.discount_amount / 100)
    : invoiceData.discount_amount
  const afterDiscount = subtotal - discountAmount
  const gstAmount = (afterDiscount * invoiceData.gst_percentage) / 100
  const lostDamagedTotal = lostDamagedItems.reduce((sum, item) => sum + item.total_charge, 0)
  const securityDeposit = invoiceData.invoice_type === "rental" ? invoiceData.security_deposit : 0
  const grandTotal = afterDiscount + gstAmount + securityDeposit + lostDamagedTotal
  const pendingAmount = grandTotal - invoiceData.amount_paid

  // Filter customers
  const filteredCustomers = customers.filter(c =>
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

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" })
      return
    }

    const { data, error } = await supabase
      .from("customers")
      .insert([newCustomer])
      .select()
      .single()

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setSelectedCustomer(data)
    setCustomers([...customers, data])
    setShowNewCustomerDialog(false)
    setNewCustomer({ name: "", phone: "", address: "", city: "", state: "", pincode: "" })
    toast({ title: "Success", description: "Customer created" })
  }

  // Save as Quote
  const handleSaveAsQuote = async () => {
    if (!selectedCustomer) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" })
      return
    }
    if (invoiceItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const orderData = {
        order_number: invoiceData.invoice_number.replace("ORD", "QTE").replace("SAL", "QTE"),
        customer_id: selectedCustomer.id,
        booking_subtype: invoiceData.invoice_type,
        event_type: invoiceData.event_type,
        event_participant: invoiceData.event_participant,
        event_date: invoiceData.event_date || null,
        event_time: invoiceData.event_time || null,
        delivery_date: invoiceData.delivery_date || null,
        delivery_time: invoiceData.delivery_time || null,
        return_date: invoiceData.return_date || null,
        return_time: invoiceData.return_time || null,
        venue_address: invoiceData.venue_address,
        delivery_address: invoiceData.delivery_address || null,
        groom_name: invoiceData.groom_name,
        groom_whatsapp: invoiceData.groom_whatsapp || null,
        groom_address: invoiceData.groom_address || null,
        bride_name: invoiceData.bride_name,
        bride_whatsapp: invoiceData.bride_whatsapp || null,
        bride_address: invoiceData.bride_address || null,
        payment_method: invoiceData.payment_method,
        amount_paid: 0,
        total_amount: grandTotal,
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: invoiceData.gst_percentage,
        discount_amount: discountAmount,
        security_deposit: securityDeposit,
        coupon_code: invoiceData.coupon_code || null,
        coupon_discount: invoiceData.coupon_discount || 0,
        sales_closed_by_id: invoiceData.sales_closed_by_id || null,
        notes: invoiceData.notes,
        is_quote: true,
        order_status: "quote",
      }

      const { data: order, error } = await supabase
        .from("product_orders")
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      // Insert items
      const itemsData = invoiceItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      await supabase.from("product_order_items").insert(itemsData)

      toast({ title: "Quote Saved", description: `Quote ${order.order_number} created` })
      router.push("/quotes")
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setSaving(false)
  }

  // Create Order
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" })
      return
    }
    if (invoiceItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const orderData = {
        order_number: invoiceData.invoice_number,
        customer_id: selectedCustomer.id,
        booking_subtype: invoiceData.invoice_type,
        event_type: invoiceData.event_type,
        event_participant: invoiceData.event_participant,
        event_date: invoiceData.event_date || null,
        event_time: invoiceData.event_time || null,
        delivery_date: invoiceData.delivery_date || null,
        delivery_time: invoiceData.delivery_time || null,
        return_date: invoiceData.return_date || null,
        return_time: invoiceData.return_time || null,
        venue_address: invoiceData.venue_address,
        delivery_address: invoiceData.delivery_address || null,
        groom_name: invoiceData.groom_name,
        groom_whatsapp: invoiceData.groom_whatsapp || null,
        groom_address: invoiceData.groom_address || null,
        bride_name: invoiceData.bride_name,
        bride_whatsapp: invoiceData.bride_whatsapp || null,
        bride_address: invoiceData.bride_address || null,
        payment_method: invoiceData.payment_method,
        amount_paid: invoiceData.amount_paid,
        total_amount: grandTotal,
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: invoiceData.gst_percentage,
        discount_amount: discountAmount,
        security_deposit: securityDeposit,
        coupon_code: invoiceData.coupon_code || null,
        coupon_discount: invoiceData.coupon_discount || 0,
        sales_closed_by_id: invoiceData.sales_closed_by_id || null,
        notes: invoiceData.notes,
        is_quote: false,
        order_status: "confirmed",
        has_items: true,
      }

      const { data: order, error } = await supabase
        .from("product_orders")
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      // Insert items
      const itemsData = invoiceItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      await supabase.from("product_order_items").insert(itemsData)

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

      toast({ title: "Order Created", description: `Order ${order.order_number} created successfully` })
      router.push("/bookings")
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setSaving(false)
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
            <h1 className="text-2xl font-bold">
              {mode === "final-bill" ? "Final Bill" : mode === "edit" ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p className="text-sm text-gray-600">
              Fill in the details below to create an invoice
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
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
            Create Order
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-lg print:rounded-none">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">SAFAWALA</h2>
              <p className="text-orange-100 text-sm mt-1">Premium Wedding Accessories</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {mode === "final-bill" ? "FINAL BILL" : invoiceData.invoice_type === "rental" ? "RENTAL INVOICE" : "SALE INVOICE"}
              </div>
              <div className="mt-2 print:hidden">
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

        <div className="p-6 space-y-6">
          {/* Invoice Number & Date */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Label className="text-xs text-gray-500">Invoice Number</Label>
              <div className="font-mono font-bold text-lg">{invoiceData.invoice_number}</div>
            </div>
            <div className="text-right">
              <Label className="text-xs text-gray-500">Date</Label>
              <div className="font-medium">{format(new Date(), "dd MMM yyyy")}</div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold">Customer Details</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="print:hidden"
                  onClick={() => setShowNewCustomerDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>

              {/* Customer Search - Hidden on print */}
              <div className="print:hidden mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(true)
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-10"
                  />
                </div>
                
                {showCustomerDropdown && customerSearch && (
                  <div className="absolute z-10 mt-1 w-full max-w-sm bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No customers found</div>
                    ) : (
                      filteredCustomers.slice(0, 10).map((customer) => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setCustomerSearch("")
                            setShowCustomerDropdown(false)
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{selectedCustomer.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="print:hidden h-6 w-6 p-0"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-3 w-3 mt-1" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Search and select a customer
                </div>
              )}
            </Card>

            {/* Event Details */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">Event Details</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Event Type</Label>
                  <Select
                    value={invoiceData.event_type}
                    onValueChange={(v) => setInvoiceData({ ...invoiceData, event_type: v as any })}
                  >
                    <SelectTrigger className="print:border-0 print:p-0">
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
                  <Label className="text-xs text-gray-500">For</Label>
                  <Select
                    value={invoiceData.event_participant}
                    onValueChange={(v) => setInvoiceData({ ...invoiceData, event_participant: v as any })}
                  >
                    <SelectTrigger className="print:border-0 print:p-0">
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
                  <Label className="text-xs text-gray-500">Event Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.event_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, event_date: e.target.value })}
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Event Time</Label>
                  <Input
                    type="time"
                    value={invoiceData.event_time}
                    onChange={(e) => setInvoiceData({ ...invoiceData, event_time: e.target.value })}
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Delivery Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.delivery_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, delivery_date: e.target.value })}
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Delivery Time</Label>
                  <Input
                    type="time"
                    value={invoiceData.delivery_time}
                    onChange={(e) => setInvoiceData({ ...invoiceData, delivery_time: e.target.value })}
                    className="print:border-0 print:p-0"
                  />
                </div>
                {invoiceData.invoice_type === "rental" && (
                  <>
                    <div>
                      <Label className="text-xs text-gray-500">Return Date</Label>
                      <Input
                        type="date"
                        value={invoiceData.return_date}
                        onChange={(e) => setInvoiceData({ ...invoiceData, return_date: e.target.value })}
                        className="print:border-0 print:p-0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Return Time</Label>
                      <Input
                        type="time"
                        value={invoiceData.return_time}
                        onChange={(e) => setInvoiceData({ ...invoiceData, return_time: e.target.value })}
                        className="print:border-0 print:p-0"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Groom & Bride Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">Groom Details</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <Input
                    value={invoiceData.groom_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, groom_name: e.target.value })}
                    placeholder="Groom's name"
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">WhatsApp</Label>
                  <Input
                    value={invoiceData.groom_whatsapp}
                    onChange={(e) => setInvoiceData({ ...invoiceData, groom_whatsapp: e.target.value })}
                    placeholder="WhatsApp number"
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Address</Label>
                  <Textarea
                    value={invoiceData.groom_address}
                    onChange={(e) => setInvoiceData({ ...invoiceData, groom_address: e.target.value })}
                    placeholder="Address"
                    rows={2}
                    className="print:border-0 print:p-0"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-pink-500" />
                <span className="font-semibold">Bride Details</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <Input
                    value={invoiceData.bride_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, bride_name: e.target.value })}
                    placeholder="Bride's name"
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">WhatsApp</Label>
                  <Input
                    value={invoiceData.bride_whatsapp}
                    onChange={(e) => setInvoiceData({ ...invoiceData, bride_whatsapp: e.target.value })}
                    placeholder="WhatsApp number"
                    className="print:border-0 print:p-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Address</Label>
                  <Textarea
                    value={invoiceData.bride_address}
                    onChange={(e) => setInvoiceData({ ...invoiceData, bride_address: e.target.value })}
                    placeholder="Address"
                    rows={2}
                    className="print:border-0 print:p-0"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sales Staff Selection */}
          <Card className="p-4 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Sales Staff</span>
            </div>
            <Select
              value={invoiceData.sales_closed_by_id}
              onValueChange={(v) => setInvoiceData({ ...invoiceData, sales_closed_by_id: v })}
            >
              <SelectTrigger>
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
          </Card>

          {/* Venue Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Venue Address
              </Label>
              <Textarea
                value={invoiceData.venue_address}
                onChange={(e) => setInvoiceData({ ...invoiceData, venue_address: e.target.value })}
                placeholder="Enter venue address..."
                rows={2}
                className="mt-1 print:border-0 print:p-0"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Delivery Address (if different)
              </Label>
              <Textarea
                value={invoiceData.delivery_address}
                onChange={(e) => setInvoiceData({ ...invoiceData, delivery_address: e.target.value })}
                placeholder="Leave empty if same as venue..."
                rows={2}
                className="mt-1 print:border-0 print:p-0"
              />
            </div>
          </div>

          {/* Coupon Code */}
          <Card className="p-4 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-purple-500" />
              <span className="font-semibold">Coupon</span>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Coupon Code</Label>
                <Input
                  value={invoiceData.coupon_code}
                  onChange={(e) => setInvoiceData({ ...invoiceData, coupon_code: e.target.value.toUpperCase() })}
                  placeholder="Enter coupon code"
                />
              </div>
              <div className="w-32">
                <Label className="text-xs text-gray-500">Discount</Label>
                <Input
                  type="number"
                  value={invoiceData.coupon_discount}
                  onChange={(e) => setInvoiceData({ ...invoiceData, coupon_discount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">Items</span>
                <Badge variant="secondary">{invoiceItems.length}</Badge>
              </div>
            </div>

            {/* Product Search - Hidden on print */}
            <div className="print:hidden mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Search product by name or scan barcode..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setShowProductDropdown(true)
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredProducts.length > 0) {
                      addProduct(filteredProducts[0])
                    }
                  }}
                  className="pl-10"
                />
              </div>

              {showProductDropdown && productSearch && (
                <div className="absolute z-10 mt-1 w-full max-w-2xl bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No products found</div>
                  ) : (
                    filteredProducts.slice(0, 10).map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex items-center justify-between"
                        onClick={() => addProduct(product)}
                      >
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              {product.barcode && <span className="mr-2">#{product.barcode}</span>}
                              {product.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-orange-600">
                            {formatCurrency(invoiceData.invoice_type === "rental" ? product.rental_price : (product.sale_price || product.rental_price))}
                          </div>
                          <div className="text-xs text-gray-500">Stock: {product.stock_available}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-center p-3 font-medium w-28">Qty</th>
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
                        <p>No items added yet</p>
                        <p className="text-xs">Search products above to add items</p>
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
                              className="w-12 text-center h-7 print:border-0"
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

          {/* Lost/Damaged Items Section */}
          {(mode === "final-bill" || lostDamagedItems.length > 0) && (
            <div className="border-t pt-6">
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
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Select Product</th>
                        <th className="text-center p-3 font-medium w-28">Type</th>
                        <th className="text-center p-3 font-medium w-20">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Charge/Item</th>
                        <th className="text-right p-3 font-medium w-28">Total</th>
                        <th className="w-12 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lostDamagedItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 relative">
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
                              <div className="print:hidden">
                                <Input
                                  placeholder="Search product..."
                                  onFocus={() => setLostDamagedProductSearch(item.id)}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="text-sm"
                                />
                                {lostDamagedProductSearch === item.id && productSearch && (
                                  <div className="absolute z-20 left-3 right-3 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
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

          {/* Button to show Lost/Damaged section */}
          {mode !== "final-bill" && lostDamagedItems.length === 0 && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment & Discount */}
            <Card className="p-4">
              <div className="font-semibold mb-3">Payment Details</div>
              <div className="space-y-3 text-sm">
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
                      <SelectItem value="full">Full Payment</SelectItem>
                      <SelectItem value="advance">50% Advance</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount Paid</Label>
                  <Input
                    type="number"
                    value={invoiceData.amount_paid}
                    onChange={(e) => setInvoiceData({ ...invoiceData, amount_paid: parseFloat(e.target.value) || 0 })}
                    className="print:border-0"
                    placeholder="₹0"
                  />
                </div>
                {invoiceData.invoice_type === "rental" && (
                  <div>
                    <Label className="text-xs text-gray-500">Security Deposit</Label>
                    <Input
                      type="number"
                      value={invoiceData.security_deposit}
                      onChange={(e) => setInvoiceData({ ...invoiceData, security_deposit: parseFloat(e.target.value) || 0 })}
                      className="print:border-0"
                      placeholder="₹0"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Discount</Label>
                    <Input
                      type="number"
                      value={invoiceData.discount_amount}
                      onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="print:border-0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <Select
                      value={invoiceData.discount_type}
                      onValueChange={(v) => setInvoiceData({ ...invoiceData, discount_type: v as any })}
                    >
                      <SelectTrigger className="print:border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">₹ Fixed</SelectItem>
                        <SelectItem value="percentage">% Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-4 bg-gray-50">
              <div className="font-semibold mb-3">Summary</div>
              <div className="space-y-2 text-sm">
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span>{formatCurrency(securityDeposit)}</span>
                  </div>
                )}
                {lostDamagedTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Lost/Damaged Charges</span>
                    <span>{formatCurrency(lostDamagedTotal)}</span>
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

          {/* Terms & Conditions */}
          <Card className="p-4 bg-gray-50 print:bg-white">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-sm">Terms & Conditions</span>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Rental Terms</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>All items must be returned by the agreed return date</li>
                    <li>Late returns will incur additional charges</li>
                    <li>Items must be returned in original condition</li>
                    <li>Customer is responsible for items during rental period</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Damage & Loss</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Minor damage: Repair charges apply</li>
                    <li>Major damage: Replacement cost charged</li>
                    <li>Lost items: Full replacement cost charged</li>
                    <li>Security deposit used to cover damages</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Payment</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Advance payment required for booking confirmation</li>
                    <li>Balance due before delivery/pickup</li>
                    <li>Security deposit refunded after return inspection</li>
                    <li>No refunds for cancellations within 24 hours</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">General</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>ID proof required at time of delivery</li>
                    <li>Alterations not allowed on rental items</li>
                    <li>Prices subject to change without notice</li>
                    <li>Management decision final in disputes</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-gray-500">
            <p>Thank you for choosing Safawala!</p>
            <p>Terms & Conditions apply. Please return items in original condition.</p>
          </div>
        </div>
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
                Quote
              </Button>
              <Button onClick={handleCreateOrder} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Create Order
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
                <Label className="text-xs">City</Label>
                <Input
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Pincode</Label>
                <Input
                  value={newCustomer.pincode}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
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
    </div>
  )
}
