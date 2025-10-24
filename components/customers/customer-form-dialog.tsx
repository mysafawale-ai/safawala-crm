"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { PincodeService } from "@/lib/pincode-service"
import { supabase } from "@/lib/supabase"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerCreated?: (customer: any) => void
  mode?: "create" | "edit"
  customer?: any
}

interface CustomerFormData {
  name: string
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  state: string
  pincode: string
  is_active: boolean
}

export function CustomerFormDialog({ open, onOpenChange, onCustomerCreated, mode = "create", customer }: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "valid" | "invalid">("idle")
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    is_active: true,
  })

  // Pre-fill form data when in edit mode
  useEffect(() => {
    if (mode === "edit" && customer && open) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        whatsapp: customer.whatsapp || customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        is_active: customer.is_active !== false,
      })
      // Set pincode status if valid
      if (customer.pincode && /^\d{6}$/.test(customer.pincode) && customer.city && customer.state) {
        setPincodeStatus("valid")
      }
    } else if (mode === "create" && !open) {
      // Reset form when dialog closes in create mode
      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        is_active: true,
      })
      setPincodeStatus("idle")
    }
  }, [mode, customer, open])

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

      try {
        const pincodeData = await PincodeService.lookup(pincode)

        if (pincodeData) {
          setFormData((prev) => ({
            ...prev,
            city: pincodeData.city,
            state: pincodeData.state,
          }))
          setPincodeStatus("valid")
          toast.success(`Location found: ${pincodeData.city}, ${pincodeData.state}`)
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

      if (formData.phone.length < 10) {
        throw new Error("Phone number must be at least 10 digits")
      }

      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
        throw new Error("Valid 6-digit pincode is required")
      }

      if (formData.email && !formData.email.includes("@")) {
        throw new Error("Please enter a valid email address")
      }

      if (mode === "edit" && customer) {
        // Update existing customer
        // Build update object conditionally
        const updateData: any = {
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          updated_at: new Date().toISOString(),
        }

        // Include is_active in update (column now exists)
        updateData.is_active = formData.is_active

        let { data, error } = await supabase
          .from("customers")
          .update(updateData)
          .eq("id", customer.id)
          .select("*")

        console.log("[CustomerFormDialog] Update result:", { data, error, customerId: customer.id })

        // Extract single row if array returned
        if (data && Array.isArray(data) && data.length > 0) {
          data = data[0]
        }

        // Handle is_active column not existing yet (graceful fallback)
        if (error && (error.message?.includes("is_active") || error.message?.includes("column"))) {
          console.warn("is_active column not found, retrying without it...")
          delete updateData.is_active
          
          let retryResult = await supabase
            .from("customers")
            .update(updateData)
            .eq("id", customer.id)
            .select("*")
          
          // Extract single row if array
          if (retryResult.data && Array.isArray(retryResult.data) && retryResult.data.length > 0) {
            retryResult.data = retryResult.data[0]
          }
          
          if (retryResult.error) throw retryResult.error
          
          toast.success("Customer updated successfully! (Note: Please run database migration to enable status toggle)")
          
          if (onCustomerCreated) {
            onCustomerCreated(retryResult.data)
          }
          
          onOpenChange(false)
          return
        }

        if (error) throw error

        if (!data) {
          throw new Error("No data returned from update")
        }

        console.log("[CustomerFormDialog] Customer updated successfully:", data)
        toast.success("Customer updated successfully!")
        
        // Call callback with updated customer
        if (onCustomerCreated) {
          console.log("[CustomerFormDialog] Calling onCustomerCreated with:", data)
          onCustomerCreated(data)
        }
      } else {
        // Create new customer
        const insertData: any = {
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          customer_code: `CUST${Date.now().toString().slice(-6)}`,
          franchise_id: "00000000-0000-0000-0000-000000000001", // Default franchise
        }

        // Try to include is_active for new customers
        insertData.is_active = true

        let { data, error } = await supabase
          .from("customers")
          .insert(insertData)
          .select("*")
        
        // Extract single row if array returned
        if (data && Array.isArray(data) && data.length > 0) {
          data = data[0]
        }

        // Handle is_active column not existing yet
        if (error && error.message?.includes("is_active")) {
          console.warn("is_active column not found, retrying without it...")
          delete insertData.is_active
          
          let retryResult = await supabase
            .from("customers")
            .insert(insertData)
            .select("*")
          
          // Extract single row if array
          if (retryResult.data && Array.isArray(retryResult.data) && retryResult.data.length > 0) {
            retryResult.data = retryResult.data[0]
          }
          
          if (retryResult.error) throw retryResult.error
          
          toast.success("Customer created successfully! (Note: Please run database migration to enable status toggle)")
          
          if (onCustomerCreated) {
            onCustomerCreated(retryResult.data)
          }
          
          setFormData({
            name: "",
            email: "",
            phone: "",
            whatsapp: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            is_active: true,
          })
          setPincodeStatus("idle")
          
          onOpenChange(false)
          return
        }

        if (error) throw error

        toast.success("Customer created successfully!")
        
        // Call callback with new customer
        if (onCustomerCreated) {
          onCustomerCreated(data)
        }
      }

      // Reset form only in create mode
      if (mode === "create") {
        setFormData({
          name: "",
          email: "",
          phone: "",
          whatsapp: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          is_active: true,
        })
        setPincodeStatus("idle")
      }

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} customer:`, error)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">
            {mode === "edit" ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Name and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+91 9876543210"
                required
              />
            </div>
          </div>

          {/* WhatsApp and Email */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </div>

          {/* Address */}
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

          {/* Pincode, City, State */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-medium">
                Pincode <span className="text-red-500">*</span>
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getPincodeIcon()}
                </div>
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

          {/* Active/Inactive Toggle - Only show in edit mode */}
          {mode === "edit" && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Customer Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.is_active ? "This customer is currently active" : "This customer is currently inactive"}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-green-700 hover:bg-green-800 min-w-32"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Saving..."}
                </>
              ) : (
                mode === "edit" ? "Update Customer" : "Save Customer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
