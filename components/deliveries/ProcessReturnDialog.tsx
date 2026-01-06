"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import {
  Package,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shirt,
  Archive,
  PackagePlus,
  User,
  Phone,
  Camera,
} from "lucide-react"

const supabase = createClient()

interface DeliveryItem {
  id: string
  product_name: string
  variant_name?: string
  quantity: number
  product_id?: string
  variant_id?: string
  // Return quantities
  lost_damaged?: number
  used?: number
  fresh?: number
  // Return notes and photo per item
  return_notes?: string
  return_photo_url?: string
}

interface ProcessReturnDialogProps {
  open: boolean
  onClose: () => void
  delivery: {
    id: string
    delivery_number?: string
    customer_name?: string
    customer_phone?: string
    booking_id?: string
    booking_source?: "product_order" | "package_booking"
  } | null
  onSuccess: () => void
}

export function ProcessReturnDialog({
  open,
  onClose,
  delivery,
  onSuccess,
}: ProcessReturnDialogProps) {
  const [items, setItems] = useState<DeliveryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Client confirmation fields
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Load delivery items when dialog opens
  useEffect(() => {
    if (open && delivery?.booking_id) {
      // Load delivery data directly from Supabase to get latest return_notes and return_photo_url
      loadDeliveryData()
      // Then load items
      loadDeliveryItems()
    }
  }, [open, delivery?.id]) // Trigger on dialog open or delivery change

  // Fetch latest delivery data to get saved notes/photo
  const loadDeliveryData = async () => {
    if (!delivery?.id) return
    
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("return_notes, return_photo_url, return_confirmation_name, return_confirmation_phone")
        .eq("id", delivery.id)
        .single()

      if (error) {
        console.warn('[ProcessReturn] Could not load delivery notes/photo:', error)
        return
      }

      console.log('[ProcessReturn] Loaded delivery data from DB:', {
        notes: data?.return_notes,
        photo: data?.return_photo_url ? 'YES' : 'NO',
        confirmation_name: data?.return_confirmation_name,
        confirmation_phone: data?.return_confirmation_phone,
      })

      // Set the loaded values
      setNotes(data?.return_notes || "")
      setPhotoUrl(data?.return_photo_url || null)
      setClientName(data?.return_confirmation_name || delivery.customer_name || "")
      setClientPhone(data?.return_confirmation_phone || delivery.customer_phone || "")
      setItems([])
      setPhotoFile(null)
      setShowCamera(false)
    } catch (err) {
      console.error('[ProcessReturn] Error loading delivery data:', err)
    }
  }

  // Additional cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      // Clear state when dialog closes
      console.log('[ProcessReturn] Dialog closed, cleared all state')
      setItems([])
      setClientName("")
      setClientPhone("")
      setNotes("")
      setPhotoUrl(null)
      setPhotoFile(null)
      setShowCamera(false)
    }
  }, [open])

  // Cleanup camera on close
  useEffect(() => {
    if (!open && stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setShowCamera(false)
    }
  }, [open, stream])

  const loadDeliveryItems = async () => {
    if (!delivery?.booking_id) {
      console.log('[ProcessReturn] No booking_id')
      return
    }
    
    setLoading(true)
    try {
      console.log('[ProcessReturn] Loading items for booking_id:', delivery.booking_id, 'source:', delivery.booking_source)
      
      // Determine table and foreign key based on booking source
      const table = delivery.booking_source === "package_booking" 
        ? "package_booking_product_items" 
        : "product_order_items"
      
      // The foreign key column name - check both possible names
      const foreignKey = delivery.booking_source === "package_booking"
        ? "package_booking_id"
        : "order_id"  // product_order_items uses 'order_id' not 'product_order_id'

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(foreignKey, delivery.booking_id)

      console.log('[ProcessReturn] Query result:', { table, foreignKey, data, error })

      if (error) throw error

      // Map items with return quantities (default to 0)
      const mappedItems: DeliveryItem[] = (data || []).map((item: any) => {
        const lost = item.return_lost_damaged || 0
        const used = item.return_used || 0
        // Use saved fresh value if it exists, otherwise calculate
        const fresh = item.return_fresh !== null && item.return_fresh !== undefined 
          ? item.return_fresh 
          : (item.quantity || 1) - lost - used
        
        console.log(`[ProcessReturn] Item ${item.id}: return_lost_damaged=${lost}, return_used=${used}, return_fresh=${item.return_fresh}, notes="${item.return_notes}", photo=${item.return_photo_url ? 'YES' : 'NO'}`)
        
        return {
          id: item.id,
          product_name: item.product_name || item.name || "Unknown Product",
          variant_name: item.variant_name,
          quantity: item.quantity || 1,
          product_id: item.product_id,
          variant_id: item.variant_id,
          lost_damaged: lost,
          used: used,
          fresh: fresh,
          return_notes: item.return_notes || "",
          return_photo_url: item.return_photo_url || null,
        }
      })

      console.log('[ProcessReturn] Mapped items:', mappedItems)
      setItems(mappedItems)
    } catch (err: any) {
      console.error("Error loading items:", err)
      toast({
        title: "Error",
        description: "Failed to load delivery items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update item quantities
  const updateItemQuantity = (
    itemId: string,
    field: "lost_damaged" | "used",
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        
        const newValue = Math.max(0, Math.min(value, item.quantity))
        const otherField = field === "lost_damaged" ? "used" : "lost_damaged"
        const otherValue = item[otherField] || 0
        
        // Ensure total doesn't exceed quantity
        const maxAllowed = item.quantity - otherValue
        const finalValue = Math.min(newValue, maxAllowed)
        
        return {
          ...item,
          [field]: finalValue,
          fresh: item.quantity - finalValue - otherValue,
        }
      })
    )
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      setStream(mediaStream)
      setShowCamera(true)
      
      // Set video source after render
      setTimeout(() => {
        if (videoRef) {
          videoRef.srcObject = mediaStream
        }
      }, 100)
    } catch (err) {
      console.error("Camera error:", err)
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const capturePhoto = () => {
    if (!videoRef) return
    
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.videoWidth
    canvas.height = videoRef.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef, 0, 0)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setPhotoUrl(dataUrl)
      
      // Convert to file for upload
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoFile(new File([blob], "return-photo.jpg", { type: "image/jpeg" }))
        }
      }, "image/jpeg", 0.8)
    }
    
    // Stop camera
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setShowCamera(false)
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setShowCamera(false)
  }

  // Save for later (just saves quantities, doesn't process)
  const handleSave = async () => {
    if (!delivery) return
    
    setSaving(true)
    try {
      const table = delivery.booking_source === "package_booking" 
        ? "package_booking_product_items" 
        : "product_order_items"
      const foreignKey = delivery.booking_source === "package_booking"
        ? "package_booking_id"
        : "order_id"

      console.log('[ProcessReturn Save] Saving items to table:', table)
      console.log('[ProcessReturn Save] Booking ID:', delivery.booking_id)
      console.log('[ProcessReturn Save] Items to save:', items)

      // Verify items are not empty
      if (items.length === 0) {
        toast({
          title: "No Items",
          description: "No items found to save",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Update each item with return quantities
      let savedCount = 0
      let errorCount = 0
      for (const item of items) {
        console.log(`[ProcessReturn Save] Updating item ${item.id}:`, {
          id: item.id,
          return_lost_damaged: item.lost_damaged || 0,
          return_used: item.used || 0,
          return_fresh: item.fresh || 0,
        })

        const { data, error } = await supabase
          .from(table)
          .update({
            return_lost_damaged: item.lost_damaged || 0,
            return_used: item.used || 0,
            return_fresh: item.fresh || 0,
            return_notes: item.return_notes || "",
            return_photo_url: item.return_photo_url || null,
          })
          .eq("id", item.id)
          .select()

        if (error) {
          console.error(`[ProcessReturn Save] ❌ Failed to update item ${item.id}:`, error)
          errorCount++
          
          // If column doesn't exist error
          if (error.message?.includes('column') || error.message?.includes('syntax')) {
            console.error('[ProcessReturn Save] ⚠️ Column error - you may need to run the SQL migration')
          }
        } else {
          console.log(`[ProcessReturn Save] ✅ Successfully updated item ${item.id}:`, data)
          savedCount++
        }
      }

      console.log(`[ProcessReturn Save] Summary: ${savedCount} saved, ${errorCount} failed out of ${items.length}`)

      if (errorCount > 0) {
        toast({
          title: "Partial Save",
          description: `Saved ${savedCount}/${items.length} items. Some items failed to save. Check console for details.`,
          variant: "destructive",
        })
      } else {
        // Update delivery with return confirmation info
        await fetch("/api/deliveries/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            delivery_id: delivery.id,
            return_confirmation_name: clientName,
            return_confirmation_phone: clientPhone,
            return_notes: notes,
            return_photo_url: photoUrl,
          }),
        })

        toast({
          title: "Saved ✅",
          description: `Return quantities saved for ${savedCount} items. You can process later.`,
        })
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      console.error("Save error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Process return (finalizes everything)
  const handleProcessReturn = async () => {
    if (!delivery) return
    
    // Validation
    if (!clientName.trim()) {
      toast({ title: "Error", description: "Client name is required", variant: "destructive" })
      return
    }
    if (!clientPhone.trim()) {
      toast({ title: "Error", description: "Client phone is required", variant: "destructive" })
      return
    }

    setProcessing(true)
    try {
      // Call the process-return API
      const res = await fetch("/api/deliveries/process-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          delivery_id: delivery.id,
          booking_id: delivery.booking_id,
          booking_source: delivery.booking_source,
          items: items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_name: item.variant_name,
            quantity: item.quantity,
            lost_damaged: item.lost_damaged || 0,
            used: item.used || 0,
            fresh: item.fresh || 0,
            return_notes: item.return_notes,
            return_photo_url: item.return_photo_url,
          })),
          client_name: clientName,
          client_phone: clientPhone,
          notes: notes,
          photo_url: photoUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to process return")
      }

      const result = await res.json()

      toast({
        title: "Return Processed!",
        description: `${result.used_to_laundry || 0} items sent to laundry, ${result.fresh_to_inventory || 0} items returned to inventory, ${result.lost_damaged_count || 0} items marked as lost/damaged.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error("Process return error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to process return",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      total: acc.total + item.quantity,
      lostDamaged: acc.lostDamaged + (item.lost_damaged || 0),
      used: acc.used + (item.used || 0),
      fresh: acc.fresh + (item.fresh || 0),
    }),
    { total: 0, lostDamaged: 0, used: 0, fresh: 0 }
  )

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Process Return
          </DialogTitle>
          <DialogDescription>
            {delivery?.delivery_number} • Specify item conditions and process the return
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client Confirmation */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Client Confirmation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Client Name *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone *
                </Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Enter phone"
                  className="mt-1 bg-white"
                />
              </div>
            </div>
          </Card>

          {/* Photo Capture */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Return Photo (Optional)
            </h3>
            {showCamera ? (
              <div className="space-y-2">
                <video
                  ref={(el) => {
                    setVideoRef(el)
                    if (el && stream) el.srcObject = stream
                  }}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    📸 Capture
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : photoUrl ? (
              <div className="space-y-2">
                <img src={photoUrl} alt="Return" className="w-full rounded-lg max-h-48 object-cover" />
                <Button variant="outline" onClick={() => { setPhotoUrl(null); setPhotoFile(null) }}>
                  Retake Photo
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={startCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Capture Return Photo
              </Button>
            )}
          </Card>

          {/* Products Table */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Conditions
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items found</p>
            ) : (
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2 text-center">Total</div>
                  <div className="col-span-2 text-center text-orange-600">Used</div>
                  <div className="col-span-2 text-center text-red-600">Lost/Damaged</div>
                  <div className="col-span-2 text-center text-green-600">Fresh</div>
                </div>

                {/* Items */}
                {items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <Badge variant="outline">{item.quantity}</Badge>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={item.used || 0}
                          onChange={(e) =>
                            updateItemQuantity(item.id, "used", parseInt(e.target.value) || 0)
                          }
                          className="h-8 text-center text-orange-600 border-orange-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={item.lost_damaged || 0}
                          onChange={(e) =>
                            updateItemQuantity(item.id, "lost_damaged", parseInt(e.target.value) || 0)
                          }
                          className="h-8 text-center text-red-600 border-red-200"
                        />
                      </div>
                      <div className="col-span-2 text-center">
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {item.fresh || 0}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Totals Summary */}
                <Card className="p-3 bg-gray-50">
                  <div className="grid grid-cols-12 gap-2 items-center font-semibold">
                    <div className="col-span-4">Totals</div>
                    <div className="col-span-2 text-center">{totals.total}</div>
                    <div className="col-span-2 text-center text-orange-600">{totals.used}</div>
                    <div className="col-span-2 text-center text-red-600">{totals.lostDamaged}</div>
                    <div className="col-span-2 text-center text-green-600">{totals.fresh}</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Action Summary */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium mb-2">What happens when you Process Return:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-orange-700">
                <Shirt className="h-4 w-4" />
                <span><strong>{totals.used}</strong> items → Laundry</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <PackagePlus className="h-4 w-4" />
                <span><strong>{totals.fresh}</strong> items → Back to Inventory</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <Archive className="h-4 w-4" />
                <span><strong>{totals.lostDamaged}</strong> items → Lost/Damaged (update booking)</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the return..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={saving || processing}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={saving || processing || items.length === 0}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save for Later
          </Button>
          <Button
            onClick={handleProcessReturn}
            disabled={saving || processing || items.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Process Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
