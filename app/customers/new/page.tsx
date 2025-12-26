"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, MapPin, CheckCircle, XCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { toast } from "sonner"
import { PincodeService } from "@/lib/pincode-service"
import { getCurrentUser } from "@/lib/auth"
import { supabaseService } from "@/lib/supabase"
import type { User } from "@/lib/types"

interface CustomerFormData {
  name: string
  phone: string
  whatsapp: string
  address: string
  city: string
  state: string
  pincode: string
  franchise_id: string
}

interface Franchise {
  id: string
  name: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    franchise_id: "",
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/")
          return
        }
        setUser(currentUser)

        const franchisesData = await supabaseService.getFranchises()
        setFranchises(franchisesData || [])

        if (currentUser.franchise_id) {
          setFormData((prev) => ({ ...prev, franchise_id: currentUser.franchise_id || "" }))
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast.error("Failed to load franchise data")
      }
    }

    loadInitialData()
  }, [router])

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePincodeChange = async (pincode: string) => {
    handleInputChange("pincode", pincode)
    setPincodeStatus("idle")

    if (pincode.length < 6) {
      setFormData((prev) => ({
        ...prev,
        city: "",
        state: "",
      }))
    }

    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setPincodeLoading(true)
      console.log("Pincode validation starting for:", pincode)

      try {
        const pincodeData = await PincodeService.lookup(pincode)
        console.log("Pincode lookup result:", pincodeData)

        if (pincodeData) {
          setFormData((prev) => ({
            ...prev,
            city: pincodeData.city,
            state: pincodeData.state,
            // Auto-populate address with area if address is empty
            address: prev.address.trim() === "" ? pincodeData.area : prev.address,
          }))
          setPincodeStatus("valid")
          toast.success(`Location found: ${pincodeData.area}, ${pincodeData.city}, ${pincodeData.state}`)
        } else {
          setPincodeStatus("invalid")
          toast.error("Invalid pincode or location not found")
        }
      } catch (error) {
        console.error("Pincode lookup error:", error)
        setPincodeStatus("invalid")
        toast.error("Failed to lookup pincode")
      } finally {
        setPincodeLoading(false)
      }
    } else if (pincode.length > 6) {
      setPincodeStatus("invalid")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name.trim()) {
        throw new Error("Customer name is required")
      }

      if (!formData.phone.trim()) {
        throw new Error("Phone number is required")
      }

      if (formData.pincode.length < 10) {
        throw new Error("Phone number must be at least 10 digits")
      }

      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
        throw new Error("Valid 6-digit pincode is required")
      }

      const franchiseId = formData.franchise_id || user?.franchise_id

      if (!franchiseId) {
        throw new Error("A franchise must be selected to create a customer")
      }

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          franchise_id: franchiseId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // API uses ApiResponseBuilder which returns { success: false, error: { message, code, details } }
        const friendly = result?.error?.message || result?.error || result?.message || "Failed to create customer"
        throw new Error(friendly)
      }

      toast.success(result.message || "Customer created successfully!")
      router.push("/customers")
    } catch (error) {
      console.error("Error creating customer:", error)
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const getPincodeIcon = () => {
    if (pincodeLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (pincodeStatus === "valid") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (pincodeStatus === "invalid") return <XCircle className="h-4 w-4 text-red-500" />
    return <MapPin className="h-4 w-4 text-gray-400" />
  }

  if (!user) return null

  const showFranchiseSelector = user.role === "super_admin" || !user.franchise_id

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
            <p className="text-muted-foreground">Create a new customer profile</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Customer Information</CardTitle>
            <CardDescription>
              Enter the customer details below. City and state will auto-fill when you enter pincode.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {showFranchiseSelector && (
                <div className="space-y-2">
                  <Label htmlFor="franchise" className="text-sm font-medium">Franchise *</Label>
                  <Select
                    value={formData.franchise_id}
                    onValueChange={(value) => handleInputChange("franchise_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises.map((franchise) => (
                        <SelectItem key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Name and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-medium">
                    Pincode *
                  </Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getPincodeIcon()}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-fills city & state</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                    readOnly={pincodeStatus === "valid"}
                    className={pincodeStatus === "valid" ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                    readOnly={pincodeStatus === "valid"}
                    className={pincodeStatus === "valid" ? "bg-muted" : ""}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-24">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || pincodeStatus === "invalid"} className="min-w-32">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Customer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
