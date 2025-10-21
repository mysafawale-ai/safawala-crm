"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, MapPin, ArrowLeft, Crown, Palette, Eye } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedBackButton } from "@/components/ui/animated-back-button"

interface DistancePricing {
  id: string
  range: string
  min_km: number
  max_km: number
  base_price_addition: number
}

interface PackageVariant {
  id: string
  name: string
  description: string
  base_price: number
  inclusions?: string[]
  distance_pricing: DistancePricing[]
  is_active: boolean
}

interface PackageType {
  id: string
  name: string
  description: string
  base_price: number
  category_id: string
  franchise_id: string
  is_active: boolean
  display_order: number
  security_deposit: number
  extra_safa_price: number
  // Added optional variants collection to align with usage throughout component
  variants?: PackageVariant[]
}

interface Category {
  id: string
  name: string
  description: string
  packages?: PackageType[]
  package_variants?: PackageVariant[]
  is_active: boolean
}

interface PackagesClientProps {
  user?: any
  initialCategories?: Category[]
  franchises?: any[]
  distanceTiers?: any[]
}

export function PackagesClient({ user, initialCategories, franchises }: PackagesClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [packageForm, setPackageForm] = useState({
    name: "",
    description: "",
    base_price: "0.00",
    security_deposit: "0.00",
    extra_safa_price: "0.00",
    franchise_id: "",
  })

  const [variantForm, setVariantForm] = useState({
    name: "",
    description: "",
    extra_price: "0.00",
    inclusions: "",
  })

  const [distancePricingForm, setDistancePricingForm] = useState({
    range: "",
    min_km: 0,
    max_km: 0,
    base_price_addition: 0,
  })

  const [dialogs, setDialogs] = useState({
    createCategory: false,
    createPackage: false,
    createVariant: false,
    configurePricing: false,
  })

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [editingVariant, setEditingVariant] = useState<PackageVariant | null>(null)
  const [editingDistancePricing, setEditingDistancePricing] = useState<DistancePricing | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<PackageVariant | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })
  const [activeTab, setActiveTab] = useState("categories")

  const [isLoading, setIsLoading] = useState(false)
  const [showPackageDialog, setShowPackageDialog] = useState(false)

  const mockCategories: Category[] = [
    {
      id: "1",
      name: "21 Safas Collection",
      description: "Premium collection with 21 traditional safas for grand celebrations",
      is_active: true,
      packages: [
        {
          id: "1-1",
          name: "Royal Wedding 21 Set",
          description: "Complete 21 safa set for royal wedding ceremonies",
          base_price: 25000,
          is_active: true,
          category_id: "1",
          franchise_id: "1",
          variants: [
            {
              id: "1-1-1",
              name: "Silk Banarasi Premium",
              description: "Premium silk banarasi safas with gold thread work",
              base_price: 35000,
              inclusions: ["21 Silk Safas", "Gold Kalgis", "Premium Jewelry Set", "Storage Box", "Setup Service"],
              is_active: true,
              distance_pricing: [
                { id: "1", range: "0-10 km", min_km: 0, max_km: 10, base_price_addition: 0 },
                { id: "2", range: "11-25 km", min_km: 11, max_km: 25, base_price_addition: 2000 },
                { id: "3", range: "26-150 km", min_km: 26, max_km: 150, base_price_addition: 5000 },
                { id: "4", range: "151-300 km", min_km: 151, max_km: 300, base_price_addition: 8000 },
                { id: "5", range: "300-1500 km", min_km: 301, max_km: 1500, base_price_addition: 15000 },
              ],
            },
          ],
          display_order: 1,
          security_deposit: 5000,
          extra_safa_price: 1000,
        },
      ],
    },
  ]

  const [categories, setCategories] = useState<Category[]>(initialCategories || mockCategories)

  // Initialize franchise_id for non-super-admins on mount
  useEffect(() => {
    if (user?.role !== "super_admin" && user?.franchise_id) {
      console.log("[v0] Initializing default franchise_id:", user.franchise_id)
      setPackageForm((prev) => ({ ...prev, franchise_id: user.franchise_id }))
    }
  }, [user])

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
    })
    setEditingCategory(category)
    setDialogs((prev) => ({ ...prev, createCategory: true }))
  }

  const handleCreateCategory = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Creating/updating category:", categoryForm)

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("packages_categories")
          .update({
            name: categoryForm.name,
            description: categoryForm.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategory.id)

        if (error) throw error

        console.log("[v0] Category updated successfully in database")
        setEditingCategory(null)
        toast.success("Category updated successfully!")
      } else {
        // Create new category
        console.log("[v0] Attempting to create new category")
        const { data, error } = await supabase
          .from("packages_categories")
          .insert({
            name: categoryForm.name,
            description: categoryForm.description,
            is_active: true,
            display_order: categories.length + 1,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("[v0] Database error details:", error)
          if (error.message.includes("row-level security policy")) {
            throw new Error("Permission denied. You may not have the required permissions to create categories.")
          }
          if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
            throw new Error(`A category with the name "${categoryForm.name}" already exists. Please use a different name.`)
          }
          throw error
        }

        console.log("[v0] Category created successfully in database:", data)
        toast.success("Category created successfully!")
      }

      await refetchData()
    } catch (error) {
      console.error("[v0] Error creating/updating category:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save category. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setCategoryForm({ name: "", description: "" })
      setDialogs((prev) => ({ ...prev, createCategory: false }))
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("packages_categories").delete().eq("id", categoryId)

      if (error) throw error

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null)
      }
      toast.success("Category deleted successfully!")
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
      toast.error("Failed to delete category. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePackage = async (packageId: string, packageName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      packageId,
      packageName,
    })
  }

  const confirmDeletePackage = async () => {
    if (!deleteConfirmation.packageId) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/packages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: deleteConfirmation.packageId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete package')

      await refetchData()
      toast.success("Package deleted successfully!")
    } catch (error) {
      console.error("Error deleting package:", error)
      toast.error("Failed to delete package. Please try again.")
    } finally {
      setIsLoading(false)
      setDeleteConfirmation({ isOpen: false, packageId: null, packageName: "" })
    }
  }

  const handleCreatePackage = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Creating/updating package:", packageForm)
      console.log("[v0] User data:", user)
      console.log("[v0] Franchises available:", franchises)

      // Validate franchise_id
      if (!packageForm.franchise_id || packageForm.franchise_id === "") {
        // Try one more time to set it from user if missing
        if (user?.franchise_id) {
          console.log("[v0] Franchise was empty, setting from user:", user.franchise_id)
          setPackageForm((prev) => ({ ...prev, franchise_id: user.franchise_id }))
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Check again after attempt to set
        if (!packageForm.franchise_id || packageForm.franchise_id === "") {
          throw new Error("Please select a franchise before creating the package.")
        }
      }

      if (editingPackage) {
        // Update existing package via API
        const res = await fetch('/api/packages/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingPackage.id,
            name: packageForm.name,
            description: packageForm.description,
            base_price: Number.parseFloat(packageForm.base_price),
            security_deposit: Number.parseFloat(packageForm.security_deposit),
            extra_safa_price: Number.parseFloat(packageForm.extra_safa_price),
            franchise_id: packageForm.franchise_id,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to update package')

        console.log("[v0] Package updated successfully via API")
        setEditingPackage(null)
        toast.success("Package updated successfully!")
      } else {
        // Create new package via API
        console.log("[v0] Attempting to create new package via API")
        const res = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: packageForm.name,
            description: packageForm.description,
            base_price: Number.parseFloat(packageForm.base_price),
            security_deposit: Number.parseFloat(packageForm.security_deposit),
            extra_safa_price: Number.parseFloat(packageForm.extra_safa_price),
            franchise_id: packageForm.franchise_id,
            is_active: true,
            display_order: (selectedCategory?.packages || []).length + 1,
            category_id: selectedCategory?.id,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to create package')

        console.log("[v0] Package created successfully via API:", json?.data)
        toast.success("Package created successfully!")
      }

      await refetchData()
    } catch (error) {
      console.error("[v0] Error creating/updating package:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save package. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setPackageForm({
        name: "",
        description: "",
        base_price: "0.00",
        security_deposit: "0.00",
        extra_safa_price: "0.00",
        franchise_id: "",
      })
      setDialogs((prev) => ({ ...prev, createPackage: false }))
    }
  }

  const handleCreateVariant = async () => {
    try {
      if (!selectedPackage) {
        toast.error("Please select a package first")
        return
      }

      // Validate form
      if (!variantForm.name.trim()) {
        toast.error("Variant name is required")
        return
      }

      if (!variantForm.description.trim()) {
        toast.error("Variant description is required")
        return
      }

      const extraPrice = Number.parseFloat(variantForm.extra_price)
      if (isNaN(extraPrice) || extraPrice < 0) {
        toast.error("Please enter a valid extra price")
        return
      }

      // Parse inclusions from comma-separated string
      const inclusions = variantForm.inclusions
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      if (inclusions.length === 0) {
        toast.error("Please add at least one inclusion")
        return
      }

      const variantData = {
        name: variantForm.name.trim(),
        description: variantForm.description.trim(),
        base_price: extraPrice,
        inclusions: inclusions,
        package_id: selectedPackage.id,
        is_active: true,
        display_order: 1,
      }

      let result
      if (editingVariant) {
        // Update existing variant
        result = await supabase
          .from("package_variants")
          .update({
            ...variantData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingVariant.id)
          .select()

        if (result.error) throw result.error
        toast.success("Variant updated successfully!")
      } else {
        // Create new variant
        result = await supabase.from("package_variants").insert([variantData]).select()

        if (result.error) throw result.error
        toast.success("Variant created successfully!")
      }

      // Refresh data and close dialog
      await refetchData()
    } catch (error) {
      console.error("Error creating/updating variant:", error)
      toast.error("Failed to save variant. Please try again.")
    } finally {
      // Reset form and close dialog
      setVariantForm({
        name: "",
        description: "",
        extra_price: "0.00",
        inclusions: "",
      })
      setEditingVariant(null)
      setDialogs((prev) => ({ ...prev, createVariant: false }))
    }
  }

  const handleEditVariant = (variant: PackageVariant) => {
    setEditingVariant(variant)
    setVariantForm({
      name: variant.name,
      description: variant.description,
      extra_price: variant.base_price.toString(),
      inclusions: variant.inclusions ? variant.inclusions.join(", ") : "",
    })
    setDialogs((prev) => ({ ...prev, createVariant: true }))
  }

  const handleDeleteVariant = async (variantId: string) => {
  const variant = selectedPackage?.variants?.find((v: PackageVariant) => v.id === variantId)
    if (!variant) return
    setPendingVariantDelete({ id: variantId, name: variant.name })
    setShowVariantDeleteDialog(true)
  }

  const [showVariantDeleteDialog, setShowVariantDeleteDialog] = useState(false)
  const [pendingVariantDelete, setPendingVariantDelete] = useState<{id:string,name:string}|null>(null)

  const confirmDeleteVariant = async () => {
    if (!pendingVariantDelete) return
    try {
      const { error } = await supabase.from('package_variants').delete().eq('id', pendingVariantDelete.id)
      if (error) throw error
      toast.success('Variant deleted successfully!')
      await refetchData()
    } catch (e:any) {
      toast.error(e.message || 'Failed to delete variant')
    } finally {
      setShowVariantDeleteDialog(false)
      setPendingVariantDelete(null)
    }
  }

  const handleCreateDistancePricing = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant first")
      return
    }

          <ConfirmDialog
            open={showVariantDeleteDialog}
            title="Delete Variant"
            description={pendingVariantDelete ? `Delete variant "${pendingVariantDelete.name}"? This cannot be undone.` : ''}
            destructive
            confirmLabel="Delete"
            onConfirm={confirmDeleteVariant}
            onCancel={()=>{ setShowVariantDeleteDialog(false); setPendingVariantDelete(null) }}
          />
    try {
      setIsLoading(true)
      console.log("[v0] Creating/updating distance pricing...")

      // Validate form
      if (!distancePricingForm.range.trim()) {
        toast.error("Please enter a distance range")
        return
      }
      if (distancePricingForm.min_km < 0 || distancePricingForm.max_km <= distancePricingForm.min_km) {
        toast.error("Please enter valid distance range (max must be greater than min)")
        return
      }
      if (distancePricingForm.base_price_addition < 0) {
        toast.error("Base price addition cannot be negative")
        return
      }

      const payload: any = {
        variant_id: selectedVariant.id,
        distance_range: distancePricingForm.range.trim(),
        min_km: distancePricingForm.min_km,
        max_km: distancePricingForm.max_km,
        base_price_addition: distancePricingForm.base_price_addition,
        is_active: true,
      }
      if (editingDistancePricing) payload.id = editingDistancePricing.id

      const res = await fetch('/api/distance-pricing/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save distance pricing')
      toast.success(editingDistancePricing ? 'Distance pricing updated successfully!' : 'Distance pricing created successfully!')

      await refetchData()
    } catch (error) {
      console.error("[v0] Error creating/updating distance pricing:", error)
      toast.error("Failed to save distance pricing. Please try again.")
    } finally {
      setIsLoading(false)
      setDialogs((prev) => ({ ...prev, configurePricing: false }))
      setEditingDistancePricing(null)
      setDistancePricingForm({
        range: "",
        min_km: 0,
        max_km: 0,
        base_price_addition: 0,
      })
    }
  }

  const handleEditDistancePricing = (distancePricing: DistancePricing) => {
    setEditingDistancePricing(distancePricing)
    setDistancePricingForm({
      range: distancePricing.range,
      min_km: distancePricing.min_km,
      max_km: distancePricing.max_km,
      base_price_addition: distancePricing.base_price_addition,
    })
    setDialogs((prev) => ({ ...prev, configurePricing: true }))
  }

  const handleDeleteDistancePricing = async (distancePricingId: string) => {
    try {
      setIsLoading(true)
      console.log("[v0] Deleting distance pricing:", distancePricingId)

      const res = await fetch('/api/distance-pricing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: distancePricingId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete distance pricing')

      toast.success("Distance pricing deleted successfully!")
      await refetchData()
    } catch (error) {
      console.error("[v0] Error deleting distance pricing:", error)
      toast.error("Failed to delete distance pricing. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const refetchData = async () => {
    try {
      console.log("[v0] Starting refetchData - fetching categories...")
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("packages_categories")
        .select("*")
        .order("display_order")
      if (categoriesError) {
        console.error("[v0] Categories fetch error:", categoriesError)
        throw categoriesError
      }
      console.log(`[v0] Categories fetched: ${categoriesData?.length || 0}`)

      console.log("[v0] Fetching packages with franchise filter...")
      // Build packages query with franchise filtering
      let packagesQuery = supabase
        .from("package_sets")
        .select("*")
        .order("display_order")
      
      // Apply franchise filtering for non-super-admins
      if (user?.role !== "super_admin" && user?.franchise_id) {
        console.log("[v0] Applying franchise filter:", user.franchise_id)
        packagesQuery = packagesQuery.eq("franchise_id", user.franchise_id)
      }
      
      const { data: packagesData, error: packagesError } = await packagesQuery
      if (packagesError) {
        console.error("[v0] Packages fetch error:", packagesError)
        throw packagesError
      }
      console.log(`[v0] Packages fetched: ${packagesData?.length || 0}`)

      // Only fetch variants for the filtered packages
      const packageIds = (packagesData || []).map((p:any) => p.id)
      let variantsData: any[] = []
      if (packageIds.length > 0) {
        console.log("[v0] Fetching variants for filtered packages...", packageIds.length)
        const { data: vData, error: variantsError } = await supabase
          .from("package_variants")
          .select("*")
          .in("package_id", packageIds)
          .order("display_order")
        if (variantsError) {
          console.error("[v0] Variants fetch error:", variantsError)
          throw variantsError
        }
        variantsData = vData || []
      }
      console.log(`[v0] Variants fetched: ${variantsData.length}`)

      // Only fetch distance pricing for those variants
      const variantIds = variantsData.map((v:any) => v.id)
      let distancePricingData: any[] = []
      if (variantIds.length > 0) {
        console.log("[v0] Fetching distance pricing for filtered variants...", variantIds.length)
        const { data: dpData, error: distancePricingError } = await supabase
          .from("distance_pricing")
          .select("*")
          .in("variant_id", variantIds)
          .order("min_km")
        if (distancePricingError) {
          console.error("[v0] Distance pricing fetch error:", distancePricingError)
          throw distancePricingError
        }
        distancePricingData = (dpData || []).map((dp:any) => ({ ...dp, range: dp.range ?? dp.distance_range ?? '' }))
      }
      console.log(`[v0] Distance pricing fetched: ${distancePricingData.length}`)

      console.log("[v0] Processing data relationships...")
      const categoriesWithPackages = categoriesData.map((category) => ({
        ...category,
        packages: packagesData
          .filter((pkg) => pkg.category_id === category.id)
          .map((pkg) => ({
            ...pkg,
            variants: variantsData
              .filter((variant) => variant.package_id === pkg.id)
              .map((variant) => ({
                ...variant,
                distance_pricing: distancePricingData.filter((dp) => dp.variant_id === variant.id),
              })),
          })),
      }))

      console.log("[v0] Setting categories state...")
      setCategories(categoriesWithPackages)

      // Update selectedCategory if it exists
      if (selectedCategory) {
        const updatedCategory = categoriesWithPackages.find(cat => cat.id === selectedCategory.id)
        if (updatedCategory) {
          console.log("[v0] Updating selectedCategory with fresh data")
          setSelectedCategory(updatedCategory)
          
          // Update selectedPackage if it exists
          if (selectedPackage) {
            const updatedPackage = updatedCategory.packages?.find((pkg: PackageType) => pkg.id === selectedPackage.id)
            if (updatedPackage) {
              console.log("[v0] Updating selectedPackage with fresh data")
              setSelectedPackage(updatedPackage)
              
              // Update selectedVariant if it exists
              if (selectedVariant) {
                const updatedVariant = updatedPackage.variants?.find((v: PackageVariant) => v.id === selectedVariant.id)
                if (updatedVariant) {
                  console.log("[v0] Updating selectedVariant with fresh data")
                  setSelectedVariant(updatedVariant)
                }
              }
            }
          }
        }
      }

      const totalPackages = packagesData.length
      console.log(`[v0] Data refetched successfully: ${categoriesData.length} categories, ${totalPackages} packages`)
    } catch (error) {
      console.error("[v0] Error refetching data:", error)
      toast.error("Failed to refresh data")
    }
  }

  const calculateVariantTotalPrice = (packageBasePrice: number, variantExtraPrice: number) => {
    return packageBasePrice + variantExtraPrice
  }

  // Calculate final price given package base, variant extra/base and distance pricing addition
  const calculatePrice = (
    variantTotalPrice: number,
    variantBaseExtra: number,
    distancePricing: DistancePricing,
  ) => {
    return variantTotalPrice + distancePricing.base_price_addition
  }

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    packageId: string | null
    packageName: string
  }>({
    isOpen: false,
    packageId: null,
    packageName: "",
  })

  useEffect(() => {
    console.log("[v0] Component mounted, fetching real data from Supabase...")
    refetchData()
  }, [])

  return (
    <div className="heritage-container p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <AnimatedBackButton
          variant="outline"
          onClick={() => router.back()}
          className="border-brown-300 text-brown-700 hover:bg-brown-50"
        />
        <div className="heritage-header flex-1">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-heritage-dark" />
            <div>
              <h1 className="vintage-title text-3xl font-bold">Safawala Package Management</h1>
              <p className="vintage-subtitle text-sm opacity-80">
                Category-based package system with distance pricing from Alkapuri, Vadodara
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage-dark">{categories.length}</div>
            <div className="text-brown-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage-dark">
              {categories.reduce((acc, cat) => acc + (cat.packages || []).length, 0)}
            </div>
            <div className="text-brown-600">Packages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage-dark">
              {categories.reduce(
                (acc, cat) =>
                  acc + (cat.packages || []).reduce((pkgAcc, pkg) => pkgAcc + (pkg.variants || []).length, 0),
                0,
              )}
            </div>
            <div className="text-brown-600">Variants</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-cream-100">
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <Crown className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger
            value="packages"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <Package className="w-4 h-4 mr-2" />
            Packages
          </TabsTrigger>
          <TabsTrigger
            value="variants"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <Palette className="w-4 h-4 mr-2" />
            Variants
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Distance Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-brown-600">
              Showing {categories.length} safa categories
              <Badge className="ml-2 bg-green-100 text-green-800">Real Data - Supabase</Badge>
            </div>
            <Dialog
              open={dialogs.createCategory}
              onOpenChange={(open) => {
                setDialogs((prev) => ({ ...prev, createCategory: open }))
                if (!open) {
                  setEditingCategory(null)
                  setCategoryForm({ name: "", description: "" })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="btn-heritage-dark" disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="heritage-container">
                <DialogHeader>
                  <DialogTitle className="vintage-heading">
                    {editingCategory ? "Edit Category" : "Create New Category"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      className="input-heritage"
                      placeholder="e.g., 21 Safas"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      className="input-heritage"
                      placeholder="Category description..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateCategory}
                  className="btn-heritage-dark"
                  disabled={!categoryForm.name.trim() || isLoading}
                >
                  {isLoading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="card-heritage">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brown-100 rounded-lg">
                        <Crown className="w-8 h-8 text-heritage-dark" />
                      </div>
                      <div>
                        <h3 className="vintage-heading text-xl font-semibold">{category.name}</h3>
                        <p className="text-brown-600 mb-2">{category.description}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {(category.package_variants || category.packages || []).length} Variants
                          </Badge>
                          <span className="text-sm text-brown-500">{(category.package_variants || category.packages || []).length} variants</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50 bg-green-50/30"
                        onClick={() => {
                          setSelectedCategory(category)
                          setActiveTab("variants")
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Variants
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/30"
                        onClick={() => handleEditCategory(category)}
                        disabled={isLoading}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          {!selectedCategory ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Category</h3>
              <p className="text-brown-600 mb-4">Choose a category from the list below to view its packages</p>
              <div className="grid gap-3 max-w-md mx-auto">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="border-brown-300 text-brown-700 hover:bg-brown-50 justify-start bg-transparent"
                    onClick={() => {
                      setSelectedCategory(category)
                      setActiveTab("packages")
                    }}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {category.name} ({(category.packages || []).length} packages)
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="border-brown-300 text-brown-700 hover:bg-brown-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Categories
                  </Button>
                  <div>
                    <h3 className="vintage-heading text-lg font-semibold">{selectedCategory.name}</h3>
                    <p className="text-sm text-brown-600">
                      {(selectedCategory.packages || []).length} packages available
                    </p>
                  </div>
                </div>
                <Dialog
                  open={dialogs.createPackage}
                  onOpenChange={(open) => {
                    setDialogs((prev) => ({ ...prev, createPackage: open }))
                    if (!open) {
                      setEditingPackage(null)
                      setPackageForm({
                        name: "",
                        description: "",
                        base_price: "0.00",
                        security_deposit: "0.00",
                        extra_safa_price: "0.00",
                        franchise_id: "",
                      })
                    } else if (open && !editingPackage) {
                      // Auto-select franchise for non-super-admins when creating new package
                      console.log("[v0] Dialog opened, user:", user)
                      console.log("[v0] Franchises available:", franchises)
                      if (user?.role !== "super_admin" && user?.franchise_id) {
                        console.log("[v0] Auto-selecting franchise:", user.franchise_id)
                        setPackageForm((prev) => ({ ...prev, franchise_id: user.franchise_id }))
                      }
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="btn-heritage-dark" disabled={isLoading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="heritage-container">
                    <DialogHeader>
                      <DialogTitle className="vintage-heading">
                        {editingPackage ? "Edit Package" : "Create New Package"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="packageName" className="text-sm font-medium text-gray-700">
                          Package Name
                        </Label>
                        <Input
                          id="packageName"
                          placeholder="E.g. Royal Wedding Set"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="packageDescription" className="text-sm font-medium text-gray-700">
                          Description
                        </Label>
                        <Textarea
                          id="packageDescription"
                          placeholder="Package description..."
                          value={packageForm.description}
                          onChange={(e) => setPackageForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="mt-1 min-h-[80px]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="packagePrice" className="text-sm font-medium text-gray-700">
                          Base Price (₹)
                        </Label>
                        <Input
                          id="packagePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={packageForm.base_price}
                          onChange={(e) => setPackageForm((prev) => ({ ...prev, base_price: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="securityDeposit" className="text-sm font-medium text-gray-700">
                          Security Deposit (₹)
                        </Label>
                        <Input
                          id="securityDeposit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={packageForm.security_deposit}
                          onChange={(e) => setPackageForm((prev) => ({ ...prev, security_deposit: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="extraSafaPrice" className="text-sm font-medium text-gray-700">
                          Extra Safa Price (₹ per piece)
                        </Label>
                        <Input
                          id="extraSafaPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={packageForm.extra_safa_price}
                          onChange={(e) => setPackageForm((prev) => ({ ...prev, extra_safa_price: e.target.value }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Price for each additional safa beyond the package count
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="packageFranchise" className="text-sm font-medium text-gray-700">
                          Franchise
                        </Label>
                        <Select
                          value={packageForm.franchise_id}
                          onValueChange={(value) => setPackageForm((prev) => ({ ...prev, franchise_id: value }))}
                          disabled={user?.role !== "super_admin"}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Franchise">
                              {packageForm.franchise_id && franchises?.find(f => f.id === packageForm.franchise_id)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {franchises?.map((franchise) => (
                              <SelectItem key={franchise.id} value={franchise.id}>
                                {franchise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {user?.role !== "super_admin" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-selected to your franchise
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleCreatePackage}
                      className="btn-heritage-dark"
                      disabled={!packageForm.name.trim() || isLoading}
                    >
                      {isLoading ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {(selectedCategory.packages || []).map((pkg) => (
                  <Card key={pkg.id} className="card-heritage">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-brown-100 rounded-lg">
                            <Package className="w-8 h-8 text-heritage-dark" />
                          </div>
                          <div>
                            <h4 className="vintage-heading text-lg font-semibold">{pkg.name}</h4>
                            <p className="text-brown-600 mb-2">{pkg.description}</p>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className={`bg-green-100 text-green-800 ${pkg.base_price === 0 ? "opacity-40" : ""}`}
                              >
                                ₹{pkg.base_price.toLocaleString()}
                              </Badge>
                              <span className="text-sm text-brown-500">{(pkg.variants || []).length} variants</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-300 text-green-700 hover:bg-green-50 bg-green-50/30"
                            onClick={() => {
                              setSelectedPackage(pkg)
                              setActiveTab("variants")
                            }}
                          >
                            <Palette className="w-4 h-4 mr-2" />
                            See Variants
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/30"
                            onClick={() => {
                              setPackageForm({
                                name: pkg.name,
                                description: pkg.description,
                                base_price: pkg.base_price.toString(),
                                security_deposit: (pkg.security_deposit || 0).toString(),
                                extra_safa_price: (pkg.extra_safa_price || 0).toString(),
                                franchise_id: pkg.franchise_id || "",
                              })
                              setEditingPackage(pkg)
                              setDialogs((prev) => ({ ...prev, createPackage: true }))
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(selectedCategory.packages || []).length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-brown-400 mb-4" />
                  <h3 className="vintage-heading text-xl mb-2">No packages found</h3>
                  <p className="text-brown-600 mb-4">Create your first package for {selectedCategory.name}</p>
                  <Button
                    className="btn-heritage-dark"
                    onClick={() => {
                      // Auto-select franchise for non-super-admins before opening dialog
                      if (user?.role !== "super_admin" && user?.franchise_id) {
                        setPackageForm((prev) => ({ ...prev, franchise_id: user.franchise_id }))
                      }
                      setDialogs((prev) => ({ ...prev, createPackage: true }))
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Package
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          {!selectedPackage ? (
            <div className="text-center py-8">
              <Palette className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Package</h3>
              <p className="text-brown-600 mb-4">Choose a package to view and manage its variants</p>
              <div className="grid gap-3 max-w-md mx-auto">
                {categories.flatMap((cat) =>
                  (cat.packages || []).map((pkg) => (
                    <Button
                      key={pkg.id}
                      variant="outline"
                      className="border-brown-300 text-brown-700 hover:bg-brown-50 justify-start bg-transparent"
                      onClick={() => {
                        setSelectedCategory(cat)
                        setSelectedPackage(pkg)
                        setActiveTab("variants")
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      {pkg.name} ({(pkg.variants || []).length} variants)
                    </Button>
                  )),
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="vintage-heading text-xl font-bold text-heritage-dark mb-2">Package Variants</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-brown-100 text-brown-800">
                      {selectedPackage.name}
                    </Badge>
                    <p className="text-sm text-brown-600">
                      {(selectedPackage.variants || []).length} variants available
                    </p>
                  </div>
                </div>
                <Button
                  className="btn-heritage-dark"
                  onClick={() => setDialogs((prev) => ({ ...prev, createVariant: true }))}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>

              <div className="grid gap-4">
                {(selectedPackage.variants || []).map((variant: PackageVariant) => (
                  <Card key={variant.id} className="card-heritage">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-brown-100 rounded-lg">
                            <Palette className="w-8 h-8 text-heritage-dark" />
                          </div>
                          <div>
                            <h4 className="vintage-heading text-lg font-semibold">{variant.name}</h4>
                            <p className="text-brown-600 mb-2">{variant.description}</p>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant="secondary"
                                className={`bg-green-100 text-green-800 ${variant.base_price === 0 ? "opacity-40" : ""}`}
                              >
                                ₹{selectedPackage.base_price.toLocaleString()} + ₹{variant.base_price.toLocaleString()}{" "}
                                = ₹
                                {calculateVariantTotalPrice(
                                  selectedPackage.base_price,
                                  variant.base_price,
                                ).toLocaleString()}
                              </Badge>
                              {variant.inclusions && variant.inclusions.length > 0 && (
                                <span className="text-sm text-brown-500">{variant.inclusions.length} inclusions</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {variant.inclusions && variant.inclusions.slice(0, 3).map((inclusion: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {inclusion}
                                </Badge>
                              ))}
                              {variant.inclusions && variant.inclusions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{variant.inclusions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-purple-50/30"
                            onClick={() => {
                              setSelectedVariant(variant)
                              setActiveTab("pricing")
                            }}
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Distance Pricing
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/30"
                            onClick={() => handleEditVariant(variant)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog
                open={dialogs.createVariant}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, createVariant: open }))
                  if (!open) {
                    setEditingVariant(null)
                    setVariantForm({
                      name: "",
                      description: "",
                      extra_price: "0.00",
                      inclusions: "",
                    })
                  }
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="vintage-heading text-heritage-dark">
                      {editingVariant ? "Edit Variant" : "Create New Variant"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="variant-name">Variant Name</Label>
                      <Input
                        id="variant-name"
                        placeholder="E.g. Premium Collection"
                        value={variantForm.name}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="variant-description">Description</Label>
                      <Textarea
                        id="variant-description"
                        placeholder="Variant description..."
                        value={variantForm.description}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="variant-price">Extra Price (₹)</Label>
                      <Input
                        id="variant-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Additional cost on top of package base price"
                        value={variantForm.extra_price}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, extra_price: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This amount will be added to the package base price (₹
                        {selectedPackage?.base_price.toLocaleString() || "0"})
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="variant-inclusions">Inclusions (comma-separated)</Label>
                      <Textarea
                        id="variant-inclusions"
                        placeholder="E.g. Safa, Kalgi, Necklace, Earrings"
                        value={variantForm.inclusions}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, inclusions: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate each inclusion with a comma</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setDialogs((prev) => ({ ...prev, createVariant: false }))}>
                      Cancel
                    </Button>
                    <Button className="btn-heritage-dark" onClick={handleCreateVariant}>
                      {editingVariant ? "Update Variant" : "Create Variant"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {!selectedVariant ? (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Variant</h3>
              <p className="text-brown-600 mb-4">Choose a variant to view and manage its distance pricing</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVariant(null)}
                    className="border-brown-300 text-brown-700 hover:bg-brown-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Variants
                  </Button>
                  <div>
                    <h3 className="vintage-heading text-lg font-semibold">{selectedVariant.name}</h3>
                    <p className="text-sm text-brown-600">Distance-based pricing from Alkapuri, Vadodara</p>
                  </div>
                </div>
                <Button
                  onClick={() => setDialogs((prev) => ({ ...prev, configurePricing: true }))}
                  className="bg-heritage-dark hover:bg-heritage-dark/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Distance Pricing
                </Button>
              </div>

              <div className="grid gap-4">
                {selectedVariant.distance_pricing.map((pricing, index) => (
                  <Card key={pricing.id} className="card-heritage">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-brown-100 rounded-lg">
                            <MapPin className="w-6 h-6 text-heritage-dark" />
                          </div>
                          <div>
                            <h4 className="vintage-heading font-semibold">{pricing.range}</h4>
                            <p className="text-sm text-brown-600">
                              {pricing.min_km} - {pricing.max_km} kilometers from Alkapuri
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Base Price + ₹{pricing.base_price_addition.toLocaleString()} Extra
                              </Badge>
                              <span className="text-sm text-brown-500">
                                Total: ₹
                                {selectedPackage && selectedVariant
                                  ? (
                                      calculatePrice(
                                        calculateVariantTotalPrice(
                                          selectedPackage.base_price,
                                          selectedVariant.base_price,
                                        ),
                                        selectedVariant.base_price,
                                        pricing,
                                      )
                                    ).toLocaleString()
                                  : '0'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/30"
                            onClick={() => handleEditDistancePricing(pricing)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                            onClick={() => handleDeleteDistancePricing(pricing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Dialog
                open={dialogs.configurePricing}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, configurePricing: open }))
                  if (!open) {
                    setEditingDistancePricing(null)
                    setDistancePricingForm({
                      range: "",
                      min_km: 0,
                      max_km: 0,
                      base_price_addition: 0,
                    })
                  }
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="vintage-heading">
                      {editingDistancePricing ? "Edit Distance Pricing" : "Add Distance Pricing"}
                    </DialogTitle>
                    <DialogDescription>Configure distance-based pricing for {selectedVariant?.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="range">Distance Range</Label>
                      <Input
                        id="range"
                        placeholder="e.g., Within City, Nearby Districts"
                        value={distancePricingForm.range}
                        onChange={(e) => setDistancePricingForm((prev) => ({ ...prev, range: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_km">Min Distance (km)</Label>
                        <Input
                          id="min_km"
                          type="number"
                          min="0"
                          value={distancePricingForm.min_km}
                          onChange={(e) =>
                            setDistancePricingForm((prev) => ({
                              ...prev,
                              min_km: Number.parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_km">Max Distance (km)</Label>
                        <Input
                          id="max_km"
                          type="number"
                          min="1"
                          value={distancePricingForm.max_km}
                          onChange={(e) =>
                            setDistancePricingForm((prev) => ({
                              ...prev,
                              max_km: Number.parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="base_price_addition">Additional Price (₹)</Label>
                      <Input
                        id="base_price_addition"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={distancePricingForm.base_price_addition}
                        onChange={(e) =>
                          setDistancePricingForm((prev) => ({
                            ...prev,
                            base_price_addition: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <p className="text-sm text-brown-600 mt-1">
                        This amount will be added to the variant's total price
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogs((prev) => ({ ...prev, configurePricing: false }))}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateDistancePricing}
                      disabled={isLoading}
                      className="bg-heritage-dark hover:bg-heritage-dark/90 text-white"
                    >
                      {isLoading ? "Saving..." : editingDistancePricing ? "Update Pricing" : "Add Pricing"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>
      </Tabs>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Crown className="w-16 h-16 mx-auto text-brown-400 mb-4" />
          <h3 className="vintage-heading text-xl mb-2">No categories found</h3>
          <p className="text-brown-600 mb-4">Create your first safa category to get started</p>
          <Button
            className="btn-heritage-dark"
            onClick={() => setDialogs((prev) => ({ ...prev, createCategory: true }))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Category
          </Button>
        </div>
      )}

      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirmation({ isOpen: false, packageId: null, packageName: "" })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <p className="text-sm text-brown-600">
              Are you sure you want to delete "{deleteConfirmation.packageName}"? This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ isOpen: false, packageId: null, packageName: "" })}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePackage} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Package"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PackagesClient
