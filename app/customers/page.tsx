"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Building2,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { User, Customer } from "@/lib/types"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"

export default function CustomersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
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

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCustomers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleWhatsApp = (customer: Customer) => {
    const phone = customer.whatsapp || customer.phone
    const message = `Hello ${customer.name}, thank you for choosing Safawala Wedding Accessories!`
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewDialogOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer)
    setEditDialogOpen(true)
  }

  const handleCustomerUpdated = (updatedCustomer: any) => {
    // Refresh the customer list
    refresh()
    setCustomerToEdit(null)
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
      // Use unified delete endpoint for permanent deletion
      const response = await fetch(`/api/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ entity: 'customer', id: customerId, hard: true })
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
  toast.success(`Customer "${customerToDelete.name}" permanently deleted`)
      
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
          {paginatedCustomers.length > 0 ? (
            paginatedCustomers.map((customer) => (
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-transparent"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-transparent"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
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

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{" "}
                    {filteredCustomers.length} customers
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* View Customer Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Customer Details
              </DialogTitle>
              <DialogDescription>
                Complete information about {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                    <p className="text-base font-semibold mt-1">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer Code</label>
                    <p className="text-base font-mono mt-1">{selectedCustomer.customer_code || 'N/A'}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-base mt-1 flex items-center gap-2">
                        {selectedCustomer.phone || 'N/A'}
                        {selectedCustomer.phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => window.open(`tel:${selectedCustomer.phone}`)}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                      <p className="text-base mt-1 flex items-center gap-2">
                        {selectedCustomer.whatsapp || selectedCustomer.phone || 'N/A'}
                        {(selectedCustomer.whatsapp || selectedCustomer.phone) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-green-600"
                            onClick={() => handleWhatsApp(selectedCustomer)}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base mt-1">{selectedCustomer.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h3>
                  <p className="text-base bg-muted p-3 rounded-md">
                    {selectedCustomer.address || 'No address provided'}
                  </p>
                </div>

                {/* Franchise Info */}
                {selectedCustomer.franchise && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Franchise
                    </h3>
                    <Badge variant="secondary" className="text-sm">
                      {selectedCustomer.franchise.name}
                    </Badge>
                  </div>
                )}

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Notes</h3>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {typeof selectedCustomer.notes === 'string' ? selectedCustomer.notes : JSON.stringify(selectedCustomer.notes)}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Array.isArray(bookings) ? bookings.filter((b: any) => b.customer_id === selectedCustomer.id).length : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {(selectedCustomer as any).is_active !== false ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1" 
                    variant="default"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleEditCustomer(selectedCustomer)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <CustomerFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onCustomerCreated={handleCustomerUpdated}
          mode="edit"
          customer={customerToEdit}
        />
      </div>
    </DashboardLayout>
  )
}
