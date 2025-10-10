"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Download,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  ArrowLeft,
} from "lucide-react"
import { InvoiceService } from "@/lib/services/invoice-service"
import { useToast } from "@/hooks/use-toast"
import type { Invoice } from "@/lib/types"

interface InvoiceStats {
  total: number
  paid: number
  partially_paid: number
  overdue: number
  total_revenue: number
}

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <InvoicesPageContent />
      </div>
    </div>
  )
}

function InvoicesPageContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    partially_paid: 0,
    overdue: 0,
    total_revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadInvoices()
    loadStats()

    const interval = setInterval(() => {
      loadInvoices()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter, dateFilter])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await InvoiceService.getAll()
      setInvoices(data)
    } catch (error) {
      console.error("Error loading invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await InvoiceService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const filterInvoices = () => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer_phone?.includes(searchTerm) ||
          invoice.groom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.payment_status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(
            (invoice) => new Date(invoice.created_at).toDateString() === filterDate.toDateString(),
          )
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((invoice) => new Date(invoice.created_at) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((invoice) => new Date(invoice.created_at) >= filterDate)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter((invoice) => new Date(invoice.created_at) >= filterDate)
          break
      }
    }

    setFilteredInvoices(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const, icon: CheckCircle },
      partial: { label: "Partial", variant: "secondary" as const, icon: Clock },
      overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle },
      pending: { label: "Pending", variant: "outline" as const, icon: Clock },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
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
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {typeof window !== 'undefined' && (window as any).__INVOICE_SCHEMA_ERROR__ && (
        <div className="border border-red-300 bg-red-50 text-sm text-red-800 rounded-md p-4 space-y-2">
          <p className="font-semibold">Database schema missing for invoices.</p>
          <p>
            The tables <code>product_orders</code> / <code>package_bookings</code> or the column <code>is_quote</code> are not present.
            Run the migrations <code>MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql</code> and <code>ADD_QUOTE_SUPPORT.sql</code> in your Supabase SQL Editor.
          </p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Open Supabase Dashboard → SQL</li>
            <li>Paste contents of <code>MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql</code> and run</li>
            <li>Then run <code>ADD_QUOTE_SUPPORT.sql</code></li>
            <li>Reload this page</li>
          </ol>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>Reload After Migration</Button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">View and manage invoices for confirmed bookings and orders</p>
          </div>
        </div>
        <Button onClick={() => router.push("/create-product-order")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partially_paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Invoices</CardTitle>
          <CardDescription>Search and filter your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, customer name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadInvoices}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No invoices found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Invoices are automatically generated when quotes are converted or when orders are placed.
              </p>
              <Button onClick={() => router.push("/quotes")}>View Quotes</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Event Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.customer_name}</span>
                          <span className="text-sm text-muted-foreground">{invoice.customer_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {invoice.groom_name && invoice.bride_name ? (
                            <>
                              <span className="text-sm">
                                {invoice.groom_name} & {invoice.bride_name}
                              </span>
                              <span className="text-xs text-muted-foreground">{invoice.event_type || "Wedding"}</span>
                            </>
                          ) : (
                            <span className="text-sm">{invoice.invoice_type === "package_booking" ? "Package Booking" : "Product Order"}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(invoice.paid_amount || 0)}</TableCell>
                      <TableCell className="text-orange-600">{formatCurrency(invoice.pending_amount || 0)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.payment_status || "pending")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const editPath =
                                invoice.invoice_type === "package_booking"
                                  ? `/book-package?edit=${invoice.id}`
                                  : `/create-product-order?edit=${invoice.id}`
                              router.push(editPath)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {}}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
