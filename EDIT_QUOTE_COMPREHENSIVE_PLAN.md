# Complete Edit Quote Form - Comprehensive Implementation Plan

## 🎯 Current Status

### ✅ What Exists:
- Basic edit dialog for event/wedding details
- Customer info display (read-only)
- Event dates, venue, groom/bride details
- Save functionality for event fields

### ❌ What's Missing (Critical):
- **Product/Package selection editing**
- **Variant selection for packages**
- **Inclusions management**
- **Quantity adjustment**
- **Add/Remove items from quote**
- **Pricing recalculation**
- **Security deposit updates**
- **Tax recalculation**

## 🔧 Solution: Multi-Tab Edit Dialog

### **Tab 1: Event & Customer Details** ✅ (Enhance existing)
- Customer info (read-only)
- Event type, dates, times
- Venue details
- Groom/Bride information
- Special instructions

### **Tab 2: Products & Packages** ❌ (NEW - CRITICAL)
- **Current Items List** with:
  - Product/Package name
  - Variant (for packages)
  - Quantity controls (+/-)
  - Unit price display
  - Total price
  - Security deposit
  - Remove button
  
- **Add Products Section**:
  - Search bar
  - Category filter
  - Product list with "Add" button
  - For packages: Variant selector dialog
  - For packages: Inclusions display

### **Tab 3: Review & Pricing** ❌ (NEW)
- Full items summary
- Pricing breakdown:
  - Subtotal
  - Discount (if any)
  - Tax/GST
  - Security Deposit
  - **Total Amount**
- Payment terms
- Final save button

## 📦 Data Structure Needed

```typescript
interface EditQuoteState {
  // Existing event details
  event_type: string
  event_date: string
  delivery_date: string
  return_date: string
  venue_address: string
  groom_name: string
  bride_name: string
  notes: string
  
  // NEW: Items management
  items: EditQuoteItem[]
  removedItemIds: string[]
  
  // NEW: Pricing
  subtotal: number
  discount: number
  tax_amount: number
  tax_percentage: number
  security_deposit: number
  total_amount: number
}

interface EditQuoteItem {
  id?: string  // For existing items
  product_id: string
  product_name: string
  category: string
  variant_id?: string
  variant_name?: string
  variant_inclusions?: string[]
  quantity: number
  unit_price: number
  total_price: number
  security_deposit: number
  extra_safas?: number
  is_new?: boolean  // Flag for newly added items
}
```

## 🚀 Implementation Steps

### **Step 1: Add Item State Management**
```typescript
const [editItems, setEditItems] = useState<EditQuoteItem[]>([])
const [removedItemIds, setRemovedItemIds] = useState<string[]>([])
const [showProductBrowser, setShowProductBrowser] = useState(false)
const [products, setProducts] = useState<any[]>([])
const [packages, setPackages] = useState<any[]>([])
```

### **Step 2: Load Quote Items When Dialog Opens**
```typescript
const handleEditQuote = async (quote: Quote) => {
  setSelectedQuote(quote)
  
  // Load event details (existing)
  // ...
  
  // NEW: Load quote items
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quote.id)
  
  setEditItems(items.map(item => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    category: item.category,
    variant_id: item.variant_id,
    variant_name: item.variant_name,
    variant_inclusions: item.variant_inclusions,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    security_deposit: item.security_deposit,
    extra_safas: item.extra_safas,
  })))
  
  setShowEditDialog(true)
}
```

### **Step 3: Item Management Functions**
```typescript
// Update quantity
const handleUpdateQuantity = (itemIndex: number, newQuantity: number) => {
  const newItems = [...editItems]
  newItems[itemIndex].quantity = newQuantity
  newItems[itemIndex].total_price = newQuantity * newItems[itemIndex].unit_price
  setEditItems(newItems)
  recalculateTotals(newItems)
}

// Remove item
const handleRemoveItem = (itemIndex: number) => {
  const item = editItems[itemIndex]
  if (item.id) {
    setRemovedItemIds([...removedItemIds, item.id])
  }
  const newItems = editItems.filter((_, i) => i !== itemIndex)
  setEditItems(newItems)
  recalculateTotals(newItems)
}

// Add new item
const handleAddItem = (product: any, variant?: any) => {
  const newItem: EditQuoteItem = {
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    variant_id: variant?.id,
    variant_name: variant?.variant_name,
    variant_inclusions: variant?.inclusions,
    quantity: 1,
    unit_price: variant?.base_price || product.base_price || 0,
    total_price: variant?.base_price || product.base_price || 0,
    security_deposit: variant?.security_deposit || product.security_deposit || 0,
    is_new: true,
  }
  const newItems = [...editItems, newItem]
  setEditItems(newItems)
  recalculateTotals(newItems)
}

// Recalculate totals
const recalculateTotals = (items: EditQuoteItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const securityDeposit = items.reduce((sum, item) => sum + (item.security_deposit * item.quantity), 0)
  const taxAmount = subtotal * 0.18 // 18% GST
  const totalAmount = subtotal + taxAmount + securityDeposit
  
  setEditFormData(prev => ({
    ...prev,
    subtotal,
    tax_amount: taxAmount,
    security_deposit: securityDeposit,
    total_amount: totalAmount,
  }))
}
```

### **Step 4: Save with Items Update**
```typescript
const handleSaveQuote = async () => {
  try {
    setIsSaving(true)
    
    // 1. Update quote header
    await supabase
      .from(table)
      .update({
        event_type: editFormData.event_type,
        // ... other event fields
        total_amount: editFormData.total_amount,
        security_deposit: editFormData.security_deposit,
        tax_amount: editFormData.tax_amount,
      })
      .eq('id', selectedQuote.id)
    
    // 2. Delete removed items
    if (removedItemIds.length > 0) {
      await supabase
        .from('quote_items')
        .delete()
        .in('id', removedItemIds)
    }
    
    // 3. Update existing items
    for (const item of editItems.filter(i => i.id && !i.is_new)) {
      await supabase
        .from('quote_items')
        .update({
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          security_deposit: item.security_deposit,
        })
        .eq('id', item.id)
    }
    
    // 4. Insert new items
    const newItems = editItems.filter(i => i.is_new).map(item => ({
      quote_id: selectedQuote.id,
      product_id: item.product_id,
      product_name: item.product_name,
      category: item.category,
      variant_id: item.variant_id,
      variant_name: item.variant_name,
      variant_inclusions: item.variant_inclusions,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      security_deposit: item.security_deposit,
      extra_safas: item.extra_safas,
    }))
    
    if (newItems.length > 0) {
      await supabase.from('quote_items').insert(newItems)
    }
    
    toast.success("Quote updated successfully!")
    setShowEditDialog(false)
    await loadQuotes()
  } catch (error) {
    toast.error("Failed to update quote")
  } finally {
    setIsSaving(false)
  }
}
```

### **Step 5: Enhanced UI with Tabs**
```tsx
<Tabs defaultValue="event" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="event">Event Details</TabsTrigger>
    <TabsTrigger value="items">Products & Packages</TabsTrigger>
    <TabsTrigger value="review">Review & Pricing</TabsTrigger>
  </TabsList>
  
  <TabsContent value="event">
    {/* Existing event details form */}
  </TabsContent>
  
  <TabsContent value="items">
    {/* NEW: Items management */}
    <div className="space-y-4">
      {/* Current Items */}
      <Card>
        <CardHeader>
          <CardTitle>Current Items</CardTitle>
        </CardHeader>
        <CardContent>
          {editItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{item.product_name}</p>
                {item.variant_name && <p className="text-sm text-gray-500">Variant: {item.variant_name}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleUpdateQuantity(index, item.quantity - 1)}>-</Button>
                  <span>{item.quantity}</span>
                  <Button size="sm" onClick={() => handleUpdateQuantity(index, item.quantity + 1)}>+</Button>
                </div>
                <span className="font-medium">{formatCurrency(item.total_price)}</span>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveItem(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Add Products */}
      <Button onClick={() => setShowProductBrowser(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Products/Packages
      </Button>
    </div>
  </TabsContent>
  
  <TabsContent value="review">
    {/* NEW: Pricing summary */}
    <Card>
      <CardHeader>
        <CardTitle>Pricing Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(editFormData.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (18%):</span>
            <span>{formatCurrency(editFormData.tax_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Security Deposit:</span>
            <span>{formatCurrency(editFormData.security_deposit)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(editFormData.total_amount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

## 📊 Benefits of This Approach

1. **Complete Functionality**: True 0-100% edit capability
2. **User-Friendly**: Tabbed interface for organized editing
3. **Real-Time Updates**: Pricing recalculates as items change
4. **Flexible**: Add, remove, or modify items
5. **Professional**: Matches quality of add quote flow

## 🎯 Implementation Priority

1. **HIGH**: Add items state management
2. **HIGH**: Load quote items in handleEditQuote
3. **HIGH**: Create Items tab with current items display
4. **HIGH**: Add quantity update functionality
5. **MEDIUM**: Add product browser for adding new items
6. **MEDIUM**: Create Review tab with pricing summary
7. **MEDIUM**: Update save function to handle items
8. **LOW**: Polish UI and add animations

## 📝 Testing Checklist

- [ ] Open edit dialog for existing quote
- [ ] Items load correctly from database
- [ ] Can increase/decrease quantities
- [ ] Pricing updates in real-time
- [ ] Can remove items
- [ ] Can add new products/packages
- [ ] Can select variants for packages
- [ ] Save updates both header and items
- [ ] Removed items deleted from database
- [ ] New items inserted correctly
- [ ] Quote list refreshes after save

---

**Status**: Ready for implementation
**Estimated Time**: 2-3 hours for complete implementation
**Quality Target**: Steve Jobs 0-100% - Full feature parity with add quote flow
