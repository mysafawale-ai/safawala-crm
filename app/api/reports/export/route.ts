import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function POST(request: NextRequest) {
  try {
    const { format, dateRange, franchiseFilter, reportData } = await request.json()

    if (format === 'pdf') {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Safawala CRM - Analytics Report', 20, 25)
      
      // Date range
      doc.setFontSize(12)
      doc.text(`Report Period: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`, 20, 40)
      
      // Revenue Summary
      doc.setFontSize(14)
      doc.text('Revenue Summary', 20, 60)
      
      const revenueTableData = reportData.revenue.map((item: any) => [
        item.name,
        `₹${item.value.toLocaleString()}`
      ])
      
      ;(doc as any).autoTable({
        startY: 70,
        head: [['Period', 'Revenue']],
        body: revenueTableData,
        theme: 'grid'
      })
      
      // Expenses Summary
      let currentY = (doc as any).lastAutoTable.finalY + 20
      doc.text('Expenses Summary', 20, currentY)
      
      const expensesTableData = reportData.expenses.map((item: any) => [
        item.name,
        `₹${item.value.toLocaleString()}`
      ])
      
      ;(doc as any).autoTable({
        startY: currentY + 10,
        head: [['Category', 'Amount']],
        body: expensesTableData,
        theme: 'grid'
      })

      const pdfBlob = doc.output('blob')
      
      return new NextResponse(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="report.pdf"'
        }
      })
    }

    if (format === 'excel') {
      // For Excel export, you would typically use a library like xlsx
      // For demo purposes, we'll create a CSV format
      let csvContent = 'Report Type,Name,Value\n'
      
      reportData.revenue.forEach((item: any) => {
        csvContent += `Revenue,${item.name},${item.value}\n`
      })
      
      reportData.expenses.forEach((item: any) => {
        csvContent += `Expenses,${item.name},${item.value}\n`
      })
      
      reportData.inventory.forEach((item: any) => {
        csvContent += `Inventory,${item.name},${item.value}\n`
      })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="report.csv"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
