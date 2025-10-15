"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Plus,
  Search,
  Download,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Info,
  RefreshCw,
  ArrowLeft,
  User,
  Calendar,
  Package,
  Shield,
  Share2,
  Eye,
  Pencil,
  CalendarIcon,
  Save,
  Loader2,
} from "lucide-react"
import { QuoteService } from "@/lib/services/quote-service"
import { BookingService } from "@/lib/services/booking-service"
import { ConvertQuoteDialog } from "@/components/quotes/convert-quote-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Quote, User as UserType } from "@/lib/types"
import { downloadQuotePDF, type PDFDesignType } from "@/lib/pdf/generate-quote-pdf"
import { useRouter, useSearchParams } from "next/navigation"
import { BookingTypeDialog } from "@/components/quotes/booking-type-dialog"
import { getCurrentUser } from "@/lib/auth"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

interface QuoteStats {
  total: number
  generated: number
  sent: number
  accepted: number
  rejected: number
  converted: number
  expired: number
}

interface QuoteTemplate {
  id: string
  name: string
  description: string
  style: "modern" | "classic" | "minimal" | "elegant" | "corporate" | "creative" | "premium"
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  layout: "standard" | "compact" | "detailed" | "summary"
}

const defaultQuoteTemplates: QuoteTemplate[] = [
  {
    id: "modern-blue",
    name: "Modern Blue",
    description: "Clean and professional with blue accents",
    style: "modern",
    colors: { primary: "#2563eb", secondary: "#64748b", accent: "#0ea5e9" },
    layout: "standard",
  },
  {
    id: "classic-gold",
    name: "Classic Gold",
    description: "Traditional wedding theme with gold highlights",
    style: "classic",
    colors: { primary: "#d97706", secondary: "#78716c", accent: "#f59e0b" },
    layout: "detailed",
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
    id: "elegant-purple",
    name: "Elegant Purple",
    description: "Sophisticated purple theme for premium events",
    style: "elegant",
    colors: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#8b5cf6" },
    layout: "detailed",
  },
  {
    id: "corporate-navy",
    name: "Corporate Navy",
    description: "Professional navy blue for business events",
    style: "corporate",
    colors: { primary: "#1e40af", secondary: "#64748b", accent: "#3b82f6" },
    layout: "standard",
  },
  {
    id: "creative-teal",
    name: "Creative Teal",
    description: "Vibrant and creative with teal accents",
    style: "creative",
    colors: { primary: "#0d9488", secondary: "#6b7280", accent: "#14b8a6" },
    layout: "summary",
  },
  {
    id: "premium-rose",
    name: "Premium Rose Gold",
    description: "Luxury rose gold theme for high-end events",
    style: "premium",
    colors: { primary: "#e11d48", secondary: "#9ca3af", accent: "#f43f5e" },
    layout: "detailed",
  },
]

function QuotesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<UserType | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<QuoteStats>({
    total: 0,
    generated: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    converted: 0,
    expired: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showQuoteDetails, setShowQuoteDetails] = useState(false)
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate>(defaultQuoteTemplates[0])
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showBookingTypeDialog, setShowBookingTypeDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [pdfDesign, setPdfDesign] = useState<PDFDesignType>("classic")
  
  // Edit quote form state
  const [editFormData, setEditFormData] = useState({
    event_type: "",
    event_participant: "",
    payment_type: "",
    event_date: "",
    event_time: "",
    delivery_date: "",
    delivery_time: "",
    return_date: "",
    return_time: "",
    venue_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    bride_address: "",
    notes: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  const demoQuoteData = {
    id: "QT001",
    customer: {
      name: "John & Jane Doe",
      email: "john.doe@email.com",
      phone: "+91 98765 43210",
      address: "123 Wedding Street, Mumbai, Maharashtra 400001",
    },
    event: {
      type: "Wedding Reception",
      date: "2024-12-15",
      venue: "Grand Ballroom, Hotel Paradise",
      guests: 200,
    },
    items: [
      { name: "Round Tables (10 seater)", quantity: 20, rate: 500, amount: 10000 },
      { name: "Chiavari Chairs", quantity: 200, rate: 50, amount: 10000 },
      { name: "Stage Decoration", quantity: 1, rate: 15000, amount: 15000 },
      { name: "Lighting Setup", quantity: 1, rate: 8000, amount: 8000 },
      { name: "Sound System", quantity: 1, rate: 5000, amount: 5000 },
    ],
    subtotal: 48000,
    tax: 8640,
    discount: 3640,
    total: 53000,
    validUntil: "2024-11-30",
  }

  const { toast } = useToast()

  // Initial load and auto-refresh
  useEffect(() => {
    loadQuotes()
    loadStats()

    const interval = setInterval(() => {
      loadQuotes()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Watch for URL changes (e.g., redirect from create page with refresh param)
  useEffect(() => {
    const refreshParam = searchParams?.get('refresh')
    if (refreshParam) {
      console.log('🔄 Refresh triggered from URL param')
      loadQuotes()
      loadStats()
    }
  }, [searchParams])

  useEffect(() => {
    filterQuotes()
  }, [quotes, searchTerm, statusFilter, dateFilter])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await QuoteService.getAll()
      setQuotes(data)
    } catch (error) {
      console.error("Error loading quotes:", error)
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await QuoteService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const filterQuotes = () => {
    let filtered = quotes

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (quote) =>
          quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.customer_phone?.includes(searchTerm) ||
          quote.groom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quote) => quote.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((quote) => new Date(quote.created_at).toDateString() === filterDate.toDateString())
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
      }
    }

    setFilteredQuotes(filtered)
  }

  const handleStatusUpdate = async (quoteId: string, newStatus: string) => {
    try {
      if (newStatus === "accepted") {
        // Find the quote to convert
        const quote = quotes.find((q) => q.id === quoteId)
        if (quote) {
          // Create booking from quote
          const bookingId = await BookingService.createFromQuote(quote)

          toast({
            title: "Success",
            description: `Quote accepted and converted to booking! Booking ID: ${bookingId.slice(0, 8)}...`,
          })
        }
      }

      await QuoteService.updateStatus(quoteId, newStatus)

      if (newStatus !== "accepted") {
        toast({
          title: "Success",
          description: "Quote status updated successfully",
        })
      }

      await loadQuotes()
      await loadStats()
    } catch (error) {
      console.error("Error updating quote status:", error)
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return

    try {
      await QuoteService.delete(quoteId)
      await loadQuotes()
      await loadStats()
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      })
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await Promise.all(selectedQuotes.map((id) => QuoteService.updateStatus(id, newStatus)))
      await loadQuotes()
      await loadStats()
      setSelectedQuotes([])
      toast({
        title: "Success",
        description: `Updated ${selectedQuotes.length} quotes to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quotes",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const franchiseId = user?.franchise_id
      if (!franchiseId) {
        console.warn("[PDF Download] No franchise_id available")
      }
      
      await downloadQuotePDF(quote, franchiseId, pdfDesign)

      toast({
        title: "Success",
        description: `Quote PDF (${pdfDesign}) downloaded successfully`,
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download quote PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generated: { label: "Generated", variant: "secondary" as const, icon: FileText },
      sent: { label: "Sent", variant: "default" as const, icon: Send },
      accepted: { label: "Accepted", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
      converted: { label: "Converted", variant: "default" as const, icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.generated
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const exportQuotes = () => {
    const csvContent = [
      ["Quote Number", "Customer", "Phone", "Event Date", "Total Amount", "Status", "Created Date"].join(","),
      ...filteredQuotes.map((quote) =>
        [
          quote.quote_number,
          quote.customer_name || "",
          quote.customer_phone || "",
          quote.event_date || "",
          quote.total_amount,
          quote.status,
          new Date(quote.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Quote Number", "Customer", "Phone", "Event Date", "Total Amount", "Status", "Created Date"].join(","),
      ...filteredQuotes.map((quote) =>
        [
          quote.quote_number,
          quote.customer_name || "",
          quote.customer_phone || "",
          quote.event_date || "",
          quote.total_amount,
          quote.status,
          new Date(quote.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleTemplateSelect = (template: QuoteTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateSelector(false)
    toast({
      title: "Template Selected",
      description: `${template.name} template will be used for new quotes`,
    })
  }

  const handleTemplatePreview = (template: QuoteTemplate) => {
    setPreviewTemplate(template)
    setShowTemplatePreview(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <TooltipProvider>
          {/* Header */}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quote Management</h1>
              <p className="text-muted-foreground">Generate and manage customer quotes</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={quotes.length === 0}>
              <Download className="h-3 w-3 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadQuotes()
                toast({
                  title: "Refreshed",
                  description: "Quote data has been refreshed",
                })
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            {/* PDF Design Selector */}
            <Select value={pdfDesign} onValueChange={(value: PDFDesignType) => setPdfDesign(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Classic PDF
                  </div>
                </SelectItem>
                <SelectItem value="modern">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Modern PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowBookingTypeDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Quote
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <div className="flex items-center space-x-1">
                <CardTitle className="text-xs font-medium">Total Quotes</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of quotes generated across all statuses</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FileText className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <div className="flex items-center space-x-1">
                <CardTitle className="text-xs font-medium">Generated</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quotes that have been created but not yet sent to customers</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Clock className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold">{stats.generated}</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <div className="flex items-center space-x-1">
                <CardTitle className="text-xs font-medium">Converted</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quotes that have been converted to confirmed bookings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CheckCircle className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold">{stats.converted}</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <div className="flex items-center space-x-1">
                <CardTitle className="text-xs font-medium">Rejected</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quotes declined by customers - no further action required</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <XCircle className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3">
          <CardHeader className="p-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm">Filters</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter quotes by customer name, quote number, status, or date range</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-7 h-8 text-sm"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-8 w-8 p-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="quote">Generated</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card className="p-3">
          <CardHeader className="p-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm">Quotes ({filteredQuotes.length})</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Complete list of quotes with customer details, amounts, and status management</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="text-xs">All generated quotes with customer details and status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="text-xs">Quote #</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Event</TableHead>
                    <TableHead className="text-xs">
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total quote amount including taxes and security deposit</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-xs">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quote status: Generated → Sent → Accepted/Rejected</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
                          <div className="text-sm font-medium">No quotes found</div>
                          <div className="text-xs text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                              ? "Try adjusting your filters or search term"
                              : "Create your first quote to get started"}
                          </div>
                          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSearchTerm("")
                                setStatusFilter("all")
                                setDateFilter("all")
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} className="h-12">
                      <TableCell className="font-medium text-xs">{quote.quote_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-xs">{quote.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{quote.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quote.booking_type === 'package' ? 'default' : 'secondary'} className="text-xs">
                          {quote.booking_type === 'package' 
                            ? '📦 Package (Rent)' 
                            : `🛍️ Product (${quote.booking_subtype === 'sale' ? 'Sale' : 'Rent'})`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-xs">{quote.event_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "No date"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs">{formatCurrency(quote.total_amount)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-xs">{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedQuote(quote)
                              setShowViewDialog(true)
                            }}
                            title="View Quote Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Redirect to edit page based on booking_type
                              const editPath = quote.booking_type === 'package' 
                                ? `/book-package?edit=${quote.id}` 
                                : `/create-product-order?edit=${quote.id}`
                              router.push(editPath)
                            }}
                            title="Edit Quote"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPDF(quote)}
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <ConvertQuoteDialog 
                            quote={quote}
                            onSuccess={(bookingId) => {
                              // Refresh quotes and optionally redirect to booking
                              loadQuotes()
                              toast({
                                title: "Success",
                                description: "Quote converted to booking successfully",
                              })
                            }}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Convert to Booking"
                                disabled={quote.status !== "accepted" && quote.status !== "sent"}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
              <DialogDescription>Select a template to start with</DialogDescription>
            </DialogHeader>
            {/* Template selection UI here */}
            <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quote Details - {selectedQuote?.quote_number}
              </DialogTitle>
              <DialogDescription>Complete information for this quote</DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedQuote.customer_name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {selectedQuote.customer_phone || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">WhatsApp:</span> {selectedQuote.customer_whatsapp || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedQuote.customer_email || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedQuote.customer_address || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">City:</span> {selectedQuote.customer_city || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">State:</span> {selectedQuote.customer_state || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Pincode:</span> {selectedQuote.customer_pincode || "N/A"}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Event Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Event Type:</span> {selectedQuote.event_type || "N/A"}
                      </div>
                      {selectedQuote.event_participant && (
                        <div>
                          <span className="font-medium">Event Participant:</span> {selectedQuote.event_participant}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Event Date:</span>{" "}
                        {selectedQuote.event_date ? new Date(selectedQuote.event_date).toLocaleDateString() : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Event Time:</span>{" "}
                        {selectedQuote.event_date ? new Date(selectedQuote.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                      </div>
                      {selectedQuote.groom_name && (
                        <>
                          <div>
                            <span className="font-medium">Groom Name:</span> {selectedQuote.groom_name}
                          </div>
                          {selectedQuote.groom_whatsapp && (
                            <div>
                              <span className="font-medium">Groom WhatsApp:</span> {selectedQuote.groom_whatsapp}
                            </div>
                          )}
                          {selectedQuote.groom_address && (
                            <div>
                              <span className="font-medium">Groom Address:</span> {selectedQuote.groom_address}
                            </div>
                          )}
                        </>
                      )}
                      {selectedQuote.bride_name && (
                        <>
                          <div>
                            <span className="font-medium">Bride Name:</span> {selectedQuote.bride_name}
                          </div>
                          {selectedQuote.bride_whatsapp && (
                            <div>
                              <span className="font-medium">Bride WhatsApp:</span> {selectedQuote.bride_whatsapp}
                            </div>
                          )}
                          {selectedQuote.bride_address && (
                            <div>
                              <span className="font-medium">Bride Address:</span> {selectedQuote.bride_address}
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <span className="font-medium">Venue:</span> {selectedQuote.venue_name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Venue Address:</span> {selectedQuote.venue_address || "N/A"}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quote & Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Quote Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Quote #:</span> {selectedQuote.quote_number}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        <Badge variant={selectedQuote.booking_type === 'package' ? 'default' : 'secondary'}>
                          {selectedQuote.booking_type === 'package' 
                            ? '📦 Package (Rent)' 
                            : `🛍️ Product (${selectedQuote.booking_subtype === 'sale' ? 'Sale' : 'Rent'})`}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {getStatusBadge(selectedQuote.status)}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(selectedQuote.created_at).toLocaleDateString()}
                      </div>
                      {selectedQuote.payment_type && (
                        <div>
                          <span className="font-medium">Payment Type:</span>{" "}
                          <Badge variant="outline">
                            {selectedQuote.payment_type === 'full' ? 'Full Payment' : 
                             selectedQuote.payment_type === 'advance' ? 'Advance Payment' : 
                             selectedQuote.payment_type === 'partial' ? 'Partial Payment' : 
                             selectedQuote.payment_type}
                          </Badge>
                        </div>
                      )}
                      {selectedQuote.amount_paid !== undefined && selectedQuote.amount_paid > 0 && (
                        <div>
                          <span className="font-medium">Amount Paid:</span> ₹{selectedQuote.amount_paid.toLocaleString()}
                        </div>
                      )}
                      {selectedQuote.pending_amount !== undefined && selectedQuote.pending_amount > 0 && (
                        <div>
                          <span className="font-medium">Pending Amount:</span> ₹{selectedQuote.pending_amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Delivery Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Delivery Date:</span>{" "}
                        {selectedQuote.delivery_date ? new Date(selectedQuote.delivery_date).toLocaleDateString() : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Delivery Time:</span>{" "}
                        {selectedQuote.delivery_date ? new Date(selectedQuote.delivery_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Return Date:</span>{" "}
                        {selectedQuote.return_date ? new Date(selectedQuote.return_date).toLocaleDateString() : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Return Time:</span>{" "}
                        {selectedQuote.return_date ? new Date(selectedQuote.return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                      </div>
                      {selectedQuote.special_instructions && (
                        <div>
                          <span className="font-medium">Special Instructions:</span>
                          <p className="text-muted-foreground mt-1">{selectedQuote.special_instructions}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Quote Items */}
                {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Quote Items
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedQuote.quote_items.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell>{formatCurrency(item.total_price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Financial Breakdown */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.subtotal_amount || selectedQuote.total_amount)}</span>
                      </div>
                      {selectedQuote.discount_amount && selectedQuote.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span className="font-medium">- {formatCurrency(selectedQuote.discount_amount)}</span>
                        </div>
                      )}
                      {selectedQuote.tax_amount && selectedQuote.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax (GST):</span>
                          <span className="font-medium">{formatCurrency(selectedQuote.tax_amount)}</span>
                        </div>
                      )}
                      {selectedQuote.security_deposit && selectedQuote.security_deposit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Security Deposit:</span>
                          <span className="font-medium">{formatCurrency(selectedQuote.security_deposit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold pt-2 border-t">
                        <span>Total Amount:</span>
                        <span className="text-green-600 text-lg">{formatCurrency(selectedQuote.total_amount)}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Notes and Terms */}
                {(selectedQuote.notes || selectedQuote.terms_conditions) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedQuote.notes && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notes
                        </h3>
                        <p className="text-sm text-muted-foreground">{selectedQuote.notes}</p>
                      </Card>
                    )}

                    {selectedQuote.terms_conditions && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Terms & Conditions
                        </h3>
                        <p className="text-sm text-muted-foreground">{selectedQuote.terms_conditions}</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedQuote)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Copy quote link or share functionality
                        navigator.clipboard.writeText(`Quote #${selectedQuote.quote_number}`)
                        toast({
                          title: "Copied",
                          description: "Quote number copied to clipboard",
                        })
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <Button onClick={() => setShowViewDialog(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Type Selection Dialog */}
        <BookingTypeDialog
          open={showBookingTypeDialog}
          onOpenChange={setShowBookingTypeDialog}
          title="Create New Quote"
          description="Select the booking type for your quote"
          mode="quote"
        />
      </TooltipProvider>
      </div>
    </div>
  )
}

export default function QuotesPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBookingTypeDialog, setShowBookingTypeDialog] = useState(false)
  const [pdfDesign, setPdfDesign] = useState<PDFDesignType>("classic")
  const [stats, setStats] = useState({
    total: 0,
    generated: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    converted: 0,
    expired: 0,
  })
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate>(defaultQuoteTemplates[0])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  
  // Edit quote form state
  const [editFormData, setEditFormData] = useState({
    event_type: "",
    event_participant: "",
    payment_type: "",
    event_date: "",
    event_time: "",
    delivery_date: "",
    delivery_time: "",
    return_date: "",
    return_time: "",
    venue_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    bride_address: "",
    notes: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const initUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    initUser()
    
    loadQuotes()
    loadStats()

    const interval = setInterval(() => {
      loadQuotes()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterQuotes()
  }, [quotes, searchTerm, statusFilter, dateFilter])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await QuoteService.getAll()
      setQuotes(data)
    } catch (error) {
      console.error("Error loading quotes:", error)
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await QuoteService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const filterQuotes = () => {
    let filtered = quotes

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (quote) =>
          quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.customer_phone?.includes(searchTerm) ||
          quote.groom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quote) => quote.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((quote) => new Date(quote.created_at).toDateString() === filterDate.toDateString())
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter((quote) => new Date(quote.created_at) >= filterDate)
          break
      }
    }

    setFilteredQuotes(filtered)
  }

  const handleStatusUpdate = async (quoteId: string, newStatus: string) => {
    try {
      if (newStatus === "accepted") {
        // Find the quote to convert
        const quote = quotes.find((q) => q.id === quoteId)
        if (quote) {
          // Create booking from quote
          const bookingId = await BookingService.createFromQuote(quote)

          toast({
            title: "Success",
            description: `Quote accepted and converted to booking! Booking ID: ${bookingId.slice(0, 8)}...`,
          })
        }
      }

      await QuoteService.updateStatus(quoteId, newStatus)

      if (newStatus !== "accepted") {
        toast({
          title: "Success",
          description: "Quote status updated successfully",
        })
      }

      await loadQuotes()
      await loadStats()
    } catch (error) {
      console.error("Error updating quote status:", error)
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return

    try {
      await QuoteService.delete(quoteId)
      await loadQuotes()
      await loadStats()
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      })
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await Promise.all(selectedQuotes.map((id) => QuoteService.updateStatus(id, newStatus)))
      await loadQuotes()
      await loadStats()
      setSelectedQuotes([])
      toast({
        title: "Success",
        description: `Updated ${selectedQuotes.length} quotes to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quotes",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const franchiseId = user?.franchise_id
      if (!franchiseId) {
        console.warn("[PDF Download] No franchise_id available")
      }
      
      await downloadQuotePDF(quote, franchiseId, pdfDesign)

      toast({
        title: "Success",
        description: `Quote PDF (${pdfDesign}) downloaded successfully`,
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download quote PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog and populate form
  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote)
    
    // Parse date and time from ISO strings
    const eventDateTime = quote.event_date ? new Date(quote.event_date) : null
    const deliveryDateTime = quote.delivery_date ? new Date(quote.delivery_date) : null
    const returnDateTime = quote.return_date ? new Date(quote.return_date) : null
    
    setEditFormData({
      event_type: quote.event_type || "Wedding",
      event_participant: quote.event_participant || "Both",
      payment_type: quote.payment_type || "full",
      event_date: eventDateTime ? eventDateTime.toISOString().split('T')[0] : "",
      event_time: eventDateTime ? format(eventDateTime, "HH:mm") : "10:00",
      delivery_date: deliveryDateTime ? deliveryDateTime.toISOString().split('T')[0] : "",
      delivery_time: deliveryDateTime ? format(deliveryDateTime, "HH:mm") : "09:00",
      return_date: returnDateTime ? returnDateTime.toISOString().split('T')[0] : "",
      return_time: returnDateTime ? format(returnDateTime, "HH:mm") : "18:00",
      venue_address: quote.venue_address || "",
      groom_name: quote.groom_name || "",
      groom_whatsapp: quote.groom_whatsapp || "",
      groom_address: quote.groom_address || "",
      bride_name: quote.bride_name || "",
      bride_whatsapp: quote.bride_whatsapp || "",
      bride_address: quote.bride_address || "",
      notes: quote.notes || quote.special_instructions || "",
    })
    
    setShowEditDialog(true)
  }

  // Save edited quote
  const handleSaveQuote = async () => {
    if (!selectedQuote) return

    try {
      setIsSaving(true)
      
      // Combine date and time into ISO strings
      const eventDate = editFormData.event_date && editFormData.event_time
        ? new Date(`${editFormData.event_date}T${editFormData.event_time}`).toISOString()
        : null
      
      const deliveryDate = editFormData.delivery_date && editFormData.delivery_time
        ? new Date(`${editFormData.delivery_date}T${editFormData.delivery_time}`).toISOString()
        : null
      
      const returnDate = editFormData.return_date && editFormData.return_time
        ? new Date(`${editFormData.return_date}T${editFormData.return_time}`).toISOString()
        : null

      // Determine which table to update
      const table = selectedQuote.booking_type === 'package' ? 'package_bookings' : 'product_orders'
      
      // Prepare update data
      const updateData: any = {
        event_type: editFormData.event_type,
        event_participant: editFormData.event_participant,
        payment_type: editFormData.payment_type,
        event_date: eventDate,
        delivery_date: deliveryDate,
        return_date: returnDate,
        venue_address: editFormData.venue_address,
        groom_name: editFormData.groom_name,
        groom_whatsapp: editFormData.groom_whatsapp,
        groom_address: editFormData.groom_address,
        bride_name: editFormData.bride_name,
        bride_whatsapp: editFormData.bride_whatsapp,
        bride_address: editFormData.bride_address,
        notes: editFormData.notes,
        updated_at: new Date().toISOString(),
      }

      // Update the database
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', selectedQuote.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Quote updated successfully",
      })

      setShowEditDialog(false)
      await loadQuotes() // Refresh quotes list
    } catch (error) {
      console.error("Error updating quote:", error)
      toast({
        title: "Error",
        description: "Failed to update quote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

const getStatusBadge = (status: string) => {
    const statusConfig = {
      generated: { label: "Generated", variant: "secondary" as const, icon: FileText },
      sent: { label: "Sent", variant: "default" as const, icon: Send },
      accepted: { label: "Accepted", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
      converted: { label: "Converted", variant: "default" as const, icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.generated
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const exportQuotes = () => {
    const csvContent = [
      ["Quote Number", "Customer", "Phone", "Event Date", "Total Amount", "Status", "Created Date"].join(","),
      ...filteredQuotes.map((quote) =>
        [
          quote.quote_number,
          quote.customer_name || "",
          quote.customer_phone || "",
          quote.event_date || "",
          quote.total_amount,
          quote.status,
          new Date(quote.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Quote Number", "Customer", "Phone", "Event Date", "Total Amount", "Status", "Created Date"].join(","),
      ...filteredQuotes.map((quote) =>
        [
          quote.quote_number,
          quote.customer_name || "",
          quote.customer_phone || "",
          quote.event_date || "",
          quote.total_amount,
          quote.status,
          new Date(quote.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleTemplateSelect = (template: QuoteTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateSelector(false)
    toast({
      title: "Template Selected",
      description: `${template.name} template will be used for new quotes`,
    })
  }

  const handleTemplatePreview = (template: QuoteTemplate) => {
    setPreviewTemplate(template)
    setShowTemplatePreview(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quote Management</h1>
            <p className="text-muted-foreground">Generate and manage customer quotes</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadQuotes()
              toast({
                title: "Refreshed",
                description: "Quote data has been refreshed",
              })
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-3 w-3 mr-1" />
                New Quote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push('/create-product-order')}>
                <Package className="h-4 w-4 mr-2" />
                Product Booking
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/book-package')}>
                <FileText className="h-4 w-4 mr-2" />
                Package Booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <div className="flex items-center space-x-1">
              <CardTitle className="text-xs font-medium">Total Quotes</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total number of quotes generated across all statuses</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FileText className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <div className="flex items-center space-x-1">
              <CardTitle className="text-xs font-medium">Generated</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quotes that have been created but not yet sent to customers</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Clock className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.generated}</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <div className="flex items-center space-x-1">
              <CardTitle className="text-xs font-medium">Converted</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quotes that have been converted to confirmed bookings</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CheckCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <div className="flex items-center space-x-1">
              <CardTitle className="text-xs font-medium">Rejected</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quotes declined by customers - no further action required</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <XCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm">Filters</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter quotes by customer name, quote number, status, or date range</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search quotes, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="quote">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm">Quotes ({filteredQuotes.length})</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete list of quotes with customer details, amounts, and status management</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription className="text-xs">All generated quotes with customer details and status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-xs">Quote #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total quote amount including taxes and security deposit</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Quote status: Generated → Sent → Accepted/Rejected</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="h-12">
                    <TableCell className="font-medium text-xs">{quote.quote_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-xs">{quote.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{quote.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={quote.booking_type === 'package' ? 'default' : 'secondary'} className="text-xs">
                        {quote.booking_type === 'package' 
                          ? '📦 Package (Rent)' 
                          : `🛍️ Product (${quote.booking_subtype === 'sale' ? 'Sale' : 'Rent'})`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-xs">{quote.event_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "No date"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{formatCurrency(quote.total_amount)}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-xs">{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setShowViewDialog(true)
                          }}
                          title="View Quote Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuote(quote)}
                          title="Edit Quote"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadPDF(quote)}
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <ConvertQuoteDialog 
                          quote={quote}
                          onSuccess={(bookingId) => {
                            // Refresh quotes and optionally redirect to booking
                            loadQuotes()
                            toast({
                              title: "Success",
                              description: "Quote converted to booking successfully",
                            })
                          }}
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Convert to Booking"
                              disabled={quote.status !== "accepted" && quote.status !== "sent"}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
            <DialogDescription>Select a template to start with</DialogDescription>
          </DialogHeader>
          {/* Template selection UI here */}
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Details - {selectedQuote?.quote_number}
            </DialogTitle>
            <DialogDescription>Complete information for this quote</DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedQuote.customer_name || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedQuote.customer_phone || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">WhatsApp:</span> {selectedQuote.customer_whatsapp || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedQuote.customer_email || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {selectedQuote.customer_address || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">City:</span> {selectedQuote.customer_city || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">State:</span> {selectedQuote.customer_state || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Pincode:</span> {selectedQuote.customer_pincode || "N/A"}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Event Type:</span> {selectedQuote.event_type || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Event Date:</span>{" "}
                      {selectedQuote.event_date ? new Date(selectedQuote.event_date).toLocaleDateString() : "N/A"}
                    </div>
                    {selectedQuote.groom_name && (
                      <div>
                        <span className="font-medium">Groom Name:</span> {selectedQuote.groom_name}
                      </div>
                    )}
                    {selectedQuote.bride_name && (
                      <div>
                        <span className="font-medium">Bride Name:</span> {selectedQuote.bride_name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Venue Address:</span> {selectedQuote.venue_address || "N/A"}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quote & Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quote Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Quote #:</span> {selectedQuote.quote_number}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      <Badge variant={selectedQuote.booking_type === 'package' ? 'default' : 'secondary'}>
                        {selectedQuote.booking_type === 'package' 
                          ? '📦 Package (Rent)' 
                          : `🛍️ Product (${selectedQuote.booking_subtype === 'sale' ? 'Sale' : 'Rent'})`}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedQuote.status)}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedQuote.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delivery Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Delivery Date:</span>{" "}
                      {selectedQuote.delivery_date ? new Date(selectedQuote.delivery_date).toLocaleDateString() : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Return Date:</span>{" "}
                      {selectedQuote.return_date ? new Date(selectedQuote.return_date).toLocaleDateString() : "N/A"}
                    </div>
                    {selectedQuote.special_instructions && (
                      <div>
                        <span className="font-medium">Special Instructions:</span>
                        <p className="text-muted-foreground mt-1">{selectedQuote.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Quote Items */}
              {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Quote Items
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.quote_items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell>{formatCurrency(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Financial Breakdown */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedQuote.subtotal_amount || selectedQuote.total_amount)}</span>
                    </div>
                    {selectedQuote.discount_amount && selectedQuote.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">- {formatCurrency(selectedQuote.discount_amount)}</span>
                      </div>
                    )}
                    {selectedQuote.tax_amount && selectedQuote.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax (GST):</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.tax_amount)}</span>
                      </div>
                    )}
                    {selectedQuote.security_deposit && selectedQuote.security_deposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Security Deposit:</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.security_deposit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Total Amount:</span>
                      <span className="text-green-600 text-lg">{formatCurrency(selectedQuote.total_amount)}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes and Terms */}
              {(selectedQuote.notes || selectedQuote.terms_conditions) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedQuote.notes && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedQuote.notes}</p>
                    </Card>
                  )}

                  {selectedQuote.terms_conditions && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Terms & Conditions
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedQuote.terms_conditions}</p>
                    </Card>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end items-center pt-4 border-t gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedQuote)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quote Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Quote - {selectedQuote?.quote_number}
            </DialogTitle>
            <DialogDescription>
              Update event and wedding details for this quote
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Information (Read-only) */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer Name</Label>
                      <p className="text-sm font-medium mt-1">{selectedQuote.customer_name || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone Number</Label>
                      <p className="text-sm font-medium mt-1">{selectedQuote.customer_phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                      <p className="text-sm font-medium mt-1">{selectedQuote.customer_whatsapp || selectedQuote.customer_phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium mt-1">{selectedQuote.customer_email || "N/A"}</p>
                    </div>
                    {selectedQuote.customer_address && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p className="text-sm font-medium mt-1">{selectedQuote.customer_address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Event & Wedding Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event & Wedding Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Row 1: Event Type, Event Participant, Payment Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Event Type</Label>
                      <Select
                        value={editFormData.event_type}
                        onValueChange={(v) =>
                          setEditFormData({ ...editFormData, event_type: v })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wedding">Wedding</SelectItem>
                          <SelectItem value="Engagement">Engagement</SelectItem>
                          <SelectItem value="Reception">Reception</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Event Participant</Label>
                      <Select
                        value={editFormData.event_participant}
                        onValueChange={(v) =>
                          setEditFormData({ ...editFormData, event_participant: v })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Groom">Groom Only</SelectItem>
                          <SelectItem value="Bride">Bride Only</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Payment Type</Label>
                      <Select
                        value={editFormData.payment_type}
                        onValueChange={(v) =>
                          setEditFormData({ ...editFormData, payment_type: v })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Payment</SelectItem>
                          <SelectItem value="advance">Advance Payment</SelectItem>
                          <SelectItem value="partial">Partial Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Event Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Event Date *</Label>
                      <Input
                        type="date"
                        value={editFormData.event_date}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, event_date: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Event Time</Label>
                      <Input
                        type="time"
                        value={editFormData.event_time}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, event_time: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Row 3: Delivery Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Delivery Date</Label>
                      <Input
                        type="date"
                        value={editFormData.delivery_date}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, delivery_date: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Delivery Time</Label>
                      <Input
                        type="time"
                        value={editFormData.delivery_time}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, delivery_time: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Row 4: Return Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Return Date</Label>
                      <Input
                        type="date"
                        value={editFormData.return_date}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, return_date: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Return Time</Label>
                      <Input
                        type="time"
                        value={editFormData.return_time}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, return_time: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Venue Address */}
                  <div>
                    <Label className="text-xs">Venue Address</Label>
                    <Textarea
                      rows={2}
                      value={editFormData.venue_address}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, venue_address: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Enter venue address"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Groom Information - Show only if Groom or Both */}
              {(editFormData.event_participant === "Groom" || editFormData.event_participant === "Both") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Groom Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Groom Name</Label>
                        <Input
                          value={editFormData.groom_name}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, groom_name: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter groom's full name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Additional WhatsApp Number</Label>
                        <Input
                          value={editFormData.groom_whatsapp}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, groom_whatsapp: e.target.value })
                          }
                          className="mt-1"
                          placeholder="WhatsApp number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Home Address</Label>
                      <Textarea
                        rows={2}
                        value={editFormData.groom_address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, groom_address: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Full address with locality and pin code"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bride Information - Show only if Bride or Both */}
              {(editFormData.event_participant === "Bride" || editFormData.event_participant === "Both") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bride Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Bride Name</Label>
                        <Input
                          value={editFormData.bride_name}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bride_name: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter bride's full name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Additional WhatsApp Number</Label>
                        <Input
                          value={editFormData.bride_whatsapp}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, bride_whatsapp: e.target.value })
                          }
                          className="mt-1"
                          placeholder="WhatsApp number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Home Address</Label>
                      <Textarea
                        rows={2}
                        value={editFormData.bride_address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, bride_address: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Full address with locality and pin code"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                    placeholder="Any special instructions or requirements"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveQuote}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </div>
  )
}
