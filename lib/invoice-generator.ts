import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Helper function to convert image URL to base64 with retry logic
async function getBase64FromUrl(url: string, retries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${retries}: Loading image from URL:`, url)
      
      // Use proxy API to avoid CORS issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      console.log(`📦 Blob received: ${blob.size} bytes, type: ${blob.type}`)
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          console.log(`✅ Image converted to base64 successfully (length: ${result.length})`)
          resolve(result)
        }
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error)
          reject(error)
        }
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error)
      if (attempt === retries) {
        throw error
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
    }
  }
  throw new Error('Failed to load image after all retries')
}

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
  static async generatePDF(invoiceData: InvoiceData): Promise<jsPDF> {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 15
    const margin = 15
    const contentWidth = pageWidth - 2 * margin

    // Convert logo URL to base64 if available
    let logoBase64: string | null = null
    if (invoiceData.companyLogo) {
      try {
        console.log('🚀 Starting logo load process...')
        logoBase64 = await getBase64FromUrl(invoiceData.companyLogo, 3)
        console.log('✅ Logo loaded and ready for PDF')
      } catch (e) {
        console.error('❌ Failed to load logo after all retries:', e)
        // Continue without logo
      }
    } else {
      console.log('ℹ️ No logo URL provided in company settings')
    }

    // Parse primary color for branding
    let primaryRGB: [number, number, number] = [34, 197, 94] // Default green
    let secondaryRGB: [number, number, number] = [239, 68, 68] // Default red
    
    if (invoiceData.primaryColor && invoiceData.primaryColor.startsWith('#')) {
      const hex = invoiceData.primaryColor.substring(1)
      primaryRGB = [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ]
    }
    
    if (invoiceData.secondaryColor && invoiceData.secondaryColor.startsWith('#')) {
      const hex = invoiceData.secondaryColor.substring(1)
      secondaryRGB = [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ]
    }

    // Set default font
    pdf.setFont('helvetica')

    // Add logo on top right if available
    if (logoBase64) {
      try {
        // Position logo on top right corner with better visibility
        const logoWidth = 50
        const logoHeight = 25
        const logoX = pageWidth - margin - logoWidth
        const logoY = yPosition
        
        // Detect image format from base64 string
        let format: 'PNG' | 'JPEG' | 'JPG' = 'PNG'
        if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
          format = 'JPEG'
        } else if (logoBase64.includes('data:image/png')) {
          format = 'PNG'
        }
        
        console.log(`✅ Adding logo: format=${format}, position=(${logoX}, ${logoY}), size=(${logoWidth}x${logoHeight})`)
        pdf.addImage(logoBase64, format, logoX, logoY, logoWidth, logoHeight)
        console.log('✅ Logo added successfully to PDF')
      } catch (e) {
        console.error('❌ Error adding logo to PDF:', e)
      }
    } else {
      console.log('⚠️ No logo base64 data available')
    }

    // Header - Company Info with branding (left side)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2])
    pdf.text(invoiceData.companyName || 'SAFAWALA', margin, yPosition + 5)
    yPosition += 10

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
    
    // Customer Code
    if (invoiceData.customerCode) {
      pdf.text(`Customer Code: ${invoiceData.customerCode}`, margin, yPosition)
      yPosition += 4
    }
    
    // Phone and WhatsApp
    pdf.text(`Phone: ${invoiceData.customerPhone}`, margin, yPosition)
    yPosition += 4
    if (invoiceData.customerWhatsApp && invoiceData.customerWhatsApp !== invoiceData.customerPhone) {
      pdf.text(`WhatsApp: ${invoiceData.customerWhatsApp}`, margin, yPosition)
      yPosition += 4
    }
    
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

    // Package Details (for package bookings)
    if (invoiceData.bookingType === 'package' && (invoiceData.packageName || invoiceData.variantName)) {
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
      yPosition += 3

      pdf.setFontSize(10)
      pdf.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2])
      pdf.text('PACKAGE DETAILS:', margin, yPosition)
      yPosition += 5

      pdf.setFontSize(9)
      pdf.setTextColor(51, 51, 51)
      if (invoiceData.packageName) {
        pdf.text(`Package: ${invoiceData.packageName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.variantName) {
        pdf.text(`Variant: ${invoiceData.variantName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.categoryName) {
        pdf.text(`Category: ${invoiceData.categoryName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.extraSafas && invoiceData.extraSafas > 0) {
        pdf.text(`Extra Safas: ${invoiceData.extraSafas}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.packageDescription) {
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        const descLines = pdf.splitTextToSize(invoiceData.packageDescription, contentWidth - 20)
        pdf.text(descLines, margin, yPosition)
        yPosition += descLines.length * 3.5
        pdf.setFontSize(9)
        pdf.setTextColor(51, 51, 51)
      }
      yPosition += 4
    }

    // Event Details (for package/rental bookings)
    if (['package', 'product_rental'].includes(invoiceData.bookingType)) {
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(margin, yPosition - 2, contentWidth, 0.5)
      yPosition += 3

      pdf.setFontSize(10)
      pdf.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2])
      pdf.text('EVENT DETAILS:', margin, yPosition)
      yPosition += 5

      pdf.setFontSize(9)
      pdf.setTextColor(51, 51, 51)
      if (invoiceData.eventType) {
        pdf.text(`Type: ${invoiceData.eventType.replace(/_/g, ' ').toUpperCase()}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.eventParticipant) {
        pdf.text(`Participant: ${invoiceData.eventParticipant}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.eventFor) {
        pdf.text(`For: ${invoiceData.eventFor}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.eventDate) {
        let eventDateStr = `Event Date: ${new Date(invoiceData.eventDate).toLocaleDateString('en-IN')}`
        if (invoiceData.eventTime) {
          eventDateStr += ` at ${invoiceData.eventTime}`
        }
        pdf.text(eventDateStr, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.deliveryDate) {
        let deliveryStr = `Delivery: ${new Date(invoiceData.deliveryDate).toLocaleDateString('en-IN')}`
        if (invoiceData.deliveryTime) {
          deliveryStr += ` at ${invoiceData.deliveryTime}`
        }
        pdf.text(deliveryStr, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.returnDate) {
        let returnStr = `Return: ${new Date(invoiceData.returnDate).toLocaleDateString('en-IN')}`
        if (invoiceData.returnTime) {
          returnStr += ` at ${invoiceData.returnTime}`
        }
        pdf.text(returnStr, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.venueName) {
        pdf.text(`Venue: ${invoiceData.venueName}`, margin, yPosition)
        yPosition += 4
      }
      if (invoiceData.venueAddress) {
        const venueLines = pdf.splitTextToSize(`Venue Address: ${invoiceData.venueAddress}`, contentWidth - 20)
        pdf.text(venueLines, margin, yPosition)
        yPosition += venueLines.length * 4
      }
      
      // Groom Details
      if (invoiceData.groomName) {
        yPosition += 2
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Groom Details:', margin, yPosition)
        yPosition += 3
        pdf.setFontSize(9)
        pdf.setTextColor(51, 51, 51)
        pdf.text(`Name: ${invoiceData.groomName}`, margin + 5, yPosition)
        yPosition += 4
        if (invoiceData.groomPhone) {
          pdf.text(`Phone: ${invoiceData.groomPhone}`, margin + 5, yPosition)
          yPosition += 4
        }
        if (invoiceData.groomAddress) {
          const groomAddrLines = pdf.splitTextToSize(`Address: ${invoiceData.groomAddress}`, contentWidth - 25)
          pdf.text(groomAddrLines, margin + 5, yPosition)
          yPosition += groomAddrLines.length * 4
        }
      }
      
      // Bride Details
      if (invoiceData.brideName) {
        yPosition += 2
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Bride Details:', margin, yPosition)
        yPosition += 3
        pdf.setFontSize(9)
        pdf.setTextColor(51, 51, 51)
        pdf.text(`Name: ${invoiceData.brideName}`, margin + 5, yPosition)
        yPosition += 4
        if (invoiceData.bridePhone) {
          pdf.text(`Phone: ${invoiceData.bridePhone}`, margin + 5, yPosition)
          yPosition += 4
        }
        if (invoiceData.brideAddress) {
          const brideAddrLines = pdf.splitTextToSize(`Address: ${invoiceData.brideAddress}`, contentWidth - 25)
          pdf.text(brideAddrLines, margin + 5, yPosition)
          yPosition += brideAddrLines.length * 4
        }
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

    // Custom Amount
    if (invoiceData.customAmount && invoiceData.customAmount > 0) {
      pdf.text('Custom Charges:', summaryLeft, yPosition)
      pdf.text(`₹${invoiceData.customAmount.toLocaleString('en-IN')}`, summaryRight, yPosition, { align: 'right' })
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
    const termsText = invoiceData.termsAndConditions || 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
    const termsLines = pdf.splitTextToSize(termsText, contentWidth)
    pdf.text(termsLines, margin, yPosition)
    yPosition += termsLines.length * 3 + 3

    // Add signature if available
    if (invoiceData.companySignature) {
      try {
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Authorized By:', pageWidth - margin - 50, yPosition)
        pdf.addImage(invoiceData.companySignature, 'PNG', pageWidth - margin - 50, yPosition + 2, 40, 12)
        yPosition += 15
      } catch (e) {
        console.error('Error adding signature:', e)
      }
    }

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
