# Edit Quote Dialog Implementation Guide

## Summary
This file contains the complete implementation for editing quotes with all booking creation fields.

## 1. State Variables (Already Added ✓)
```typescript
const [showEditDialog, setShowEditDialog] = useState(false)
const [editFormData, setEditFormData] = useState({...})
const [isSaving, setIsSaving] = useState(false)
```

## 2. Handler Functions (Add after handleDownloadPDF - line ~427)
See: EDIT_QUOTE_FUNCTIONS.txt

## 3. Add Edit Button to Quote Actions
Find the quote action buttons (around line 2050-2100) and add:

```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => handleEditQuote(quote)}
>
  <Pencil className="h-3 w-3 mr-1" />
  Edit
</Button>
```

## 4. Add Edit Quote Dialog (Add before closing DialogS - around line 1300-1400)

```typescript
{/* Edit Quote Dialog */}
<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Pencil className="h-5 w-5" />
        Edit Quote - {selectedQuote?.quote_number}
      </DialogTitle>
      <DialogDescription>
        Update event and wedding details for this quote
      </DialogDescription>
    </DialogHeader>

    {selectedQuote && (
      <div className="space-y-6">
        {/* Event & Wedding Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event & Wedding Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Event Type, Event Participant, Payment Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Event Type</Label>
                <Select
                  value={editFormData.event_type}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, event_type: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Engagement">Engagement</SelectItem>
                    <SelectItem value="Reception">Reception</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Event Participant</Label>
                <Select
                  value={editFormData.event_participant}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, event_participant: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Groom">Groom Only</SelectItem>
                    <SelectItem value="Bride">Bride Only</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Payment Type</Label>
                <Select
                  value={editFormData.payment_type}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, payment_type: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Payment</SelectItem>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Event Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Event Date *</Label>
                <Input
                  type="date"
                  value={editFormData.event_date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, event_date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Event Time</Label>
                <Input
                  type="time"
                  value={editFormData.event_time}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, event_time: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Row 3: Delivery Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Delivery Date</Label>
                <Input
                  type="date"
                  value={editFormData.delivery_date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, delivery_date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Delivery Time</Label>
                <Input
                  type="time"
                  value={editFormData.delivery_time}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, delivery_time: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Row 4: Return Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Return Date</Label>
                <Input
                  type="date"
                  value={editFormData.return_date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, return_date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Return Time</Label>
                <Input
                  type="time"
                  value={editFormData.return_time}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, return_time: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Venue Address */}
            <div>
              <Label className="text-xs">Venue Address</Label>
              <Textarea
                rows={2}
                value={editFormData.venue_address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, venue_address: e.target.value })
                }
                className="mt-1"
                placeholder="Enter venue address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Groom Information - Show only if Groom or Both */}
        {(editFormData.event_participant === "Groom" || editFormData.event_participant === "Both") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Groom Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Groom Name</Label>
                  <Input
                    value={editFormData.groom_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, groom_name: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Enter groom's full name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Additional WhatsApp Number</Label>
                  <Input
                    value={editFormData.groom_whatsapp}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, groom_whatsapp: e.target.value })
                    }
                    className="mt-1"
                    placeholder="WhatsApp number"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Home Address</Label>
                <Textarea
                  rows={2}
                  value={editFormData.groom_address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, groom_address: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Full address with locality and pin code"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bride Information - Show only if Bride or Both */}
        {(editFormData.event_participant === "Bride" || editFormData.event_participant === "Both") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bride Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Bride Name</Label>
                  <Input
                    value={editFormData.bride_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, bride_name: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Enter bride's full name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Additional WhatsApp Number</Label>
                  <Input
                    value={editFormData.bride_whatsapp}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, bride_whatsapp: e.target.value })
                    }
                    className="mt-1"
                    placeholder="WhatsApp number"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Home Address</Label>
                <Textarea
                  rows={2}
                  value={editFormData.bride_address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, bride_address: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Full address with locality and pin code"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={editFormData.notes}
              onChange={(e) =>
                setEditFormData({ ...editFormData, notes: e.target.value })
              }
              placeholder="Any special instructions or requirements"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowEditDialog(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuote}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

## 5. Import Loader2 icon
Add to lucide-react imports:
```typescript
import { ..., Loader2 } from "lucide-react"
```

## Files to Update:
- `/Applications/safawala-crm/app/quotes/page.tsx`

## Implementation Notes:
- Form matches booking creation structure exactly
- Conditional rendering for Groom/Bride fields
- Date/time inputs separated for better UX
- Updates either product_orders or package_bookings table based on booking_type
- Refreshes quotes list after successful update
