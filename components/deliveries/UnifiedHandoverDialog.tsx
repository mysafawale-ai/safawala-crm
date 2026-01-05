'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Camera, PenTool, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ProductItem {
  product_id: string
  product_name: string
  qty_delivered: number
  category?: string
}

interface UnifiedHandoverDialogProps {
  open: boolean
  onClose: () => void
  delivery: any | null
  onSaved: () => void
}

export function UnifiedHandoverDialog({
  open,
  onClose,
  delivery,
  onSaved,
}: UnifiedHandoverDialogProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('recipient')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  
  // Recipient info
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  
  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  
  // Items
  const [items, setItems] = useState<(ProductItem & {
    qty_used: number
    qty_not_used: number
    qty_damaged: number
    qty_lost: number
    damage_reason?: string
    damage_notes?: string
  })[]>([])

  // Initialize form
  useEffect(() => {
    const loadData = async () => {
      if (!open || !delivery) return
      setLoading(true)
      try {
        // Get booking items
        let productItems: any[] = []
        if (delivery.booking_source === 'product_order') {
          const res = await fetch(`/api/product-orders/${delivery.booking_id}`)
          if (res.ok) {
            const json = await res.json()
            productItems = json.items || []
          }
        } else if (delivery.booking_source === 'package_booking') {
          const res = await fetch(`/api/package-bookings/${delivery.booking_id}`)
          if (res.ok) {
            const json = await res.json()
            productItems = json.items?.flatMap((it: any) => 
              (it.selected_products || []).map((pid: string) => ({ 
                product_id: pid, 
                quantity: 1 
              }))
            ) || []
          }
        }

        // Fetch product details
        const withDetails = await Promise.all(
          productItems.map(async (pi: any) => {
            const pr = await fetch(`/api/products/${pi.product_id}`)
            const p = pr.ok ? await pr.json() : null
            return {
              product_id: pi.product_id,
              product_name: p?.name || 'Unknown Product',
              qty_delivered: pi.quantity || 1,
              category: p?.category,
              qty_used: 0,
              qty_not_used: 0,
              qty_damaged: 0,
              qty_lost: 0,
              damage_reason: undefined,
              damage_notes: undefined,
            }
          })
        )

        setItems(withDetails)
        setLoading(false)
      } catch (e) {
        console.error('Failed loading handover data', e)
        setLoading(false)
      }
    }

    loadData()
  }, [open, delivery])

  // Signature canvas handlers
  const startDrawing = () => setIsDrawing(true)
  const stopDrawing = () => setIsDrawing(false)

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()

    setHasSignature(true)
  }

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    setHasSignature(false)
  }

  // Photo handlers
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Update item quantities
  const updateItem = (idx: number, field: string, value: number) => {
    setItems(prev => {
      const updated = [...prev]
      const item = updated[idx]
      
      // Update field
      ;(item as any)[field] = Math.max(0, Math.min(value, item.qty_delivered))
      
      // Recalculate validation
      const total = item.qty_used + item.qty_not_used + item.qty_damaged + item.qty_lost
      if (total > item.qty_delivered) {
        // Scale down the recently changed field
        ;(item as any)[field] = Math.max(0, item.qty_delivered - (total - value))
      }
      
      return updated
    })
  }

  // Validate form
  const validateForm = () => {
    if (!recipientName.trim()) {
      toast({ title: 'Error', description: 'Recipient name is required', variant: 'destructive' })
      return false
    }
    if (!recipientPhone.trim()) {
      toast({ title: 'Error', description: 'Recipient phone is required', variant: 'destructive' })
      return false
    }
    if (!photoUrl) {
      toast({ title: 'Error', description: 'Photo is required', variant: 'destructive' })
      return false
    }
    if (!hasSignature) {
      toast({ title: 'Error', description: 'Signature is required', variant: 'destructive' })
      return false
    }

    // Validate items sum to delivered
    for (const item of items) {
      const total = item.qty_used + item.qty_not_used + item.qty_damaged + item.qty_lost
      if (total !== item.qty_delivered) {
        toast({
          title: 'Error',
          description: `${item.product_name}: Total quantities (${total}) must equal delivered (${item.qty_delivered})`,
          variant: 'destructive'
        })
        return false
      }
      if (item.qty_damaged > 0 && !item.damage_reason) {
        toast({
          title: 'Error',
          description: `${item.product_name}: Damage reason required when items are damaged`,
          variant: 'destructive'
        })
        return false
      }
    }

    return true
  }

  // Save handover
  const handleSave = async () => {
    if (!validateForm() || !delivery || !canvasRef.current) return

    setLoading(true)
    try {
      // Get signature as data URL
      const signatureUrl = canvasRef.current.toDataURL('image/png')

      // Upload photo and signature to Supabase storage
      let photoStoragePath = null
      let signatureStoragePath = null

      if (photoFile) {
        const photoFormData = new FormData()
        photoFormData.append('file', photoFile)
        photoFormData.append('delivery_id', delivery.id)
        
        const photoRes = await fetch('/api/deliveries/upload-photo', {
          method: 'POST',
          body: photoFormData,
        })
        if (photoRes.ok) {
          const photoJson = await photoRes.json()
          photoStoragePath = photoJson.url
        }
      }

      if (hasSignature) {
        // Convert signature canvas to blob
        const signatureBlob = await new Promise<Blob>(resolve => 
          canvasRef.current!.toBlob(blob => resolve(blob!), 'image/png')
        )
        const signatureFile = new File([signatureBlob], `signature-${delivery.id}.png`, { type: 'image/png' })
        
        const sigFormData = new FormData()
        sigFormData.append('file', signatureFile)
        sigFormData.append('delivery_id', delivery.id)
        
        const sigRes = await fetch('/api/deliveries/upload-signature', {
          method: 'POST',
          body: sigFormData,
        })
        if (sigRes.ok) {
          const sigJson = await sigRes.json()
          signatureStoragePath = sigJson.url
        }
      }

      // Save handover to database
      const payload = {
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        photo_url: photoStoragePath || photoUrl,
        signature_url: signatureStoragePath,
        items: items.map(it => ({
          product_id: it.product_id,
          qty_used: it.qty_used,
          qty_not_used: it.qty_not_used,
          qty_damaged: it.qty_damaged,
          qty_lost: it.qty_lost,
          damage_reason: it.damage_reason || null,
          damage_notes: it.damage_notes || null,
        })),
      }

      const res = await fetch(`/api/deliveries/${delivery.id}/unified-handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save handover')
      }

      toast({ title: 'Success', description: 'Handover completed and inventory updated!' })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save handover',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Delivery Handover</DialogTitle>
          <DialogDescription>
            Capture recipient info, photos, signature, and categorize items (used, not used, damaged, lost)
          </DialogDescription>
        </DialogHeader>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recipient">Recipient</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="signature">Signature</TabsTrigger>
            </TabsList>

            {/* Recipient Tab */}
            <TabsContent value="recipient" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recipient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipient-name">Name *</Label>
                    <Input
                      id="recipient-name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Full name of person receiving delivery"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient-phone">Phone Number *</Label>
                    <Input
                      id="recipient-phone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Contact phone number"
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photo Tab */}
            <TabsContent value="photo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Photo *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt="Delivery photo" className="w-full max-h-96 object-contain mx-auto rounded" />
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            fileInputRef.current?.click()
                          }}
                          disabled={loading}
                        >
                          <Camera className="h-4 w-4 mr-2" /> Retake Photo
                        </Button>
                      </>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-2">Click to capture photo</p>
                        <p className="text-xs text-muted-foreground mb-4">Take a photo of the items at handover</p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                        >
                          <Camera className="h-4 w-4 mr-2" /> Capture Photo
                        </Button>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Item Categorization</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Categorize each item: Used (→Laundry), Not Used (→Inventory), Damaged/Lost (→Archive)
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items found for this delivery</p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.product_id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Delivered: {item.qty_delivered} units
                            </p>
                          </div>
                          <div className="text-sm">
                            {(() => {
                              const total = item.qty_used + item.qty_not_used + item.qty_damaged + item.qty_lost
                              const remaining = Math.max(0, item.qty_delivered - total)
                              return (
                                remaining > 0 ? (
                                  <span className="text-red-600 font-medium">Unassigned: {remaining}</span>
                                ) : (
                                  <span className="text-green-600 font-medium flex items-center"><CheckCircle2 className="h-4 w-4 mr-1" /> Complete</span>
                                )
                              )
                            })()}
                          </div>
                        </div>

                        {/* Quantity inputs grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Used (Laundry)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={item.qty_delivered}
                              value={item.qty_used}
                              onChange={(e) => updateItem(idx, 'qty_used', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Not Used (Inventory)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={item.qty_delivered}
                              value={item.qty_not_used}
                              onChange={(e) => updateItem(idx, 'qty_not_used', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Damaged (Archive)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={item.qty_delivered}
                              value={item.qty_damaged}
                              onChange={(e) => updateItem(idx, 'qty_damaged', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Lost (Archive)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={item.qty_delivered}
                              value={item.qty_lost}
                              onChange={(e) => updateItem(idx, 'qty_lost', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* Damage details if damaged */}
                        {item.qty_damaged > 0 && (
                          <div className="space-y-3 border-t pt-3">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Reason for damage required for {item.qty_damaged} item(s)
                              </AlertDescription>
                            </Alert>
                            <div>
                              <Label className="text-xs">Damage Reason *</Label>
                              <Select value={item.damage_reason || ''} onValueChange={(val) => {
                                const updated = [...items]
                                updated[idx].damage_reason = val
                                setItems(updated)
                              }}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stain">Stain</SelectItem>
                                  <SelectItem value="tear">Tear / Hole</SelectItem>
                                  <SelectItem value="burn">Burn Mark</SelectItem>
                                  <SelectItem value="fade">Fade / Discoloration</SelectItem>
                                  <SelectItem value="button">Button / Zipper Issue</SelectItem>
                                  <SelectItem value="smell">Bad Smell</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Additional Damage Notes</Label>
                              <Textarea
                                value={item.damage_notes || ''}
                                onChange={(e) => {
                                  const updated = [...items]
                                  updated[idx].damage_notes = e.target.value
                                  setItems(updated)
                                }}
                                placeholder="Describe the damage in detail..."
                                className="text-sm h-20"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Signature Tab */}
            <TabsContent value="signature" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signature</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recipient signature confirms receipt and acknowledgment
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseUp={stopDrawing}
                      onMouseMove={drawSignature}
                      onMouseLeave={stopDrawing}
                      className="w-full border cursor-crosshair bg-white rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={hasSignature ? 'outline' : 'default'}
                      onClick={clearSignature}
                      disabled={!hasSignature || loading}
                      className="flex-1"
                    >
                      Clear Signature
                    </Button>
                    {hasSignature && (
                      <div className="flex-1 flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Signature captured
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || items.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Complete Handover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
