'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { InlinePDFViewer } from './inline-pdf-viewer'
import { useInvoiceGenerator } from '@/hooks/use-invoice-generator'

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
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const { generatePDFObject } = useInvoiceGenerator()

  // Auto-generate PDF when dialog opens
  useEffect(() => {
    const generatePDF = async () => {
      if (open && !pdfData) {
        try {
          const pdf = await generatePDFObject(booking, bookingItems)
          const pdfBytes = pdf.output('arraybuffer')
          setPdfData(new Uint8Array(pdfBytes as ArrayBuffer))
        } catch (error) {
          console.error('Error generating PDF:', error)
        }
      }
    }

    generatePDF()
    
    // Reset when dialog closes
    if (!open) {
      setPdfData(null)
    }
  }, [open, booking, bookingItems, pdfData, generatePDFObject])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {pdfData ? (
          <InlinePDFViewer
            pdfBytes={pdfData}
            filename={`Invoice_${booking.booking_number}.pdf`}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating invoice...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
