# 📱 Barcode Scanning System - Complete Implementation Guide

> **Philosophy**: "Scan. Done." - Steve Jobs approach to invisible, context-aware technology

## 🎯 Vision

The barcode system should **know what you want to do** based on where you are. No menus, no questions - just scan and the app handles the rest.

---

## 📊 Phase 1: Foundation (COMPLETED ✅)

### Database Tables Created

#### 1️⃣ **product_barcodes** - Master Tracking
```sql
- Tracks individual physical items
- Links barcode → product → current status
- Records location, booking, lifecycle stats
- Statuses: available, rented, in_laundry, maintenance, damaged, archived
```

#### 2️⃣ **barcode_scan_history** - Audit Log
```sql
- Immutable record of every scan
- Tracks: who, what, when, where, why
- Used for analytics and troubleshooting
- Actions: booking_add, delivery_out, return_in, laundry_send, etc.
```

#### 3️⃣ **booking_barcode_links** - Booking Assignments
```sql
- Many-to-many relationship
- Links specific barcoded items to bookings
- Tracks delivery, return timestamps
```

#### 4️⃣ **laundry_barcode_items** - Laundry Tracking
```sql
- Tracks items in laundry batches
- Individual item status in cleaning cycle
- Cost tracking per item
```

### 🔧 Helper Functions Created

- `get_barcode_status(barcode)` - Quick status lookup
- `record_barcode_scan(...)` - Auto-update status on scan

---

## 📱 Phase 2: Frontend Components (NEXT)

### Component Structure
```
/components/barcode/
├── BarcodeScanner.tsx          # Main camera scanner
├── BarcodeScannerModal.tsx     # Modal wrapper
├── BarcodeFeedback.tsx         # Success/error animations
├── ManualBarcodeEntry.tsx      # Fallback manual entry
├── BarcodeList.tsx             # List of scanned items
└── ScannerContext.tsx          # Context provider

/hooks/
├── useBarcode.ts               # Main logic hook
├── useBarcodeScanner.ts        # Camera integration
└── useBarcodeActions.ts        # Context-based actions

/lib/barcode/
├── scanner.ts                  # Scanner utilities
├── actions.ts                  # Action handlers
└── types.ts                    # TypeScript types
```

---

## 🎬 User Flow Scenarios

### Scenario 1: Booking Flow
```
📍 Location: /book-package or /create-product-order
👤 User: Creating a new booking
🎯 Action: Scan items to add to booking

Flow:
1. User clicks "Scan Items to Add"
2. Camera opens with overlay
3. Scan barcode → Vibration + Sound
4. Item added to booking
5. Scanner stays open for next item
6. Swipe down or tap "Done" when finished

Backend:
- Check if barcode exists in product_barcodes
- Verify status = 'available'
- Add to booking_items
- Create entry in barcode_scan_history (action: 'booking_add')
- Update product_barcodes.current_booking_id
```

### Scenario 2: Delivery Out
```
📍 Location: /bookings/[id] (booking detail page)
👤 User: Delivering items to customer
🎯 Action: Confirm which items are being delivered

Flow:
1. Open booking → Click "Deliver Items"
2. Shows expected items list
3. Click "Scan to Confirm"
4. Scan each item going out
5. ✓ Green checkmark on scanned items
6. Unscanned items get warning
7. Confirm delivery → Updates status

Backend:
- record_barcode_scan(barcode, 'delivery_out', booking_id)
- Update product_barcodes.status = 'rented'
- Update booking_barcode_links.delivered_at = now()
```

### Scenario 3: Return Processing
```
📍 Location: /bookings/[id]
👤 User: Customer returns items after event
🎯 Action: Process returns and decide next step

Flow:
1. Click "Process Returns"
2. Shows items expected back
3. Scan each returned item
4. For each scan, quick 3-button choice:
   - ✓ Archive (clean, ready)
   - 🧺 Send to Laundry
   - ⚠️ Report Damage
5. Item processed based on choice

Backend:
- record_barcode_scan(barcode, 'return_in', booking_id)
- If Archive: status = 'available'
- If Laundry: status = 'in_laundry', add to laundry batch
- If Damage: status = 'damaged', create damage report
```

### Scenario 4: Laundry Batch
```
📍 Location: /laundry
👤 User: Sending items to laundry vendor
🎯 Action: Create batch and scan items

Flow:
1. Click "New Laundry Batch"
2. Select vendor, expected return date
3. Click "Scan Items"
4. Rapid-fire scanning of multiple items
5. Shows count: "15 items scanned"
6. Review list → Confirm & Send

Backend:
- Create laundry_batch record
- For each scan:
  - record_barcode_scan(barcode, 'laundry_send', NULL)
  - Insert into laundry_barcode_items
  - Update product_barcodes.status = 'in_laundry'
```

### Scenario 5: Archive Management
```
📍 Location: /products/archive
👤 User: Receiving new inventory
🎯 Action: Register new items into system

Flow:
1. Click "Receive New Items"
2. Camera opens
3. Scan barcode on new item
4. If barcode exists: "Moved to available"
5. If new barcode: Quick form (Category, Name, Variant)
6. Continue scanning

Backend:
- Check if barcode exists in product_barcodes
- If exists: status = 'available'
- If new: Insert into product_barcodes
- record_barcode_scan(barcode, 'archive_in')
```

---

## 🔧 Technical Implementation Details

### Libraries to Install

```bash
pnpm add @zxing/browser          # Barcode scanning
pnpm add framer-motion            # Smooth animations
pnpm add react-use-sound          # Sound effects
```

### 1. Basic Scanner Component

```tsx
// components/barcode/BarcodeScanner.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: Error) => void
  continuous?: boolean
}

export function BarcodeScanner({ 
  onScan, 
  onError, 
  continuous = true 
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    const startScanning = async () => {
      try {
        const videoInputDevices = await reader.listVideoInputDevices()
        const selectedDeviceId = videoInputDevices[0]?.deviceId

        if (videoRef.current && selectedDeviceId) {
          await reader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                const barcode = result.getText()
                onScan(barcode)
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                  navigator.vibrate(200)
                }
                
                // Sound feedback
                playBeep()

                if (!continuous) {
                  reader.reset()
                }
              }
              if (error && onError) {
                onError(error)
              }
            }
          )
          setIsScanning(true)
        }
      } catch (err) {
        onError?.(err as Error)
      }
    }

    startScanning()

    return () => {
      reader.reset()
    }
  }, [onScan, onError, continuous])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-4 border-white rounded-lg opacity-75">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-scan" />
        </div>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-lg font-semibold">
        Point camera at barcode
      </div>
    </div>
  )
}

function playBeep() {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}
```

### 2. Context-Aware Hook

```tsx
// hooks/useBarcode.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export type BarcodeContext = 
  | 'booking'
  | 'delivery'
  | 'return'
  | 'laundry'
  | 'archive'

interface UseBarcodeOptions {
  context: BarcodeContext
  bookingId?: string
  onSuccess?: (barcode: string) => void
  onError?: (error: string) => void
}

export function useBarcode({ 
  context, 
  bookingId, 
  onSuccess, 
  onError 
}: UseBarcodeOptions) {
  const { toast } = useToast()
  const [scannedItems, setScannedItems] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScan = useCallback(async (barcode: string) => {
    setIsProcessing(true)

    try {
      // 1. Check if barcode exists
      const { data: barcodeData, error: checkError } = await supabase
        .from('product_barcodes')
        .select('*, products(name, category)')
        .eq('barcode', barcode)
        .single()

      if (checkError || !barcodeData) {
        throw new Error('Barcode not found in system')
      }

      // 2. Context-specific action
      let action = ''
      let newStatus = ''

      switch (context) {
        case 'booking':
          action = 'booking_add'
          newStatus = 'rented'
          // Add to booking items
          await addToBooking(barcodeData, bookingId!)
          break

        case 'delivery':
          action = 'delivery_out'
          newStatus = 'rented'
          await markAsDelivered(barcodeData.id, bookingId!)
          break

        case 'return':
          action = 'return_in'
          newStatus = 'available'
          await processReturn(barcodeData.id, bookingId!)
          break

        case 'laundry':
          action = 'laundry_send'
          newStatus = 'in_laundry'
          break

        case 'archive':
          action = 'archive_in'
          newStatus = 'available'
          break
      }

      // 3. Record scan in history
      await supabase.from('barcode_scan_history').insert({
        barcode,
        scan_action: action,
        booking_id: bookingId,
        status_before: barcodeData.status,
        status_after: newStatus,
        scanned_by: (await supabase.auth.getUser()).data.user?.id,
      })

      // 4. Update barcode status
      await supabase
        .from('product_barcodes')
        .update({ 
          status: newStatus,
          current_booking_id: context === 'booking' ? bookingId : null
        })
        .eq('id', barcodeData.id)

      // Success!
      setScannedItems(prev => [...prev, barcode])
      onSuccess?.(barcode)
      
      toast({
        title: '✓ Scanned Successfully',
        description: `${barcodeData.products?.name} - ${barcode}`,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scan failed'
      onError?.(errorMessage)
      
      toast({
        title: '⚠️ Scan Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [context, bookingId, onSuccess, onError, toast])

  return {
    handleScan,
    scannedItems,
    isProcessing,
    clearScanned: () => setScannedItems([]),
  }
}

// Helper functions
async function addToBooking(barcodeData: any, bookingId: string) {
  // Implementation depends on your booking structure
  // This is a placeholder
}

async function markAsDelivered(barcodeId: string, bookingId: string) {
  await supabase
    .from('booking_barcode_links')
    .update({ 
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .match({ barcode_id: barcodeId, booking_id: bookingId })
}

async function processReturn(barcodeId: string, bookingId: string) {
  await supabase
    .from('booking_barcode_links')
    .update({ 
      status: 'returned',
      returned_at: new Date().toISOString()
    })
    .match({ barcode_id: barcodeId, booking_id: bookingId })
}
```

### 3. Scanner Modal Component

```tsx
// components/barcode/BarcodeScannerModal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BarcodeScanner } from './BarcodeScanner'
import { X, Keyboard } from 'lucide-react'
import { useState } from 'react'
import { ManualBarcodeEntry } from './ManualBarcodeEntry'

interface BarcodeScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
  title?: string
  description?: string
}

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
  title = 'Scan Barcode',
  description = 'Point your camera at the barcode'
}: BarcodeScannerModalProps) {
  const [showManual, setShowManual] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        {showManual ? (
          <ManualBarcodeEntry
            onSubmit={(barcode) => {
              onScan(barcode)
              setShowManual(false)
            }}
            onCancel={() => setShowManual(false)}
          />
        ) : (
          <>
            <BarcodeScanner onScan={onScan} continuous />
            
            <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowManual(true)}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                Enter Manually
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📝 Next Steps

### Immediate (Phase 2)
1. ✅ Create database tables (DONE)
2. ⏳ Install required packages
3. ⏳ Build scanner components
4. ⏳ Create hooks for barcode logic
5. ⏳ Integrate into booking flow

### Short-term (Phase 3)
1. Add delivery/return scanning
2. Laundry batch scanning
3. Archive management
4. Offline queue support

### Long-term (Phase 4)
1. Bulk scanning mode
2. Analytics dashboard
3. Barcode label printing
4. Mobile app optimization

---

## 🧪 Testing Checklist

- [ ] Scan barcode in booking flow
- [ ] Scan barcode for delivery
- [ ] Scan barcode for returns
- [ ] Send items to laundry via scan
- [ ] Receive items from laundry
- [ ] Archive new inventory
- [ ] Manual barcode entry fallback
- [ ] Duplicate detection
- [ ] Offline scanning + sync
- [ ] Invalid barcode handling
- [ ] Permission errors

---

## 📚 Database Query Examples

### Check barcode status
```sql
SELECT * FROM get_barcode_status('SAFA-001-A');
```

### Record a scan
```sql
SELECT record_barcode_scan(
  'SAFA-001-A',           -- barcode
  'booking_add',          -- action
  'booking-uuid-here',    -- booking_id
  'user-uuid-here',       -- user_id
  'Added to wedding booking',  -- notes
  'franchise-uuid-here'   -- franchise_id
);
```

### Get all items for a booking
```sql
SELECT 
  pb.barcode,
  p.name AS product_name,
  pb.status,
  bbl.delivered_at,
  bbl.returned_at
FROM booking_barcode_links bbl
JOIN product_barcodes pb ON pb.id = bbl.barcode_id
JOIN products p ON p.id = pb.product_id
WHERE bbl.booking_id = 'booking-uuid-here';
```

### Scan history for audit
```sql
SELECT 
  bsh.scanned_at,
  bsh.scan_action,
  bsh.barcode,
  p.name AS product_name,
  u.name AS scanned_by_name
FROM barcode_scan_history bsh
LEFT JOIN product_barcodes pb ON pb.barcode = bsh.barcode
LEFT JOIN products p ON p.id = pb.product_id
LEFT JOIN users u ON u.id = bsh.scanned_by
ORDER BY bsh.scanned_at DESC
LIMIT 50;
```

---

## 🎨 UI/UX Principles

### 1. **Instant Feedback**
- Vibration on successful scan
- Sound effect (beep)
- Visual confirmation (green checkmark)
- All within 200ms

### 2. **Error Handling**
- Clear error messages
- Suggest fixes
- Manual entry fallback
- Retry option

### 3. **Progressive Disclosure**
- Scanner opens in context
- Minimal UI during scanning
- Details on demand
- Quick actions after scan

### 4. **Offline-First**
- Queue scans when offline
- Sync when online
- Visual indicator of sync status

---

**Ready to implement Phase 2?** Let me know and I'll create the React components!
