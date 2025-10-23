# 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  (Your booking pages, order pages, etc.)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ imports & uses
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT LAYER                                │
│                                                                  │
│  ┌────────────────────────┐    ┌───────────────────────────┐  │
│  │  ItemsSelectionDialog  │    │   ItemsDisplayDialog      │  │
│  │                        │    │                           │  │
│  │  • Browse products     │    │  • View selected items    │  │
│  │  • Search & filter     │    │  • Edit quantities        │  │
│  │  • Check availability  │    │  • Remove items           │  │
│  │  • Select items        │    │  • Show summary           │  │
│  └────────────┬───────────┘    └──────────┬────────────────┘  │
│               │                             │                   │
└───────────────┼─────────────────────────────┼───────────────────┘
                │                             │
                │ uses                        │ uses
                ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HOOKS LAYER                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │useItemSelection│  │useAvailability│  │useOrderCalculations│ │
│  │              │  │Check         │  │                      │ │
│  │• Add items   │  │              │  │• Subtotal            │ │
│  │• Remove      │  │• Check stock │  │• Discounts           │ │
│  │• Update qty  │  │• Date range  │  │• GST                 │ │
│  │• Calculations│  │• Conflicts   │  │• Security deposit    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │             │
│  ┌──────┴──────────────────┴──────────────────────┴───────────┐│
│  │              useProductFilter                               ││
│  │                                                              ││
│  │  • Search term                                              ││
│  │  • Category filter                                          ││
│  │  • Subcategory filter                                       ││
│  │  • Stock filter                                             ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ uses
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TYPES LAYER                                  │
│                                                                  │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Product      │  │   PackageSet    │  │    Category     │ │
│  │                │  │                 │  │                 │ │
│  │• id            │  │• id             │  │• id             │ │
│  │• name          │  │• name           │  │• name           │ │
│  │• rental_price  │  │• base_price     │  │• display_order  │ │
│  │• sale_price    │  │• variants[]     │  │                 │ │
│  │• stock         │  │• extra_safas    │  │                 │ │
│  └────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌──────────────────────────┐  ┌───────────────────────────┐  │
│  │  SelectedProductItem     │  │  SelectedPackageItem      │  │
│  │                          │  │                           │  │
│  │• id                      │  │• id                       │  │
│  │• product_id              │  │• package_id               │  │
│  │• product                 │  │• variant_id               │  │
│  │• quantity                │  │• package                  │  │
│  │• unit_price              │  │• variant                  │  │
│  │• total_price             │  │• quantity                 │  │
│  └──────────────────────────┘  │• extra_safas              │  │
│                                 │• security_deposit         │  │
│                                 └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ persists to
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Supabase Database                       │  │
│  │                                                            │  │
│  │  Tables:                                                   │  │
│  │  • products                                                │  │
│  │  • package_sets                                            │  │
│  │  • package_variants                                        │  │
│  │  • product_orders                                          │  │
│  │  • product_order_items                                     │  │
│  │  • package_bookings                                        │  │
│  │  • package_booking_items                                   │  │
│  │  • categories                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Selection Flow
```
User Action → ItemsSelectionDialog → useProductFilter → Filtered Items
                    ↓
            User Selects Item
                    ↓
            onItemSelect callback
                    ↓
            useItemSelection.addItem
                    ↓
            State Updated
```

### 2. Display Flow
```
State (items) → ItemsDisplayDialog → Render Items
                        ↓
                User Changes Quantity
                        ↓
                onQuantityChange callback
                        ↓
                useItemSelection.updateQuantity
                        ↓
                Recalculate Prices
                        ↓
                State Updated → Re-render
```

### 3. Calculation Flow
```
Selected Items → useOrderCalculations → {
                                          subtotal,
                                          discount,
                                          gst,
                                          total
                                        }
                                          ↓
                                    Display in Summary
```

### 4. Availability Flow
```
User Clicks Check → useAvailabilityCheck.checkSingleProduct
                            ↓
                    Query Supabase (products + bookings)
                            ↓
                    Calculate conflicts
                            ↓
                    Return availability data
                            ↓
                    Display in modal/badge
```

---

## 🎯 Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Component                          │
│                                                              │
│  const { items, addItem, ... } = useItemSelection()         │
│  const calculations = useOrderCalculations(items)           │
│                                                              │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │ Selection Button   │        │ Display Button       │    │
│  │ "Select Products"  │        │ "View Cart (3)"      │    │
│  └─────────┬──────────┘        └──────────┬───────────┘    │
│            │                                │                │
│            │ onClick                        │ onClick        │
│            ▼                                ▼                │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │ItemsSelectionDialog│        │ ItemsDisplayDialog   │    │
│  │                    │        │                      │    │
│  │ props:             │        │ props:               │    │
│  │ • items            │        │ • items              │    │
│  │ • onItemSelect     │───┐    │ • onQuantityChange   │─┐  │
│  │ • context          │   │    │ • onRemoveItem       │ │  │
│  └────────────────────┘   │    │ • summaryData        │ │  │
│                            │    └──────────────────────┘ │  │
│                            │                             │  │
│                            └─────────────────────────────┘  │
│                                    │                         │
│                                    ▼                         │
│                            Updates items state               │
│                                    │                         │
│                                    ▼                         │
│                            Triggers re-calculation           │
│                                    │                         │
│                                    ▼                         │
│                            Both dialogs get new data         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Modularity

Each layer is independent and reusable:

```
┌──────────────────────────────────────────────────────────────┐
│                    MODULARITY BENEFITS                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Components Layer:                                            │
│  • Can be used in any page                                    │
│  • No business logic inside                                   │
│  • Pure presentation                                          │
│                                                               │
│  Hooks Layer:                                                 │
│  • Reusable business logic                                    │
│  • Framework agnostic                                         │
│  • Easy to test                                               │
│                                                               │
│  Types Layer:                                                 │
│  • Single source of truth                                     │
│  • Type safety everywhere                                     │
│  • IntelliSense support                                       │
│                                                               │
│  Data Layer:                                                  │
│  • Supabase abstraction                                       │
│  • Can be swapped                                             │
│  • Consistent interface                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎪 Example: Full Flow

```
1. User opens booking page
        ↓
2. Page loads products from Supabase
        ↓
3. User clicks "Select Products"
        ↓
4. ItemsSelectionDialog opens
        ↓
5. User types "wedding" in search
        ↓
6. useProductFilter filters items
        ↓
7. Grid updates with filtered products
        ↓
8. User clicks "Add to Cart" on item
        ↓
9. onItemSelect callback fires
        ↓
10. useItemSelection.addItem updates state
        ↓
11. Dialog closes, button shows "View Cart (1)"
        ↓
12. User clicks "View Cart"
        ↓
13. ItemsDisplayDialog opens with items
        ↓
14. useOrderCalculations computes totals
        ↓
15. Summary shows ₹5,000 + ₹250 GST = ₹5,250
        ↓
16. User clicks "+" to increase quantity
        ↓
17. onQuantityChange callback fires
        ↓
18. useItemSelection.updateQuantity updates state
        ↓
19. Recalculates: ₹10,000 + ₹500 GST = ₹10,500
        ↓
20. Summary updates automatically
        ↓
21. User clicks "Proceed to Checkout"
        ↓
22. Items saved to database
```

---

## 🎨 State Management

```
┌────────────────────────────────────────────────────────────┐
│                    STATE FLOW                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Local State (Page):                                        │
│  ┌────────────────────────────────────┐                    │
│  │ const [showDialog, setShowDialog]  │                    │
│  │ const [products, setProducts]      │                    │
│  │ const [formData, setFormData]      │                    │
│  └────────────────────────────────────┘                    │
│                     ↓                                       │
│                                                             │
│  Hook State (useItemSelection):                            │
│  ┌────────────────────────────────────┐                    │
│  │ const [items, setItems]            │                    │
│  │                                    │                    │
│  │ Derived: totalItems, totalAmount   │                    │
│  └────────────────────────────────────┘                    │
│                     ↓                                       │
│                                                             │
│  Component State (Dialog):                                 │
│  ┌────────────────────────────────────┐                    │
│  │ const [searchTerm, setSearchTerm]  │                    │
│  │ const [viewMode, setViewMode]      │                    │
│  │ const [filter, setFilter]          │                    │
│  └────────────────────────────────────┘                    │
│                     ↓                                       │
│                                                             │
│  Computed (useMemo):                                        │
│  ┌────────────────────────────────────┐                    │
│  │ filteredItems = useMemo(...)       │                    │
│  │ calculations = useMemo(...)        │                    │
│  └────────────────────────────────────┘                    │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE STRATEGIES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Memoization:                                             │
│     • useMemo for filtered items                             │
│     • useMemo for calculations                               │
│     • React.memo for components                              │
│                                                              │
│  2. Callback Optimization:                                   │
│     • useCallback for event handlers                         │
│     • Prevent unnecessary re-renders                         │
│                                                              │
│  3. Lazy Loading:                                            │
│     • Load images on demand                                  │
│     • Paginate large lists                                   │
│                                                              │
│  4. Debouncing:                                              │
│     • Search input debounced                                 │
│     • Filter updates debounced                               │
│                                                              │
│  5. Virtual Scrolling (Future):                              │
│     • Render only visible items                              │
│     • Handle 1000+ items efficiently                         │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Reusability
- ✅ Testability
- ✅ Maintainability
- ✅ Scalability
- ✅ Performance

---

*Understanding this architecture will help you extend and customize the components!*
