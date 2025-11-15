import jsPDF from 'jspdf'

export interface PDFColors {
  primary: [number, number, number]
  secondary: [number, number, number]
  text: [number, number, number]
  lightText: [number, number, number]
  border: [number, number, number]
}

export interface PDFConfig {
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
  colors: PDFColors
}

/**
 * PDF Header Component - Company info and logo
 */
export class PDFHeader {
  static async render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      companyName: string
      companyAddress?: string
      companyPhone?: string
      companyEmail?: string
      companyGST?: string
      companyWebsite?: string
      logoBase64?: string | null
    }
  ): Promise<number> {
    const { pageWidth, margin, colors } = config
    let y = yPosition

    // Add logo on top right if available
    if (data.logoBase64) {
      try {
        const logoWidth = 50
        const logoHeight = 25
        const logoX = pageWidth - margin - logoWidth
        const logoY = y

        let format: 'PNG' | 'JPEG' | 'JPG' = 'PNG'
        if (data.logoBase64.includes('image/jpeg') || data.logoBase64.includes('image/jpg')) {
          format = 'JPEG'
        }

        pdf.addImage(data.logoBase64, format, logoX, logoY, logoWidth, logoHeight)
        console.log('✅ Logo added to PDF')
      } catch (e) {
        console.error('❌ Failed to add logo:', e)
      }
    }

    // Company name (left side, bold)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    pdf.text(data.companyName, margin, y + 8)
    y += 14

    // Company details (smaller, gray)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])

    if (data.companyAddress) {
      pdf.text(data.companyAddress, margin, y)
      y += 4
    }
    if (data.companyPhone) {
      pdf.text(`Phone: ${data.companyPhone}`, margin, y)
      y += 4
    }
    if (data.companyEmail) {
      pdf.text(`Email: ${data.companyEmail}`, margin, y)
      y += 4
    }
    if (data.companyGST) {
      pdf.text(`GST: ${data.companyGST}`, margin, y)
      y += 4
    }
    if (data.companyWebsite) {
      pdf.text(`Website: ${data.companyWebsite}`, margin, y)
      y += 4
    }

    y += 6
    return y
  }
}

/**
 * PDF Invoice Title Component
 */
export class PDFInvoiceTitle {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      invoiceNumber: string
      bookingId: string
      date: string
      type: string
      status?: string
    }
  ): number {
    const { margin, contentWidth, colors } = config
    let y = yPosition

    // Separator line
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, margin + contentWidth, y)
    y += 6

    // INVOICE title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    pdf.text('INVOICE', margin, y)
    y += 8

    // Invoice details
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])

    pdf.text(`Invoice #: ${data.invoiceNumber}`, margin, y)
    y += 4
    pdf.text(`Booking ID: ${data.bookingId}`, margin, y)
    y += 4
    pdf.text(`Date: ${data.date}`, margin, y)
    y += 4
    pdf.text(`Type: ${data.type}`, margin, y)
    y += 4

    if (data.status) {
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      pdf.text(`Status: ${data.status}`, margin, y)
      y += 4
    }

    y += 6
    return y
  }
}

/**
 * PDF Customer Details Component
 */
export class PDFCustomerDetails {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      customerName: string
      customerCode?: string
      customerPhone: string
      customerWhatsApp?: string
      customerEmail?: string
      customerAddress?: string
      customerCity?: string
      customerState?: string
      customerPincode?: string
    }
  ): number {
    const { margin, contentWidth, colors } = config
    let y = yPosition

    // Section separator
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    // Section title
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    pdf.text('BILL TO:', margin, y)
    y += 5

    // Customer details
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    
    pdf.text(data.customerName, margin, y)
    y += 4

    if (data.customerCode) {
      pdf.text(`Customer Code: ${data.customerCode}`, margin, y)
      y += 4
    }

    pdf.text(`Phone: ${data.customerPhone}`, margin, y)
    y += 4

    if (data.customerWhatsApp && data.customerWhatsApp !== data.customerPhone) {
      pdf.text(`WhatsApp: ${data.customerWhatsApp}`, margin, y)
      y += 4
    }

    if (data.customerEmail) {
      pdf.text(`Email: ${data.customerEmail}`, margin, y)
      y += 4
    }

    if (data.customerAddress) {
      const addressLines = pdf.splitTextToSize(
        `${data.customerAddress}${data.customerCity ? ', ' + data.customerCity : ''}${data.customerState ? ', ' + data.customerState : ''}${data.customerPincode ? ' - ' + data.customerPincode : ''}`,
        contentWidth - 20
      )
      pdf.text(addressLines, margin, y)
      y += addressLines.length * 4
    }

    y += 4
    return y
  }
}

/**
 * PDF Package Details Component
 */
export class PDFPackageDetails {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      packageName?: string
      variantName?: string
      categoryName?: string
      extraSafas?: number
      packageDescription?: string
    }
  ): number {
    const { margin, contentWidth, colors } = config
    let y = yPosition

    if (!data.packageName && !data.variantName) {
      return y
    }

    // Section separator
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    // Section title
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    pdf.text('PACKAGE DETAILS:', margin, y)
    y += 5

    // Package info
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    if (data.packageName) {
      pdf.text(`Package: ${data.packageName}`, margin, y)
      y += 4
    }
    if (data.variantName) {
      pdf.text(`Variant: ${data.variantName}`, margin, y)
      y += 4
    }
    if (data.categoryName) {
      pdf.text(`Category: ${data.categoryName}`, margin, y)
      y += 4
    }
    if (data.extraSafas && data.extraSafas > 0) {
      pdf.text(`Extra Safas: ${data.extraSafas}`, margin, y)
      y += 4
    }
    if (data.packageDescription) {
      pdf.setFontSize(8)
      pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      const descLines = pdf.splitTextToSize(data.packageDescription, contentWidth - 20)
      pdf.text(descLines, margin, y)
      y += descLines.length * 3.5
    }

    y += 4
    return y
  }
}

/**
 * PDF Event Details Component
 */
export class PDFEventDetails {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      eventType?: string
      eventParticipant?: string
      eventFor?: string
      eventDate?: string
      eventTime?: string
      deliveryDate?: string
      deliveryTime?: string
      returnDate?: string
      returnTime?: string
      venueName?: string
      venueAddress?: string
      groomName?: string
      groomPhone?: string
      groomAddress?: string
      brideName?: string
      bridePhone?: string
      brideAddress?: string
    }
  ): number {
    const { margin, contentWidth, colors } = config
    let y = yPosition

    // Section separator
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    // Section title
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    pdf.text('EVENT DETAILS:', margin, y)
    y += 5

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    if (data.eventType) {
      pdf.text(`Type: ${data.eventType.replace(/_/g, ' ').toUpperCase()}`, margin, y)
      y += 4
    }
    if (data.eventParticipant) {
      pdf.text(`Participant: ${data.eventParticipant}`, margin, y)
      y += 4
    }
    if (data.eventFor) {
      pdf.text(`For: ${data.eventFor}`, margin, y)
      y += 4
    }
    if (data.eventDate) {
      let eventDateStr = `Event Date: ${new Date(data.eventDate).toLocaleDateString('en-IN')}`
      if (data.eventTime) {
        eventDateStr += ` at ${data.eventTime}`
      }
      pdf.text(eventDateStr, margin, y)
      y += 4
    }
    if (data.deliveryDate) {
      let deliveryStr = `Delivery: ${new Date(data.deliveryDate).toLocaleDateString('en-IN')}`
      if (data.deliveryTime) {
        deliveryStr += ` at ${data.deliveryTime}`
      }
      pdf.text(deliveryStr, margin, y)
      y += 4
    }
    if (data.returnDate) {
      let returnStr = `Return: ${new Date(data.returnDate).toLocaleDateString('en-IN')}`
      if (data.returnTime) {
        returnStr += ` at ${data.returnTime}`
      }
      pdf.text(returnStr, margin, y)
      y += 4
    }
    if (data.venueName) {
      pdf.text(`Venue: ${data.venueName}`, margin, y)
      y += 4
    }
    if (data.venueAddress) {
      const venueLines = pdf.splitTextToSize(`Address: ${data.venueAddress}`, contentWidth - 20)
      pdf.text(venueLines, margin, y)
      y += venueLines.length * 4
    }

    // Groom details
    if (data.groomName) {
      y += 2
      pdf.setFontSize(8)
      pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      pdf.text('Groom Details:', margin, y)
      y += 3
      pdf.setFontSize(9)
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      pdf.text(`Name: ${data.groomName}`, margin + 5, y)
      y += 4
      if (data.groomPhone) {
        pdf.text(`Phone: ${data.groomPhone}`, margin + 5, y)
        y += 4
      }
      if (data.groomAddress) {
        const groomLines = pdf.splitTextToSize(`Address: ${data.groomAddress}`, contentWidth - 25)
        pdf.text(groomLines, margin + 5, y)
        y += groomLines.length * 4
      }
    }

    // Bride details
    if (data.brideName) {
      y += 2
      pdf.setFontSize(8)
      pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      pdf.text('Bride Details:', margin, y)
      y += 3
      pdf.setFontSize(9)
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      pdf.text(`Name: ${data.brideName}`, margin + 5, y)
      y += 4
      if (data.bridePhone) {
        pdf.text(`Phone: ${data.bridePhone}`, margin + 5, y)
        y += 4
      }
      if (data.brideAddress) {
        const brideLines = pdf.splitTextToSize(`Address: ${data.brideAddress}`, contentWidth - 25)
        pdf.text(brideLines, margin + 5, y)
        y += brideLines.length * 4
      }
    }

    y += 4
    return y
  }
}

/**
 * PDF Financial Summary Component
 */
export class PDFFinancialSummary {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      subtotal: number
      distanceAmount?: number
      customAmount?: number
      discountAmount?: number
      discountPercentage?: number
      couponDiscount?: number
      couponCode?: string
      taxAmount?: number
      taxPercentage?: number
      totalAmount: number
      securityDeposit?: number
    }
  ): number {
    const { margin, contentWidth, pageWidth, colors } = config
    let y = yPosition + 5

    // Separator
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    const summaryLeft = margin
    const summaryRight = pageWidth - margin - 50

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    // Subtotal
    pdf.text('Subtotal:', summaryLeft, y)
    pdf.text(`₹${data.subtotal.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
    y += 4

    // Additional charges
    if (data.distanceAmount && data.distanceAmount > 0) {
      pdf.text('Distance Charges:', summaryLeft, y)
      pdf.text(`₹${data.distanceAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      y += 4
    }

    if (data.customAmount && data.customAmount > 0) {
      pdf.text('Custom Charges:', summaryLeft, y)
      pdf.text(`₹${data.customAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      y += 4
    }

    // Discounts
    if (data.discountAmount && data.discountAmount > 0) {
      pdf.setTextColor(34, 139, 34) // Green
      pdf.text(`Discount${data.discountPercentage ? ` (${data.discountPercentage}%)` : ''}:`, summaryLeft, y)
      pdf.text(`-₹${data.discountAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      y += 4
    }

    if (data.couponDiscount && data.couponDiscount > 0) {
      pdf.setTextColor(34, 139, 34) // Green
      pdf.text(`Coupon${data.couponCode ? ` (${data.couponCode})` : ''}:`, summaryLeft, y)
      pdf.text(`-₹${data.couponDiscount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      y += 4
    }

    // Tax
    if (data.taxAmount && data.taxAmount > 0) {
      pdf.text(`GST${data.taxPercentage ? ` (${data.taxPercentage}%)` : ''}:`, summaryLeft, y)
      pdf.text(`₹${data.taxAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      y += 4
    }

    // Total
    y += 2
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Total Amount:', summaryLeft, y)
    pdf.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
    y += 5

    // Security deposit
    if (data.securityDeposit && data.securityDeposit > 0) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      pdf.text('Security Deposit (Refundable):', summaryLeft, y)
      pdf.text(`₹${data.securityDeposit.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      y += 4
    }

    y += 3
    return y
  }
}

/**
 * PDF Payment Status Component
 */
export class PDFPaymentStatus {
  static render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      paidAmount: number
      pendingAmount?: number
      paymentMethod?: string
      paymentType: string
    }
  ): number {
    const { margin, contentWidth, pageWidth, colors } = config
    let y = yPosition

    // Separator
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    const summaryLeft = margin
    const summaryRight = pageWidth - margin - 50

    // Section title
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    pdf.text('PAYMENT STATUS:', margin, y)
    y += 5

    pdf.setFont('helvetica', 'normal')

    // Amount paid
    pdf.setTextColor(34, 139, 34) // Green
    pdf.text('Amount Paid:', summaryLeft, y)
    pdf.text(`₹${data.paidAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
    y += 4

    // Amount pending
    if (data.pendingAmount && data.pendingAmount > 0) {
      pdf.setTextColor(255, 140, 0) // Orange
      pdf.text('Amount Pending:', summaryLeft, y)
      pdf.text(`₹${data.pendingAmount.toLocaleString('en-IN')}`, summaryRight, y, { align: 'right' })
      y += 4
    }

    // Payment method
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    if (data.paymentMethod) {
      pdf.text('Payment Method:', summaryLeft, y)
      pdf.text(data.paymentMethod, summaryRight, y, { align: 'right' })
      y += 4
    }

    // Payment type
    pdf.text('Payment Type:', summaryLeft, y)
    pdf.text(data.paymentType.replace(/_/g, ' ').toUpperCase(), summaryRight, y, { align: 'right' })
    y += 6

    return y
  }
}

/**
 * PDF Footer Component
 */
export class PDFFooter {
  static async render(
    pdf: jsPDF,
    config: PDFConfig,
    yPosition: number,
    data: {
      termsAndConditions?: string
      signatureBase64?: string | null
    }
  ): Promise<number> {
    const { margin, contentWidth, pageWidth, colors } = config
    let y = yPosition + 3

    // Terms & Conditions
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.rect(margin, y - 2, contentWidth, 0.5)
    y += 3

    pdf.setFontSize(8)
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
    pdf.text('Terms & Conditions:', margin, y)
    y += 3

    const termsText = data.termsAndConditions || 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
    const termsLines = pdf.splitTextToSize(termsText, contentWidth)
    pdf.text(termsLines, margin, y)
    y += termsLines.length * 3 + 3

    // Signature
    if (data.signatureBase64) {
      try {
        pdf.setFontSize(8)
        pdf.text('Authorized By:', pageWidth - margin - 50, y)
        pdf.addImage(data.signatureBase64, 'PNG', pageWidth - margin - 50, y + 2, 40, 12)
        y += 15
      } catch (e) {
        console.error('❌ Error adding signature:', e)
      }
    }

    return y
  }
}
