"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { Loader2, Info, AlertTriangle, TrendingUp, TrendingDown, Package } from "lucide-react"

interface ReturnItem {
  product_id: string
  product_name: string
  product_code?: string
  category?: string
  image_url?: string
  qty_delivered: number
  qty_returned: number // Used items returned
  qty_to_laundry?: number // Portion of used items to send to laundry
  qty_not_used: number // Extra items that were never used
  qty_damaged: number
  qty_lost: number
  damage_reason?: string
  damage_description?: string
  damage_severity?: string
  lost_reason?: string
  lost_description?: string
  notes?: string
}

interface InventoryPreview {
  product_id: string
  product_name: string
  current_stock: {
    total: number
    available: number
    damaged: number
    booked: number
    in_laundry: number
  }
  new_stock: {
    total: number
    available: number
    damaged: number
    booked: number
    in_laundry: number
  }
  changes: {
    total: number
    available: number
    damaged: number
    booked: number
    in_laundry: number
  }
  warnings: string[]
}

interface ReturnProcessingDialogProps {
  returnRecord: any
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const damageReasons = [
  { value: "torn", label: "Torn" },
  { value: "stained", label: "Stained" },
  { value: "burned", label: "Burned" },
  { value: "missing_parts", label: "Missing Parts" },
  { value: "color_fade", label: "Color Fade" },
  { value: "shrunk", label: "Shrunk" },
  { value: "other", label: "Other" },
]

const damageSeverity = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "beyond_repair", label: "Beyond Repair" },
]

const lostReasons = [
  { value: "stolen", label: "Stolen" },
  { value: "lost", label: "Lost" },
  { value: "not_returned", label: "Not Returned by Customer" },
  { value: "other", label: "Other" },
]

export function ReturnProcessingDialog({
  returnRecord,
  open,
  onClose,
  onSuccess,
}: ReturnProcessingDialogProps) {
  const [items, setItems] = useState<ReturnItem[]>([])
  const [sendToLaundry, setSendToLaundry] = useState(false)
  const [notes, setNotes] = useState("")
  const [processingNotes, setProcessingNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [preview, setPreview] = useState<InventoryPreview[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open && returnRecord) {
      loadReturnItems()
    }
  }, [open, returnRecord])

  const loadReturnItems = async () => {
    setLoading(true)
    try {
      // Fetch booking items based on booking source
      let productItems: any[] = []
      // Optional: handover prefill map
      let handoverMap: Record<string, { qty_not_tied: number; notes?: string }> = {}
      // If delivery_id exists on the return record, fetch handover to prefill Not Used
      if (returnRecord?.delivery_id) {
        try {
          const hoRes = await fetch(`/api/deliveries/${returnRecord.delivery_id}/handover`, { cache: "no-store" })
          if (hoRes.ok) {
            const hoJson = await hoRes.json()
            const arr = Array.isArray(hoJson?.items) ? hoJson.items : []
            handoverMap = arr.reduce((acc: any, it: any) => {
              if (it?.product_id) acc[it.product_id] = { qty_not_tied: Number(it.qty_not_tied) || 0, notes: it.notes }
              return acc
            }, {})
          }
        } catch (e) {
          // Ignore prefill errors silently
        }
      }
      
      if (returnRecord.booking_source === "product_order") {
        const response = await fetch(`/api/product-orders/${returnRecord.booking_id}`)
        if (response.ok) {
          const data = await response.json()
          productItems = data.items || []
        }
      } else if (returnRecord.booking_source === "package_booking") {
        const response = await fetch(`/api/package-bookings/${returnRecord.booking_id}`)
        if (response.ok) {
          const data = await response.json()
          // Extract products from package booking items
          productItems = data.items?.flatMap((item: any) => 
            (item.selected_products || []).map((productId: string) => ({
              product_id: productId,
              quantity: 1,
            }))
          ) || []
        }
      }

      // Fetch product details
      const itemsWithDetails = await Promise.all(
        productItems.map(async (item: any) => {
          const productResponse = await fetch(`/api/products/${item.product_id}`)
          const product = productResponse.ok ? await productResponse.json() : null

          const ho = handoverMap[item.product_id]
          const qty_not_used_prefill = ho ? Math.max(0, Math.min(Number(item.quantity || 1), Number(ho.qty_not_tied))) : 0
          const qty_delivered_val = item.quantity || 1
          const defaultQtyReturned = Math.max(0, qty_delivered_val - qty_not_used_prefill)

          return {
            product_id: item.product_id,
            product_name: product?.name || "Unknown Product",
            product_code: product?.product_code,
            category: product?.category,
            image_url: product?.image_url,
            qty_delivered: qty_delivered_val,
            // Default: prefer handover's not used -> rest goes to Used
            qty_returned: defaultQtyReturned,
            qty_to_laundry: 0,
            qty_not_used: qty_not_used_prefill, // Extra items not used (prefilled from handover when available)
            qty_damaged: 0,
            qty_lost: 0,
            damage_reason: undefined,
            damage_description: "",
            damage_severity: undefined,
            lost_reason: undefined,
            lost_description: "",
            notes: ho?.notes || "",
          }
        })
      )

      setItems(itemsWithDetails)
    } catch (error) {
      console.error("Error loading return items:", error)
      toast({
        title: "Error",
        description: "Failed to load return items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (index: number, updates: Partial<ReturnItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  const handleQuantityChange = (index: number, field: "qty_returned" | "qty_not_used" | "qty_damaged" | "qty_lost", value: string) => {
    const numValue = parseInt(value) || 0
    const item = items[index]
    const otherFields = {
      qty_returned: item.qty_returned,
      qty_not_used: item.qty_not_used,
      qty_damaged: item.qty_damaged,
      qty_lost: item.qty_lost,
    }
    otherFields[field] = numValue

    // Auto-balance: ensure total doesn't exceed delivered
    const total = otherFields.qty_returned + otherFields.qty_not_used + otherFields.qty_damaged + otherFields.qty_lost
    if (total > item.qty_delivered) {
      toast({
        title: "Invalid Quantity",
        description: "Total cannot exceed delivered quantity",
        variant: "destructive",
      })
      return
    }

    // If reducing qty_returned below qty_to_laundry, clamp laundry qty
    const updates: any = { [field]: numValue }
    if (field === 'qty_returned') {
      const newReturned = numValue
      const current = items[index]
      const currentLaundry = current.qty_to_laundry || 0
      if (currentLaundry > newReturned) {
        updates.qty_to_laundry = newReturned
      }
    }
    updateItem(index, updates)
  }

  const handleLaundryQtyChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0
    const item = items[index]
    const max = item.qty_returned
    if (numValue < 0 || numValue > max) {
      toast({ title: 'Invalid Laundry Quantity', description: `Must be between 0 and ${max}`, variant: 'destructive' })
      return
    }
    updateItem(index, { qty_to_laundry: numValue })
  }

  const validateItems = (): boolean => {
    for (const item of items) {
      const total = item.qty_returned + item.qty_not_used + item.qty_damaged + item.qty_lost
      if (total !== item.qty_delivered) {
        toast({
          title: "Validation Error",
          description: `${item.product_name}: Quantities must add up to delivered (${item.qty_delivered})`,
          variant: "destructive",
        })
        return false
      }

      // Laundry qty must be <= returned qty
      if ((item.qty_to_laundry || 0) > item.qty_returned) {
        toast({
          title: "Validation Error",
          description: `${item.product_name}: Laundry quantity cannot exceed Used quantity`,
          variant: "destructive",
        })
        return false
      }

      if (item.qty_damaged > 0 && !item.damage_reason) {
        toast({
          title: "Validation Error",
          description: `${item.product_name}: Damage reason required`,
          variant: "destructive",
        })
        return false
      }

      if (item.qty_lost > 0 && !item.lost_reason) {
        toast({
          title: "Validation Error",
          description: `${item.product_name}: Lost reason required`,
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const loadPreview = async () => {
    if (!validateItems()) return

    setLoadingPreview(true)
    try {
      const response = await fetch(
        `/api/returns/${returnRecord.id}/preview?items=${encodeURIComponent(
          JSON.stringify(
            items.map((item) => ({
              product_id: item.product_id,
              qty_delivered: item.qty_delivered,
              qty_returned: item.qty_returned,
              qty_not_used: item.qty_not_used,
              qty_damaged: item.qty_damaged,
              qty_lost: item.qty_lost,
              qty_to_laundry: item.qty_to_laundry ?? (sendToLaundry ? item.qty_returned : 0),
              send_to_laundry: sendToLaundry,
            }))
          )
        )}`
      )

      if (!response.ok) {
        throw new Error("Failed to load preview")
      }

      const data = await response.json()
      setPreview(data.preview || [])
      setShowPreview(true)
    } catch (error) {
      console.error("Error loading preview:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory preview",
        variant: "destructive",
      })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateItems()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/returns/${returnRecord.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            qty_delivered: item.qty_delivered,
            qty_returned: item.qty_returned,
            qty_not_used: item.qty_not_used,
            qty_damaged: item.qty_damaged,
            qty_lost: item.qty_lost,
            qty_to_laundry: item.qty_to_laundry ?? (sendToLaundry ? item.qty_returned : 0),
            damage_reason: item.damage_reason,
            damage_description: item.damage_description,
            damage_severity: item.damage_severity,
            lost_reason: item.lost_reason,
            lost_description: item.lost_description,
            notes: item.notes,
          })),
          send_to_laundry: sendToLaundry,
          notes,
          processing_notes: processingNotes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process return")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Return processed successfully! ${result.results?.items_processed || 0} items processed.`,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error processing return:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totals = items.reduce(
    (acc, item) => ({
      delivered: acc.delivered + item.qty_delivered,
      returned: acc.returned + item.qty_returned,
      not_used: acc.not_used + item.qty_not_used,
      damaged: acc.damaged + item.qty_damaged,
      lost: acc.lost + item.qty_lost,
    }),
    { delivered: 0, returned: 0, not_used: 0, damaged: 0, lost: 0 }
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Process Return - {returnRecord?.return_number}</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <p>Review and process returned items:</p>
              <ul className="text-xs list-disc list-inside space-y-0.5 mt-2">
                <li><strong>Used (Laundry)</strong>: Items that were used and need cleaning</li>
                <li><strong className="text-blue-600">Not Used (Extra)</strong>: Extra items that weren't used - go directly to available</li>
                <li><strong className="text-orange-600">Damaged</strong>: Items with damage - provide details</li>
                <li><strong className="text-red-600">Stolen/Lost</strong>: Missing items</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="font-semibold">{item.product_name}</h4>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {item.product_code && <span>Code: {item.product_code}</span>}
                          {item.category && <Badge variant="outline">{item.category}</Badge>}
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        <div>
                          <Label className="text-xs">Delivered</Label>
                          <Input
                            type="number"
                            value={item.qty_delivered}
                            disabled
                            className="bg-muted h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Used</Label>
                          <Input
                            type="number"
                            value={item.qty_returned}
                            onChange={(e) =>
                              handleQuantityChange(index, "qty_returned", e.target.value)
                            }
                            min={0}
                            max={item.qty_delivered}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-600">Not Used (Extra)</Label>
                          <Input
                            type="number"
                            value={item.qty_not_used}
                            onChange={(e) =>
                              handleQuantityChange(index, "qty_not_used", e.target.value)
                            }
                            min={0}
                            max={item.qty_delivered}
                            className="h-9 border-blue-300 focus-visible:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-orange-600">Damaged</Label>
                          <Input
                            type="number"
                            value={item.qty_damaged}
                            onChange={(e) =>
                              handleQuantityChange(index, "qty_damaged", e.target.value)
                            }
                            min={0}
                            max={item.qty_delivered}
                            className="h-9 border-orange-300 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-red-600">Stolen/Lost</Label>
                          <Input
                            type="number"
                            value={item.qty_lost}
                            onChange={(e) =>
                              handleQuantityChange(index, "qty_lost", e.target.value)
                            }
                            min={0}
                            max={item.qty_delivered}
                            className="h-9 border-red-300 focus-visible:ring-red-500"
                          />
                        </div>
                      </div>

                      {/* Per-item Laundry split */}
                      {item.qty_returned > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Move to Laundry</Label>
                            <Input
                              type="number"
                              value={item.qty_to_laundry ?? 0}
                              onChange={(e) => handleLaundryQtyChange(index, e.target.value)}
                              min={0}
                              max={item.qty_returned}
                              className="h-9"
                            />
                          </div>
                          <div className="self-end text-xs text-muted-foreground">
                            Will restock directly: {(item.qty_returned - (item.qty_to_laundry ?? 0))}
                          </div>
                        </div>
                      )}

                      {item.qty_damaged > 0 && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-orange-50 dark:bg-orange-950 rounded">
                          <div>
                            <Label>Damage Reason *</Label>
                            <Select
                              value={item.damage_reason}
                              onValueChange={(value) =>
                                updateItem(index, { damage_reason: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {damageReasons.map((reason) => (
                                  <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Severity</Label>
                            <Select
                              value={item.damage_severity}
                              onValueChange={(value) =>
                                updateItem(index, { damage_severity: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                {damageSeverity.map((severity) => (
                                  <SelectItem key={severity.value} value={severity.value}>
                                    {severity.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label>Damage Description</Label>
                            <Textarea
                              value={item.damage_description}
                              onChange={(e) =>
                                updateItem(index, { damage_description: e.target.value })
                              }
                              placeholder="Describe the damage..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {item.qty_lost > 0 && (
                        <div className="grid grid-cols-1 gap-4 p-3 bg-red-50 dark:bg-red-950 rounded">
                          <div>
                            <Label>Lost Reason *</Label>
                            <Select
                              value={item.lost_reason}
                              onValueChange={(value) =>
                                updateItem(index, { lost_reason: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {lostReasons.map((reason) => (
                                  <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Lost Description</Label>
                            <Textarea
                              value={item.lost_description}
                              onChange={(e) =>
                                updateItem(index, { lost_description: e.target.value })
                              }
                              placeholder="Provide details about the lost item..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label>Notes (Optional)</Label>
                        <Input
                          value={item.notes}
                          onChange={(e) => updateItem(index, { notes: e.target.value })}
                          placeholder="Any additional notes..."
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-4 bg-muted">
                <h4 className="font-semibold mb-3">Summary</h4>
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{totals.delivered}</div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{totals.returned}</div>
                    <div className="text-xs text-muted-foreground">Used (Laundry)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{totals.not_used}</div>
                    <div className="text-xs text-muted-foreground">Not Used (Direct)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{totals.damaged}</div>
                    <div className="text-sm text-muted-foreground">Damaged</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{totals.lost}</div>
                    <div className="text-sm text-muted-foreground">Stolen/Lost</div>
                  </div>
                </div>
              </Card>

              <div className="flex items-start space-x-2 p-4 border rounded bg-green-50 dark:bg-green-950">
                <Checkbox
                  id="send-to-laundry"
                  checked={sendToLaundry}
                  onCheckedChange={(checked) => setSendToLaundry(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="send-to-laundry" className="cursor-pointer font-medium">
                    Send used items to laundry
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used items will be sent to laundry before becoming available. 
                    "Not Used" items skip laundry and go directly to available inventory.
                  </p>
                </div>
              </div>

              <div>
                <Label>Return Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="General notes about this return..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Processing Notes (Internal)</Label>
                <Textarea
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  placeholder="Internal notes about processing..."
                  rows={2}
                />
              </div>

              {showPreview && preview.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Inventory Impact Preview:</div>
                    {preview.map((p) => (
                      <div key={p.product_id} className="text-sm space-y-1 mb-2">
                        <div className="font-medium">{p.product_name}</div>
                        <div className="flex gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            Available: {p.current_stock.available} → {p.new_stock.available}
                            {p.changes.available > 0 && (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            )}
                            {p.changes.available < 0 && (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={
                                p.changes.available > 0 ? "text-green-600" : "text-red-600"
                              }
                            >
                              ({p.changes.available > 0 ? "+" : ""}
                              {p.changes.available})
                            </span>
                          </span>
                          {p.changes.damaged !== 0 && (
                            <span className="text-orange-600">
                              Damaged: +{p.changes.damaged}
                            </span>
                          )}
                          {p.changes.total !== 0 && (
                            <span className="text-red-600">Total: {p.changes.total}</span>
                          )}
                          {p.changes.in_laundry !== 0 && (
                            <span className="text-blue-600">
                              Laundry: +{p.changes.in_laundry}
                            </span>
                          )}
                        </div>
                        {p.warnings.length > 0 && (
                          <div className="flex items-start gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3 mt-0.5" />
                            <span>{p.warnings.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={loadPreview}
            disabled={loading || loadingPreview}
          >
            {loadingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Preview...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Preview Impact
              </>
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Return"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
