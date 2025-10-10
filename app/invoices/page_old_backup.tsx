"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Download,
  Printer,
  Trash2,
  CreditCard,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { InvoiceService } from "@/lib/services/invoice-service"
import type { Invoice } from "@/lib/types"
import type { DateRange } from "react-day-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface InvoiceStats {
  total: number
  draft: number
  sent: number
  paid: number
  partially_paid: number
  overdue: number
  total_revenue: number
  pending_amount: number
}

interface InvoiceTemplate {
  id: string
  name: string
  description: string
  style: "professional" | "modern" | "classic" | "minimal" | "corporate" | "elegant" | "creative"
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  layout: "standard" | "compact" | "detailed" | "itemized"
}

const defaultInvoiceTemplates: InvoiceTemplate[] = [
  {
    id: "professional-blue",
    name: "Professional Blue",
    description: "Clean and professional with blue accents",
    style: "professional",
    colors: { primary: "#1e40af", secondary: "#64748b", accent: "#3b82f6" },
    layout: "standard",
  },
  {
    id: "modern-green",
    name: "Modern Green",
    description: "Contemporary design with green highlights",
    style: "modern",
    colors: { primary: "#059669", secondary: "#6b7280", accent: "#10b981" },
    layout: "detailed",
  },
  {
    id: "classic-navy",
    name: "Classic Navy",
    description: "Traditional business style with navy blue",
    style: "classic",
    colors: { primary: "#1e3a8a", secondary: "#78716c", accent: "#2563eb" },
    layout: "itemized",
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    description: "Simple and clean with minimal design",
    style: "minimal",
    colors: { primary: "#374151", secondary: "#9ca3af", accent: "#6b7280" },
    layout: "compact",
  },
  {
    id: "corporate-black",
    name: "Corporate Black",
    description: "Professional black theme for corporate invoices",
    style: "corporate",
    colors: { primary: "#111827", secondary: "#6b7280", accent: "#374151" },
    layout: "standard",
  },
  {
    id: "elegant-purple",
    name: "Elegant Purple",
    description: "Sophisticated purple theme for premium services",
    style: "elegant",
    colors: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#8b5cf6" },
    layout: "detailed",
  },
  {
    id: "creative-orange",
    name: "Creative Orange",
    description: "Vibrant and creative with orange accents",
    style: "creative",
    colors: { primary: "#ea580c", secondary: "#6b7280", accent: "#f97316" },
    layout: "itemized",
  },
]

function InvoicesPageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
    totalValue: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(defaultInvoiceTemplates[0])
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null)

  const demoInvoiceData = {
    id: "INV001",
    customer: {
      name: "ABC Company Ltd.",
      email: "billing@abccompany.com",
      phone: "+91 98765 43210",
      address: "456 Corporate Plaza, Bangalore, Karnataka 560001",
      gst: "29ABCDE1234F1Z5",
    },
    invoice: {
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      paymentTerms: "Net 30 days",
    },
    items: [
      { name: "Event Management Services", quantity: 1, rate: 50000, amount: 50000 },
      { name: "Audio Visual Equipment", quantity: 2, rate: 15000, amount: 30000 },
      { name: "Decoration & Setup", quantity: 1, rate: 25000, amount: 25000 },
      { name: "Catering Coordination", quantity: 1, rate: 10000, amount: 10000 },
    ],
    subtotal: 115000,
    tax: 20700,
    discount: 5700,
    total: 130000,
  }

  const { toast } = useToast()

  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [filtersChanged, setFiltersChanged] = useState(false)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const data = await InvoiceService.getAll()
      setInvoices(data)
      setFilteredInvoices(data)
      
      // Fetch and set stats
      const statsData = await InvoiceService.getStats()
      setStats(statsData)

      toast({
        title: "Success",
        description: `Loaded ${data.length} invoices successfully!`,
      })
    } catch (error: any) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load invoices",
        variant: "destructive",
      })
      // Set empty arrays on error
      setInvoices([])
      setFilteredInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats is now handled by InvoiceService.getStats() in fetchInvoices
  
  const handleViewInvoice = (invoiceId: string) => {
          customer_name: "Rajesh Kumar",
          customer_email: "rajesh.kumar@email.com",
          customer_phone: "+91-9876543210",
          issue_date: "2024-01-15",
          due_date: "2024-01-30",
          paid_date: "2024-01-20",
          total_amount: 28500,
          paid_amount: 28500,
          balance_amount: 0,
          status: "paid",
          notes: "Premium wedding package - handled with extra care",
          item_count: 3,
          total_quantity: 3,
        },
        {
          id: "2",
          invoice_number: "INV-2024-002",
          customer_name: "Priya Sharma",
          customer_email: "priya.sharma@email.com",
          customer_phone: "+91-9876543211",
          issue_date: "2024-01-14",
          due_date: "2024-01-29",
          paid_date: "2024-01-25",
          total_amount: 18380,
          paid_amount: 18380,
          balance_amount: 0,
          status: "paid",
          notes: "Engagement ceremony rental package",
          item_count: 3,
          total_quantity: 6,
        },
        {
          id: "3",
          invoice_number: "INV-2024-003",
          customer_name: "Amit Patel",
          customer_email: "amit.patel@email.com",
          customer_phone: "+91-9876543212",
          issue_date: "2024-02-01",
          due_date: "2024-02-16",
          paid_date: "2024-02-10",
          total_amount: 53696,
          paid_amount: 53696,
          balance_amount: 0,
          status: "paid",
          notes: "Reception party - premium furniture and lighting",
          item_count: 1,
          total_quantity: 10,
        },
        {
          id: "4",
          invoice_number: "INV-2024-004",
          customer_name: "Sneha Gupta",
          customer_email: "sneha.gupta@email.com",
          customer_phone: "+91-9876543213",
          issue_date: "2024-02-20",
          due_date: "2024-03-06",
          total_amount: 66620,
          paid_amount: 40000,
          balance_amount: 26620,
          status: "sent",
          notes: "Direct sale - premium sherwani and jewelry set",
          item_count: 1,
          total_quantity: 1,
        },
        {
          id: "5",
          invoice_number: "INV-2024-005",
          customer_name: "Vikram Singh",
          customer_email: "vikram.singh@email.com",
          customer_phone: "+91-9876543214",
          issue_date: "2024-02-25",
          due_date: "2024-03-11",
          total_amount: 13960,
          paid_amount: 7000,
          balance_amount: 6960,
          status: "sent",
          notes: "Sangeet ceremony lighting setup",
          item_count: 1,
          total_quantity: 4,
        },
        {
          id: "6",
          invoice_number: "INV-2024-006",
          customer_name: "Rajesh Kumar",
          customer_email: "rajesh.kumar@email.com",
          customer_phone: "+91-9876543210",
          issue_date: "2024-01-10",
          due_date: "2024-01-25",
          total_amount: 10030,
          paid_amount: 3000,
          balance_amount: 7030,
          status: "overdue",
          notes: "Additional services - makeup and accessories",
          item_count: 2,
          total_quantity: 6,
        },
        {
          id: "7",
          invoice_number: "INV-2024-007",
          customer_name: "Priya Sharma",
          customer_email: "priya.sharma@email.com",
          customer_phone: "+91-9876543211",
          issue_date: "2024-01-05",
          due_date: "2024-01-20",
          total_amount: 17200,
          paid_amount: 5000,
          balance_amount: 12200,
          status: "overdue",
          notes: "Emergency alteration services",
          item_count: 2,
          total_quantity: 2,
        },
        {
          id: "8",
          invoice_number: "INV-2024-008",
          customer_name: "Sneha Gupta",
          customer_email: "sneha.gupta@email.com",
          customer_phone: "+91-9876543213",
          issue_date: "2024-03-01",
          due_date: "2024-03-16",
          total_amount: 24960,
          paid_amount: 0,
          balance_amount: 24960,
          status: "draft",
          notes: "Upcoming wedding consultation and planning",
          item_count: 2,
          total_quantity: 2,
        },
      ]

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError)
        // If invoices table doesn't exist, show demo data
        setUsingRealData(false)
        setInvoices(demoInvoices)
        setFilteredInvoices(demoInvoices)
        calculateStats(demoInvoices)
        return
      }

      // If we have invoices, fetch related data
      if (invoicesData && invoicesData.length > 0) {
        const bookingIds = invoicesData.map((inv) => inv.booking_id).filter(Boolean)
        const customerIds = invoicesData.map((inv) => inv.customer_id).filter(Boolean)
        const invoiceIds = invoicesData.map((inv) => inv.id)

        // Fetch related bookings
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, booking_number, event_date, delivery_date, event_type, groom_name, bride_name")
          .in("id", bookingIds)

        // Fetch related customers
        const { data: customersData } = await supabase
          .from("customers")
          .select("id, name, phone, email, address")
          .in("id", customerIds)

        // Fetch invoice items
        const { data: invoiceItemsData } = await supabase.from("invoice_items").select("*").in("invoice_id", invoiceIds)

        // Create lookup maps for efficient joining
        const bookingsMap = new Map(bookingsData?.map((b) => [b.id, b]) || [])
        const customersMap = new Map(customersData?.map((c) => [c.id, c]) || [])
        const itemsMap = new Map()

        // Group invoice items by invoice_id
        invoiceItemsData?.forEach((item) => {
          if (!itemsMap.has(item.invoice_id)) {
            itemsMap.set(item.invoice_id, [])
          }
          itemsMap.get(item.invoice_id).push(item)
        })

        const transformedInvoices: Invoice[] = invoicesData.map((invoice: any) => {
          const booking = bookingsMap.get(invoice.booking_id)
          const customer = customersMap.get(invoice.customer_id)
          const items = itemsMap.get(invoice.id) || []

          return {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name || customer?.name || "Unknown Customer",
            customer_email: invoice.customer_email || customer?.email || "",
            customer_phone: invoice.customer_phone || customer?.phone || "",
            customer_address: invoice.customer_address || customer?.address || "",
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            total_amount: invoice.total_amount || 0,
            paid_amount: invoice.paid_amount || 0,
            balance_amount: invoice.balance_amount || invoice.total_amount,
            status: invoice.status || "draft",
            notes: invoice.notes || "",
            booking_number: booking?.booking_number || "",
            event_type: booking?.event_type || "",
            event_date: booking?.event_date || null,
            groom_name: booking?.groom_name || "",
            bride_name: booking?.bride_name || "",
            items: items,
            item_count: items.length,
            total_quantity: (items as any[]).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
            pdf_url: invoice.pdf_url || null,
            pdf_generated: !!invoice.pdf_generated,
            tax_amount: invoice.tax_amount || 0,
            discount_amount: invoice.discount_amount || 0,
          }
        })

        setUsingRealData(true)
        setInvoices(transformedInvoices)
        setFilteredInvoices(transformedInvoices)
        calculateStats(transformedInvoices)
      } else {
        // No invoices found, show demo data
        setUsingRealData(false)
        setInvoices(demoInvoices)
        setFilteredInvoices(demoInvoices)
        calculateStats(demoInvoices)
      }

      toast({
        title: "Success",
        description: `Loaded ${invoicesData?.length || 0} invoices from database successfully!`,
      })
    } catch (error: any) {
      console.error("Error fetching invoices:", error)

      const fallbackDemoInvoices: Invoice[] = [
        {
          id: "1",
          invoice_number: "INV-2024-001",
          customer_name: "Rajesh Kumar",
          customer_email: "rajesh.kumar@email.com",
          customer_phone: "+91-9876543210",
          issue_date: "2024-01-15",
          due_date: "2024-01-30",
          paid_date: "2024-01-20",
          total_amount: 28500,
          paid_amount: 28500,
          balance_amount: 0,
          status: "paid",
          notes: "Premium wedding package - handled with extra care",
          item_count: 3,
          total_quantity: 3,
        },
      ]

      setInvoices(fallbackDemoInvoices)
      setFilteredInvoices(fallbackDemoInvoices)
      setUsingRealData(false)
      calculateStats(fallbackDemoInvoices)

      toast({
        title: "Using Sample Data",
        description: "Database tables not found. Run the SQL script to connect to real data.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewInvoice = (invoiceId: string) => {
    const invoice = filteredInvoices.find((inv) => inv.id === invoiceId)
    if (invoice) {
      toast({
        title: "Invoice Details",
        description: `${invoice.invoice_number} - ${invoice.customer_name} - ${formatCurrency(invoice.total_amount)}`,
      })
      // TODO: Navigate to invoice detail page when route is created
      // router.push(`/invoices/${invoiceId}`)
    }
  }

  const handleEditInvoice = (invoiceId: string) => {
    toast({
      title: "Edit Invoice",
      description: `Opening invoice editor for ${invoiceId}`,
    })
    // Navigate to invoice edit page
    // router.push(`/invoices/${invoiceId}/edit`)
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    try {
      // If a generated PDF URL exists (e.g., settlement invoice), open it directly
      if (invoice.pdf_url) {
        window.open(invoice.pdf_url, "_blank")
        toast({ title: "Opening PDF", description: `Opening ${invoice.invoice_number}` })
        return
      }

      const invoiceData = {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer: {
          name: invoice.customer_name,
          email: invoice.customer_email,
          phone: invoice.customer_phone,
          address: invoice.customer_address,
        },
        invoice: {
          date: invoice.issue_date,
          dueDate: invoice.due_date,
          paymentTerms: "Net 15 days",
        },
        items:
          invoice.items?.map((item) => ({
            name: item.product_name || item.item_name || "Unknown Item",
            description: item.description || "",
            quantity: item.quantity || 1,
            rate: item.unit_price || 0,
            amount: item.line_total || 0,
          })) || [],
        subtotal: invoice.total_amount - (invoice.tax_amount || 0),
        tax: invoice.tax_amount || 0,
        discount: invoice.discount_amount || 0,
        total: invoice.total_amount,
        paid: invoice.paid_amount || 0,
        balance: invoice.balance_amount || invoice.total_amount,
        status: invoice.status,
        booking_number: invoice.booking_number,
        event_type: invoice.event_type,
        event_date: invoice.event_date,
        groom_name: invoice.groom_name,
        bride_name: invoice.bride_name,
        template: selectedTemplate,
        company: {
          name: "Safawala",
          address: "123 Business Street, City, State 12345",
          phone: "+91 98765 43210",
          email: "info@safawala.com",
          gst: "29ABCDE1234F1Z5",
        },
      }

  // Fallback: create a JSON export (no PDF available/generated)
  const element = document.createElement("a")
  const file = new Blob([JSON.stringify(invoiceData, null, 2)], { type: "application/json" })
  element.href = URL.createObjectURL(file)
  element.download = `${invoice.invoice_number}.json`
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)

      toast({
        title: "Download Started",
        description: `Downloading ${invoice.invoice_number} with ${selectedTemplate.name} template`,
      })
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading the invoice",
        variant: "destructive",
      })
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    toast({
      title: "Print Invoice",
      description: `Printing ${invoice.invoice_number}`,
    })
    // Implement print logic
    window.print()
  }

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      if (usingRealData) {
        const { error } = await supabase
          .from("invoices")
          .update({
            paid_amount: invoice.total_amount,
            balance_amount: 0,
            status: "paid",
            paid_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", invoice.id)

        if (error) throw error
      }

      toast({
        title: "Payment Recorded",
        description: `${invoice.invoice_number} marked as paid`,
      })

      fetchInvoices()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      if (usingRealData) {
        const { error } = await supabase.from("invoices").delete().eq("id", invoice.id)

        if (error) throw error
      }

      toast({
        title: "Invoice Deleted",
        description: `${invoice.invoice_number} has been deleted`,
      })

      fetchInvoices()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  const calculateStats = (invoiceList: Invoice[]): InvoiceStats => {
    return {
      total: invoiceList.length,
      paid: invoiceList.filter((inv) => inv.status === "paid").length,
      pending: invoiceList.filter((inv) => inv.status === "sent").length,
      overdue: invoiceList.filter((inv) => inv.status === "overdue").length,
      draft: invoiceList.filter((inv) => inv.status === "draft").length,
      totalValue: invoiceList.reduce((sum, inv) => sum + inv.total_amount, 0),
      cancelled: invoiceList.filter((inv) => inv.status === "cancelled").length,
    }
  }

  const applyFilters = () => {
    let filtered = [...invoices]

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer_email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    if (dateRange?.from) {
      filtered = filtered.filter((invoice) => {
        const issueDate = new Date(invoice.issue_date)
        const fromDate = dateRange.from!
        const toDate = dateRange.to || dateRange.from!

        return issueDate >= fromDate && issueDate <= toDate
      })
    }

    setFilteredInvoices(filtered)
    setStats(calculateStats(filtered))
    setFiltersChanged(false)
  }

  const handleFilterChange = () => {
    setFiltersChanged(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const, icon: CheckCircle },
      sent: { label: "Pending", variant: "secondary" as const, icon: Clock },
      overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle },
      draft: { label: "Draft", variant: "outline" as const, icon: FileText },
      cancelled: { label: "Cancelled", variant: "outline" as const, icon: FileText },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateSelector(false)
    toast({
      title: "Template Selected",
      description: `${template.name} template will be used for new invoices`,
    })
  }

  const handleTemplatePreview = (template: InvoiceTemplate) => {
    setPreviewTemplate(template)
    setShowTemplatePreview(true)
  }

  const handleSendWhatsApp = async (invoice: Invoice) => {
    try {
      const message = `Hi ${invoice.customer_name},

Your invoice ${invoice.invoice_number} is ready!

Amount: ${formatCurrency(invoice.total_amount)}
Due Date: ${formatDate(invoice.due_date)}
${invoice.balance_amount > 0 ? `Balance: ${formatCurrency(invoice.balance_amount)}` : "Status: Paid ✅"}

Please make payment by the due date to avoid late charges.

Thank you for your business!
- Safawala Team`

      // Send via WhatsApp API
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: invoice.customer_phone,
          message: message,
          type: "invoice",
        }),
      })

      if (response.ok) {
        toast({
          title: "Invoice Sent",
          description: `Invoice ${invoice.invoice_number} sent via WhatsApp to ${invoice.customer_phone}`,
        })
      } else {
        throw new Error("Failed to send WhatsApp message")
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error)
      toast({
        title: "Error",
        description: "Failed to send invoice via WhatsApp",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (invoices.length > 0) {
      applyFilters()
    }
  }, [invoices])

  useEffect(() => {
    handleFilterChange()
  }, [searchTerm, statusFilter, dateRange])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
            <p className="text-muted-foreground">
              Manage and track all your invoices
              {!usingRealData && " (sample data)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Invoice Templates
          </Button>
          <Button
            variant="outline"
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2" onClick={() => router.push("/bookings/add")}>
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {!usingRealData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">No Invoice Data Found</p>
              <p className="text-sm text-yellow-700">
                No invoices have been generated yet. Invoices are automatically created when bookings are converted from
                quotes or when orders are placed. Create your first order to generate an invoice.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 bg-transparent"
              onClick={() => router.push("/bookings/add")}
            >
              Create Order
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalValue)} total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Not yet sent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter invoices by search term, status, and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={applyFilters} className="w-full" variant={filtersChanged ? "default" : "outline"}>
                {filtersChanged ? "Apply Filters" : "Filters Applied"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {loading ? "Loading invoices..." : `${filteredInvoices.length} invoice(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {invoices.length === 0
                  ? "No invoices have been created yet."
                  : "No invoices match your current filters."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{invoice.invoice_number}</h4>
                      {getStatusBadge(invoice.status)}
                      {invoice.booking_number && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {invoice.booking_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{invoice.customer_name}</span>
                      <span>•</span>
                      <span>Issued: {formatDate(invoice.issue_date)}</span>
                      <span>•</span>
                      <span>Due: {formatDate(invoice.due_date)}</span>
                      {invoice.event_type && (
                        <>
                          <span>•</span>
                          <span>{invoice.event_type}</span>
                        </>
                      )}
                      {invoice.paid_date && (
                        <>
                          <span>•</span>
                          <span>Paid: {formatDate(invoice.paid_date)}</span>
                        </>
                      )}
                    </div>
                    {invoice.notes && <p className="text-sm text-muted-foreground">{invoice.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                      <div className="font-semibold">{formatCurrency(invoice.total_amount)}</div>
                      {invoice.balance_amount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Balance: {formatCurrency(invoice.balance_amount)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {invoice.item_count} item(s) • {invoice.total_quantity} qty
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            handleViewInvoice(invoice.id)
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Unable to view invoice details",
                              variant: "destructive",
                            })
                          }
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>

                      {invoice.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice)}
                          className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CreditCard className="h-3 w-3" />
                          Mark Paid
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Invoice
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                          </DropdownMenuItem>

                          {invoice.customer_phone && (
                            <DropdownMenuItem onClick={() => handleSendWhatsApp(invoice)}>
                              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                              </svg>
                              Send WhatsApp
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Invoice
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the invoice
                                  <strong> {invoice.invoice_number}</strong> and remove all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Invoice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Select Invoice Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose a template style for your invoices. Current: {selectedTemplate.name}
            </p>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {defaultInvoiceTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate.id === template.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.colors.primary }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.colors.secondary }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.colors.accent }} />
                    </div>
                  </div>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Style:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.style}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Layout:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.layout}
                      </Badge>
                    </div>
                    {/* Template Preview */}
                    <div
                      className="mt-3 p-2 rounded border text-xs"
                      style={{
                        borderColor: template.colors.primary,
                        backgroundColor: `${template.colors.primary}08`,
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ color: template.colors.primary }} className="font-medium">
                          INVOICE #INV001
                        </span>
                        <span className="text-muted-foreground">Preview</span>
                      </div>
                      <div className="text-muted-foreground">Customer: ABC Company Ltd.</div>
                      <div className="text-muted-foreground">Date: {new Date().toLocaleDateString()}</div>
                      <div className="mt-1 pt-1 border-t flex justify-between">
                        <span>Total:</span>
                        <span style={{ color: template.colors.accent }} className="font-medium">
                          ₹15,000
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTemplatePreview(template)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{selectedTemplate.name}</span>
            </div>
            <Button onClick={() => setShowTemplateSelector(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Template Preview: {previewTemplate?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">Full preview with demo data</p>
          </DialogHeader>
          {previewTemplate && (
            <div className="mt-4">
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  borderColor: previewTemplate.colors.primary,
                  backgroundColor: `${previewTemplate.colors.primary}02`,
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: previewTemplate.colors.primary }}>
                      INVOICE
                    </h1>
                    <div className="text-sm text-muted-foreground">
                      <p>Safawala Event Management</p>
                      <p>123 Business Street, Mumbai 400001</p>
                      <p>Phone: +91 98765 43210</p>
                      <p>GST: 27ABCDE1234F1Z5</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold mb-1" style={{ color: previewTemplate.colors.secondary }}>
                      Invoice #{demoInvoiceData.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Date: {demoInvoiceData.invoice.date}</p>
                      <p>Due Date: {demoInvoiceData.invoice.dueDate}</p>
                      <p>Terms: {demoInvoiceData.invoice.paymentTerms}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: previewTemplate.colors.secondary }}>
                    Bill To:
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>{demoInvoiceData.customer.name}</strong>
                    </p>
                    <p>{demoInvoiceData.customer.address}</p>
                    <p>Email: {demoInvoiceData.customer.email}</p>
                    <p>Phone: {demoInvoiceData.customer.phone}</p>
                    <p>GST: {demoInvoiceData.customer.gst}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2" style={{ borderColor: previewTemplate.colors.primary }}>
                          <th className="text-left py-2">Description</th>
                          <th className="text-center py-2">Qty</th>
                          <th className="text-right py-2">Rate</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoInvoiceData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.name}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2">₹{item.rate.toLocaleString()}</td>
                            <td className="text-right py-2">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{demoInvoiceData.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (18%):</span>
                        <span>₹{demoInvoiceData.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-₹{demoInvoiceData.discount.toLocaleString()}</span>
                      </div>
                      <div
                        className="flex justify-between font-bold text-lg pt-2 border-t-2"
                        style={{
                          borderColor: previewTemplate.colors.primary,
                          color: previewTemplate.colors.accent,
                        }}
                      >
                        <span>Total Amount:</span>
                        <span>₹{demoInvoiceData.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold mb-2" style={{ color: previewTemplate.colors.secondary }}>
                    Payment Instructions:
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Payment is due within 30 days of invoice date</p>
                    <p>• Please include invoice number in payment reference</p>
                    <p>• Late payments may incur additional charges</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
                  <p>Thank you for your business!</p>
                  <p>For any queries, please contact us at info@safawala.com</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button onClick={() => setShowTemplatePreview(false)}>Close Preview</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function InvoicesPage() {
  return <InvoicesPageContent />
}
