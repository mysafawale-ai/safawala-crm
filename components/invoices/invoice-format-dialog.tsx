'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InlinePDFViewer } from './inline-pdf-viewer'
import { useInvoiceGenerator } from '@/hooks/use-invoice-generator'
import { Download, Eye } from 'lucide-react'

interface InvoiceFormatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  bookingItems: any[]
}

export function InvoiceFormatDialog({
  open,
  onOpenChange,
  booking,
  bookingItems
}: InvoiceFormatDialogProps) {
  const [format, setFormat] = useState<'detailed' | 'compact'>('detailed')
  const [showViewer, setShowViewer] = useState(false)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const { generatePDFObject } = useInvoiceGenerator()

  const handlePreview = () => {
    const pdf = generatePDFObject(booking, bookingItems)
    const pdfBytes = pdf.output('arraybuffer')
    setPdfData(new Uint8Array(pdfBytes as ArrayBuffer))
    setShowViewer(true)
  }

  const handleDownload = () => {
    const pdf = generatePDFObject(booking, bookingItems)
    pdf.save(`Invoice_${booking.booking_number}.pdf`)
  }

  if (showViewer && pdfData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <InlinePDFViewer
            pdfBytes={pdfData}
            filename={`Invoice_${booking.booking_number}.pdf`}
            onClose={() => setShowViewer(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Select format and view or download your invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Invoice Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="flex-1 cursor-pointer">
                  <div className="font-medium">Detailed Invoice</div>
                  <div className="text-sm text-gray-600">Complete breakdown with all items, taxes, and discounts</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="compact" id="compact" />
                <Label htmlFor="compact" className="flex-1 cursor-pointer">
                  <div className="font-medium">Compact Invoice</div>
                  <div className="text-sm text-gray-600">Simplified version with essential information only</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Booking:</span> {booking.booking_number}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Amount:</span> ₹{booking.total_amount?.toLocaleString('en-IN') || '0'}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Type:</span> {(booking.booking_type || booking.source || 'Package').replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handlePreview()
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
