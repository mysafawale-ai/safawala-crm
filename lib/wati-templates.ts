export interface WATITemplate {
  name: string
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION"
  language: string
  components: {
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
    text?: string
    example?: {
      header_text?: string[]
      body_text?: string[][]
    }
    buttons?: {
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"
      text: string
      url?: string
      phone_number?: string
    }[]
  }[]
  status: "PENDING" | "APPROVED" | "REJECTED"
  description: string
}

export const SAFAWALA_TEMPLATES: WATITemplate[] = [
  // BOOKING SYSTEM TEMPLATES
  {
    name: "booking_confirmation",
    category: "UTILITY",
    language: "en",
    description: "Booking confirmation message for customers",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Booking Confirmed ✅",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your booking has been confirmed! 🎉

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Event Time: {{4}}
• Venue: {{5}}
• Items: {{6}}

💰 *Payment Information:*
• Total Amount: ₹{{7}}
• Payment Status: {{8}}

📞 For any queries, contact us at +91 97252 95692

Thank you for choosing Safawala! 🙏`,
        example: {
          body_text: [
            [
              "Rahul Kumar",
              "BK001",
              "25 Dec 2024",
              "6:00 PM",
              "Hotel Grand Palace",
              "Royal Turban Set, Kalgi, Necklace",
              "15000",
              "Paid",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala - Premium Wedding Accessories",
      },
    ],
  },
  {
    name: "booking_status_update",
    category: "UTILITY",
    language: "en",
    description: "Booking status update notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📋 Booking Status Update",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your booking status has been updated:

📋 *Booking Details:*
• Booking ID: {{2}}
• New Status: {{3}}
• Updated Date: {{4}}
• Next Action: {{5}}

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Priya Sharma", "BK001", "Confirmed", "20 Dec 2024", "Items being prepared"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Booking Team",
      },
    ],
  },
  {
    name: "booking_reminder_pickup",
    category: "UTILITY",
    language: "en",
    description: "Pickup reminder for customers",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📅 Pickup Reminder",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Reminder: Your items are ready for pickup!

📋 *Booking Details:*
• Booking ID: {{2}}
• Pickup Date: {{3}}
• Pickup Time: {{4}}
• Location: {{5}}

📦 *Items Ready:*
{{6}}

Please arrive on time with your booking confirmation.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Rahul Kumar", "BK001", "24 Dec 2024", "2:00 PM", "Safawala Store", "Royal Turban Set, Kalgi"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Pickup Team",
      },
    ],
  },
  {
    name: "booking_delivery_notification",
    category: "UTILITY",
    language: "en",
    description: "Delivery notification for customers",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🚚 Out for Delivery",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your items are out for delivery! 🎉

📋 *Delivery Details:*
• Booking ID: {{2}}
• Delivery Address: {{3}}
• Expected Time: {{4}}
• Delivery Person: {{5}}
• Contact: {{6}}

📦 *Items Being Delivered:*
{{7}}

Please be available to receive your items.

📞 Support: +91 97252 95692`,
        example: {
          body_text: [
            ["Priya Sharma", "BK002", "123 Main Street", "4:00 PM", "Amit Singh", "+91 98765 43210", "Bridal Set"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Delivery Team",
      },
    ],
  },
  {
    name: "booking_cancellation",
    category: "UTILITY",
    language: "en",
    description: "Booking cancellation notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "❌ Booking Cancelled",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your booking has been cancelled as requested.

📋 *Cancellation Details:*
• Booking ID: {{2}}
• Cancellation Date: {{3}}
• Reason: {{4}}
• Refund Amount: ₹{{5}}
• Refund Status: {{6}}

💰 *Refund Information:*
Your refund will be processed within 3-5 business days.

We're sorry to see you go. We hope to serve you again in the future!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Neha Gupta", "BK003", "22 Dec 2024", "Event postponed", "10000", "Processing"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Customer Care",
      },
    ],
  },

  // CUSTOMER MANAGEMENT TEMPLATES
  {
    name: "customer_welcome",
    category: "UTILITY",
    language: "en",
    description: "Welcome message for new customer registration",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Welcome to Safawala! 🎉",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Welcome to the Safawala family! 🙏

👤 *Your Account Details:*
• Customer ID: {{2}}
• Phone: {{3}}
• Credit Limit: ₹{{4}}

🎯 *What's Next:*
• Browse our premium collection
• Get instant quotes
• Book for your special events
• Enjoy exclusive member benefits

📱 Save our number: +91 97252 95692
🌐 Visit: www.safawala.com

Thank you for choosing us for your special moments! ✨`,
        example: {
          body_text: [["Rajesh Kumar", "CU001", "+91 98765 43210", "50000"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala - Premium Wedding Accessories",
      },
    ],
  },
  {
    name: "customer_birthday",
    category: "MARKETING",
    language: "en",
    description: "Birthday wishes for customers",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🎂 Happy Birthday!",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Wishing you a very Happy Birthday! 🎉

🎁 *Special Birthday Offer:*
• {{2}}% OFF on all bookings
• Valid till: {{3}}
• Use code: BIRTHDAY{{4}}

May this year bring you joy, prosperity, and beautiful celebrations! ✨

📞 Book now: +91 97252 95692`,
        example: {
          body_text: [["Rahul Kumar", "15", "31 Dec 2024", "2024"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Team",
      },
    ],
  },
  {
    name: "customer_credit_limit_exceeded",
    category: "UTILITY",
    language: "en",
    description: "Credit limit exceeded notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⚠️ Credit Limit Alert",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your account has reached the credit limit.

💳 *Account Details:*
• Current Outstanding: ₹{{2}}
• Credit Limit: ₹{{3}}
• Available Credit: ₹{{4}}

🔄 *Action Required:*
Please clear pending payments to continue booking services.

💰 *Payment Options:*
• UPI: safawala@paytm
• Account: 1234567890 (HDFC Bank)

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Rajesh Kumar", "55000", "50000", "0"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Finance Team",
      },
    ],
  },
  {
    name: "customer_loyalty_reward",
    category: "MARKETING",
    language: "en",
    description: "Loyalty reward notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🎁 Loyalty Reward!",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Congratulations! You've earned a loyalty reward! 🌟

🏆 *Reward Details:*
• Reward Type: {{2}}
• Value: ₹{{3}}
• Valid Until: {{4}}
• Reason: {{5}}

🎯 *How to Use:*
• Use code: LOYAL{{6}}
• Applicable on next booking
• Cannot be combined with other offers

Thank you for being a valued customer!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Amit Singh", "Discount Voucher", "2000", "31 Jan 2025", "10th Booking", "2024"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Loyalty Program",
      },
    ],
  },
  {
    name: "customer_feedback_request",
    category: "UTILITY",
    language: "en",
    description: "Feedback request after service completion",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⭐ Share Your Experience",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Thank you for choosing Safawala! 🙏

We hope you had a wonderful experience with our services for your {{2}} event.

📝 *Please share your feedback:*
• Service Quality: ⭐⭐⭐⭐⭐
• Staff Behavior: ⭐⭐⭐⭐⭐
• Product Quality: ⭐⭐⭐⭐⭐
• Overall Experience: ⭐⭐⭐⭐⭐

Your feedback helps us serve you better!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Priya Sharma", "wedding"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Customer Care",
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "QUICK_REPLY",
            text: "Excellent Service",
          },
          {
            type: "QUICK_REPLY",
            text: "Good Service",
          },
          {
            type: "QUICK_REPLY",
            text: "Need Improvement",
          },
        ],
      },
    ],
  },

  // INVENTORY MANAGEMENT TEMPLATES
  {
    name: "inventory_low_stock",
    category: "UTILITY",
    language: "en",
    description: "Low stock alert for staff",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⚠️ Low Stock Alert",
      },
      {
        type: "BODY",
        text: `*Low Stock Alert*

📦 *Item Details:*
• Product: {{1}}
• Current Stock: {{2}} units
• Minimum Required: {{3}} units
• Category: {{4}}

🔄 *Action Required:*
Please restock this item immediately to avoid booking conflicts.

📊 Check inventory dashboard for more details.`,
        example: {
          body_text: [["Royal Turban - Gold", "2", "5", "Turbans"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Inventory System",
      },
    ],
  },
  {
    name: "new_product_arrival",
    category: "MARKETING",
    language: "en",
    description: "New product arrival notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✨ New Arrivals!",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Exciting new products have arrived! 🎉

🆕 *New Collection:*
• Product: {{2}}
• Category: {{3}}
• Price: ₹{{4}}
• Available from: {{5}}

🎯 *Special Launch Offer:*
• {{6}}% OFF for first 10 bookings
• Premium quality guaranteed
• Limited stock available

Book now to be among the first to experience our latest collection! ✨

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Valued Customer", "Designer Bridal Turban Set", "Bridal Collection", "25000", "Today", "20"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala New Collections",
      },
    ],
  },
  {
    name: "inventory_out_of_stock",
    category: "UTILITY",
    language: "en",
    description: "Out of stock alert for staff",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🚫 Out of Stock Alert",
      },
      {
        type: "BODY",
        text: `*URGENT: Out of Stock*

📦 *Item Details:*
• Product: {{1}}
• Category: {{2}}
• Last Available: {{3}}
• Pending Bookings: {{4}}

🚨 *Immediate Action Required:*
• Contact suppliers immediately
• Update booking availability
• Inform customers about alternatives

📊 Inventory Dashboard: Check for alternatives`,
        example: {
          body_text: [["Premium Bridal Turban", "Bridal Collection", "Yesterday", "3"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Inventory Alert",
      },
    ],
  },
  {
    name: "inventory_quality_issue",
    category: "UTILITY",
    language: "en",
    description: "Quality issue alert for inventory items",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⚠️ Quality Issue Alert",
      },
      {
        type: "BODY",
        text: `*Quality Issue Reported*

📦 *Item Details:*
• Product: {{1}}
• Issue Type: {{2}}
• Reported by: {{3}}
• Date: {{4}}
• Severity: {{5}}

🔍 *Action Required:*
• Immediate quality check
• Remove from available inventory
• Contact supplier if needed
• Update booking status

📋 Report ID: {{6}}`,
        example: {
          body_text: [["Royal Turban Set", "Stain/Damage", "Quality Team", "Today", "High", "QR001"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Quality Control",
      },
    ],
  },
  {
    name: "inventory_seasonal_collection",
    category: "MARKETING",
    language: "en",
    description: "Seasonal collection launch notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🌟 Seasonal Collection Launch",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Introducing our exclusive {{2}} collection! ✨

🎨 *New Collection Highlights:*
• Theme: {{3}}
• Items Available: {{4}}
• Price Range: ₹{{5}} - ₹{{6}}
• Limited Edition: {{7}} pieces only

🎁 *Launch Offers:*
• Early Bird: {{8}}% OFF
• Free accessories with premium sets
• Complimentary styling consultation

Book now for the upcoming season!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Valued Customer", "Winter Wedding", "Royal Heritage", "25", "15000", "50000", "50", "25"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Collections",
      },
    ],
  },

  // LAUNDRY MANAGEMENT TEMPLATES
  {
    name: "laundry_batch_created",
    category: "UTILITY",
    language: "en",
    description: "Laundry batch creation notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🧺 Laundry Batch Created",
      },
      {
        type: "BODY",
        text: `*New Laundry Batch Created*

📋 *Batch Details:*
• Batch ID: {{1}}
• Vendor: {{2}}
• Items Count: {{3}}
• Service Type: {{4}}
• Expected Return: {{5}}

📦 *Items Included:*
{{6}}

💰 *Cost: ₹{{7}}*

Status will be updated as items are processed.`,
        example: {
          body_text: [
            [
              "LB001",
              "Premium Laundry Services",
              "15",
              "Dry Cleaning",
              "26 Dec 2024",
              "Turbans, Suits, Accessories",
              "3000",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala.com Management", // Updated branding from Safawala Laundry to Safawala.com
      },
    ],
  },
  {
    name: "laundry_ready_for_pickup",
    category: "UTILITY",
    language: "en",
    description: "Laundry ready for pickup notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✅ Laundry Ready",
      },
      {
        type: "BODY",
        text: `*Laundry Items Ready for Pickup*

📋 *Batch Details:*
• Batch ID: {{1}}
• Vendor: {{2}}
• Items: {{3}}
• Quality Check: {{4}}
• Pickup Location: {{5}}

🕐 *Pickup Schedule:*
• Available from: {{6}}
• Contact Person: {{7}}

Please arrange pickup at the earliest.`,
        example: {
          body_text: [
            ["LB001", "Premium Laundry", "15 items", "Passed", "Vendor Location", "Today 2 PM", "Vendor Manager"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala.com Team", // Updated branding from Safawala Laundry to Safawala.com
      },
    ],
  },

  // PURCHASE MANAGEMENT TEMPLATES
  {
    name: "purchase_order_created",
    category: "UTILITY",
    language: "en",
    description: "Purchase order creation notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📋 Purchase Order Created",
      },
      {
        type: "BODY",
        text: `*New Purchase Order*

📋 *Order Details:*
• PO Number: {{1}}
• Vendor: {{2}}
• Items: {{3}}
• Total Amount: ₹{{4}}
• Expected Delivery: {{5}}

📦 *Items Ordered:*
{{6}}

💳 *Payment Terms: {{7}}*

Please confirm receipt and delivery schedule.`,
        example: {
          body_text: [
            ["PO001", "ABC Suppliers", "10", "25000", "30 Dec 2024", "Turbans, Accessories", "30 days credit"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Purchase Team",
      },
    ],
  },
  {
    name: "purchase_delivery_received",
    category: "UTILITY",
    language: "en",
    description: "Purchase delivery received notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📦 Delivery Received",
      },
      {
        type: "BODY",
        text: `*Purchase Delivery Received*

📋 *Delivery Details:*
• PO Number: {{1}}
• Vendor: {{2}}
• Received Date: {{3}}
• Items Received: {{4}}
• Quality Status: {{5}}

✅ *Next Steps:*
• Quality inspection completed
• Items added to inventory
• Invoice processing initiated

📊 Updated inventory levels available in dashboard.`,
        example: {
          body_text: [["PO001", "ABC Suppliers", "Today", "10/10", "Approved"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Receiving Team",
      },
    ],
  },

  // EXPENSE MANAGEMENT TEMPLATES
  {
    name: "expense_submitted",
    category: "UTILITY",
    language: "en",
    description: "Expense submission notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "💰 Expense Submitted",
      },
      {
        type: "BODY",
        text: `*Expense Report Submitted*

📋 *Expense Details:*
• Employee: {{1}}
• Amount: ₹{{2}}
• Category: {{3}}
• Date: {{4}}
• Description: {{5}}

📄 *Status: Pending Approval*

The expense will be reviewed and processed accordingly.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Amit Singh", "2500", "Travel", "Today", "Client meeting transportation"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Expense Management",
      },
    ],
  },
  {
    name: "expense_approved",
    category: "UTILITY",
    language: "en",
    description: "Expense approval notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✅ Expense Approved",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your expense has been approved! 🎉

💰 *Expense Details:*
• Amount: ₹{{2}}
• Category: {{3}}
• Approved by: {{4}}
• Approval Date: {{5}}

💳 *Reimbursement:*
Amount will be credited to your account in the next payroll cycle.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Amit Singh", "2500", "Travel", "Manager", "Today"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Finance Team",
      },
    ],
  },

  // PAYROLL MANAGEMENT TEMPLATES
  {
    name: "payroll_processed",
    category: "UTILITY",
    language: "en",
    description: "Payroll processing notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "💰 Salary Processed",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your salary for {{2}} has been processed! 🎉

💰 *Salary Details:*
• Basic Salary: ₹{{3}}
• Incentives: ₹{{4}}
• Deductions: ₹{{5}}
• Net Salary: ₹{{6}}

💳 *Payment:*
Amount credited to account ending with {{7}}

📄 Detailed payslip will be shared separately.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Priya Sharma", "December 2024", "25000", "3000", "2000", "26000", "1234"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Payroll Team",
      },
    ],
  },
  {
    name: "payroll_incentive_earned",
    category: "UTILITY",
    language: "en",
    description: "Incentive earned notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🌟 Incentive Earned",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Congratulations! You've earned an incentive! 🎉

🏆 *Incentive Details:*
• Type: {{2}}
• Amount: ₹{{3}}
• Achievement: {{4}}
• Period: {{5}}

💰 *Payment:*
This incentive will be included in your next salary.

Keep up the excellent work!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Amit Singh", "Performance Bonus", "5000", "Exceeded monthly targets", "December 2024"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala HR Team",
      },
    ],
  },

  // ATTENDANCE MANAGEMENT TEMPLATES
  {
    name: "attendance_marked",
    category: "UTILITY",
    language: "en",
    description: "Attendance marking confirmation",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✅ Attendance Marked",
      },
      {
        type: "BODY",
        text: `Hello {{1}},

Your attendance has been marked successfully!

🕐 *Attendance Details:*
• Date: {{2}}
• Check-in: {{3}}
• Status: {{4}}
• Location: {{5}}

⏰ *Reminder:*
Don't forget to mark check-out when leaving.

Have a productive day! 💪`,
        example: {
          body_text: [["Amit Singh", "25 Dec 2024", "9:00 AM", "Present", "Main Office"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Attendance System",
      },
    ],
  },
  {
    name: "attendance_late_arrival",
    category: "UTILITY",
    language: "en",
    description: "Late arrival notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⏰ Late Arrival Alert",
      },
      {
        type: "BODY",
        text: `Hello {{1}},

Late arrival recorded for today.

🕐 *Details:*
• Expected Time: {{2}}
• Actual Time: {{3}}
• Delay: {{4}} minutes
• Date: {{5}}

📝 *Action Required:*
Please provide reason for late arrival to HR.

⚠️ Frequent late arrivals may affect performance evaluation.

📞 Contact HR: +91 97252 95692`,
        example: {
          body_text: [["Priya Sharma", "9:00 AM", "9:30 AM", "30", "25 Dec 2024"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala HR Team",
      },
    ],
  },

  // ANALYTICS & REPORTS TEMPLATES
  {
    name: "daily_summary",
    category: "UTILITY",
    language: "en",
    description: "Daily business summary for management",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📊 Daily Summary",
      },
      {
        type: "BODY",
        text: `*Business Summary for {{1}}*

💰 *Revenue:*
• Total: ₹{{2}}
• Bookings: {{3}}
• Payments: ₹{{4}}

📋 *Bookings:*
• New: {{5}}
• Confirmed: {{6}}
• Completed: {{7}}

📦 *Inventory:*
• Low Stock Items: {{8}}
• Items Rented: {{9}}

👥 *Staff Performance:*
• Tasks Completed: {{10}}
• Pending Tasks: {{11}}

Have a great day! 🌟`,
        example: {
          body_text: [["25 Dec 2024", "45000", "8", "30000", "3", "5", "2", "2", "15", "12", "3"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Daily Reports",
      },
    ],
  },
  {
    name: "weekly_performance_report",
    category: "UTILITY",
    language: "en",
    description: "Weekly performance report",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📊 Weekly Report",
      },
      {
        type: "BODY",
        text: `*Weekly Performance Summary*
*Week: {{1}}*

💰 *Financial Performance:*
• Revenue: ₹{{2}}
• Growth: {{3}}%
• Target Achievement: {{4}}%

📋 *Operations:*
• Total Bookings: {{5}}
• Completed: {{6}}
• Customer Satisfaction: {{7}}%

👥 *Team Performance:*
• Staff Productivity: {{8}}%
• Tasks Completed: {{9}}

📈 *Key Insights:*
{{10}}

Great work team! 🌟`,
        example: {
          body_text: [
            ["Dec 18-24, 2024", "125000", "12", "105", "25", "22", "95", "88", "45", "Strong customer retention"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Analytics Team",
      },
    ],
  },
  {
    name: "monthly_business_report",
    category: "UTILITY",
    language: "en",
    description: "Monthly business report",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📈 Monthly Report",
      },
      {
        type: "BODY",
        text: `*Monthly Business Report*
*Month: {{1}}*

💰 *Revenue Analysis:*
• Total Revenue: ₹{{2}}
• Monthly Growth: {{3}}%
• Profit Margin: {{4}}%

📊 *Key Metrics:*
• New Customers: {{5}}
• Repeat Customers: {{6}}
• Average Order Value: ₹{{7}}

🎯 *Achievements:*
• {{8}}

📋 *Focus Areas:*
• {{9}}

Detailed report attached.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [
            [
              "December 2024",
              "450000",
              "18",
              "25",
              "25",
              "78",
              "18000",
              "Highest monthly revenue",
              "Customer retention improvement",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Management Reports",
      },
    ],
  },

  // INVOICE MANAGEMENT TEMPLATES
  {
    name: "invoice_generated",
    category: "UTILITY",
    language: "en",
    description: "Invoice generation notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📄 Invoice Generated",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your invoice has been generated successfully!

📄 *Invoice Details:*
• Invoice Number: {{2}}
• Date: {{3}}
• Amount: ₹{{4}}
• Due Date: {{5}}
• Booking ID: {{6}}

💳 *Payment Options:*
• UPI: safawala@paytm
• Account: 1234567890 (HDFC Bank)
• Online Payment Link

📎 Invoice copy will be shared separately.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Rahul Kumar", "INV001", "25 Dec 2024", "20000", "30 Dec 2024", "BK001"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Billing Team",
      },
    ],
  },
  {
    name: "invoice_payment_received",
    category: "UTILITY",
    language: "en",
    description: "Invoice payment received notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✅ Payment Received",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Thank you! Your invoice payment has been received.

💳 *Payment Details:*
• Invoice: {{2}}
• Amount: ₹{{3}}
• Payment Date: {{4}}
• Transaction ID: {{5}}
• Method: {{6}}

📄 *Status: PAID*

Receipt will be shared separately.

Thank you for your business!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Rahul Kumar", "INV001", "20000", "25 Dec 2024", "TXN123456", "UPI"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Accounts Team",
      },
    ],
  },

  // FRANCHISE MANAGEMENT TEMPLATES
  {
    name: "franchise_performance",
    category: "UTILITY",
    language: "en",
    description: "Franchise performance update",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📊 Performance Update",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Monthly performance summary:

📈 *Performance Metrics:*
• Revenue: ₹{{2}}
• Growth: {{3}}%
• Target Achievement: {{4}}%
• Ranking: {{5}}

🎯 *Areas of Focus:*
• {{6}}

Keep up the excellent work!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Mumbai Franchise", "150000", "15", "120", "2nd", "Customer retention"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Franchise Team",
      },
    ],
  },
  {
    name: "franchise_target_achieved",
    category: "UTILITY",
    language: "en",
    description: "Franchise target achievement notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🎯 Target Achieved!",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Congratulations! You've achieved your monthly target! 🎉

🏆 *Achievement Details:*
• Target: ₹{{2}}
• Achieved: ₹{{3}}
• Achievement: {{4}}%
• Bonus Earned: ₹{{5}}

🌟 *Performance Highlights:*
• {{6}}

Keep up the excellent work!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Mumbai Franchise", "200000", "250000", "125", "15000", "Highest customer satisfaction"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Franchise Team",
      },
    ],
  },
  {
    name: "franchise_new_launch",
    category: "UTILITY",
    language: "en",
    description: "New franchise launch notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🚀 New Franchise Launch",
      },
      {
        type: "BODY",
        text: `*New Franchise Launch Announcement*

🎉 We're excited to announce the launch of our new franchise!

📍 *Franchise Details:*
• Location: {{1}}
• Franchise Partner: {{2}}
• Launch Date: {{3}}
• Services: {{4}}
• Contact: {{5}}

🎁 *Grand Opening Offers:*
• {{6}}

Welcome to the Safawala family!

📞 Support: +91 97252 95692`,
        example: {
          body_text: [
            ["Pune", "ABC Enterprises", "1 Jan 2025", "Full Range", "+91 98765 43210", "20% OFF on all bookings"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Franchise Network",
      },
    ],
  },

  // STAFF MANAGEMENT TEMPLATES
  {
    name: "task_assignment",
    category: "UTILITY",
    language: "en",
    description: "Task assignment notification for staff",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📋 New Task Assigned",
      },
      {
        type: "BODY",
        text: `Hello {{1}},

You have been assigned a new task:

📝 *Task Details:*
• Title: {{2}}
• Priority: {{3}}
• Due Date: {{4}}
• Assigned by: {{5}}

📄 *Description:*
{{6}}

Please acknowledge and complete this task on time.

💬 Reply to this message for any clarifications.`,
        example: {
          body_text: [
            [
              "Amit Singh",
              "Prepare items for BK001",
              "High",
              "24 Dec 2024",
              "Manager",
              "Prepare and pack all items for booking BK001. Ensure quality check is done.",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Task Management",
      },
    ],
  },
  {
    name: "staff_appreciation",
    category: "UTILITY",
    language: "en",
    description: "Staff appreciation message",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "⭐ Outstanding Performance",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Congratulations on your outstanding performance! 🌟

🏆 *Achievement:*
• {{2}}
• Performance Rating: {{3}}
• Recognition: {{4}}

Your dedication and hard work are truly appreciated. Keep up the excellent work!

👏 From: {{5}}

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [
            [
              "Priya Sharma",
              "Completed 50 bookings this month",
              "Excellent",
              "Employee of the Month",
              "Management Team",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Management",
      },
    ],
  },
  {
    name: "staff_leave_approved",
    category: "UTILITY",
    language: "en",
    description: "Leave approval notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "✅ Leave Approved",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your leave request has been approved! 🎉

📅 *Leave Details:*
• Leave Type: {{2}}
• From: {{3}}
• To: {{4}}
• Duration: {{5}} days
• Approved by: {{6}}

📝 *Instructions:*
• Complete pending tasks before leave
• Handover responsibilities to {{7}}
• Contact HR for any queries

Enjoy your time off! 😊

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["Priya Sharma", "Annual Leave", "28 Dec 2024", "2 Jan 2025", "5", "Manager", "Amit Singh"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala HR Team",
      },
    ],
  },
  {
    name: "staff_training_reminder",
    category: "UTILITY",
    language: "en",
    description: "Training session reminder",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📚 Training Reminder",
      },
      {
        type: "BODY",
        text: `Hello {{1}},

Reminder: Training session scheduled for tomorrow!

📚 *Training Details:*
• Topic: {{2}}
• Date: {{3}}
• Time: {{4}}
• Venue: {{5}}
• Trainer: {{6}}

📋 *What to Bring:*
• Notebook and pen
• Employee ID
• Positive attitude! 😊

Attendance is mandatory.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [
            ["Team", "Customer Service Excellence", "26 Dec 2024", "10:00 AM", "Training Room", "External Trainer"],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Training Team",
      },
    ],
  },

  // VENDOR MANAGEMENT TEMPLATES
  {
    name: "vendor_payment_due",
    category: "UTILITY",
    language: "en",
    description: "Vendor payment due notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "💳 Payment Due",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Payment notification for your services:

💰 *Payment Details:*
• Amount: ₹{{2}}
• Invoice: {{3}}
• Due Date: {{4}}
• Services: {{5}}

Payment will be processed as per our agreement terms.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["ABC Laundry Services", "5000", "INV001", "25 Dec 2024", "Laundry Services"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Vendor Relations",
      },
    ],
  },
  {
    name: "vendor_performance_review",
    category: "UTILITY",
    language: "en",
    description: "Vendor performance review notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📊 Performance Review",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Monthly performance review summary:

📈 *Performance Metrics:*
• Service Quality: {{2}}/5
• Delivery Timeliness: {{3}}%
• Cost Effectiveness: {{4}}/5
• Overall Rating: {{5}}/5

💡 *Feedback:*
{{6}}

🎯 *Areas for Improvement:*
{{7}}

Thank you for your continued partnership!

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [
            [
              "ABC Laundry Services",
              "4.5",
              "95",
              "4",
              "4.2",
              "Excellent service quality",
              "Delivery timing can be improved",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Vendor Relations",
      },
    ],
  },
  {
    name: "vendor_contract_renewal",
    category: "UTILITY",
    language: "en",
    description: "Vendor contract renewal notification",
    status: "PENDING",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "📋 Contract Renewal",
      },
      {
        type: "BODY",
        text: `Dear {{1}},

Your contract is due for renewal.

📄 *Contract Details:*
• Current Contract: {{2}}
• Expiry Date: {{3}}
• Renewal Period: {{4}}
• New Terms: {{5}}

📝 *Next Steps:*
• Review updated terms
• Sign renewal agreement
• Submit required documents

Please contact us to discuss renewal terms.

📞 Contact: +91 97252 95692`,
        example: {
          body_text: [["ABC Services", "SVC001", "31 Dec 2024", "1 Year", "Updated pricing and SLA"]],
        },
      },
      {
        type: "FOOTER",
        text: "Safawala Contracts Team",
      },
    ],
  },
]

export class WATITemplateManager {
  private baseUrl: string
  private accessToken: string

  constructor() {
    this.baseUrl = "https://live-mt-server.wati.io/481455"
    this.accessToken =
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMWU0YjA3NS03ZmUxLTQzYmUtOTBiMC04NTExMjQxNjEzYTQiLCJ1bmlxdWVfbmFtZSI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwibmFtZWlkIjoibXlzYWZhd2FsZUBnbWFpbC5jb20iLCJlbWFpbCI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDgvMTIvMjAyNSAyMDoxMjo1NSIsInRlbmFudF9pZCI6IjQ4MTQ1NSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.ZmgPg4ZTHPhSytUlT0s2BfmUIEkzlKdAbogvVNzHTek"
  }

  generateSubmissionFormat(templateName: string): string {
    // Find the template by name
    const template = SAFAWALA_TEMPLATES.find((t) => t.name === templateName)

    if (!template) {
      return JSON.stringify({ error: `Template '${templateName}' not found` }, null, 2)
    }

    if (!template.components || !Array.isArray(template.components)) {
      return JSON.stringify({ error: "Template components are missing or invalid" }, null, 2)
    }

    try {
      const submissionFormat = {
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components.map((component) => {
          const formattedComponent: any = {
            type: component.type,
          }

          if (component.format) {
            formattedComponent.format = component.format
          }

          if (component.text) {
            formattedComponent.text = component.text
          }

          if (component.example) {
            formattedComponent.example = component.example
          }

          if (component.buttons) {
            formattedComponent.buttons = component.buttons
          }

          return formattedComponent
        }),
      }

      return JSON.stringify(submissionFormat, null, 2)
    } catch (error) {
      return JSON.stringify({ error: "Failed to generate submission format" }, null, 2)
    }
  }

  async submitTemplate(template: WATITemplate): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.accessToken,
        },
        body: JSON.stringify(template),
      })

      return response.ok
    } catch (error) {
      console.error("Error submitting template:", error)
      return false
    }
  }

  async getTemplateStatus(templateName: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/templates/${templateName}`, {
        headers: {
          Authorization: this.accessToken,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.status || "UNKNOWN"
      }
      return "ERROR"
    } catch (error) {
      console.error("Error getting template status:", error)
      return "ERROR"
    }
  }

  getTemplatesByCategory(category: string): WATITemplate[] {
    return SAFAWALA_TEMPLATES.filter(
      (template) =>
        template.description.toLowerCase().includes(category.toLowerCase()) ||
        template.name.toLowerCase().includes(category.toLowerCase()),
    )
  }

  getAllTemplates(): WATITemplate[] {
    return SAFAWALA_TEMPLATES
  }
}

// Export template manager instance
export const templateManager = new WATITemplateManager()
