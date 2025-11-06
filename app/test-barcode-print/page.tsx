'use client'

import { useState } from 'react'
import { RandomBarcodePrinter } from '@/components/inventory/random-barcode-test-printer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BarcodePrintTestPage() {
  const [printDialogOpen, setPrintDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Barcode Printing Test - 2 Column Compact Layout</CardTitle>
            <CardDescription>
              Test 2-column barcode printing with attached rows for layout and alignment verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
              <ol className="text-blue-800 space-y-2 list-decimal list-inside">
                <li>Click "Open Test Printer"</li>
                <li>Set quantity (number of barcodes)</li>
                <li>Click "Print Random Barcodes"</li>
                <li>Print preview will open - verify layout</li>
                <li>Check that 2 columns are attached with no gaps</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => setPrintDialogOpen(true)}
                size="lg"
                className="w-full"
              >
                Open Test Printer
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">What to check:</h3>
              <ul className="text-yellow-800 space-y-1 list-disc list-inside text-sm">
                <li>✓ 2 columns are attached (no gaps)</li>
                <li>✓ Barcodes are centered in each column</li>
                <li>✓ Row separators are visible</li>
                <li>✓ Text doesn't overlap barcode</li>
                <li>✓ Spacing is even</li>
                <li>✓ Page breaks work for large quantities</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Next step:</h3>
              <p className="text-green-800 text-sm">
                Once layout looks correct, we'll create proper PDF generation without printing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <RandomBarcodePrinter
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
      />
    </div>
  )
}
