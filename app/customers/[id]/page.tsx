"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AvatarInitials } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { Customer, Booking, Payment } from "@/lib/types"

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    lastBookingDate: null as string | null,
  })

  useEffect(() => {
    if (customerId) {
      loadCustomerData()
    }
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      setLoading(true)

      // Load customer details
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single()

      if (customerError) throw customerError
      setCustomer(customerData)

      // Load customer bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })

      if (bookingsError) throw bookingsError
      setBookings(bookingsData || [])

      // Load customer payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          booking:bookings(booking_number)
        `)
        .in(
          "booking_id",
          (bookingsData || []).map((b) => b.id),
        )
        .order("created_at", { ascending: false })

      if (paymentsError) throw paymentsError
      setPayments(paymentsData || [])

      // Calculate stats
      const totalBookings = bookingsData?.length || 0
      const totalSpent = bookingsData?.reduce((sum, booking) => sum + booking.amount_paid, 0) || 0
      const lastBookingDate = bookingsData?.[0]?.created_at || null

      setStats({
        totalBookings,
        totalSpent,
        lastBookingDate,
      })
    } catch (error) {
      console.error("Error loading customer data:", error)
      toast({
        title: "Error",
        description: "Failed to load customer data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      delivered: { label: "Delivered", variant: "outline" as const },
      returned: { label: "Returned", variant: "outline" as const },
      completed: { label: "Completed", variant: "default" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const },
      pending: { label: "Pending", variant: "secondary" as const },
      failed: { label: "Failed", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleEditCustomer = () => {
    router.push(`/customers/${customerId}/edit`)
  }

  const handleDeleteCustomer = async () => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return

    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      })

      router.push("/customers")
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold">Customer not found</h3>
          <p className="text-muted-foreground">The customer you're looking for doesn't exist.</p>
          <Button onClick={handleBackClick} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customer Details</h2>
            <p className="text-muted-foreground">View and manage customer information</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadCustomerData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleEditCustomer}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteCustomer}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            <AvatarInitials name={customer.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{customer.name}</CardTitle>
                  <CardDescription className="text-base">Customer ID: {customer.customer_code}</CardDescription>
                </div>
                <Badge variant="outline" className="text-sm">
                  Active Customer
                </Badge>
              </div>

              <div className="flex items-center space-x-6 mt-4">
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.city || "City"}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Booking</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastBookingDate ? new Date(stats.lastBookingDate).toLocaleDateString() : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent order</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{booking.booking_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{booking.total_amount.toLocaleString()}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No bookings found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground capitalize">{payment.method}</p>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Complete booking history for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.booking_number}</TableCell>
                      <TableCell className="capitalize">{booking.type.replace("_", " ")}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>₹{booking.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/bookings/${booking.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bookings.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No bookings found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This customer hasn't made any bookings yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments made by this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell>{payment.booking?.booking_number || "N/A"}</TableCell>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {payments.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No payments found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This customer hasn't made any payments yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Detailed customer profile and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-sm text-muted-foreground">{customer.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Code</label>
                  <p className="text-sm text-muted-foreground">{customer.customer_code}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <p className="text-sm text-muted-foreground">{customer.phone || "Not provided"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp</label>
                  <p className="text-sm text-muted-foreground">{customer.whatsapp || "Not provided"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <p className="text-sm text-muted-foreground">{customer.email || "Not provided"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <p className="text-sm text-muted-foreground">{customer.city || "Not provided"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm text-muted-foreground">{customer.address || "Not provided"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member Since</label>
                  <p className="text-sm text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-muted-foreground">{new Date(customer.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
