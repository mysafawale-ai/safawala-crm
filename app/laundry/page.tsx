"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Plus,
  Search,
  Eye,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react"

interface Vendor {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  service_type: string
  pricing_per_item?: number
  notes: string
  is_active: boolean
}

interface LaundryBatch {
  id: string
  batch_number: string
  vendor_name: string
  status: string
  total_items: number
  total_cost: number
  sent_date: string
  expected_return_date: string
  actual_return_date: string | null
  notes: string
  categories: string
  item_types_count: number
}

interface BatchItem {
  id: string
  product_name: string
  product_category: string
  quantity: number
  condition_before: string
  condition_after: string | null
  unit_cost: number
  total_cost: number
  notes: string
}

interface Product {
  id: string
  name: string
  category: string
  price?: number
}

interface NewBatchItem {
  product_id: string | null
  product_name: string
  product_category: string
  quantity: number
  unit_cost: number
  total_cost: number
  condition_before: string
  notes: string
}

const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "Premium Dry Cleaners",
    contact_person: "Rajesh Kumar",
    phone: "+91-9876543210",
    email: "rajesh@premiumdry.com",
    service_type: "both",
    notes: "Specializes in delicate fabrics and wedding attire",
    is_active: true,
  },
  {
    id: "2",
    name: "Royal Laundry Services",
    contact_person: "Priya Sharma",
    phone: "+91-9876543211",
    email: "priya@royallaundry.com",
    service_type: "laundry",
    notes: "Fast turnaround, good for bulk items",
    is_active: true,
  },
  {
    id: "3",
    name: "Express Clean Co.",
    contact_person: "Amit Singh",
    phone: "+91-9876543212",
    email: "amit@expressclean.com",
    service_type: "dry_cleaning",
    notes: "Premium service for expensive items",
    is_active: true,
  },
]

const mockBatches: LaundryBatch[] = [
  {
    id: "1",
    batch_number: "LB001",
    vendor_name: "Premium Cleaners",
    sent_date: "2024-01-15",
    expected_return_date: "2024-01-18",
    actual_return_date: null,
    status: "in_progress",
    total_items: 5,
    total_cost: 250.0,
    notes: "Rush order for weekend wedding",
    categories: "Veils and Drapes",
    item_types_count: 1,
  },
]

const mockProducts: Product[] = [
  { id: "1", name: "Wedding Dress", category: "Bridal Wear", price: 50.0 },
  { id: "2", name: "Tuxedo", category: "Formal Wear", price: 40.0 },
  { id: "3", name: "Tablecloth", category: "Linens", price: 15.0 },
  { id: "4", name: "Napkins", category: "Linens", price: 5.0 },
  { id: "5", name: "Bridal Veil", category: "Veils and Drapes", price: 60.0 },
  { id: "6", name: "Formal Shirt", category: "Formal Wear", price: 20.0 },
  { id: "7", name: "Saree", category: "Traditional Wear", price: 35.0 },
  { id: "8", name: "Lehenga", category: "Bridal Wear", price: 75.0 },
  { id: "9", name: "Curtains", category: "Linens", price: 25.0 },
  { id: "10", name: "Bedsheets", category: "Linens", price: 18.0 },
]

const mockBatchItems: BatchItem[] = [
  {
    id: "1",
    product_name: "Wedding Dress",
    product_category: "Bridal Wear",
    quantity: 2,
    condition_before: "dirty",
    condition_after: "clean",
    unit_cost: 50.0,
    total_cost: 100.0,
    notes: "Delicate silk material",
  },
  {
    id: "2",
    product_name: "Tuxedo",
    product_category: "Formal Wear",
    quantity: 3,
    condition_before: "stained",
    condition_after: "clean",
    unit_cost: 40.0,
    total_cost: 120.0,
    notes: "Wine stain on lapel",
  },
]

export default function LaundryPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [batches, setBatches] = useState<LaundryBatch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBatch, setSelectedBatch] = useState<LaundryBatch | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [showCreateBatch, setShowCreateBatch] = useState(false)
  const [showBatchDetails, setShowBatchDetails] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [showAddVendorDialog, setShowAddVendorDialog] = useState(false)

  const [editingBatch, setEditingBatch] = useState<LaundryBatch | null>(null)
  const [showEditBatch, setShowEditBatch] = useState(false)
  const [editBatchItems, setEditBatchItems] = useState<BatchItem[]>([])
  const [editSelectedProduct, setEditSelectedProduct] = useState("")
  const [editItemQuantity, setEditItemQuantity] = useState(1)
  const [editItemCondition, setEditItemCondition] = useState("dirty")
  const [editItemNotes, setEditItemNotes] = useState("")

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    vendor_id: "",
    sent_date: new Date().toISOString().split("T")[0],
    expected_return_date: "",
    notes: "",
    special_instructions: "",
  })

  const [newBatchItems, setNewBatchItems] = useState<NewBatchItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemCondition, setItemCondition] = useState("dirty")
  const [itemNotes, setItemNotes] = useState("")

  const [newVendor, setNewVendor] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    service_type: "laundry",
    notes: "",
  })

  const [customProductName, setCustomProductName] = useState("")
  const [showCustomProduct, setShowCustomProduct] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      let vendorsData: Vendor[] = []
      let batchesData: LaundryBatch[] = []
      let productsData: Product[] = []
      let hasErrors = false

      // Try to fetch vendors
      try {
        const { data: vendorsResult, error: vendorsError } = await supabase
          .from("vendors")
          .select("*")
          .eq("is_active", true)

        if (vendorsError) {
          console.error("Vendors error:", vendorsError)
          hasErrors = true
        } else {
          vendorsData = vendorsResult || []
        }
      } catch (error) {
        console.error("Vendors fetch failed:", error)
        hasErrors = true
      }

      // Try to fetch batches
      try {
        const { data: batchesResult, error: batchesError } = await supabase.from("laundry_batch_summary").select("*")

        if (batchesError) {
          console.error("Batches error:", batchesError)
          hasErrors = true
        } else {
          batchesData = batchesResult || []
        }
      } catch (error) {
        console.error("Batches fetch failed:", error)
        hasErrors = true
      }

      // Try to fetch products
      try {
        const { data: productsResult, error: productsError } = await supabase
          .from("products")
          .select("id, name, category, price")

        if (productsError) {
          console.error("Products error:", productsError)
          hasErrors = true
        } else {
          productsData = productsResult || []
        }
      } catch (error) {
        console.error("Products fetch failed:", error)
        hasErrors = true
      }

      if (hasErrors || (vendorsData.length === 0 && batchesData.length === 0)) {
        throw new Error("Database tables not found or empty")
      }

      setVendors(vendorsData)
      setBatches(batchesData)
      setProducts(productsData)
      setUsingMockData(false)

      toast({
        title: "Data loaded successfully",
        description: "Connected to database and loaded real data.",
      })
    } catch (error: any) {
      console.error("Database error:", error)

      // Fall back to mock data
      setVendors(mockVendors)
      setBatches(mockBatches)
      setProducts(mockProducts)
      setUsingMockData(true)

      toast({
        title: "Using sample data",
        description: "Database not configured. Run the laundry management schema script to enable full functionality.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBatchItems = async (batchId: string) => {
    if (usingMockData) {
      setBatchItems(mockBatchItems)
      return
    }

    try {
      const { data, error } = await supabase.from("laundry_batch_items").select("*").eq("batch_id", batchId)

      if (error) throw error
      setBatchItems(data || [])
    } catch (error) {
      console.error("Error fetching batch items:", error)
      setBatchItems(mockBatchItems)
    }
  }

  const handleViewBatch = async (batch: LaundryBatch) => {
    setSelectedBatch(batch)
    await fetchBatchItems(batch.id)
    setShowBatchDetails(true)
  }

  const generateBatchNumber = () => {
    const prefix = "LB"
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }

  const addItemToBatch = () => {
    if (!selectedProduct && !showCustomProduct) {
      toast({
        title: "Error",
        description: "Please select a product or enter a custom product name",
        variant: "destructive",
      })
      return
    }

    if (showCustomProduct && !customProductName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom product name",
        variant: "destructive",
      })
      return
    }

    let productData
    if (showCustomProduct) {
      productData = {
        id: null,
        name: customProductName.trim(),
        category: "Custom",
      }
    } else {
      const product = products.find((p) => p.id === selectedProduct)
      if (!product) return
      productData = product
    }

    const selectedVendor = vendors.find((v) => v.id === newBatch.vendor_id)
    const unitCost = selectedVendor?.pricing_per_item || 0
    const totalCost = unitCost * itemQuantity

    const newItem: NewBatchItem = {
      product_id: productData.id,
      product_name: productData.name,
      product_category: productData.category,
      quantity: itemQuantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      condition_before: itemCondition,
      notes: itemNotes,
    }

    setNewBatchItems([...newBatchItems, newItem])

    // Reset form
    setSelectedProduct("")
    setCustomProductName("")
    setShowCustomProduct(false)
    setItemQuantity(1)
    setItemCondition("dirty")
    setItemNotes("")
  }

  const removeItemFromBatch = (index: number) => {
    setNewBatchItems(newBatchItems.filter((_, i) => i !== index))
  }

  const getTotalBatchCost = () => {
    return newBatchItems.reduce((sum, item) => sum + item.total_cost, 0)
  }

  const getTotalBatchItems = () => {
    return newBatchItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const resetBatchForm = () => {
    setNewBatch({
      vendor_id: "",
      sent_date: new Date().toISOString().split("T")[0],
      expected_return_date: "",
      notes: "",
      special_instructions: "",
    })
    setNewBatchItems([])
    setSelectedProduct("")
    setCustomProductName("")
    setShowCustomProduct(false)
    setItemQuantity(1)
    setItemCondition("dirty")
    setItemNotes("")
  }

  const handleCreateBatch = async () => {
    if (usingMockData) {
      toast({
        title: "Demo Mode",
        description: "Batch creation is not available in demo mode. Please configure the database.",
        variant: "destructive",
      })
      return
    }

    if (!newBatch.vendor_id || !newBatch.sent_date || !newBatch.expected_return_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (newBatchItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the batch",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)

      const selectedVendor = vendors.find((v) => v.id === newBatch.vendor_id)
      const batchNumber = generateBatchNumber()

      // Create the batch
      const { data: batchData, error: batchError } = await supabase
        .from("laundry_batches")
        .insert({
          batch_number: batchNumber,
          vendor_id: newBatch.vendor_id,
          vendor_name: selectedVendor?.name || "",
          status: "in_progress",
          sent_date: newBatch.sent_date,
          expected_return_date: newBatch.expected_return_date,
          notes: newBatch.notes,
          special_instructions: newBatch.special_instructions,
          total_items: getTotalBatchItems(),
          total_cost: getTotalBatchCost(),
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Create batch items
      const batchItemsToInsert = newBatchItems.map((item) => ({
        batch_id: batchData.id,
        product_id: item.product_id === null ? null : item.product_id,
        product_name: item.product_name,
        product_category: item.product_category,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        condition_before: item.condition_before,
        notes: item.notes,
      }))

      const { error: itemsError } = await supabase.from("laundry_batch_items").insert(batchItemsToInsert)

      if (itemsError) throw itemsError

      toast({
        title: "Batch created successfully",
        description: `Batch ${batchNumber} has been created with ${getTotalBatchItems()} items and is now in progress.`,
      })

      setShowCreateBatch(false)
      resetBatchForm()
      fetchData()
    } catch (error: any) {
      console.error("Error creating batch:", error)
      toast({
        title: "Error",
        description: "Failed to create batch. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleStatusUpdate = async (batch: LaundryBatch, newStatus: string) => {
    try {
      setCreating(true)

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === "cancelled" && { total_cost: 0 }),
      }

      const { error } = await supabase.from("laundry_batches").update(updateData).eq("id", batch.id)

      if (error) throw error

      if (newStatus === "returned") {
        toast({
          title: "Batch returned",
          description: `Batch ${batch.batch_number} has been returned successfully.`,
        })
      } else if (newStatus === "cancelled") {
        toast({
          title: "Batch cancelled",
          description: `Batch ${batch.batch_number} has been cancelled and total cost reset to ₹0.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Status updated",
          description: `Batch ${batch.batch_number} status changed to ${newStatus.replace("_", " ")}.`,
        })
      }

      fetchData()
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "in_progress":
        return <Truck className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "returned":
        return <Package className="h-4 w-4" />
      case "cancelled":
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "returned":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading laundry management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laundry Management</h1>
            <p className="text-muted-foreground">Manage laundry batches and vendor relationships</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Laundry Batch</DialogTitle>
                <DialogDescription>Create a new batch to send items to a laundry vendor</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Batch Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select
                      value={newBatch.vendor_id}
                      onValueChange={(value) => setNewBatch({ ...newBatch, vendor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name} - ({vendor.service_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sent_date">Sent Date *</Label>
                    <Input
                      type="date"
                      value={newBatch.sent_date}
                      onChange={(e) => setNewBatch({ ...newBatch, sent_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_return_date">Expected Return Date *</Label>
                  <Input
                    type="date"
                    value={newBatch.expected_return_date}
                    onChange={(e) => setNewBatch({ ...newBatch, expected_return_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    placeholder="General notes about this batch..."
                    value={newBatch.notes}
                    onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                  />
                </div>

                {/* Add Items Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Add Items to Batch</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="product">Product</Label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="custom-product"
                          checked={showCustomProduct}
                          onChange={(e) => {
                            setShowCustomProduct(e.target.checked)
                            if (e.target.checked) {
                              setSelectedProduct("")
                            } else {
                              setCustomProductName("")
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor="custom-product" className="text-sm">
                          Other Product
                        </Label>
                      </div>

                      {showCustomProduct ? (
                        <Input
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value)}
                          placeholder="Enter product name"
                          className="w-full"
                        />
                      ) : (
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="condition">Condition Before</Label>
                      <Select value={itemCondition} onValueChange={setItemCondition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dirty">Dirty</SelectItem>
                          <SelectItem value="stained">Stained</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="clean">Clean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="laundry_charge">Laundry Charge (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="placeholder:text-muted-foreground/30"
                        onChange={(e) => {
                          const selectedVendor = vendors.find((v) => v.id === newBatch.vendor_id)
                          if (selectedVendor) {
                            selectedVendor.pricing_per_item = Number.parseFloat(e.target.value) || 0
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="item_notes">Item Notes</Label>
                      <Input
                        placeholder="Notes about this item..."
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={addItemToBatch} className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>

                  {/* Items List */}
                  {newBatchItems.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h4 className="font-semibold">
                          Batch Items ({getTotalBatchItems()} items, ₹{getTotalBatchCost().toFixed(2)} total)
                        </h4>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newBatchItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>{item.product_category}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.condition_before}</Badge>
                              </TableCell>
                              <TableCell>₹{item.unit_cost.toFixed(2)}</TableCell>
                              <TableCell>₹{item.total_cost.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeItemFromBatch(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateBatch(false)
                    resetBatchForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch} disabled={creating}>
                  {creating ? "Creating..." : "Create Batch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Database Status Alert */}
      {usingMockData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Database Schema Update Needed:</strong> Laundry management tables are missing. Run the SQL script to
            add laundry management schema and enable full functionality.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">Active laundry batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.filter((b) => b.status === "in_progress").length}</div>
            <p className="text-xs text-muted-foreground">Currently being processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.reduce((sum, batch) => sum + batch.total_items, 0)}</div>
            <p className="text-xs text-muted-foreground">Items in all batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{batches.reduce((sum, batch) => sum + batch.total_cost, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total laundry costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Laundry Batches</CardTitle>
          <CardDescription>Track and manage all laundry batches sent to vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batches Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_number}</TableCell>
                    <TableCell>{batch.vendor_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(batch.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(batch.status)}
                          {batch.status.replace("_", " ")}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{batch.total_items} items</div>
                        <div className="text-muted-foreground">{batch.item_types_count} types</div>
                      </div>
                    </TableCell>
                    <TableCell>₹{batch.total_cost.toFixed(2)}</TableCell>
                    <TableCell>{new Date(batch.sent_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(batch.expected_return_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {batch.status === "in_progress" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(batch, "returned")}
                              disabled={creating}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Mark Returned
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(batch, "cancelled")}
                              disabled={creating}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {batch.status === "returned" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(batch, "cancelled")}
                            disabled={creating}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Details Dialog */}
      <Dialog open={showBatchDetails} onOpenChange={setShowBatchDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Batch Details - {selectedBatch?.batch_number}</DialogTitle>
            <DialogDescription>Detailed information about this laundry batch</DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm font-medium">{selectedBatch.vendor_name}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedBatch.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedBatch.status)}
                      {selectedBatch.status.replace("_", " ")}
                    </div>
                  </Badge>
                </div>
                <div>
                  <Label>Sent Date</Label>
                  <p className="text-sm">{new Date(selectedBatch.sent_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Expected Return</Label>
                  <p className="text-sm">{new Date(selectedBatch.expected_return_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Total Items</Label>
                  <p className="text-sm font-medium">{selectedBatch.total_items}</p>
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="text-sm font-medium">₹{selectedBatch.total_cost.toFixed(2)}</p>
                </div>
              </div>

              {selectedBatch.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedBatch.notes}</p>
                </div>
              )}

              {/* Batch Items */}
              <div>
                <Label className="text-base font-semibold">Batch Items</Label>
                <div className="mt-2 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Condition Before</TableHead>
                        <TableHead>Condition After</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.product_category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.condition_before}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.condition_after ? (
                              <Badge variant="outline">{item.condition_after}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>₹{item.unit_cost.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
