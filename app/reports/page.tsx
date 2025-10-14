"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { InventoryChart } from "@/components/charts/inventory-chart"
import { ExportDialog } from "@/components/reports/export-dialog"
import { getCurrentUser, canViewReports, canViewFinancials, canManageFranchises } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User, ChartData, ReportData } from "@/lib/types"
import {
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Printer,
  RefreshCw,
  ArrowLeft,
  Search,
  Lock,
  Shield,
} from "lucide-react"
import { AnimatedBackButton } from "@/components/ui/animated-back-button"
import type { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalyticsSummary {
  id: string
  franchise_id: string
  date: string
  total_revenue: number
  total_expenses: number
  total_bookings: number
  total_customers: number
  rental_revenue: number
  sales_revenue: number
  franchises?: {
    name: string
  }
}

interface ExpenseData {
  id: string
  franchise_id: string
  category_name: string
  amount: number
  description: string
  expense_date: string
  franchises?: {
    name: string
  }
}

interface ProductAnalytics {
  id: string
  name: string
  stock_total: number
  stock_available: number
  stock_damaged: number
  franchise_id: string
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [hasReportAccess, setHasReportAccess] = useState(false)
  const [hasFinancialAccess, setHasFinancialAccess] = useState(false)
  const [hasFranchiseAccess, setHasFranchiseAccess] = useState(false)
  const [reportData, setReportData] = useState<ReportData>({
    revenue: [],
    expenses: [],
    inventory: [],
    damages: [],
    salesVsRentals: [],
    franchiseComparison: [],
  })

  // Separate state for filter inputs vs applied filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 365), // Last 12 months to show more data
    to: new Date(),
  })
  const [franchiseFilter, setFranchiseFilter] = useState<string>("all")

  // Applied filters state (what's actually being used for data fetching)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 365),
    to: new Date(),
  })
  const [appliedFranchiseFilter, setAppliedFranchiseFilter] = useState<string>("all")

  const [franchises, setFranchises] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [usingFallbackData, setUsingFallbackData] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<{
    totalRevenue: number
    totalExpenses: number
    totalBookings: number
    totalCustomers: number
    netProfit: number
    profitMargin: number
  }>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalBookings: 0,
    totalCustomers: 0,
    netProfit: 0,
    profitMargin: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/")
        return
      }

      const reportAccess = canViewReports(currentUser.role)
      const financialAccess = canViewFinancials(currentUser.role)
      const franchiseAccess = canManageFranchises(currentUser.role)

      if (!reportAccess) {
        toast({
          title: "Access Denied",
          description: `Your role (${currentUser.role.replace("_", " ").toUpperCase()}) doesn't have permission to view reports and analytics.`,
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      console.log("[v0] Analytics access granted:", {
        user: currentUser.name,
        role: currentUser.role,
        reportAccess,
        financialAccess,
        franchiseAccess,
        franchise_id: currentUser.franchise_id,
      })

      setUser(currentUser)
      setHasReportAccess(reportAccess)
      setHasFinancialAccess(financialAccess)
      setHasFranchiseAccess(franchiseAccess)

      await loadFranchises(currentUser)
      await loadReportData(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Only trigger data loading when applied filters change
  useEffect(() => {
    if (user) {
      loadReportData(user)
    }
  }, [appliedDateRange, appliedFranchiseFilter, user])

  const loadFranchises = async (currentUser: User) => {
    if (currentUser.role === "super_admin") {
      try {
        const { data, error } = await supabase.from("franchises").select("id, name").eq("is_active", true).order("name")

        if (error) throw error
        setFranchises(data || [])
      } catch (error) {
        console.error("Error loading franchises:", error)
        toast({
          title: "Error",
          description: "Failed to load franchises",
          variant: "destructive",
        })
      }
    }
  }

  const loadReportData = async (currentUser: User) => {
    setRefreshing(true)
    setUsingFallbackData(false)

    console.log("Loading analytics data from Supabase...")
    console.log("[v0] User permissions check:", {
      role: currentUser.role,
      hasReportAccess: canViewReports(currentUser.role),
      hasFinancialAccess: canViewFinancials(currentUser.role),
      hasFranchiseAccess: canManageFranchises(currentUser.role),
    })

    try {
      const fromDate = appliedDateRange?.from
        ? format(appliedDateRange.from, "yyyy-MM-dd")
        : format(subDays(new Date(), 365), "yyyy-MM-dd")
      const toDate = appliedDateRange?.to ? format(appliedDateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

      console.log("Date range:", fromDate, "to", toDate)

      // Try to load real data from Supabase
      await loadRealData(currentUser, fromDate, toDate)

      toast({
        title: "Data Loaded Successfully",
        description: "Loaded analytics data from Supabase database.",
        variant: "default",
      })
    } catch (error) {
      console.log("Real data loading failed, using fallback data")
      console.error("Analytics error details:", error)

      // Use fallback data on error
      await processFallbackData()
      setUsingFallbackData(true)

      toast({
        title: "Using Demo Data",
        description:
          "Analytics tables not found. Displaying sample data. Please run the SQL script to create analytics tables.",
        variant: "default",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const loadRealData = async (currentUser: User, fromDate: string, toDate: string) => {
    console.log("Attempting to load real data from Supabase tables...")
    console.log("[v0] Loading data with role-based restrictions:", {
      role: currentUser.role,
      franchise_id: currentUser.franchise_id,
      appliedFranchiseFilter,
    })

    // Load analytics summary data
    let analyticsQuery = supabase
      .from("analytics_summary")
      .select("*")
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: true })

    if (currentUser.role === "staff" || currentUser.role === "readonly") {
      // Staff and readonly users can only see their own franchise data
      if (currentUser.franchise_id) {
        analyticsQuery = analyticsQuery.eq("franchise_id", currentUser.franchise_id)
      } else {
        throw new Error("No franchise access for staff user")
      }
    } else if (currentUser.role === "franchise_admin") {
      // Franchise admins can only see their own franchise data
      if (currentUser.franchise_id) {
        analyticsQuery = analyticsQuery.eq("franchise_id", currentUser.franchise_id)
      }
    } else if (currentUser.role === "super_admin") {
      // Super admins can see all data or filter by specific franchise
      if (appliedFranchiseFilter !== "all") {
        analyticsQuery = analyticsQuery.eq("franchise_id", appliedFranchiseFilter)
      }
    }

    const { data: analyticsResult, error: analyticsError } = await analyticsQuery

    if (analyticsError) {
      console.error("Analytics query error:", analyticsError)
      throw new Error(`Analytics table error: ${analyticsError.message}`)
    }

    // Get franchise names separately if needed
    let franchiseNames: { [key: string]: string } = {}
    if (analyticsResult && analyticsResult.length > 0) {
      const franchiseIds = [...new Set(analyticsResult.map((item) => item.franchise_id))]
      const { data: franchiseData } = await supabase.from("franchises").select("id, name").in("id", franchiseIds)

      if (franchiseData) {
        franchiseNames = franchiseData.reduce(
          (acc, franchise) => {
            acc[franchise.id] = franchise.name
            return acc
          },
          {} as { [key: string]: string },
        )
      }
    }

    console.log("Analytics data loaded:", analyticsResult?.length, "records")

    let expenseResult: ExpenseData[] = []
    if (hasFinancialAccess) {
      let expenseQuery = supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", fromDate)
        .lte("expense_date", toDate)
        .order("expense_date", { ascending: true })

      // Apply same role-based filtering for expenses
      if (currentUser.role === "staff" || currentUser.role === "readonly") {
        if (currentUser.franchise_id) {
          expenseQuery = expenseQuery.eq("franchise_id", currentUser.franchise_id)
        }
      } else if (currentUser.role === "franchise_admin") {
        if (currentUser.franchise_id) {
          expenseQuery = expenseQuery.eq("franchise_id", currentUser.franchise_id)
        }
      } else if (currentUser.role === "super_admin" && appliedFranchiseFilter !== "all") {
        expenseQuery = expenseQuery.eq("franchise_id", appliedFranchiseFilter)
      }

      const { data: expenseData, error: expenseError } = await expenseQuery

      if (expenseError) {
        console.error("Expense query error:", expenseError)
        // Don't throw error for expenses, use empty array
      } else {
        expenseResult = expenseData || []
      }
    }

    console.log("Expense data loaded:", expenseResult?.length || 0, "records")

    // Load product data for inventory analysis
    let productQuery = supabase
      .from("products")
      .select(`
        id,
        name,
        stock_total,
        stock_available,
        stock_damaged,
        franchise_id
      `)
      .eq("is_active", true)

    if (currentUser.role === "staff" || currentUser.role === "readonly") {
      if (currentUser.franchise_id) {
        productQuery = productQuery.eq("franchise_id", currentUser.franchise_id)
      }
    } else if (currentUser.role === "franchise_admin") {
      if (currentUser.franchise_id) {
        productQuery = productQuery.eq("franchise_id", currentUser.franchise_id)
      }
    } else if (currentUser.role === "super_admin" && appliedFranchiseFilter !== "all") {
      productQuery = productQuery.eq("franchise_id", appliedFranchiseFilter)
    }

    const { data: productResult, error: productError } = await productQuery

    if (productError) {
      console.error("Product query error:", productError)
      // Don't throw error for products, use empty array
    }

    console.log("Product data loaded:", productResult?.length || 0, "records")

    // Process real data with franchise names
    await processRealData(analyticsResult || [], expenseResult || [], productResult || [], franchiseNames)
  }

  const processRealData = async (
    analyticsData: AnalyticsSummary[],
    expenseData: ExpenseData[],
    productData: ProductAnalytics[],
    franchiseNames: { [key: string]: string } = {},
  ) => {
    console.log("Processing real data from Supabase...")

    // Calculate summary metrics
    const totalRevenue = analyticsData.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0)
    const totalExpenses = analyticsData.reduce((sum, item) => sum + (Number(item.total_expenses) || 0), 0)
    const totalBookings = analyticsData.reduce((sum, item) => sum + (Number(item.total_bookings) || 0), 0)
    const totalCustomers = Math.max(...analyticsData.map((item) => Number(item.total_customers) || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    setAnalyticsData({
      totalRevenue,
      totalExpenses,
      totalBookings,
      totalCustomers,
      netProfit,
      profitMargin,
    })

    // Process revenue data for charts
    const revenueChartData: ChartData[] = analyticsData.map((item) => ({
      name: format(new Date(item.date), "MMM yyyy"),
      value: Number(item.total_revenue) || 0,
    }))

    // Process expense data for charts - group by category
    const expenseByCategory = expenseData.reduce((acc: { [key: string]: number }, item) => {
      const category = item.category_name || "MISCELLANEOUS"
      acc[category] = (acc[category] || 0) + (Number(item.amount) || 0)
      return acc
    }, {})

    const expenseChartData: ChartData[] = Object.entries(expenseByCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
    }))

    // Process inventory data - group by category (use 'PRODUCTS' as default since category column doesn't exist)
    const inventoryByCategory = productData.reduce((acc: { [key: string]: number }, item) => {
      const category = "PRODUCTS" // Since category column doesn't exist, group all as 'PRODUCTS'
      acc[category] = (acc[category] || 0) + (Number(item.stock_total) || 0)
      return acc
    }, {})

    const inventoryChartData: ChartData[] = Object.entries(inventoryByCategory).map(([category, total]) => ({
      name: category,
      value: total,
    }))

    // Process damaged items data
    const damagesChartData: ChartData[] = productData
      .filter((item) => (Number(item.stock_damaged) || 0) > 0)
      .map((item) => ({
        name: item.name || "Unknown Product",
        value: Number(item.stock_damaged) || 0,
      }))

    // Process sales vs rentals data
    const totalRentalRevenue = analyticsData.reduce((sum, item) => sum + (Number(item.rental_revenue) || 0), 0)
    const totalSalesRevenue = analyticsData.reduce((sum, item) => sum + (Number(item.sales_revenue) || 0), 0)

    const salesVsRentalsData: ChartData[] = [
      { name: "Rentals", value: totalRentalRevenue },
      { name: "Sales", value: totalSalesRevenue },
    ]

    // Process franchise comparison (for super admin)
    let franchiseComparisonData: ChartData[] = []
    if (user?.role === "super_admin" && appliedFranchiseFilter === "all") {
      const franchiseRevenue = analyticsData.reduce((acc: { [key: string]: number }, item) => {
        const franchiseName = franchiseNames[item.franchise_id] || "Unknown Franchise"
        acc[franchiseName] = (acc[franchiseName] || 0) + (Number(item.total_revenue) || 0)
        return acc
      }, {})

      franchiseComparisonData = Object.entries(franchiseRevenue).map(([name, revenue]) => ({
        name,
        value: revenue,
      }))
    }

    setReportData({
      revenue: revenueChartData,
      expenses: expenseChartData,
      inventory: inventoryChartData,
      damages: damagesChartData,
      salesVsRentals: salesVsRentalsData,
      franchiseComparison: franchiseComparisonData,
    })

    console.log("Real data processed successfully")
  }

  const processFallbackData = async () => {
    console.log("Processing fallback demo data...")

    // Mock analytics data for the last 6 months
    const mockAnalyticsData = [
      {
        date: "2024-03-01",
        total_revenue: 125000,
        total_expenses: 43500,
        total_bookings: 18,
        total_customers: 12,
        rental_revenue: 95000,
        sales_revenue: 30000,
      },
      {
        date: "2024-04-01",
        total_revenue: 185000,
        total_expenses: 55700,
        total_bookings: 25,
        total_customers: 18,
        rental_revenue: 135000,
        sales_revenue: 50000,
      },
      {
        date: "2024-05-01",
        total_revenue: 165000,
        total_expenses: 55300,
        total_bookings: 22,
        total_customers: 16,
        rental_revenue: 115000,
        sales_revenue: 50000,
      },
      {
        date: "2024-06-01",
        total_revenue: 195000,
        total_expenses: 51700,
        total_bookings: 28,
        total_customers: 20,
        rental_revenue: 145000,
        sales_revenue: 50000,
      },
      {
        date: "2024-07-01",
        total_revenue: 225000,
        total_expenses: 79300,
        total_bookings: 32,
        total_customers: 24,
        rental_revenue: 175000,
        sales_revenue: 50000,
      },
      {
        date: "2024-08-01",
        total_revenue: 245000,
        total_expenses: 85500,
        total_bookings: 35,
        total_customers: 28,
        rental_revenue: 195000,
        sales_revenue: 50000,
      },
    ]

    const mockExpenseData = [
      { category_name: "RENT", total_amount: 150000 },
      { category_name: "UTILITIES", total_amount: 48000 },
      { category_name: "MARKETING", total_amount: 90000 },
      { category_name: "SUPPLIES", total_amount: 42000 },
      { category_name: "MAINTENANCE", total_amount: 40700 },
      { category_name: "STAFF", total_amount: 108000 },
      { category_name: "TRANSPORT", total_amount: 41800 },
    ]

    const mockProductData = [
      { name: "Royal Turban", category: "TURBAN", stock_total: 45, stock_damaged: 2 },
      { name: "Golden Sehra", category: "SEHRA", stock_total: 23, stock_damaged: 0 },
      { name: "Pearl Kalgi", category: "KALGI", stock_total: 18, stock_damaged: 1 },
      { name: "Diamond Necklace", category: "NECKLACE", stock_total: 32, stock_damaged: 1 },
      { name: "Wedding Shoes", category: "SHOES", stock_total: 28, stock_damaged: 0 },
      { name: "Silk Dupatta", category: "DUPATTA", stock_total: 35, stock_damaged: 0 },
      { name: "Gold Bracelet", category: "BRACELET", stock_total: 15, stock_damaged: 1 },
    ]

    // Process fallback data
    const totalRevenue = mockAnalyticsData.reduce((sum, item) => sum + item.total_revenue, 0)
    const totalExpenses = mockAnalyticsData.reduce((sum, item) => sum + item.total_expenses, 0)
    const totalBookings = mockAnalyticsData.reduce((sum, item) => sum + item.total_bookings, 0)
    const totalCustomers = Math.max(...mockAnalyticsData.map((item) => item.total_customers))
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    setAnalyticsData({
      totalRevenue,
      totalExpenses,
      totalBookings,
      totalCustomers,
      netProfit,
      profitMargin,
    })

    // Process revenue data for charts
    const revenueChartData: ChartData[] = mockAnalyticsData.map((item) => ({
      name: format(new Date(item.date), "MMM yyyy"),
      value: item.total_revenue,
    }))

    // Process expense data for charts
    const expenseChartData: ChartData[] = mockExpenseData.map((item) => ({
      name: item.category_name,
      value: item.total_amount,
    }))

    // Process inventory data
    const inventoryChartData: ChartData[] = mockProductData.reduce((acc: ChartData[], item: any) => {
      const existing = acc.find((x) => x.name === item.category)
      if (existing) {
        existing.value += item.stock_total
      } else {
        acc.push({
          name: item.category,
          value: item.stock_total,
        })
      }
      return acc
    }, [])

    // Process damaged items data
    const damagesChartData: ChartData[] = mockProductData
      .filter((item) => item.stock_damaged > 0)
      .map((item) => ({
        name: item.name,
        value: item.stock_damaged,
      }))

    // Process sales vs rentals data
    const totalRentalRevenue = mockAnalyticsData.reduce((sum, item) => sum + item.rental_revenue, 0)
    const totalSalesRevenue = mockAnalyticsData.reduce((sum, item) => sum + item.sales_revenue, 0)

    const salesVsRentalsData: ChartData[] = [
      { name: "Rentals", value: totalRentalRevenue },
      { name: "Sales", value: totalSalesRevenue },
    ]

    // Mock franchise comparison data
    const franchiseComparisonData: ChartData[] = [
      { name: "Mumbai Central", value: 450000 },
      { name: "Delhi North", value: 380000 },
      { name: "Bangalore South", value: 310000 },
    ]

    setReportData({
      revenue: revenueChartData,
      expenses: expenseChartData,
      inventory: inventoryChartData,
      damages: damagesChartData,
      salesVsRentals: salesVsRentalsData,
      franchiseComparison: franchiseComparisonData,
    })

    console.log("Fallback data processed successfully")
  }

  const handleApplyFilters = () => {
    setAppliedDateRange(dateRange)
    setAppliedFranchiseFilter(franchiseFilter)

    toast({
      title: "Filters Applied",
      description: "Loading data with new filters...",
      variant: "default",
    })
  }

  const handleRefresh = () => {
    if (user) {
      loadReportData(user)
    }
  }

  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    setIsExporting(true)

    try {
      const exportData = {
        reportType: "Business Analytics Report",
        dateRange: appliedDateRange,
        franchiseFilter: appliedFranchiseFilter !== "all" ? appliedFranchiseFilter : null,
        reportData,
        ...analyticsData,
        topProducts: [
          { name: "Royal Turban Set", category: "Turban", bookings: 45, revenue: 225000 },
          { name: "Golden Sehra", category: "Sehra", bookings: 32, revenue: 160000 },
          { name: "Pearl Kalgi", category: "Kalgi", bookings: 28, revenue: 140000 },
        ],
      }

      if (format === "csv") {
        const csvContent = [
          ["Safawala CRM - Business Report"],
          ["Generated on:", new Date().toLocaleDateString()],
          [
            "Date Range:",
            `${appliedDateRange?.from?.toLocaleDateString()} - ${appliedDateRange?.to?.toLocaleDateString()}`,
          ],
          ["Data Source:", usingFallbackData ? "Demo Data" : "Supabase Database"],
          [""],
          ["SUMMARY"],
          ["Total Revenue", `₹${exportData.totalRevenue.toLocaleString()}`],
          ["Total Expenses", `₹${exportData.totalExpenses.toLocaleString()}`],
          ["Net Profit", `₹${exportData.netProfit.toLocaleString()}`],
          ["Profit Margin", `${exportData.profitMargin.toFixed(2)}%`],
          ["Total Bookings", exportData.totalBookings],
          ["Total Customers", exportData.totalCustomers],
          [""],
          ["REVENUE BY MONTH"],
          ["Month", "Revenue"],
          ...reportData.revenue.map((item) => [item.name, `₹${item.value.toLocaleString()}`]),
          [""],
          ["EXPENSES BY CATEGORY"],
          ["Category", "Amount"],
          ...reportData.expenses.map((item) => [item.name, `₹${item.value.toLocaleString()}`]),
          [""],
          ["INVENTORY BY CATEGORY"],
          ["Category", "Items"],
          ...reportData.inventory.map((item) => [item.name, item.value]),
        ]
          .map((row) => row.join(","))
          .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `safawala-report-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleInitializeAnalytics = async () => {
    try {
      toast({
        title: "Analytics Setup Required",
        description:
          "Please run the 'create-analytics-dummy-data.sql' script in your Supabase SQL editor to create analytics tables with sample data.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error initializing analytics:", error)
      toast({
        title: "Error",
        description: "Failed to initialize analytics tables",
        variant: "destructive",
      })
    }
  }

  // Check if filters have changed from applied filters
  const filtersChanged =
    dateRange?.from?.getTime() !== appliedDateRange?.from?.getTime() ||
    dateRange?.to?.getTime() !== appliedDateRange?.to?.getTime() ||
    franchiseFilter !== appliedFranchiseFilter

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) return null

  if (!hasReportAccess) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-4">
            <AnimatedBackButton variant="outline" size="sm" onClick={() => router.back()} />
            <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You don't have permission to view analytics and reports. Please contact your administrator to request
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <Shield className="h-4 w-4" />
              <span>Current role: {user.role.replace("_", " ").toUpperCase()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <AnimatedBackButton variant="outline" size="sm" onClick={() => router.back()} />
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          {usingFallbackData && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Demo Data</div>
          )}
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {user.role.replace("_", " ").toUpperCase()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          {usingFallbackData && (
            <Button variant="default" onClick={handleInitializeAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Setup Analytics
            </Button>
          )}
          <Button onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Advanced Export
          </Button>
        </div>
      </div>

      {!hasFinancialAccess && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Financial data (expenses, profit margins) is restricted for your role. Contact your administrator for
            access.
          </AlertDescription>
        </Alert>
      )}

      {usingFallbackData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Using Demo Data
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Analytics tables are not set up in your database. The data shown below is for demonstration purposes only.
              To view real analytics data, please run the SQL script to create the required tables with sample data.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range for report"
              />
            </div>
            {hasFranchiseAccess && (
              <div className="min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Franchise</label>
                <Select value={franchiseFilter} onValueChange={setFranchiseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Franchises</SelectItem>
                    {franchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleApplyFilters} disabled={!filtersChanged || refreshing} className="min-w-[120px]">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>

          {filtersChanged && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <AlertTriangle className="inline mr-1 h-4 w-4" />
                Filters have been modified. Click "Apply Filters" to update the data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData.totalRevenue.toLocaleString()}</div>
            {hasFinancialAccess ? (
              <p className="text-xs text-muted-foreground">Profit Margin: {analyticsData.profitMargin.toFixed(1)}%</p>
            ) : (
              <p className="text-xs text-muted-foreground text-red-600">
                <Lock className="inline h-3 w-3 mr-1" />
                Financial details restricted
              </p>
            )}
          </CardContent>
        </Card>

        {hasFinancialAccess ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analyticsData.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((analyticsData.totalExpenses / Math.max(analyticsData.totalRevenue, 1)) * 100).toFixed(1)}% of revenue
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Total Expenses
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">Restricted</div>
              <p className="text-xs text-red-600">Financial access required</p>
            </CardContent>
          </Card>
        )}

        {hasFinancialAccess ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analyticsData.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{analyticsData.netProfit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{analyticsData.totalBookings} total bookings</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Net Profit
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">Restricted</div>
              <p className="text-xs text-red-600">Financial access required</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active customer base</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          {hasFinancialAccess && <TabsTrigger value="expenses">Expenses</TabsTrigger>}
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          {hasFinancialAccess && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
          {hasFranchiseAccess && <TabsTrigger value="franchises">Franchises</TabsTrigger>}
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueChart data={reportData.revenue} title="Revenue Trend" type="line" />
            <RevenueChart data={reportData.salesVsRentals} title="Sales vs Rentals" type="pie" />
          </div>
        </TabsContent>

        {hasFinancialAccess && (
          <TabsContent value="expenses" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <RevenueChart data={reportData.expenses} title="Expenses by Category" type="bar" />
              <RevenueChart data={reportData.expenses} title="Expense Distribution" type="pie" />
            </div>
          </TabsContent>
        )}

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InventoryChart data={reportData.inventory} title="Inventory by Category" type="bar" />
            {reportData.damages.length > 0 && (
              <InventoryChart data={reportData.damages} title="Damaged Items" type="pie" />
            )}
          </div>
        </TabsContent>

        {hasFinancialAccess && (
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Expenses</CardTitle>
                  <CardDescription>Financial performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Revenue</span>
                      <span className="font-bold text-green-600">₹{analyticsData.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expenses</span>
                      <span className="font-bold text-red-600">₹{analyticsData.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Net Profit</span>
                        <span
                          className={`font-bold ${analyticsData.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₹{analyticsData.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Profit Margin: {analyticsData.profitMargin.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Bookings</span>
                      <span className="font-bold">{analyticsData.totalBookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Customers</span>
                      <span className="font-bold">{analyticsData.totalCustomers}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Avg Revenue per Booking</span>
                        <span className="font-bold text-blue-600">
                          ₹
                          {analyticsData.totalBookings > 0
                            ? Math.round(analyticsData.totalRevenue / analyticsData.totalBookings).toLocaleString()
                            : 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Revenue per customer: ₹
                      {analyticsData.totalCustomers > 0
                        ? Math.round(analyticsData.totalRevenue / analyticsData.totalCustomers).toLocaleString()
                        : 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {hasFranchiseAccess && (
          <TabsContent value="franchises" className="space-y-4">
            {reportData.franchiseComparison.length > 0 ? (
              <RevenueChart data={reportData.franchiseComparison} title="Franchise Performance Comparison" type="bar" />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    No franchise comparison data available for the selected period
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        reportData={{
          ...analyticsData,
          topProducts: [
            { name: "Royal Turban Set", category: "Turban", bookings: 45, revenue: 225000 },
            { name: "Golden Sehra", category: "Sehra", bookings: 32, revenue: 160000 },
            { name: "Pearl Kalgi", category: "Kalgi", bookings: 28, revenue: 140000 },
          ],
        }}
        dateRange={appliedDateRange}
        selectedFranchise={appliedFranchiseFilter}
        reportType="Business Analytics Report"
      />
    </div>
  )
}
