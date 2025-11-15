import { InvoiceData } from './invoice-generator'

/**
 * Generate clean HTML invoice template
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const {
    bookingNumber,
    bookingDate,
    bookingType,
    bookingStatus,
    customerName,
    customerCode,
    customerPhone,
    customerWhatsApp,
    customerEmail,
    customerAddress,
    customerCity,
    customerState,
    customerPincode,
    packageName,
    variantName,
    categoryName,
    extraSafas,
    packageDescription,
    eventType,
    eventFor,
    eventParticipant,
    eventTime,
    venueName,
    venueAddress,
    deliveryDate,
    deliveryTime,
    returnDate,
    returnTime,
    groomName,
    brideName,
    items,
    subtotal,
    discountAmount,
    discountPercentage,
    couponCode,
    couponDiscount,
    distanceAmount,
    customAmount,
    taxAmount,
    taxPercentage,
    totalAmount,
    paidAmount,
    securityDeposit,
    pendingAmount,
    paymentMethod,
    paymentType,
    companyName,
    companyPhone,
    companyEmail,
    companyAddress,
    companyCity,
    companyState,
    companyGST,
    companyWebsite,
    companyLogo,
    primaryColor,
    secondaryColor,
    accentColor,
    termsAndConditions
  } = data

  const primaryColorValue = primaryColor || '#3B82F6'
  const secondaryColorValue = secondaryColor || '#EF4444'
  const accentColorValue = accentColor || '#10B981'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${bookingNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColorValue};
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColorValue};
      margin-bottom: 5px;
    }
    
    .company-details {
      font-size: 11px;
      color: #666;
      line-height: 1.5;
    }
    
    .company-logo {
      max-width: 200px;
      max-height: 100px;
      object-fit: contain;
      vertical-align: middle;
    }
    
    /* Invoice Title */
    .invoice-title {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .invoice-title h1 {
      font-size: 28px;
      color: ${primaryColorValue};
      margin-bottom: 10px;
    }
    
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
    }
    
    .invoice-meta-item {
      flex: 1;
    }
    
    .invoice-meta-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }
    
    .invoice-meta-value {
      font-weight: bold;
      font-size: 13px;
      color: #333;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    
    /* Customer Details */
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: ${primaryColorValue};
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: #f9fafb;
      padding: 15px;
      border-radius: 5px;
    }
    
    .info-item {
      font-size: 11px;
    }
    
    .info-label {
      color: #666;
      font-weight: 600;
    }
    
    .info-value {
      color: #333;
      margin-left: 5px;
    }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table thead {
      background: ${primaryColorValue};
      color: white;
    }
    
    .items-table th {
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    
    .items-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .text-right {
      text-align: right;
    }
    
    /* Financial Summary */
    .financial-summary {
      margin-left: auto;
      width: 300px;
      margin-bottom: 20px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
    }
    
    .summary-row.discount {
      color: ${secondaryColorValue};
    }
    
    .summary-row.total {
      border-top: 2px solid #333;
      font-weight: bold;
      font-size: 14px;
      color: ${primaryColorValue};
      margin-top: 10px;
      padding-top: 10px;
    }
    
    .summary-row.paid {
      color: ${accentColorValue};
      font-weight: 600;
    }
    
    .summary-row.pending {
      color: ${secondaryColorValue};
      font-weight: 600;
    }
    
    /* Terms & Footer */
    .terms {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border-left: 3px solid ${primaryColorValue};
      border-radius: 3px;
      font-size: 10px;
      color: #666;
    }
    
    .terms-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-container {
        max-width: 100%;
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div style="flex-shrink: 0; margin-right: 20px;">
        ${companyLogo ? `
        <img src="${companyLogo}" alt="Company Logo" class="company-logo" style="display: block;">
        ` : `
        <div class="company-name">${companyName || 'SAFAWALA'}</div>
        `}
      </div>
      <div class="company-info">
        <div class="company-details">
          ${companyAddress ? `${companyAddress}<br>` : ''}
          ${companyCity ? `${companyCity}${companyState ? ', ' + companyState : ''}<br>` : ''}
          ${companyPhone ? `Phone: ${companyPhone}<br>` : ''}
          ${companyEmail ? `Email: ${companyEmail}<br>` : ''}
          ${companyGST ? `GST: ${companyGST}<br>` : ''}
          ${companyWebsite ? `Website: ${companyWebsite}` : ''}
        </div>
      </div>
    </div>
    
    <!-- Invoice Title -->
    <div class="invoice-title">
      <h1>INVOICE</h1>
    </div>
    
    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <div class="invoice-meta-item">
        <div class="invoice-meta-label">Invoice Number</div>
        <div class="invoice-meta-value">${bookingNumber}</div>
      </div>
      <div class="invoice-meta-item">
        <div class="invoice-meta-label">Invoice Date</div>
        <div class="invoice-meta-value">${new Date(bookingDate).toLocaleDateString('en-IN')}</div>
      </div>
      <div class="invoice-meta-item">
        <div class="invoice-meta-label">Type</div>
        <div class="invoice-meta-value">${bookingType.replace(/_/g, ' ').toUpperCase()}</div>
      </div>
      ${bookingStatus ? `
      <div class="invoice-meta-item">
        <div class="invoice-meta-label">Status</div>
        <div class="invoice-meta-value">
          <span class="status-badge status-${bookingStatus.toLowerCase().includes('confirm') || bookingStatus.toLowerCase().includes('paid') ? 'confirmed' : bookingStatus.toLowerCase().includes('pending') ? 'pending' : 'cancelled'}">
            ${bookingStatus}
          </span>
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- Customer Details -->
    <div class="section">
      <div class="section-title">BILL TO</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Customer Name:</span>
          <span class="info-value">${customerName}</span>
        </div>
        ${customerCode ? `
        <div class="info-item">
          <span class="info-label">Customer ID:</span>
          <span class="info-value">${customerCode}</span>
        </div>
        ` : ''}
        <div class="info-item">
          <span class="info-label">Phone:</span>
          <span class="info-value">${customerPhone}</span>
        </div>
        ${customerWhatsApp && customerWhatsApp !== customerPhone ? `
        <div class="info-item">
          <span class="info-label">WhatsApp:</span>
          <span class="info-value">${customerWhatsApp}</span>
        </div>
        ` : ''}
        ${customerEmail ? `
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">${customerEmail}</span>
        </div>
        ` : ''}
        ${customerAddress ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="info-label">Address:</span>
          <span class="info-value">${customerAddress}${customerCity ? ', ' + customerCity : ''}${customerState ? ', ' + customerState : ''}${customerPincode ? ' - ' + customerPincode : ''}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Package Details (if applicable) -->
    ${bookingType === 'package' && packageName ? `
    <div class="section">
      <div class="section-title">PACKAGE DETAILS</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Package:</span>
          <span class="info-value">${packageName}</span>
        </div>
        ${variantName ? `
        <div class="info-item">
          <span class="info-label">Variant:</span>
          <span class="info-value">${variantName}</span>
        </div>
        ` : ''}
        ${categoryName ? `
        <div class="info-item">
          <span class="info-label">Category:</span>
          <span class="info-value">${categoryName}</span>
        </div>
        ` : ''}
        ${extraSafas ? `
        <div class="info-item">
          <span class="info-label">Extra Safas:</span>
          <span class="info-value">${extraSafas}</span>
        </div>
        ` : ''}
        ${packageDescription ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="info-label">Description:</span>
          <span class="info-value">${packageDescription}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Event Details (if applicable) -->
    ${(bookingType === 'package' || bookingType === 'product_rental') && (eventType || venueName || deliveryDate) ? `
    <div class="section">
      <div class="section-title">EVENT DETAILS</div>
      <div class="info-grid">
        ${eventType ? `
        <div class="info-item">
          <span class="info-label">Event Type:</span>
          <span class="info-value">${eventType}</span>
        </div>
        ` : ''}
        ${eventFor ? `
        <div class="info-item">
          <span class="info-label">Event For:</span>
          <span class="info-value">${eventFor}</span>
        </div>
        ` : ''}
        ${groomName ? `
        <div class="info-item">
          <span class="info-label">Groom:</span>
          <span class="info-value">${groomName}</span>
        </div>
        ` : ''}
        ${brideName ? `
        <div class="info-item">
          <span class="info-label">Bride:</span>
          <span class="info-value">${brideName}</span>
        </div>
        ` : ''}
        ${venueName ? `
        <div class="info-item">
          <span class="info-label">Venue:</span>
          <span class="info-value">${venueName}</span>
        </div>
        ` : ''}
        ${venueAddress ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="info-label">Venue Address:</span>
          <span class="info-value">${venueAddress}</span>
        </div>
        ` : ''}
        ${deliveryDate ? `
        <div class="info-item">
          <span class="info-label">Delivery:</span>
          <span class="info-value">${new Date(deliveryDate).toLocaleDateString('en-IN')}${deliveryTime ? ' at ' + deliveryTime : ''}</span>
        </div>
        ` : ''}
        ${returnDate ? `
        <div class="info-item">
          <span class="info-label">Return:</span>
          <span class="info-value">${new Date(returnDate).toLocaleDateString('en-IN')}${returnTime ? ' at ' + returnTime : ''}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Items Table -->
    ${items && items.length > 0 ? `
    <div class="section">
      <div class="section-title">ITEMS</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Name</th>
            <th>Category</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${item.name}</strong>
              ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
              ${item.barcode ? `<br><small style="color: #999;">Barcode: ${item.barcode}</small>` : ''}
            </td>
            <td>${item.category || '-'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
            <td class="text-right"><strong>₹${item.totalPrice.toFixed(2)}</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <!-- Financial Summary -->
    <div class="financial-summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      
      ${discountAmount && discountAmount > 0 ? `
      <div class="summary-row discount">
        <span>Discount${discountPercentage ? ` (${discountPercentage}%)` : ''}:</span>
        <span>-₹${discountAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      
      ${couponDiscount && couponDiscount > 0 ? `
      <div class="summary-row discount">
        <span>Coupon${couponCode ? ` (${couponCode})` : ''}:</span>
        <span>-₹${couponDiscount.toFixed(2)}</span>
      </div>
      ` : ''}
      
      ${customAmount && customAmount !== 0 ? `
      <div class="summary-row">
        <span>${customAmount > 0 ? 'Additional Charges' : 'Adjustment'}:</span>
        <span>₹${customAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      
      ${taxAmount && taxAmount > 0 ? `
      <div class="summary-row">
        <span>GST${taxPercentage ? ` (${taxPercentage}%)` : ''}:</span>
        <span>₹${taxAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      
      <div class="summary-row total">
        <span>TOTAL AMOUNT:</span>
        <span>₹${totalAmount.toFixed(2)}</span>
      </div>
      
      ${securityDeposit && securityDeposit > 0 ? `
      <div class="summary-row" style="color: #f59e0b;">
        <span>Security Deposit:</span>
        <span>₹${securityDeposit.toFixed(2)}</span>
      </div>
      ` : ''}
      
      <div class="summary-row paid">
        <span>Paid Amount:</span>
        <span>₹${paidAmount.toFixed(2)}</span>
      </div>
      
      ${pendingAmount && pendingAmount > 0 ? `
      <div class="summary-row pending">
        <span>Pending Amount:</span>
        <span>₹${pendingAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      
      ${paymentMethod || paymentType ? `
      <div style="margin-top: 10px; font-size: 10px; color: #666;">
        ${paymentMethod ? `Method: ${paymentMethod}` : ''}
        ${paymentType ? ` | Type: ${paymentType}` : ''}
      </div>
      ` : ''}
    </div>
    
    <!-- Terms & Conditions -->
    ${termsAndConditions ? `
    <div class="terms">
      <div class="terms-title">Terms & Conditions</div>
      ${termsAndConditions}
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice. For any queries, please contact us.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
