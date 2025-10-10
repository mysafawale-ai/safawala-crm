"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { PincodeService } from "@/lib/pincode-service"
import { supabase } from "@/lib/supabase"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerCreated?: (customer: any) => void
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
}

export function CustomerFormDialog({ open, onOpenChange, onCustomerCreated }: CustomerFormDialogProps) {
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
  })

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

      // Create customer via Supabase directly
      const { data, error } = await supabase
        .from("customers")
        .insert({
          ...formData,
          customer_code: `CUST${Date.now().toString().slice(-6)}`,
          franchise_id: "00000000-0000-0000-0000-000000000001", // Default franchise
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Customer created successfully!")
      
      // Call callback with new customer
      if (onCustomerCreated) {
        onCustomerCreated(data)
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      })
      setPincodeStatus("idle")

      // Close dialog
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Add New Customer</DialogTitle>
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
                  Saving...
                </>
              ) : (
                "Save Customer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
