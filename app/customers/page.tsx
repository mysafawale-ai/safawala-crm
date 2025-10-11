"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useData } from "@/hooks/use-data"
import { getCurrentUser } from "@/lib/auth"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Eye,
  MessageCircle,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { User, Customer } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"

export default function CustomersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const router = useRouter()

  const { data: customers = [], loading, error, refresh } = useData<Customer[]>("customers")
  const { data: bookings = [] } = useData("bookings")

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)
    }
    checkAuth()
  }, [router])

  const filteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) {
      return []
    }
    
    return customers.filter(
      (customer: Customer) =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [customers, searchTerm])

  const handleWhatsApp = (customer: Customer) => {
    const phone = customer.whatsapp || customer.phone
    const message = `Hello ${customer.name}, thank you for choosing Safawala Wedding Accessories!`
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) {
      toast.error("No customer selected for deletion")
      return
    }

    // Validate customer ID
    const customerId = customerToDelete.id
    if (!customerId || typeof customerId !== 'string') {
      toast.error("Invalid customer ID")
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
      return
    }

    console.log('[Delete Customer] Starting deletion for:', {
      id: customerId,
      name: customerToDelete.name,
      code: customerToDelete.customer_code
    })

    try {
      // Make DELETE request
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log('[Delete Customer] Response status:', response.status)

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = "Failed to delete customer"
        
        // Try to parse error response
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
            
            // Handle specific error cases
            if (response.status === 404) {
              errorMessage = "Customer not found. It may have already been deleted."
            } else if (response.status === 409) {
              errorMessage = errorData.error || "Cannot delete customer with existing bookings or orders."
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "You don't have permission to delete this customer."
            }
          } catch (parseError) {
            console.error('[Delete Customer] Failed to parse error response:', parseError)
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      // Parse success response
      let responseData
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          responseData = await response.json()
        }
      } catch (parseError) {
        console.warn('[Delete Customer] Could not parse success response:', parseError)
      }

      // Success!
      console.log('[Delete Customer] Successfully deleted:', responseData)
      toast.success(`Customer "${customerToDelete.name}" deleted successfully`)
      
      // Close dialog and refresh list
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
      refresh()

    } catch (error: any) {
      console.error('[Delete Customer] Error:', error)
      
      // Show user-friendly error message
      const errorMessage = error.message || "Failed to delete customer. Please try again."
      toast.error(errorMessage)
      
      // Keep dialog open on error so user can try again or cancel
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading customers: {error}</p>
          <Button onClick={refresh} className="mt-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

  if (loading) {
    return (
      <DashboardLayout userRole={user.role}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
              <p className="text-muted-foreground">Manage your customer database and relationships</p>
            </div>
            <Link href="/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={8} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={user.role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
            <p className="text-muted-foreground">Manage your customer database and relationships</p>
          </div>
          <Link href="/customers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(customers) ? customers.length : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(customers) ? customers.length : 0}</div>
              <p className="text-xs text-muted-foreground">100% active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(bookings) ? bookings.length : 0}</div>
              <p className="text-xs text-muted-foreground">Customer bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{Array.isArray(customers) ? customers.length : 0}</div>
              <p className="text-xs text-muted-foreground">New customers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <Badge variant={customer.status === 'inactive' ? "destructive" : "default"}>
                      {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{customer.customer_code}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {customer.franchise && (
                      <div className="mb-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {customer.franchise.name}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{customer.phone}</span>
                    </div>

                    {customer.whatsapp && (
                      <div className="flex items-center gap-2 text-sm">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <span>{customer.whatsapp}</span>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {customer.address}
                          {customer.city && `, ${customer.city}`} - {customer.pincode}
                          {customer.state && `, ${customer.state}`}
                        </span>
                      </div>
                    )}
                    
                    {customer.staff_assignments && customer.staff_assignments.length > 0 && (
                      <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
                        <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-500">Assigned to:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customer.staff_assignments.map(assignment => (
                              <Badge key={assignment.id} variant="outline" className="text-xs">
                                {assignment.staff.first_name} {assignment.staff.last_name}
                                {assignment.role === 'primary' && ' (Primary)'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-1 pt-3">
                    <Link href={`/customers/${customer.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/customers/${customer.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    {customer.whatsapp && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(customer)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(customer)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first customer."}
                  </p>
                  <Link href="/customers/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{customerToDelete?.name}</strong> and all associated data.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Customer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
