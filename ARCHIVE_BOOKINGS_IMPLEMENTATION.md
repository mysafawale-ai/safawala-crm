# 🗂️ Archive Bookings Implementation

**Commit:** `48bbfa7`  
**Date:** $(date)  
**Feature:** Replace permanent deletion with soft-delete archiving pattern

## Overview

Implemented a comprehensive archiving system that replaces the destructive delete operation with a recoverable soft-delete pattern. Users can now archive bookings instead of permanently deleting them, and restore archived bookings back to active status.

## What Changed

### 1. **Database Schema** - SQL Migration Required ✅
**File:** `ADD_ARCHIVE_TO_BOOKINGS.sql`

Adds `is_archived` BOOLEAN column to:
- `package_bookings`
- `product_orders`
- `direct_sales_orders` (if exists)
- `bookings` (legacy unified table)

**Default:** `false` (all new bookings created as active)  
**Indexed:** Yes, for query performance (`idx_[table]_archived`)

**⚠️ ACTION REQUIRED:** Run this SQL in Supabase Console before using archive feature

```sql
-- Quick Setup:
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE direct_sales_orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

-- Create indexes for performance:
CREATE INDEX idx_package_bookings_archived ON package_bookings(is_archived, created_at DESC);
CREATE INDEX idx_product_orders_archived ON product_orders(is_archived, created_at DESC);
CREATE INDEX idx_direct_sales_archived ON direct_sales_orders(is_archived, created_at DESC);
CREATE INDEX idx_bookings_archived ON bookings(is_archived, created_at DESC);
```

### 2. **API Endpoints** - New Routes Created ✅

#### Archive Endpoint
**File:** `app/api/bookings/[id]/archive/route.ts`
- **Method:** PATCH
- **Endpoint:** `/api/bookings/{id}/archive`
- **Body:** `{ type: 'package_booking' | 'product_order' | 'direct_sales' | 'unified' }`
- **Action:** Sets `is_archived = true`
- **Returns:** Success response with table name and booking ID

#### Restore Endpoint
**File:** `app/api/bookings/[id]/restore/route.ts`
- **Method:** PATCH
- **Endpoint:** `/api/bookings/{id}/restore`
- **Body:** `{ type: 'package_booking' | 'product_order' | 'direct_sales' | 'unified' }`
- **Action:** Sets `is_archived = false`
- **Returns:** Success response with table name and booking ID

**Features:**
- Automatic table detection if type not provided
- Franchise isolation enforced (only super_admin can access other franchises)
- Proper error handling with migration hints
- Returns helpful SQL migration message if column doesn't exist

### 3. **UI Components** - Enhanced Bookings Page ✅

**File:** `app/bookings/page.tsx`

#### Archive Button (Replaces Delete)
- **Icon:** Archive (amber-600)
- **Location:** Main bookings table, action column
- **Behavior:** Opens confirmation dialog
- **Confirmation:** "Archive booking? This booking will be moved to archived section. You can restore it anytime."
- **Color:** Amber (warning/info state instead of destructive red)

#### Archived Bookings Section
- **Location:** Below pagination controls in bookings table
- **Display:** Hidden by default (collapsible)
- **Toggle Button:** "▶ Show" / "▼ Hide"
- **Cards:** Horizontal scrollable section showing up to 5 most recent archived bookings

#### Archived Booking Card
Each card displays:
- Booking number with creation date
- "Archived" badge (amber-100 bg, amber-800 text)
- Customer name and venue
- Total amount
- Action buttons:
  - **View:** Opens full booking details dialog
  - **Restore:** Moves booking back to active list

### 4. **State Management** - Added Hooks ✅

```typescript
// New state variables in BookingsPage:
const [archivedBookings, setArchivedBookings] = useState<Booking[]>([])
const [showArchivedSection, setShowArchivedSection] = useState(false)
```

### 5. **Data Fetching** - New useEffect ✅

Automatically fetches archived bookings on component load:
- Queries all booking tables for `is_archived = true` records
- Applies franchise isolation filter
- Returns top 5 most recent archived bookings
- Runs when `currentUser` changes

### 6. **Handler Functions** - Updated Handlers ✅

#### handleArchiveBooking()
```typescript
- Shows confirmation dialog
- Calls PATCH /api/bookings/{id}/archive
- Refreshes active bookings list
- Updates archived bookings section
- Shows toast notification
- Handles errors with helpful messages
```

#### handleRestoreBooking()
```typescript
- No confirmation (quicker operation)
- Calls PATCH /api/bookings/{id}/restore
- Refreshes active bookings list
- Removes from archived section immediately
- Shows toast notification
- Handles errors gracefully
```

## User Workflow

### Archive a Booking
1. User opens Bookings page
2. Finds booking in table
3. Clicks **Archive** button (amber icon)
4. Confirms action in dialog
5. Booking disappears from main list
6. Booking appears in "Archived Bookings" section
7. Toast shows: "Archived: Booking archived successfully"

### View Archived Booking
1. Open Bookings page
2. Scroll down to "Archived Bookings" section
3. Click **Show** button to expand
4. Click **View** button on any archived booking card
5. Booking details dialog opens (same as active bookings)

### Restore Archived Booking
1. Open Bookings page
2. Click **Show** in "Archived Bookings" section
3. Click **Restore** button on archived booking card
4. Booking immediately returns to active list
5. Disappears from archived section
6. Toast shows: "Restored: Booking restored successfully"

## Technical Details

### Soft Delete Pattern
- **Traditional Delete:** Permanently removes data from database (unrecoverable)
- **Soft Delete (Archive):** Keeps data but marks with `is_archived = true` (recoverable)

**Benefits:**
- ✅ Data recovery for accidental actions
- ✅ Maintains audit trail
- ✅ Preserves referential integrity
- ✅ Easy undo functionality

### Queries
**Active bookings only:**
```sql
SELECT * FROM package_bookings WHERE is_archived = false
```

**Archived bookings only:**
```sql
SELECT * FROM package_bookings WHERE is_archived = true ORDER BY created_at DESC LIMIT 5
```

### Performance
- Indexes on `(is_archived, created_at DESC)` optimize queries
- Pagination still works for large active booking lists
- Archive queries don't impact active booking performance

### Security
- Franchise isolation maintained via `franchise_id` check
- Super admin can see all franchises' bookings
- Regular users can only see their franchise's bookings
- Authorization happens before updating `is_archived` flag

### Error Handling
- Detects missing `is_archived` column
- Provides helpful SQL migration message
- Gracefully handles table discovery
- Returns meaningful error codes (404, 403, 400, 500)

## Limitations & Future Enhancements

### Current Limitations
- Archived bookings are read-only (cannot edit while archived)
- Only 5 most recent archived bookings shown (design choice for UI)
- Delete button still exists for permanent deletion (kept for admin purposes)

### Future Enhancements
1. **Bulk Archive:** Select multiple bookings and archive in batch
2. **Archive Filters:** Filter archived bookings by date range, customer, etc.
3. **Pagination in Archive:** Show more than 5 archived bookings with pagination
4. **Archive History:** Track who archived when and from where
5. **Auto-Archive:** Automatically archive old bookings after N days
6. **Retention Policy:** Permanently delete archived bookings after N days

## Testing Checklist

- [ ] SQL migration runs successfully without errors
- [ ] Archive button appears in bookings table
- [ ] Archive button has correct amber color and icon
- [ ] Clicking archive shows confirmation dialog
- [ ] Confirming archive moves booking to archived section
- [ ] Archived bookings section appears below pagination
- [ ] Show/Hide toggle works in archived section
- [ ] Archived booking cards display correct info
- [ ] View button opens booking details dialog
- [ ] Restore button moves booking back to active list
- [ ] Toast notifications show on success/error
- [ ] Error message shows if column doesn't exist
- [ ] Franchise isolation works (users only see their bookings)
- [ ] Super admin can archive any franchise's bookings
- [ ] Page doesn't show archived section if no archived bookings

## Deployment Steps

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Run SQL Migration**
   - Open Supabase Console: https://app.supabase.com/project/_/sql
   - Copy-paste content from `ADD_ARCHIVE_TO_BOOKINGS.sql`
   - Click **Run** to execute
   - Verify: Should see success messages ✅

3. **Deploy App**
   ```bash
   git push origin main
   # or use your CI/CD pipeline
   ```

4. **Verify in Production**
   - Open Bookings page
   - Archive a test booking
   - Verify it appears in archived section
   - Restore it back to active
   - Refresh page to confirm persistence

## Rollback Instructions

If issues occur:

1. **Revert Code**
   ```bash
   git revert 48bbfa7
   git push origin main
   ```

2. **Keep Database As-Is** (optional)
   - `is_archived` column can stay (won't hurt)
   - Or remove with: `ALTER TABLE [table] DROP COLUMN is_archived`

## File Summary

| File | Type | Purpose |
|------|------|---------|
| `ADD_ARCHIVE_TO_BOOKINGS.sql` | SQL | Database migration |
| `app/api/bookings/[id]/archive/route.ts` | API | Archive endpoint |
| `app/api/bookings/[id]/restore/route.ts` | API | Restore endpoint |
| `app/bookings/page.tsx` | Component | UI and handlers |

## Related Issues
- User requested: "make it archive... create a small card below the bookings list of 5 archived showing other we can scroll to see"
- Previous: Delete button was destructive and irreversible
- Solution: Soft-delete with visible recovery option

## Notes
- Commit message: "🗂️ Archive Bookings Implementation"
- Follows existing code patterns and conventions
- No breaking changes to existing functionality
- Maintains backward compatibility
- TypeScript strict mode compliant
