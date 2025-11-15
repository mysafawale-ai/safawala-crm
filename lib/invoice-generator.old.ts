import { generateInvoiceHTML } from './invoice-html-template'

export interface InvoiceData {
  bookingId: string
  bookingNumber: string
  bookingDate: string
  eventDate: string
  bookingType: 'package' | 'product_rental' | 'product_sale' | 'direct_sale'
  paymentType: 'full' | 'advance' | 'partial'
  bookingStatus?: string
  isQuote?: boolean
  
  // Customer details
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerWhatsApp?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerPincode?: string
  customerCode?: string
  
  // Event details
  eventType?: string
  eventParticipant?: string
  eventFor?: string
  venueName?: string
  venueAddress?: string
  groomName?: string
  groomPhone?: string
  groomAddress?: string
  brideName?: string
  bridePhone?: string
  brideAddress?: string
  deliveryDate?: string
  deliveryTime?: string
  returnDate?: string
  returnTime?: string
  eventTime?: string
  
  // Package details
  packageName?: string
  packageDescription?: string
  variantName?: string
  categoryName?: string
  extraSafas?: number
  
  // Financial details
  subtotal: number
  discountAmount?: number
  discountPercentage?: number
  couponCode?: string
  couponDiscount?: number
  distanceAmount?: number
  customAmount?: number
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
  companyCity?: string
  companyState?: string
  companyGST?: string
  companyLogo?: string
  companyWebsite?: string
  companySignature?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  termsAndConditions?: string
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
  /**
   * Generate HTML invoice and open in new window for printing
   */
  static async generatePDF(invoiceData: InvoiceData): Promise<void> {
    const html = generateInvoiceHTML(invoiceData)
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    }
  }

  /**
   * Generate HTML and return as blob for download
   */
  static async generateHTMLBlob(invoiceData: InvoiceData): Promise<Blob> {
    const html = generateInvoiceHTML(invoiceData)
    return new Blob([html], { type: 'text/html' })
  }

  /**
   * Download invoice as HTML file
   */
  static downloadHTML(invoiceData: InvoiceData, filename: string) {
    const html = generateInvoiceHTML(invoiceData)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.replace('.pdf', '.html')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Legacy method - now uses HTML approach
   */
  static async generateOldPDF(invoiceData: InvoiceData): Promise<never> {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 15
    const margin = 15
    const contentWidth = pageWidth - 2 * margin

    console.log('🚀 Starting PDF generation for:', invoiceData.bookingNumber)

    // Load logo and signature
    let logoBase64: string | null = null
    let signatureBase64: string | null = null

    if (invoiceData.companyLogo) {
      try {
        logoBase64 = await getBase64FromUrl(invoiceData.companyLogo, 3)
        console.log('✅ Logo loaded successfully')
      } catch (e) {
        console.error('❌ Failed to load logo:', e)
      }
    }

    if (invoiceData.companySignature) {
      try {
        signatureBase64 = await getBase64FromUrl(invoiceData.companySignature, 2)
        console.log('✅ Signature loaded successfully')
      } catch (e) {
        console.error('❌ Failed to load signature:', e)
      }
    }

    // Parse colors
    const parseHexColor = (hex: string): [number, number, number] => {
      const cleanHex = hex.replace('#', '')
      return [
        parseInt(cleanHex.substring(0, 2), 16),
        parseInt(cleanHex.substring(2, 4), 16),
        parseInt(cleanHex.substring(4, 6), 16)
      ]
    }

    const colors: PDFColors = {
      primary: invoiceData.primaryColor ? parseHexColor(invoiceData.primaryColor) : [59, 130, 246],
      secondary: invoiceData.secondaryColor ? parseHexColor(invoiceData.secondaryColor) : [239, 68, 68],
      text: [51, 51, 51],
      lightText: [100, 100, 100],
      border: [200, 200, 200],
      accent: invoiceData.accentColor ? parseHexColor(invoiceData.accentColor) : [16, 185, 129],
      background: [248, 250, 252]
    }

    const config: PDFConfig = {
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      colors
    }

    // Set default font
    pdf.setFont('helvetica')

    // === RENDER HEADER COMPONENT ===
    yPosition = await PDFHeader.render(pdf, config, yPosition, {
      companyName: invoiceData.companyName || 'SAFAWALA',
      companyAddress: invoiceData.companyAddress,
      companyPhone: invoiceData.companyPhone,
      companyEmail: invoiceData.companyEmail,
      companyGST: invoiceData.companyGST,
      companyWebsite: invoiceData.companyWebsite,
      logoBase64
    })

    // === RENDER INVOICE TITLE COMPONENT ===
    yPosition = PDFInvoiceTitle.render(pdf, config, yPosition, {
      invoiceNumber: invoiceData.bookingNumber,
      bookingId: invoiceData.bookingId,
      date: new Date(invoiceData.bookingDate).toLocaleDateString('en-IN'),
      type: invoiceData.bookingType.replace(/_/g, ' ').toUpperCase(),
      status: invoiceData.bookingStatus
    })

    // === RENDER CUSTOMER DETAILS COMPONENT ===
    yPosition = PDFCustomerDetails.render(pdf, config, yPosition, {
      customerName: invoiceData.customerName,
      customerCode: invoiceData.customerCode,
      customerPhone: invoiceData.customerPhone,
      customerWhatsApp: invoiceData.customerWhatsApp,
      customerEmail: invoiceData.customerEmail,
      customerAddress: invoiceData.customerAddress,
      customerCity: invoiceData.customerCity,
      customerState: invoiceData.customerState,
      customerPincode: invoiceData.customerPincode
    })

    // === RENDER PACKAGE DETAILS COMPONENT (if package booking) ===
    if (invoiceData.bookingType === 'package') {
      yPosition = PDFPackageDetails.render(pdf, config, yPosition, {
        packageName: invoiceData.packageName,
        variantName: invoiceData.variantName,
        categoryName: invoiceData.categoryName,
        extraSafas: invoiceData.extraSafas,
        packageDescription: invoiceData.packageDescription
      })
    }

    // === RENDER EVENT DETAILS COMPONENT (if applicable) ===
    if (['package', 'product_rental'].includes(invoiceData.bookingType)) {
      yPosition = PDFEventDetails.render(pdf, config, yPosition, {
        eventType: invoiceData.eventType,
        eventParticipant: invoiceData.eventParticipant,
        eventFor: invoiceData.eventFor,
        eventTime: invoiceData.eventTime,
        deliveryDate: invoiceData.deliveryDate,
        deliveryTime: invoiceData.deliveryTime,
        returnDate: invoiceData.returnDate,
        returnTime: invoiceData.returnTime,
        venueName: invoiceData.venueName,
        venueAddress: invoiceData.venueAddress,
        groomName: invoiceData.groomName,
        brideName: invoiceData.brideName
      })
    }

    // Package and event details already rendered by components above

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

    // === RENDER FINANCIAL SUMMARY COMPONENT ===
    yPosition = PDFFinancialSummary.render(pdf, config, yPosition, {
      subtotal: invoiceData.subtotal,
      distanceAmount: invoiceData.distanceAmount,
      customAmount: invoiceData.customAmount,
      discountAmount: invoiceData.discountAmount,
      discountPercentage: invoiceData.discountPercentage,
      couponDiscount: invoiceData.couponDiscount,
      couponCode: invoiceData.couponCode,
      taxAmount: invoiceData.taxAmount,
      taxPercentage: invoiceData.taxPercentage,
      totalAmount: invoiceData.totalAmount,
      securityDeposit: invoiceData.securityDeposit
    })

    // === RENDER PAYMENT STATUS COMPONENT ===
    yPosition = PDFPaymentStatus.render(pdf, config, yPosition, {
      paidAmount: invoiceData.paidAmount,
      pendingAmount: invoiceData.pendingAmount,
      paymentMethod: invoiceData.paymentMethod,
      paymentType: invoiceData.paymentType
    })

    // === RENDER FOOTER COMPONENT ===
    yPosition = await PDFFooter.render(pdf, config, yPosition, {
      termsAndConditions: invoiceData.termsAndConditions,
      signatureBase64
    })

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
