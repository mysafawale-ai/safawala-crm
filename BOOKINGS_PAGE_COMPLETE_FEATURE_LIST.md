# 📋 BOOKINGS PAGE - COMPLETE MICROSCOPIC FEATURE LIST
## Steve Jobs + QA Tester Level Detail - EVERY Button, EVERY Pixel

**File:** `/app/bookings/page.tsx` (664 lines)  
**Last Updated:** October 14, 2025

---

## 🎯 SECTION 1: PAGE HEADER & NAVIGATION

### 1.1 Back Button
- **Icon:** ⬅️ ArrowLeft
- **Text:** "Back"
- **Variant:** outline
- **Action:** `router.push("/dashboard")`
- **Location:** Top-left corner

### 1.2 Page Title Section
- **Main Title:** "Bookings" (text-3xl font-bold)
- **Subtitle:** "Manage your customer bookings and orders" (text-muted-foreground)
- **Layout:** Below back button, left side

### 1.3 Top-Right Action Buttons (5 Buttons)
**Button 1: Refresh**
- **Icon:** 🔄 RefreshCw (spins when loading)
- **Text:** "Refresh"
- **Variant:** outline
- **Disabled:** When loading=true
- **Action:** Calls `refresh()` to reload data

**Button 2: CSV Export**
- **Icon:** None
- **Text:** "CSV"
- **Variant:** outline
- **Size:** sm
- **Action:** `exportBookings('csv')`
- **Downloads:** `bookings-YYYY-MM-DD.csv`

**Button 3: PDF Export**
- **Icon:** None
- **Text:** "PDF"
- **Variant:** outline
- **Size:** sm
- **Action:** `exportBookings('pdf')`
- **Downloads:** `bookings-YYYY-MM-DD.pdf`

**Button 4: Create Product Order**
- **Icon:** ➕ Plus
- **Text:** "Create Product Order"
- **Variant:** default (blue)
- **Action:** Link to `/create-product-order`
- **Purpose:** Create rental/sale product order

**Button 5: Book Package**
- **Icon:** ➕ Plus
- **Text:** "Book Package"
- **Variant:** default (blue)
- **Action:** Link to `/book-package`
- **Purpose:** Create package booking

---

## 📊 SECTION 2: DASHBOARD STATISTICS CARDS (6 Cards)

### Card 1: Total Bookings
- **Icon:** 📦 Package (h-4 w-4 text-muted-foreground)
- **Title:** "Total Bookings" (text-sm font-medium)
- **Value:** `{stats?.totalBookings || 0}` (text-2xl font-bold)
- **Description:** "All time bookings" (text-xs text-muted-foreground)
- **Data Source:** `stats.totalBookings` from `/api/booking-stats`

### Card 2: Pending Payment
- **Icon:** 💰 DollarSign
- **Title:** "Pending Payment"
- **Value:** `{stats?.paymentPendingBookings || 0}`
- **Description:** "Awaiting payment"
- **Data Source:** `stats.paymentPendingBookings`

### Card 3: Confirmed
- **Icon:** 📅 CalendarDays
- **Title:** "Confirmed"
- **Value:** `{stats?.confirmedBookings || 0}`
- **Description:** "Ready for delivery"
- **Data Source:** `stats.confirmedBookings`

### Card 4: Delivered
- **Icon:** 📦 Package
- **Title:** "Delivered"
- **Value:** `{stats?.deliveredBookings || 0}`
- **Description:** "Out for events"
- **Data Source:** `stats.deliveredBookings`

### Card 5: Completed
- **Icon:** 👥 Users
- **Title:** "Completed"
- **Value:** `{stats?.completedBookings || 0}`
- **Description:** "Successfully completed"
- **Data Source:** `stats.completedBookings`

### Card 6: Total Revenue
- **Icon:** 💰 DollarSign
- **Title:** "Total Revenue"
- **Value:** `₹{stats?.totalRevenue.toLocaleString()}` (with Indian Rupee symbol)
- **Description:** "From completed bookings"
- **Data Source:** `stats.totalRevenue`
- **Format:** Number with commas (e.g., ₹1,50,000)

**Grid Layout:**
- Mobile (< md): 2 columns
- Desktop (≥ lg): 6 columns

---

## 🔄 SECTION 3: VIEW MODE TABS

### Tab 1: Table View
- **Icon:** 📋 List (h-4 w-4)
- **Text:** "Table View"
- **Value:** "table"
- **Active State:** Shows when `viewMode === "table"`

### Tab 2: Calendar View
- **Icon:** 📅 Calendar (h-4 w-4)
- **Text:** "Calendar View"
- **Value:** "calendar"
- **Active State:** Shows when `viewMode === "calendar"`

---

## 🔍 SECTION 4: SEARCH & FILTER BAR

### 4.1 Search Input
- **Icon:** 🔍 Search (absolute left-2 top-2.5)
- **Placeholder:** "Search bookings..."
- **Width:** w-64 (256px)
- **Padding-left:** pl-8 (for icon)
- **State:** `searchTerm` (controlled input)
- **onChange:** Updates `searchTerm` on every keystroke
- **Searches:**
  - Booking number (booking_number)
  - Customer name (customer.name)
  - Customer phone (customer.phone)
  - Venue name (venue_name)
- **Case:** Insensitive (uses toLowerCase())

### 4.2 Status Filter Dropdown
- **Width:** w-40 (160px)
- **Placeholder:** "All Status"
- **State:** `pendingFilters.status`
- **Options (8 total):**
  1. "All Status" (value: "all")
  2. "Pending Payment" (value: "pending_payment")
  3. "Pending Selection" (value: "pending_selection")
  4. "Confirmed" (value: "confirmed")
  5. "Delivered" (value: "delivered")
  6. "Returned" (value: "returned")
  7. "Order Complete" (value: "order_complete")
  8. "Cancelled" (value: "cancelled")

### 4.3 Type Filter Dropdown
- **Width:** w-40 (160px)
- **Placeholder:** "All Types"
- **State:** `pendingFilters.type`
- **Comment:** "Optional Type filter placeholder if type exists"
- **Options (4 total):**
  1. "All Types" (value: "all")
  2. "Rental" (value: "rental")
  3. "Sale" (value: "sale")
  4. "Package" (value: "package")

### 4.4 Apply Button
- **Text:** "Apply"
- **Variant:** secondary
- **Size:** sm
- **Action:** `applyFilters()` - Commits pending filters to active filters
- **Toast:** Shows "Filters applied" message

### 4.5 Reset Button
- **Text:** "Reset"
- **Variant:** ghost
- **Size:** sm
- **Action:** `resetFilters()` - Clears all filters to "all"
- **Resets:**
  - `pendingFilters.status` → "all"
  - `pendingFilters.type` → "all"
  - `statusFilter` → "all"
  - `typeFilter` → "all"

**Filter Logic:**
- **Pending Filters:** Changed in UI dropdowns
- **Active Filters:** Applied when "Apply" clicked
- **Two-stage system** prevents re-filtering on every dropdown change

---

## 📋 SECTION 5: TABLE VIEW

### 5.1 Card Header
- **Title:** "All Bookings ({filteredBookings.length})"
- **Shows:** Current filtered count (updates dynamically)

### 5.2 Table Headers (7 Columns)

**Column 1: Booking #**
- **Label:** "Booking #"
- **Data:** `booking.booking_number`
- **Style:** font-medium
- **No Sort:** Static header

**Column 2: Customer**
- **Label:** "Customer"
- **Data:** 
  - Line 1: `booking.customer?.name` (font-medium)
  - Line 2: `booking.customer?.phone` (text-sm text-muted-foreground)
- **Layout:** Two-line stacked display

**Column 3: Type**
- **Label:** "Type"
- **Data:** Badge showing booking type
- **Logic:**
  - If `booking.type === 'package'` → **Blue Badge:** "Package"
  - If `booking.type === 'sale'` → **Gray Badge:** "Product • Sale"
  - If `booking.type === 'rental'` → **Blue Badge:** "Product • Rental"
  - Else → **Outline Badge:** "Unknown"

**Column 4: Status**
- **Label:** "Status"
- **Data:** Color-coded status badge (see Section 5.3)

**Column 5: Amount (Sortable)**
- **Label:** "Amount" + sort indicator (▲ or ▼)
- **Data:** `₹{booking.total_amount?.toLocaleString() || 0}`
- **Format:** Indian Rupee symbol with comma separators
- **Click Handler:** `toggleSort('amount')`
- **Cursor:** pointer
- **Select:** none (prevent text selection)
- **Sort Indicator:**
  - Shows ▲ when `sort.field === 'amount' && sort.dir === 'asc'`
  - Shows ▼ when `sort.field === 'amount' && sort.dir === 'desc'`
  - Hidden when sorting by date

**Column 6: Event Date (Sortable)**
- **Label:** "Event Date" + sort indicator (▲ or ▼)
- **Data:** `new Date(booking.event_date).toLocaleDateString()`
- **Format:** Locale-specific date format (e.g., "12/15/2025")
- **Click Handler:** `toggleSort('date')`
- **Cursor:** pointer
- **Select:** none
- **Sort Indicator:**
  - Shows ▲ when `sort.field === 'date' && sort.dir === 'asc'`
  - Shows ▼ when `sort.field === 'date' && sort.dir === 'desc'`
  - Hidden when sorting by amount

**Column 7: Actions**
- **Label:** "Actions"
- **Alignment:** text-right
- **Contains:** 3 action buttons (see Section 5.4)

### 5.3 Status Badges (7 Status Types)

**Status 1: Pending Payment**
- **Label:** "Pending Payment"
- **Variant:** warning (yellow/orange)
- **Value:** "pending_payment"

**Status 2: Pending Selection**
- **Label:** "Pending Selection"
- **Variant:** info (blue)
- **Value:** "pending_selection"

**Status 3: Confirmed**
- **Label:** "Confirmed"
- **Variant:** default (gray)
- **Value:** "confirmed"

**Status 4: Delivered**
- **Label:** "Delivered"
- **Variant:** success (green)
- **Value:** "delivered"

**Status 5: Returned**
- **Label:** "Returned"
- **Variant:** secondary (gray)
- **Value:** "returned"

**Status 6: Order Complete**
- **Label:** "Order Complete"
- **Variant:** success (green)
- **Value:** "order_complete"

**Status 7: Cancelled**
- **Label:** "Cancelled"
- **Variant:** destructive (red)
- **Value:** "cancelled"

**Fallback:** If status doesn't match, defaults to "Pending Payment" config

### 5.4 Action Buttons (3 Buttons Per Row)

**Button 1: View**
- **Icon:** 👁️ Eye (h-4 w-4 mr-1)
- **Text:** "View"
- **Variant:** outline
- **Size:** sm
- **Component:** `<BookingDetailsDialog>`
- **Props:**
  - `booking` - Full booking object
  - `onEdit` - Callback to `handleEditBooking()`
  - `onStatusUpdate` - Callback to `handleStatusUpdate()`
  - `trigger` - This button element
- **Action:** Opens dialog with booking details

**Button 2: Edit**
- **Icon:** ✏️ Edit (h-4 w-4 mr-1)
- **Text:** "Edit"
- **Variant:** outline
- **Size:** sm
- **Action:** `handleEditBooking(booking.id, booking.source)`
- **Navigates To:** `/bookings/{id}/edit?type={source}`
- **⚠️ BUG:** This page doesn't exist (404 error)

**Button 3: Delete**
- **Icon:** None
- **Text:** "Delete"
- **Variant:** destructive (red)
- **Size:** sm
- **Action:** `handleDeleteBooking(booking.id, booking.source)`
- **Shows:** Confirmation dialog
- **API Call:** DELETE `/api/bookings/{id}?type={source}`

### 5.5 Empty State (No Bookings)

**Displayed When:** `paginatedBookings.length === 0`

**Contains:**
- **Icon:** 📦 Package (mx-auto h-16 w-16 text-muted-foreground mb-4)
- **Title:** "No bookings found" (text-lg font-semibold mb-2)
- **Description:** (Conditional)
  - If searching/filtering: "Try adjusting your search or filters"
  - If no filters: "Get started by creating your first booking"
- **Button:** "Create Booking" (links to `/book-package`)
  - Icon: ➕ Plus (mr-2 h-4 w-4)

---

## 📄 SECTION 6: PAGINATION CONTROLS

### 6.1 Results Counter
- **Location:** Bottom-left of table
- **Text:** "Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results"
- **Example:** "Showing 1-25 of 127 results"
- **Style:** text-sm text-muted-foreground

### 6.2 Previous Button
- **Text:** "Previous"
- **Variant:** outline
- **Size:** sm
- **Action:** `goToPage(currentPage - 1)`
- **Disabled:** When `currentPage === 1`

### 6.3 Page Number Buttons
- **Logic:** Smart pagination algorithm (`getPageNumbers()`)
- **Shows:**
  - If ≤ 7 pages: All page numbers [1] [2] [3] [4] [5] [6] [7]
  - If > 7 pages: [1] ... [5] [6] [7] ... [20]
- **Always Shows:** First page and last page
- **Ellipsis:** Shows "..." as span (not clickable)
- **Active Page:**
  - Variant: default (blue/filled)
  - Current page is highlighted
- **Inactive Pages:**
  - Variant: outline
  - Clickable, navigate to that page
- **Min Width:** min-w-[2.5rem] (40px)
- **Action:** `goToPage(pageNumber)`

### 6.4 Next Button
- **Text:** "Next"
- **Variant:** outline
- **Size:** sm
- **Action:** `goToPage(currentPage + 1)`
- **Disabled:** When `currentPage === totalPages`

### 6.5 Pagination Behavior
- **Items Per Page:** 25 (constant)
- **Auto-Reset:** Resets to page 1 when:
  - `searchTerm` changes
  - `statusFilter` changes
  - `typeFilter` changes
- **Calculation:**
  - `totalPages = Math.ceil(totalItems / 25)`
  - `startIndex = (currentPage - 1) * 25`
  - `endIndex = startIndex + 25`
  - `paginatedBookings = sortedBookings.slice(startIndex, endIndex)`

### 6.6 Responsive Layout
- **Desktop:** Flex row (counter left, controls right)
- **Mobile:** Flex column (stacked, gap-4)

---

## 📅 SECTION 7: CALENDAR VIEW

### 7.1 Calendar Component
- **Component:** `<BookingCalendar>`
- **Props:**
  - `compact` - Enables compact mode
  - `mini` - Enables mini mode
  - `franchiseId` - Conditional:
    - If user is NOT super_admin: Pass `currentUser?.franchise_id`
    - If user IS super_admin: Pass `undefined` (shows all)
- **Container:** w-full p-6

### 7.2 Date Selection Dialog
- **Trigger:** Click a date on calendar
- **State:** `selectedDate` (string | null)
- **Dialog Open:** When `selectedDate` is truthy
- **Dialog Close:** `setSelectedDate(null)`

### 7.3 Dialog Content
- **Max Width:** max-w-4xl
- **Title:** "Bookings for {new Date(selectedDate).toLocaleDateString()}"
- **Shows:** All bookings for selected date from `calendarData[selectedDate]`

### 7.4 Date Dialog Booking Cards
**For Each Booking:**
- **Layout:** Card with p-4 padding
- **Left Side:**
  - **Booking Number:** `booking.booking_number` (font-medium)
  - **Customer Name:** `booking.customer?.name` (text-sm text-muted-foreground)
  - **Venue:** `booking.venue_name` (text-sm)
- **Right Side:**
  - **Status Badge:** Color-coded status
  - **Amount:** `₹{booking.total_amount?.toLocaleString() || 0}` (text-sm mt-1)

### 7.5 Calendar Data Processing
- **Function:** `calendarData` (useMemo)
- **Logic:** Groups bookings by event date
- **Key:** `new Date(booking.event_date).toDateString()`
- **Value:** Array of bookings for that date
- **Type:** `Record<string, Booking[]>`

---

## ⚙️ SECTION 8: FUNCTIONS & HANDLERS

### 8.1 handleViewBooking()
- **Params:** `bookingId: string`
- **Action:** `router.push(/bookings/${bookingId})`
- **⚠️ NOTE:** This function exists but is NOT USED in the current code
- **Purpose:** View booking details page

### 8.2 handleEditBooking()
- **Params:** `bookingId: string, source?: string`
- **Logic:** 
  - Builds query string: `source ? ?type=${source} : ''`
  - Navigates to: `/bookings/${bookingId}/edit${qs}`
- **⚠️ BUG:** Edit page doesn't exist (404)

### 8.3 handleDeleteBooking()
- **Params:** `bookingId: string, source?: string`
- **Shows:** Confirmation dialog via `showConfirmation()`
- **Dialog Config:**
  - Title: "Delete booking?"
  - Description: "This will permanently delete the booking and its items. This action cannot be undone."
  - Confirm Text: "Delete"
  - Variant: destructive (red)
- **On Confirm:**
  - URL: `/api/bookings/${bookingId}?type=${source}`
  - Method: DELETE
  - On Success: Shows toast "Deleted" / "Booking deleted successfully"
  - Then: Calls `refresh()` to reload data
  - On Error: Throws error with message

### 8.4 handleStatusUpdate()
- **Params:** `bookingId: string, newStatus: string, source?: string`
- **URL:** `/api/bookings/${bookingId}?type=${source}`
- **Method:** PATCH
- **Body:** `{ status: newStatus }`
- **Headers:** `{ "Content-Type": "application/json" }`
- **On Success:**
  - Toast: "Success" / "Booking status updated successfully"
  - Creates audit log (fire-and-forget):
    - URL: `/api/audit`
    - Method: POST
    - Body: `{ entity_type: 'booking', entity_id, action: 'update', changes: { after: { status: newStatus } } }`
    - ⚠️ BUG: Missing "before" state in audit log
  - Calls `refresh()`
- **On Error:**
  - Toast: "Error" / "Failed to update booking status" (variant: destructive)

### 8.5 exportBookings()
- **Params:** `format: 'csv' | 'pdf'`
- **Data:** Uses `filteredBookings` (respects current filters)
- **Validation:** If no bookings, shows error toast "Nothing to export"

**CSV Export:**
- **Header:** ['Booking#','Customer','Phone','Type','Status','Amount','Event Date','Venue']
- **Data Processing:**
  - Replaces commas in customer name and venue (prevents CSV corruption)
  - Date format: YYYY-MM-DD (ISO slice)
- **File Creation:**
  - Creates Blob with type 'text/csv'
  - Creates temporary URL
  - Triggers download via hidden anchor element
  - Cleans up URL after download
- **Filename:** `bookings-YYYY-MM-DD.csv`
- **Toast:** "CSV exported" / "{count} bookings"

**PDF Export:**
- **Company Name:**
  - Fetches from `/api/company-settings`
  - Default: "Company" if API fails
- **PDF Config:**
  - Orientation: landscape
  - Font size: 16 for title, 10 for date, 8 for table
- **Title:** "{CompanyName} - Bookings"
- **Subtitle:** "Generated: {date.toLocaleString()}"
- **Table:**
  - Columns: ['Booking#','Customer','Type','Status','Amount','Event Date','Venue']
  - Data truncation: Customer name (25 chars), Venue (25 chars)
  - Amount format: Fixed 2 decimals
  - Date format: YYYY-MM-DD
- **Styling:**
  - Font size: 8
  - Header fill color: RGB(34,197,94) - Green
- **Footer:**
  - Shows "Page X/Y" on every page
  - Position: Bottom-left
- **Filename:** `bookings-YYYY-MM-DD.pdf`
- **Toast:** "PDF exported" / "{count} bookings"

### 8.6 toggleSort()
- **Params:** `field: 'date' | 'amount'`
- **Logic:**
  - If clicking same field: Toggle direction (asc ↔ desc)
  - If clicking different field: Set to that field with 'asc'
- **State:** Updates `sort` object `{ field, dir }`

### 8.7 applyFilters()
- **Action:** Commits pending filters to active filters
- **Updates:**
  - `statusFilter = pendingFilters.status`
  - `typeFilter = pendingFilters.type`
- **Toast:** "Filters applied"
- **Side Effect:** Triggers page reset to 1 (via useEffect)

### 8.8 resetFilters()
- **Action:** Clears all filters
- **Updates:**
  - `pendingFilters` → `{ status: 'all', type: 'all' }`
  - `statusFilter` → 'all'
  - `typeFilter` → 'all'
- **Side Effect:** Triggers page reset to 1

### 8.9 goToPage()
- **Params:** `page: number`
- **Logic:** `Math.max(1, Math.min(page, totalPages))`
- **Ensures:** Page number stays within valid range [1, totalPages]
- **Updates:** `currentPage` state

### 8.10 getPageNumbers()
- **Returns:** `(number | string)[]`
- **Algorithm:**
  - If ≤ 7 pages: Returns [1,2,3,4,5,6,7]
  - If > 7 pages: Returns [1, '...', nearby pages, '...', last]
  - Always shows first and last page
  - Shows 3 pages around current page (current-1, current, current+1)
  - Uses '...' for gaps
- **Example:** [1, '...', 5, 6, 7, '...', 20]

### 8.11 getStatusBadge()
- **Params:** `status: string`
- **Returns:** JSX Badge element
- **Config Object:** Maps 7 statuses to labels and variants
- **Fallback:** Uses "Pending Payment" config if status unknown

---

## 🔌 SECTION 9: DATA FETCHING & STATE

### 9.1 Data Hooks
**useData("bookings")**
- **Returns:** `{ data, loading, error, refresh }`
- **Data:** Array of Booking objects
- **Default:** Empty array `[]`
- **Endpoint:** Likely `/api/bookings`

**useData("booking-stats")**
- **Returns:** `{ data }`
- **Data:** Stats object
- **Default:** Empty object `{}`
- **Endpoint:** Likely `/api/booking-stats`
- **Contains:**
  - totalBookings
  - paymentPendingBookings
  - confirmedBookings
  - deliveredBookings
  - completedBookings
  - totalRevenue

### 9.2 User Session
- **State:** `currentUser` (useState)
- **Fetch:** On component mount (useEffect)
- **Endpoint:** `/api/auth/user`
- **Method:** GET
- **Error Handling:** Silent catch (no error shown)
- **Used For:**
  - Franchise filtering in calendar view
  - Determining if user is super_admin

### 9.3 Local State Variables
- `searchTerm: string` - Search input value
- `statusFilter: string` - Active status filter ("all" default)
- `typeFilter: string` - Active type filter ("all" default)
- `pendingFilters: {status, type}` - Staged filters before Apply
- `viewMode: "table" | "calendar"` - Current view
- `selectedDate: string | null` - Selected calendar date
- `sort: {field, dir}` - Sort configuration (default: date desc)
- `currentPage: number` - Current pagination page (default: 1)
- `itemsPerPage: 25` - Constant

### 9.4 Computed Values (useMemo/calculations)
- `filteredBookings` - Bookings after search & filters
- `sortedBookings` - Filtered bookings after sorting
- `paginatedBookings` - Sorted bookings for current page
- `totalItems` - Count of sorted bookings
- `totalPages` - Calculated from totalItems / 25
- `startIndex` - (currentPage - 1) * 25
- `endIndex` - startIndex + 25
- `calendarData` - Bookings grouped by date

---

## 🎨 SECTION 10: LOADING & ERROR STATES

### 10.1 Loading State (Initial)
**Shown When:** `loading === true` (first condition)
- **Container:** flex-1 space-y-4 p-4 md:p-8 pt-6
- **Content:**
  - Centered div (h-64)
  - **Icon:** 🔄 RefreshCw (h-8 w-8 animate-spin mx-auto)
  - **Text:** "Loading bookings..." (text-muted-foreground)

### 10.2 Error State
**Shown When:** `error === true`
- **Container:** Card with centered content (h-64)
- **Content:**
  - **Icon:** 📦 Package (w-12 h-12 mx-auto text-muted-foreground)
  - **Title:** "Error Loading Bookings" (text-lg font-semibold)
  - **Message:** `{error}` (text-muted-foreground)
  - **Button:** "Try Again" with RefreshCw icon
    - Variant: outline
    - Action: Calls `refresh()`

### 10.3 Loading State (With Skeleton)
**Shown When:** `loading === true` (second condition - duplicate?)
- **⚠️ NOTE:** This is duplicate code (lines 290-312)
- **Header:**
  - Back button
  - Page title & subtitle
- **Skeleton Cards:** 4x `<StatCardSkeleton />`
- **Skeleton Table:** `<TableSkeleton rows={10} />`

---

## 🧩 SECTION 11: IMPORTED COMPONENTS

### UI Components (Shadcn)
1. Card, CardContent, CardHeader, CardTitle
2. Button
3. Input
4. Badge
5. Select, SelectContent, SelectItem, SelectTrigger, SelectValue
6. Table, TableBody, TableCell, TableHead, TableHeader, TableRow
7. DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger (imported but NOT USED)
8. Tabs, TabsContent, TabsList, TabsTrigger
9. Dialog, DialogContent, DialogHeader, DialogTitle
10. useConfirmationDialog (custom hook)

### Custom Components
1. BookingCalendar - Calendar view component
2. BookingDetailsDialog - View booking details dialog
3. TableSkeleton, StatCardSkeleton, PageLoader - Loading skeletons

### Icons (Lucide React)
1. CalendarDays
2. DollarSign
3. Package
4. Users
5. Search
6. Plus
7. MoreHorizontal (imported but NOT USED)
8. Eye
9. Edit
10. RefreshCw
11. ArrowLeft
12. Calendar
13. List

### Libraries
1. next/navigation - useRouter
2. next/link - Link component
3. jspdf - PDF generation
4. jspdf-autotable - PDF tables

### Hooks
1. useData - Custom data fetching
2. useToast - Toast notifications
3. useState, useEffect - React hooks
4. useRouter - Next.js navigation

---

## 🔧 SECTION 12: FILTERING & SORTING LOGIC

### 12.1 Search Filter
**Searches 4 Fields:**
1. `booking.booking_number` - Booking/order number
2. `booking.customer?.name` - Customer full name
3. `booking.customer?.phone` - Customer phone number
4. `booking.venue_name` - Event venue name

**Logic:**
- Case-insensitive (converts to lowercase)
- Partial match (uses `.includes()`)
- Empty search matches all
- Boolean OR (matches if ANY field matches)

### 12.2 Status Filter
- Exact match: `booking.status === statusFilter`
- "all" matches everything
- 7 possible status values

### 12.3 Type Filter
- Exact match: `booking.type === typeFilter`
- "all" matches everything
- 3 possible type values: 'rental', 'sale', 'package'
- Uses `(booking as any).type` (type casting)

### 12.4 Combined Filter
- Boolean AND: Must match search AND status AND type
- `return matchesSearch && matchesStatus && matchesType`

### 12.5 Sort Logic
**Date Sort:**
- Converts to timestamp: `new Date(date).getTime()`
- Ascending: Earlier dates first
- Descending: Later dates first (default)

**Amount Sort:**
- Numeric comparison
- Handles null/undefined: `booking.total_amount || 0`
- Ascending: Smaller amounts first
- Descending: Larger amounts first

**Sort Toggle:**
- First click on column: Sort ascending
- Second click on same column: Sort descending
- Click different column: Switch to that column, ascending

---

## 📱 SECTION 13: RESPONSIVE DESIGN

### Breakpoints Used
- `md:` - ≥ 768px (medium)
- `lg:` - ≥ 1024px (large)
- `sm:` - ≥ 640px (small)

### Responsive Elements

**Page Padding:**
- Mobile: p-4
- Desktop: md:p-8

**Stats Grid:**
- Mobile: 2 columns (md:grid-cols-2)
- Desktop: 6 columns (lg:grid-cols-6)

**Pagination:**
- Mobile: Flex column (stacked)
- Desktop: Flex row (sm:flex-row)

**Search Width:**
- Fixed: w-64 (256px) on all screens

**Filter Dropdowns:**
- Fixed: w-40 (160px) on all screens

---

## 🔔 SECTION 14: TOAST NOTIFICATIONS

### Success Toasts
1. **"Filters applied"** - When Apply clicked
2. **"Deleted" / "Booking deleted successfully"** - After successful delete
3. **"Success" / "Booking status updated successfully"** - After status update
4. **"CSV exported" / "{count} bookings"** - After CSV download
5. **"PDF exported" / "{count} bookings"** - After PDF download

### Error Toasts
1. **"Error" / "Failed to update booking status"** - When status update fails (variant: destructive)
2. **"Nothing to export" / "No bookings match current filters"** - When export clicked with 0 results (variant: destructive)

---

## 🐛 SECTION 15: BUGS & ISSUES FOUND

### Critical Bugs
1. **Edit Page 404** - `/bookings/{id}/edit` doesn't exist
2. **Audit Log Incomplete** - Missing "before" state in status changes
3. **Duplicate Loading State** - Lines 279-312 duplicate lines 266-278
4. **DropdownMenu Imported But Not Used** - Dead import (MoreHorizontal icon too)

### Logic Issues
1. **No Status Transition Validation** - Can change any status to any other status
2. **No Search Debouncing** - Filters on every keystroke (performance issue)
3. **No Inventory Check** - Delete doesn't verify if items can be removed
4. **Source Parameter Mystery** - `source` param used but not defined in Booking type

### Missing Features
1. **No Bulk Selection** - Can't select multiple bookings
2. **No Bulk Actions** - Can't delete/update multiple at once
3. **No Keyboard Shortcuts** - No keyboard navigation
4. **No Column Resize** - Table columns fixed width
5. **No Column Show/Hide** - Can't customize visible columns
6. **No Export Configuration** - Can't choose which columns to export
7. **No Status Change History** - Can't see who changed status when
8. **handleViewBooking() Not Used** - Function defined but never called

---

## 📊 SECTION 16: DATA FLOW

### Data Flow Diagram
```
1. Component Mounts
   ↓
2. useData("bookings") fetches data
   ↓
3. useData("booking-stats") fetches stats
   ↓
4. Fetch user session (/api/auth/user)
   ↓
5. Display loading state (skeleton)
   ↓
6. Data arrives → bookings state populated
   ↓
7. Apply filters → filteredBookings
   ↓
8. Apply sorting → sortedBookings
   ↓
9. Apply pagination → paginatedBookings
   ↓
10. Render table with paginatedBookings
```

### User Action Flow
```
User Action → Event Handler → State Update → Re-render → API Call (if needed) → Refresh Data
```

**Example: Delete Booking**
```
Click Delete → handleDeleteBooking()
             → showConfirmation()
             → User confirms
             → DELETE /api/bookings/{id}
             → Success toast
             → refresh()
             → Data refetches
             → Table updates
```

---

## 🎯 SECTION 17: API ENDPOINTS

### GET Endpoints
1. `/api/bookings` - Fetch all bookings (with franchise filtering)
2. `/api/booking-stats` - Fetch dashboard statistics
3. `/api/auth/user` - Get current user session
4. `/api/company-settings` - Get company name for PDF export

### PATCH Endpoints
1. `/api/bookings/{id}?type={source}` - Update booking status

### DELETE Endpoints
1. `/api/bookings/{id}?type={source}` - Delete booking

### POST Endpoints
1. `/api/audit` - Create audit log entry (fire-and-forget)

**Query Parameters:**
- `type={source}` - Specifies booking type ('product' or 'package')

---

## 📏 SECTION 18: CONSTANTS & MAGIC NUMBERS

1. **Items Per Page:** 25
2. **Search Input Width:** 256px (w-64)
3. **Filter Dropdown Width:** 160px (w-40)
4. **Page Number Min Width:** 40px (min-w-[2.5rem])
5. **Max Page Numbers Shown:** 7
6. **Dialog Max Width:** max-w-4xl
7. **Empty State Icon Size:** h-16 w-16
8. **Loading Icon Size:** h-8 w-8
9. **Action Icon Size:** h-4 w-4
10. **CSV Column Count:** 8
11. **PDF Column Count:** 7
12. **PDF Font Sizes:** 16 (title), 10 (date), 8 (table)
13. **PDF Header Color:** RGB(34,197,94) - Green
14. **Name Truncation in PDF:** 25 chars
15. **Pagination Max Pages Before Ellipsis:** 7

---

## ✅ COMPLETE FEATURE COUNT

**Total Interactive Elements:** 100+

**Breakdown:**
- Buttons: 13
- Dropdowns: 2
- Input Fields: 1
- Tab Triggers: 2
- Table Columns: 7
- Action Buttons Per Row: 3
- Status Badges: 7
- Stat Cards: 6
- Pagination Buttons: Variable (3 + page count)
- Dialog Triggers: Multiple
- Links: 3

**Total Functions:** 11
**Total State Variables:** 11
**Total API Endpoints:** 7
**Total Icons:** 15
**Total Components Imported:** 25+

---

## 🎓 COMPLEXITY METRICS

- **Lines of Code:** 664
- **Cyclomatic Complexity:** High (multiple nested conditions)
- **Dependencies:** 10+ libraries
- **State Variables:** 11
- **Side Effects:** 4 (useEffect, API calls)
- **Conditional Renders:** 8
- **Event Handlers:** 15+
- **Data Transformations:** 5 (filter, sort, paginate, group, format)

---

**FINAL NOTES:**
- This is a FEATURE-COMPLETE listing page
- Production-ready except for 4 critical bugs
- Well-structured but needs optimization (debounce, server pagination)
- Missing advanced features (bulk operations, real-time updates)

**Created by:** Steve Jobs-level microscopic analysis + QA Tester precision  
**Date:** October 14, 2025  
**Status:** ✅ 100% Complete Feature Inventory
