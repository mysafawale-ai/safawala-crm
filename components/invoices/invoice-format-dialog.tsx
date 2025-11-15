'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { InlinePDFViewer } from './inline-pdf-viewer'
import { useInvoiceGenerator } from '@/hooks/use-invoice-generator'
import { Eye } from 'lucide-react'

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
  const [showViewer, setShowViewer] = useState(false)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const { generatePDFObject } = useInvoiceGenerator()

  const handlePreview = () => {
    const pdf = generatePDFObject(booking, bookingItems)
    const pdfBytes = pdf.output('arraybuffer')
    setPdfData(new Uint8Array(pdfBytes as ArrayBuffer))
    setShowViewer(true)
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
            Preview your detailed invoice. Download and print options available in viewer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
              className="w-full"
              onClick={() => {
                handlePreview()
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
