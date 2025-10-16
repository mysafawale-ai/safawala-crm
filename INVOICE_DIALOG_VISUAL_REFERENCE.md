# 📸 Invoice Dialog Visual Structure

## 🎨 Complete Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  📄 Invoice Details - INV-12345                                 [×] │
│  Complete information for this invoice                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ 👤 Customer Information      │ │ 📅 Event Information        │ │
│  ├──────────────────────────────┤ ├─────────────────────────────┤ │
│  │ Name: John Doe              │ │ Event Type: Wedding         │ │
│  │ Phone: +91 9876543210       │ │ Event Date: 15 Dec 2024     │ │
│  │ WhatsApp: +91 9876543210    │ │ Event Time: 6:00 PM        │ │
│  │ Email: john@example.com     │ │ Participant: Groom Side     │ │
│  │ Address: 123 Main Street    │ │ Groom: Rahul Kumar          │ │
│  │ City: Mumbai                │ │ Groom WhatsApp: +91 98...   │ │
│  │ State: Maharashtra          │ │ Groom Address: 456 Park St  │ │
│  │ Pincode: 400001             │ │ Bride: Priya Sharma         │ │
│  └──────────────────────────────┘ │ Bride WhatsApp: +91 97...   │ │
│                                    │ Bride Address: 789 Lake Rd  │ │
│                                    │ Venue: Grand Palace Hotel   │ │
│                                    │ Venue Address: Downtown     │ │
│                                    └─────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ 📄 Invoice Information       │ │ ⏰ Delivery Information     │ │
│  ├──────────────────────────────┤ ├─────────────────────────────┤ │
│  │ Invoice #: INV-12345        │ │ Delivery Date: 14 Dec 2024  │ │
│  │ Type: 📦 Package (Rent)     │ │ Delivery Time: 10:00 AM     │ │
│  │ Status: 🟢 Paid             │ │ Return Date: 16 Dec 2024    │ │
│  │ Created: 1 Dec 2024         │ │ Return Time: 8:00 PM        │ │
│  │ Payment Type: Advance       │ │ Special Instructions:       │ │
│  │ Amount Paid: ₹50,000        │ │ Please deliver before 9 AM  │ │
│  │ Pending Amount: ₹25,000     │ │ Handle with care            │ │
│  └──────────────────────────────┘ └─────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📦 Invoice Items                                             │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ┌────────────────────────────────────────────────────────┐  │  │
│  │ │ [Safa] ←──(category badge)                             │  │  │
│  │ │                                                          │  │  │
│  │ │ Premium Wedding Package                                  │  │  │
│  │ │ Complete wedding attire with accessories                 │  │  │
│  │ │                                                          │  │  │
│  │ │ ┌──────────────────────────────────────────────────┐   │  │  │
│  │ │ │ 🔵 Variant: Deluxe Safa Collection    [+10 Extra]│   │  │  │
│  │ │ │                                                   │   │  │  │
│  │ │ │ Inclusions:                                       │   │  │  │
│  │ │ │ • Safa × 50           • Dupatta × 25             │   │  │  │
│  │ │ │ • Pagdi × 30          • Turban × 15              │   │  │  │
│  │ │ │ • Sherwani × 10       • Accessories × 100        │   │  │  │
│  │ │ └──────────────────────────────────────────────────┘   │  │  │
│  │ │                                                          │  │  │
│  │ │ Quantity: 1    Unit Price: ₹45,000                      │  │  │
│  │ │                               Line Total                 │  │  │
│  │ │                              ₹45,000 ←────(bold,large)   │  │  │
│  │ └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │ ┌────────────────────────────────────────────────────────┐  │  │
│  │ │ [Decoration]                                            │  │  │
│  │ │                                                          │  │  │
│  │ │ Stage Decoration Package                                 │  │  │
│  │ │                                                          │  │  │
│  │ │ Quantity: 1    Unit Price: ₹15,000                      │  │  │
│  │ │                               Line Total                 │  │  │
│  │ │                              ₹15,000                     │  │  │
│  │ └────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 💰 💰 Financial Summary                                     │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │ Items Subtotal:                            ₹60,000 ────────┤  │
│  │                                                              │  │
│  │ 📍 Distance Charges (25 km)                ₹2,500 🔵────────┤  │
│  │                                                              │  │
│  │ Discount (40%)                           - ₹24,000 🟢──────┤  │
│  │                                                              │  │
│  │ Coupon (WEDDING2024)                      - ₹5,000 🟢──────┤  │
│  │ ───────────────────────────────────────────────────────────┤  │
│  │ After Discounts:                           ₹33,500 ────────┤  │
│  │                                                              │  │
│  │ GST (18%)                                   ₹6,030 ────────┤  │
│  │ ───────────────────────────────────────────────────────────┤  │
│  │ 🔒 Security Deposit (Refundable)          ₹10,000 🔵──────┤  │
│  │                                                              │  │
│  │ ╔═══════════════════════════════════════════════════════╗  │  │
│  │ ║ Grand Total:                   ₹39,530 🟢            ║  │  │
│  │ ╚═══════════════════════════════════════════════════════╝  │  │
│  │                                                              │  │
│  │ ╔═══════════════════════════════════════════════════════╗  │  │
│  │ ║ 💎 Total with Security Deposit: ₹49,530 🟣          ║  │  │
│  │ ╚═══════════════════════════════════════════════════════╝  │  │
│  │                                                              │  │
│  │ ─────────── 💳 Payment Status ─────────────                │  │
│  │                                                              │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ ✅ Amount Paid:              ₹20,000 🟢             │  │  │
│  │ └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ ⏳ Balance Due:               ₹19,530 🟠             │  │  │
│  │ └──────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📝 Notes                                                     │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ Please ensure all items are cleaned before return.           │  │
│  │ Any damage will be charged from security deposit.            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │         [📥 Download PDF]  [↗️ Share]  [✕ Close]         │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding Legend

### Financial Colors
- 🟢 **Green** - Paid amounts, discounts, savings, grand total
- 🟠 **Orange** - Pending amounts, balance due
- 🔵 **Blue** - Information, distance charges, security deposit, variant sections
- 🟣 **Purple** - Total with security deposit (special highlight)
- ⚪ **Gray** - Secondary information, descriptions

### Status Colors
- 🟢 **Green Badge** - Paid
- 🟠 **Orange Badge** - Pending
- 🔴 **Red Badge** - Overdue
- 🔵 **Blue Badge** - Processing

---

## 📏 Section Breakdown

### 1. Header (Fixed Top)
```
┌──────────────────────────────────────┐
│ 📄 Invoice Details - INV-12345   [×] │
│ Complete information for this invoice│
└──────────────────────────────────────┘
```
- Icon: FileText (📄)
- Title: Dynamic with invoice number
- Close button: Top right

---

### 2. Customer & Event (2-Column Grid)
```
┌─────────────────┐ ┌─────────────────┐
│ 👤 Customer     │ │ 📅 Event        │
│ 8 fields        │ │ 12+ fields      │
└─────────────────┘ └─────────────────┘
```
**Responsive**: Stacks to 1 column on mobile

---

### 3. Invoice & Delivery (2-Column Grid)
```
┌─────────────────┐ ┌─────────────────┐
│ 📄 Invoice      │ │ ⏰ Delivery     │
│ 7 fields        │ │ 5 fields        │
│ + payment badge │ │ + times         │
└─────────────────┘ └─────────────────┘
```
**Key Features**:
- Payment type badge in Invoice
- Inline amounts (paid/pending)
- Delivery & return times in Delivery

---

### 4. Invoice Items (Full Width) 🎯 **CRITICAL**
```
┌──────────────────────────────────────┐
│ 📦 Invoice Items                     │
│ ┌─────────────────────────────────┐ │
│ │ [Category Badge]                │ │
│ │ Product/Package Name (Bold)     │ │
│ │ Description (Gray)              │ │
│ │                                  │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 🔵 Variant: Name           │ │ │
│ │ │ Inclusions:                 │ │ │
│ │ │ • Item × Qty  • Item × Qty │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                  │ │
│ │ Quantity | Unit Price          │ │
│ │           Line Total (Bold)    │ │
│ └─────────────────────────────────┘ │
│ [Repeat for each item]              │
└──────────────────────────────────────┘
```

**Visual Hierarchy**:
1. Category badge (colored, top)
2. Product name (bold, large)
3. Description (gray, smaller)
4. Variant section (blue background)
5. Inclusions grid (2 columns)
6. Price details (border-top, aligned)

---

### 5. Financial Summary (Full Width)
```
┌──────────────────────────────────────┐
│ 💰 Financial Summary                 │
├──────────────────────────────────────┤
│ Items Subtotal           ₹60,000    │
│ 📍 Distance (25km) 🔵    ₹2,500     │
│ Discount (40%) 🟢      - ₹24,000    │
│ Coupon (CODE) 🟢        - ₹5,000    │
├──────────────────────────────────────┤
│ After Discounts          ₹33,500    │
│ GST (18%)                 ₹6,030    │
├──────────────────────────────────────┤
│ 🔒 Security Dep 🔵      ₹10,000    │
│                                      │
│ ╔════════════════════════════════╗  │
│ ║ Grand Total 🟢    ₹39,530     ║  │
│ ╚════════════════════════════════╝  │
│                                      │
│ ╔════════════════════════════════╗  │
│ ║ 💎 Total + Dep 🟣 ₹49,530    ║  │
│ ╚════════════════════════════════╝  │
│                                      │
│ ──── 💳 Payment Status ────         │
│ ✅ Paid 🟢           ₹20,000        │
│ ⏳ Balance 🟠        ₹19,530        │
└──────────────────────────────────────┘
```

**Line-by-Line Breakdown**:
1. Items Subtotal - plain
2. Distance - blue, with km
3. Discount - green, negative
4. Coupon - green, negative, with code
5. **After Discounts** - bold separator
6. GST - dynamic %
7. Security - blue, refundable note
8. **Grand Total** - green bg, bold, large
9. **Total + Deposit** - purple bg, border
10. **Payment Breakdown** - section header
11. Amount Paid - green bg
12. Balance Due - orange bg

---

### 6. Notes (Full Width, Conditional)
```
┌──────────────────────────────────────┐
│ 📝 Notes                             │
├──────────────────────────────────────┤
│ Special instructions or notes...     │
└──────────────────────────────────────┘
```
**Shows only if**: Invoice has notes

---

### 7. Action Buttons (Footer)
```
┌──────────────────────────────────────┐
│  [📥 Download PDF] [↗️ Share] [✕]   │
└──────────────────────────────────────┘
```
**Buttons**:
- Download PDF (primary)
- Share (secondary)
- Close (ghost)

---

## 🎭 Interactive Elements

### Badges
```
┌──────────────────┐
│ 📦 Package (Rent)│  ← Type badge
└──────────────────┘

┌─────────┐
│ 🟢 Paid │  ← Status badge (green)
└─────────┘

┌──────────────────┐
│ Advance Payment  │  ← Payment type (outline)
└──────────────────┘

┌────────┐
│ +10 Ex │  ← Extra safas (outline, small)
└────────┘

┌─────┐
│ Safa│  ← Category (secondary, small)
└─────┘
```

### Cards
```
┌─────────────────────┐
│ Header with icon    │
├─────────────────────┤
│ Content             │
│ Key: Value pairs    │
└─────────────────────┘
```
- Border: Light gray
- Padding: p-4
- Rounded corners

### Highlighted Sections
```
┌────────────────────┐
│ 🔵 Blue Background │  ← Variant info
│ • Inclusions       │
└────────────────────┘

┌────────────────────┐
│ 🟢 Green BG        │  ← Grand total
│ Grand Total: ₹XX   │
└────────────────────┘

┌────────────────────┐
│ 🟣 Purple BG       │  ← Total with deposit
│ 💎 Total: ₹XX     │
└────────────────────┘
```

---

## 📱 Responsive Behavior

### Desktop (> 1024px)
```
┌─────────────┬─────────────┐
│ Customer    │ Event       │
├─────────────┼─────────────┤
│ Invoice     │ Delivery    │
├─────────────┴─────────────┤
│ Items (full width)        │
├───────────────────────────┤
│ Financial (full width)    │
└───────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────┬─────────────┐
│ Customer    │ Event       │
├─────────────┴─────────────┤
│ Invoice                   │
├───────────────────────────┤
│ Delivery                  │
├───────────────────────────┤
│ Items                     │
├───────────────────────────┤
│ Financial                 │
└───────────────────────────┘
```

### Mobile (< 768px)
```
┌───────────────────────────┐
│ Customer                  │
├───────────────────────────┤
│ Event                     │
├───────────────────────────┤
│ Invoice                   │
├───────────────────────────┤
│ Delivery                  │
├───────────────────────────┤
│ Items                     │
│ (stacked)                 │
├───────────────────────────┤
│ Financial                 │
│ (full width)              │
└───────────────────────────┘
```

---

## 🎨 Design Tokens

### Typography Scale
- **Headers**: font-semibold, h3
- **Labels**: font-medium, text-sm
- **Values**: default weight, text-sm
- **Totals**: font-bold, text-base or text-lg
- **Descriptions**: text-muted-foreground, text-xs

### Spacing Scale
- **Card padding**: p-4
- **Section gap**: space-y-6
- **Line gap**: space-y-2
- **Grid gap**: gap-4
- **Line padding**: py-2, py-3

### Color Palette
```css
/* Success / Paid / Savings */
--green-50: #f0fdf4
--green-600: #16a34a
--green-700: #15803d

/* Warning / Pending */
--orange-50: #fff7ed
--orange-600: #ea580c
--orange-700: #c2410c

/* Info / Variant */
--blue-50: #eff6ff
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Special / Deposit */
--purple-50: #faf5ff
--purple-600: #9333ea
--purple-700: #7e22ce
--purple-200: #e9d5ff (border)

/* Neutral */
--gray-50: #f9fafb
--gray-600: #4b5563
--muted-foreground: #6b7280
```

### Border Styles
- **Card border**: border (light gray)
- **Line separator**: border-b
- **Highlight border**: border-2 (for deposit total)
- **Rounded**: rounded, rounded-lg, rounded-md

---

## 🔍 Key Visual Patterns

### Section Header Pattern
```
┌───────────────────────────┐
│ [Icon] Section Name       │
├───────────────────────────┤
```
- Icon: 4x4 size (h-4 w-4)
- Text: font-semibold
- Flex layout: items-center gap-2

### Key-Value Pattern
```
Label (medium):     Value (default)
Phone:              +91 9876543210
```
- Label: font-medium
- Separator: colon + space
- Inline display

### Financial Line Pattern
```
┌───────────────────────────┐
│ Label          ₹Amount    │
└───────────────────────────┘
```
- Flex: justify-between
- Border bottom: separator
- Padding: py-2

### Highlight Box Pattern
```
┌───────────────────────────┐
│ ║ Label      ₹Amount ║    │
└───────────────────────────┘
```
- Background: colored (green/purple)
- Bold font
- Large text: text-lg
- Padding: p-2 or p-3

---

## 📸 Component Anatomy

### Invoice Item Card
```
┌─────────────────────────────────┐
│ ┌─────┐                         │ ← Category badge (top-left)
│ │ Cat │                         │
│ └─────┘                         │
│                                  │
│ Product Name                     │ ← Bold, large (h4)
│ Description here...              │ ← Gray, small
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 🔵 Variant: Name           │ │ ← Blue background section
│ │ Inclusions:                 │ │
│ │ ┌──────────┬──────────┐    │ │ ← 2-column grid
│ │ │ • Item 1 │ • Item 3 │    │ │
│ │ │ • Item 2 │ • Item 4 │    │ │
│ │ └──────────┴──────────┘    │ │
│ └─────────────────────────────┘ │
│ ─────────────────────────────── │ ← Border separator
│ Qty: 1  Unit: ₹XX              │ ← Small text, inline
│                    Line Total   │ ← Right aligned
│                       ₹XX,XXX   │ ← Bold, large
└─────────────────────────────────┘
```

**Spacing**:
- Card padding: p-4
- Internal spacing: space-y-3
- Variant padding: p-3
- Grid gap: gap-1

---

## ✅ Visual Quality Checklist

### Alignment
- [ ] All labels left-aligned
- [ ] All amounts right-aligned
- [ ] Icons aligned with text
- [ ] Badges inline with text

### Hierarchy
- [ ] Product names most prominent
- [ ] Totals second most prominent
- [ ] Labels medium emphasis
- [ ] Descriptions least emphasis

### Spacing
- [ ] Consistent padding (p-4)
- [ ] Consistent gaps (gap-4, space-y-6)
- [ ] Breathing room around elements
- [ ] Not cramped, not sparse

### Color
- [ ] Green for positive (paid, savings)
- [ ] Orange for attention (pending)
- [ ] Blue for info
- [ ] Purple for special
- [ ] Consistent usage throughout

### Typography
- [ ] Readable font sizes
- [ ] Appropriate weights
- [ ] Consistent scale
- [ ] Good contrast ratios

---

## 🎯 Critical Visual Features

### 1. Items Section Variants
The blue background for variants is **critical for visual hierarchy**:
```
┌─────────────────────────────────┐
│ Product Name                     │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 🔵 BLUE BACKGROUND         │ │ ← Makes variants stand out
│ │ Variant: Premium Collection │ │
│ │ Inclusions: ...             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 2. Financial Highlights
Green and purple backgrounds draw eyes to key totals:
```
╔═══════════════════════════════╗
║ 🟢 Grand Total: ₹39,530      ║ ← Green = success, paid
╚═══════════════════════════════╝

╔═══════════════════════════════╗
║ 🟣 💎 Total + Deposit: ₹49,530║ ← Purple = special attention
╚═══════════════════════════════╝
```

### 3. Payment Status Colors
Green vs Orange creates instant understanding:
```
✅ Paid: ₹20,000 🟢  ← Green = good
⏳ Due:  ₹19,530 🟠  ← Orange = action needed
```

---

**This visual structure matches the Quotes dialog 100% for consistency!** 🎨

---

*Visual reference document for Invoice Dialog*
*Matches: /app/invoices/page.tsx (lines 507-870+)*
*Standard: Quotes dialog design system*
