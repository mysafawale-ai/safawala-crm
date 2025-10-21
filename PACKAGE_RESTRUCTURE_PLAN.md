# Package Management System Restructure

## Current Structure

```
Categories (packages_categories)
  └── Package Sets (package_sets) - Called "Packages" in UI
      └── Package Variants (package_variants) - Called "Variants" in UI
          └── Distance Pricing (distance_pricing)
```

**Example:**
- Category: "30 Safas"
- Package: "Royal Wedding 30 Set"
- Variants: "Standard", "Premium", "Deluxe"
- Distance Pricing: Per variant

## New Structure

```
Categories (packages_categories)
  └── Package Variants (package_variants) - Will be called "Packages" in UI
      └── Package Levels (NEW TABLE) - Will be called "Variants" in UI
          └── Distance Pricing (distance_pricing)
```

**Example:**
- Category: "30 Safas"
- Package (actually variant): "Standard 30 Set", "Premium 30 Set", "Deluxe 30 Set"
- Variants (actually levels): "Raja", "VIP", "VVIP"
- Distance Pricing: Per level

## What Changes

### Database Changes
1. **Create new table: `package_levels`**
   - Similar structure to current `package_variants`
   - Will have fields: id, variant_id (FK to package_variants), name, description, base_price, etc.

2. **Remove `package_sets` table** (or keep for backward compatibility)
   - Link `package_variants` directly to `categories`
   - Add `category_id` to `package_variants`

3. **Update `distance_pricing`**
   - Change FK from `variant_id` to `level_id`

### UI Changes
1. **Packages Page (`/sets`)**
   - Show Categories first (30 Safas, 31 Safa, etc.)
   - Click on category → Show **Variants as "Packages"**
   - Click on package → Show **Levels as "Variants"** (Raja, VIP, VVIP)
   - Each level has its own pricing and distance pricing

2. **Navigation Breadcrumbs**
   - Categories → Packages (variants) → Variants (levels)

3. **Terminology Update**
   - Throughout UI, swap the labels
   - Backend keeps real names for clarity

## Migration Strategy

### Option 1: Clean Break (Recommended)
1. Create new `package_levels` table
2. Add `category_id` to `package_variants`
3. Migrate existing data:
   - Current `package_variants` → New `package_levels`
   - Current `package_sets` → New `package_variants`
4. Update all APIs and UI

### Option 2: Backward Compatible
1. Keep `package_sets` table
2. Add `package_levels` table
3. Add flag to switch between old/new structure
4. Gradual migration

## Benefits
- More flexible pricing levels (Raja, VIP, VVIP, or any custom names)
- Simpler hierarchy for users to understand
- Easier to add/remove pricing tiers
- Better matches business logic

## Implementation Steps
1. ✅ Document current structure
2. ⏳ Create migration SQL script
3. ⏳ Update API routes
4. ⏳ Update UI components
5. ⏳ Test thoroughly
6. ⏳ Deploy

## Questions to Confirm
1. Do we keep old data or start fresh?
2. Should we support custom level names per package?
3. What are the default levels? (Raja, VIP, VVIP?)
4. Can levels vary per package or fixed for all?
