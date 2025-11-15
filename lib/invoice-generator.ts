import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceData {
  bookingId: string
  bookingNumber: string
  bookingDate: string
  eventDate: string
  bookingType: 'package' | 'product_rental' | 'product_sale' | 'direct_sale'
  paymentType: 'full' | 'advance' | 'partial'
  
  // Customer details
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerPincode?: string
  
  // Event details
  eventType?: string
  eventFor?: string
  venueName?: string
  venueAddress?: string
  groomName?: string
  brideName?: string
  deliveryDate?: string
  returnDate?: string
  
  // Financial details
  subtotal: number
  discountAmount?: number
  discountPercentage?: number
  couponCode?: string
  couponDiscount?: number
  distanceAmount?: number
  taxAmount?: number
  taxPercentage?: number
  totalAmount: number
  paidAmount: number
  securityDeposit?: number
  pendingAmount?: number
  paymentMethod?: string
  
  // Items
  items: InvoiceItem[]
  
  // Company details
  companyName?: string
  companyPhone?: string
  companyEmail?: string
  companyAddress?: string
  companyGST?: string
  companyLogo?: string
}

export interface InvoiceItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  barcode?: string
}

export class InvoiceGenerator {
  static generatePDF(invoiceData: InvoiceData): jsPDF {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 15
    const margin = 15
    const contentWidth = pageWidth - 2 * margin

    // Set default font
    pdf.setFont('helvetica')

    // Header - Company Info
    pdf.setFontSize(16)
    pdf.setTextColor(51, 51, 51)
    pdf.text(invoiceData.companyName || 'SAFAWALA', margin, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    if (invoiceData.companyAddress) {
      pdf.text(invoiceData.companyAddress, margin, yPosition)
      yPosition += 4
    }
    if (invoiceData.companyPhone) {
      pdf.text(`Phone: ${invoiceData.companyPhone}`, margin, yPosition)
      yPosition += 4
    }
    if (invoiceData.companyEmail) {
      pdf.text(`Email: ${invoiceData.companyEmail}`, margin, yPosition)
      yPosition += 4
    }
    if (invoiceData.companyGST) {
      pdf.text(`GST: ${invoiceData.companyGST}`, margin, yPosition)
      yPosition += 4
    }
    yPosition += 4

    // Invoice Title and Number
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('INVOICE', margin, yPosition)
    yPosition += 6

    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Invoice #: ${invoiceData.bookingNumber}`, margin, yPosition)
    yPosition += 4
    pdf.text(`Booking ID: ${invoiceData.bookingId}`, margin, yPosition)
    yPosition += 4
    pdf.text(`Date: ${new Date(invoiceData.bookingDate).toLocaleDateString('en-IN')}`, margin, yPosition)
    yPosition += 4
    pdf.text(`Type: ${invoiceData.bookingType.replace(/_/g, ' ').toUpperCase()}`, margin, yPosition)
    yPosition += 6

    // Customer Details Section
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
    yPosition += 3

    pdf.setFontSize(10)
    pdf.setTextColor(51, 51, 51)
    pdf.text('BILL TO:', margin, yPosition)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.text(invoiceData.customerName, margin, yPosition)
    yPosition += 4
    pdf.text(`Phone: ${invoiceData.customerPhone}`, margin, yPosition)
    yPosition += 4
    if (invoiceData.customerEmail) {
      pdf.text(`Email: ${invoiceData.customerEmail}`, margin, yPosition)
      yPosition += 4
    }
    if (invoiceData.customerAddress) {
      const addressLines = pdf.splitTextToSize(
        `${invoiceData.customerAddress}${invoiceData.customerCity ? ', ' + invoiceData.customerCity : ''}${invoiceData.customerState ? ', ' + invoiceData.customerState : ''}${invoiceData.customerPincode ? ' - ' + invoiceData.customerPincode : ''}`,
        contentWidth - 20
      )
      pdf.text(addressLines, margin, yPosition)
      yPosition += addressLines.length * 4
    }
    yPosition += 4

    // Event Details (for package/rental bookings)
    if (['package', 'product_rental'].includes(invoiceData.bookingType)) {
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
      yPosition += 3

      pdf.setFontSize(10)
      pdf.setTextColor(51, 51, 51)
      pdf.text('EVENT DETAILS:', margin, yPosition)
      yPosition += 5

      pdf.setFontSize(9)
      if (invoiceData.eventType) {
        pdf.text(`Type: ${invoiceData.eventType.replace(/_/g, ' ').toUpperCase()}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.eventFor) {
        pdf.text(`For: ${invoiceData.eventFor}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.eventDate) {
        pdf.text(`Event Date: ${new Date(invoiceData.eventDate).toLocaleDateString('en-IN')}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.deliveryDate) {
        pdf.text(`Delivery Date: ${new Date(invoiceData.deliveryDate).toLocaleDateString('en-IN')}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.returnDate) {
        pdf.text(`Return Date: ${new Date(invoiceData.returnDate).toLocaleDateString('en-IN')}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.venueName) {
        pdf.text(`Venue: ${invoiceData.venueName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.venueAddress) {
        pdf.text(`Venue Address: ${invoiceData.venueAddress}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.groomName) {
        pdf.text(`Groom: ${invoiceData.groomName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.brideName) {
        pdf.text(`Bride: ${invoiceData.brideName}`, margin, yPosition)
        yPosition += 4
      }
      yPosition += 2
    }

    // Items Table
    if (invoiceData.items && invoiceData.items.length > 0) {
      const tableData = invoiceData.items.map(item => [
        item.name,
        item.quantity.toString(),
        `₹${item.unitPrice.toLocaleString('en-IN')}`,
        `₹${item.totalPrice.toLocaleString('en-IN')}`
      ])

      autoTable(pdf, {
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        startY: yPosition,
        margin: margin,
        didDrawPage: (data: any) => {
          // Footer with page numbers
          const pageCount = pdf.internal.pages.length - 1
          const currentPage = data.pageNumber
          pdf.setFontSize(8)
          pdf.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          )
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        }
      })
      yPosition = (pdf as any).lastAutoTable.finalY + 5
    }

    // Financial Summary Section
    yPosition += 5
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
    yPosition += 3

    pdf.setFontSize(9)
    pdf.setTextColor(51, 51, 51)

    const summaryLeft = margin
    const summaryRight = pageWidth - margin - 50

    // Subtotal
    pdf.text('Subtotal:', summaryLeft, yPosition)
    pdf.text(`₹${invoiceData.subtotal.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
    yPosition += 4

    // Distance Charges
    if (invoiceData.distanceAmount && invoiceData.distanceAmount > 0) {
      pdf.text('Distance Charges:', summaryLeft, yPosition)
      pdf.text(`₹${invoiceData.distanceAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      yPosition += 4
    }

    // Discount
    if (invoiceData.discountAmount && invoiceData.discountAmount > 0) {
      pdf.setTextColor(34, 139, 34) // Green
      pdf.text(`Discount${invoiceData.discountPercentage ? ` (${invoiceData.discountPercentage}%)` : ''}:`, summaryLeft, yPosition)
      pdf.text(`-₹${invoiceData.discountAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      pdf.setTextColor(51, 51, 51)
      yPosition += 4
    }

    // Coupon Discount
    if (invoiceData.couponDiscount && invoiceData.couponDiscount > 0) {
      pdf.setTextColor(34, 139, 34) // Green
      pdf.text(`Coupon ${invoiceData.couponCode ? `(${invoiceData.couponCode})` : ''}:`, summaryLeft, yPosition)
      pdf.text(`-₹${invoiceData.couponDiscount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      pdf.setTextColor(51, 51, 51)
      yPosition += 4
    }

    // Tax/GST
    if (invoiceData.taxAmount && invoiceData.taxAmount > 0) {
      pdf.text(`GST${invoiceData.taxPercentage ? ` (${invoiceData.taxPercentage}%)` : ''}:`, summaryLeft, yPosition)
      pdf.text(`₹${invoiceData.taxAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      yPosition += 4
    }

    // Total Amount (Highlighted)
    yPosition += 2
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
    yPosition += 3

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Total Amount:', summaryLeft, yPosition)
    pdf.text(`₹${invoiceData.totalAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
    yPosition += 5

    // Security Deposit (if applicable)
    if (invoiceData.securityDeposit && invoiceData.securityDeposit > 0) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Security Deposit (Refundable):', summaryLeft, yPosition)
      pdf.text(`₹${invoiceData.securityDeposit.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      yPosition += 4
    }

    // Payment Status Section
    yPosition += 3
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
    yPosition += 3

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(51, 51, 51)
    pdf.text('PAYMENT STATUS:', margin, yPosition)
    yPosition += 5

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)

    // Amount Paid
    pdf.setTextColor(34, 139, 34) // Green
    pdf.text('Amount Paid:', summaryLeft, yPosition)
    pdf.text(`₹${invoiceData.paidAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
    yPosition += 4

    // Amount Pending
    if (invoiceData.pendingAmount && invoiceData.pendingAmount > 0) {
      pdf.setTextColor(255, 140, 0) // Orange
      pdf.text('Amount Pending:', summaryLeft, yPosition)
      pdf.text(`₹${invoiceData.pendingAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
      yPosition += 4
    }

    // Payment Method
    if (invoiceData.paymentMethod) {
      pdf.setTextColor(51, 51, 51)
      pdf.text('Payment Method:', summaryLeft, yPosition)
      pdf.text(invoiceData.paymentMethod, summaryRight, yPosition, { align: 'right' })
      yPosition += 4
    }

    // Payment Type
    pdf.text('Payment Type:', summaryLeft, yPosition)
    pdf.text(invoiceData.paymentType.replace(/_/g, ' ').toUpperCase(), summaryRight, yPosition, { align: 'right' })
    yPosition += 6

    // Terms and Conditions
    yPosition += 3
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
    yPosition += 3

    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Terms & Conditions:', margin, yPosition)
    yPosition += 3
    const termsText = 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
    const termsLines = pdf.splitTextToSize(termsText, contentWidth)
    pdf.text(termsLines, margin, yPosition)

    // Set metadata
    pdf.setProperties({
      title: `Invoice ${invoiceData.bookingNumber}`,
      subject: `Invoice for Booking ${invoiceData.bookingNumber}`,
      author: invoiceData.companyName || 'Safawala'
    })

    return pdf
  }

  static downloadPDF(pdf: jsPDF, filename: string) {
    pdf.save(filename)
  }
}
