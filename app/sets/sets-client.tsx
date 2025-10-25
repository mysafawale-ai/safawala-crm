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
import { Plus, Pencil, Trash2, MapPin, ArrowLeft, Crown, Palette, Eye, Layers } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useRouter, useSearchParams } from "next/navigation"
// Package icon no longer used after removing Packages tab
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface DistancePricing {
  id: string
  range: string
  min_km: number
  max_km: number
  base_price_addition: number
}

interface PackageLevel {
  id: string
  name: string
  base_price: number
  is_active: boolean
  display_order: number
  distance_pricing: DistancePricing[]
}

interface PackageVariant {
  id: string
  name: string
  description: string
  base_price: number
  extra_safa_price?: number
  missing_safa_penalty?: number
  inclusions?: string[]
  package_levels?: PackageLevel[]
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
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get initial tab from URL hash or default to categories
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (['categories', 'variants', 'levels', 'pricing'].includes(hash)) {
        return hash
      }
    }
    return 'categories'
  }

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
    extra_safa_price: "0.00",
    missing_safa_penalty: "0.00",
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
    createLevel: false,
  })

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [editingVariant, setEditingVariant] = useState<PackageVariant | null>(null)
  const [editingDistancePricing, setEditingDistancePricing] = useState<DistancePricing | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<PackageVariant | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<PackageLevel | null>(null)
  const [editingLevel, setEditingLevel] = useState<PackageLevel | null>(null)
  const [levelForm, setLevelForm] = useState({ name: "", base_price: "0.00" })
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })
  const [activeTab, setActiveTab] = useState(getInitialTab())

  // Sync tab changes to URL without creating history entries
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

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
              package_levels: [
                {
                  id: "lvl-1",
                  name: "Basic",
                  base_price: 35000,
                  is_active: true,
                  display_order: 1,
                  distance_pricing: [
                    { id: "1", range: "0-10 km", min_km: 0, max_km: 10, base_price_addition: 0 },
                    { id: "2", range: "11-25 km", min_km: 11, max_km: 25, base_price_addition: 2000 },
                  ],
                },
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
        
        // Check auth session before inserting
        const { data: { session } } = await supabase.auth.getSession()
        console.log("[v0] Auth session check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: session?.access_token ? 'EXISTS' : 'MISSING'
        })
        
        if (!session) {
          throw new Error("You are not authenticated. Please log out and log back in.")
        }
        
        // Get franchise_id from user
        const franchiseId = user?.franchise_id
        if (!franchiseId && user?.role !== 'super_admin') {
          throw new Error("No franchise associated with your account. Please contact support.")
        }
        
        const { data, error } = await supabase
          .from("packages_categories")
          .insert({
            name: categoryForm.name,
            description: categoryForm.description,
            franchise_id: franchiseId, // 🔒 FRANCHISE ISOLATION
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
      setIsLoading(true)
      
      if (!selectedCategory) {
        toast.error("Please select a category first")
        return
      }

      if (!variantForm.name.trim()) {
        toast.error("Variant name is required")
        return
      }

      if (!variantForm.description.trim()) {
        toast.error("Variant description is required")
        return
      }

      const basePrice = Number.parseFloat(variantForm.extra_price)
      if (isNaN(basePrice) || basePrice < 0) {
        toast.error("Please enter a valid base price")
        return
      }

      const extraSafaPrice = Number.parseFloat(variantForm.extra_safa_price)
      const missingSafaPenalty = Number.parseFloat(variantForm.missing_safa_penalty)

      if (isNaN(extraSafaPrice) || extraSafaPrice < 0) {
        toast.error("Please enter a valid extra safa price")
        return
      }

      if (isNaN(missingSafaPenalty) || missingSafaPenalty < 0) {
        toast.error("Please enter a valid missing safa penalty")
        return
      }

      const inclusions = variantForm.inclusions
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      const payload: any = {
        name: variantForm.name.trim(),
        description: variantForm.description.trim(),
        base_price: basePrice,
        extra_safa_price: extraSafaPrice,
        missing_safa_penalty: missingSafaPenalty,
        inclusions,
        category_id: selectedCategory.id,
        package_id: selectedCategory.id,
        franchise_id: user?.franchise_id || null,
        is_active: true,
        display_order: ((selectedCategory.package_variants || []).length) + 1,
      }

      if (editingVariant) {
        // Update variant via API
        console.log("[v0] Updating variant via API:", editingVariant.id)
        const res = await fetch('/api/packages/variants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: editingVariant.id, ...payload }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to update variant')
        console.log("[v0] Variant updated successfully via API")
        toast.success("Variant updated successfully!")
      } else {
        // Create variant via API
        console.log("[v0] Creating variant via API")
        const res = await fetch('/api/packages/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to create variant')
        console.log("[v0] Variant created successfully via API:", json?.data)
        toast.success("Variant created successfully!")
      }

      await refetchData()
      
      setVariantForm({ name: "", description: "", extra_price: "0.00", extra_safa_price: "0.00", missing_safa_penalty: "0.00", inclusions: "" })
      setEditingVariant(null)
      setDialogs((prev) => ({ ...prev, createVariant: false }))
    } catch (error) {
      console.error("[v0] Error creating/updating variant:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save variant. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditVariant = (variant: PackageVariant) => {
    setEditingVariant(variant)
    setVariantForm({
      name: variant.name,
      description: variant.description,
      extra_price: variant.base_price.toString(),
      extra_safa_price: (variant.extra_safa_price || 0).toString(),
      missing_safa_penalty: (variant.missing_safa_penalty || 0).toString(),
      inclusions: variant.inclusions ? variant.inclusions.join(", ") : "",
    })
    setDialogs((prev) => ({ ...prev, createVariant: true }))
  }

  const handleDeleteVariant = async (variantId: string) => {
  const variant = selectedCategory?.package_variants?.find((v: PackageVariant) => v.id === variantId)
    if (!variant) return
    setPendingVariantDelete({ id: variantId, name: variant.name })
    setShowVariantDeleteDialog(true)
  }

  const [showVariantDeleteDialog, setShowVariantDeleteDialog] = useState(false)
  const [pendingVariantDelete, setPendingVariantDelete] = useState<{id:string,name:string}|null>(null)

  const confirmDeleteVariant = async () => {
    if (!pendingVariantDelete) return
    try {
      setIsLoading(true)
      console.log("[v0] Deleting variant via API:", pendingVariantDelete.id)
      const res = await fetch(`/api/packages/variants?id=${pendingVariantDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete variant')
      console.log("[v0] Variant deleted successfully via API")
      toast.success('Variant deleted successfully!')
      await refetchData()
    } catch (e: any) {
      console.error("[v0] Error deleting variant:", e)
      toast.error(e.message || 'Failed to delete variant')
    } finally {
      setIsLoading(false)
      setShowVariantDeleteDialog(false)
      setPendingVariantDelete(null)
    }
  }

  const handleCreateDistancePricing = async () => {
    if (!selectedLevel || !selectedVariant) {
      toast.error("Please select a level first")
      return
    }
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
        package_level_id: selectedLevel.id,
        distance_range: distancePricingForm.range.trim(),
        min_distance_km: distancePricingForm.min_km,
        max_distance_km: distancePricingForm.max_km,
        additional_price: distancePricingForm.base_price_addition,
        franchise_id: user?.franchise_id,
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
      
      await refetchData()
      toast.success(editingDistancePricing ? 'Distance pricing updated successfully!' : 'Distance pricing created successfully!')
      
      setDialogs((prev) => ({ ...prev, configurePricing: false }))
      setEditingDistancePricing(null)
      setDistancePricingForm({
        range: "",
        min_km: 0,
        max_km: 0,
        base_price_addition: 0,
      })
    } catch (error) {
      console.error("[v0] Error creating/updating distance pricing:", error)
      toast.error("Failed to save distance pricing. Please try again.")
    } finally {
      setIsLoading(false)
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

  const handleSaveLevel = async () => {
    try {
      if (!selectedVariant) {
        toast.error("Select a variant first")
        return
      }
      const price = Number.parseFloat(levelForm.base_price)
      if (isNaN(price) || price < 0) {
        toast.error("Enter a valid base price")
        return
      }
      const payload: any = {
        variant_id: selectedVariant.id,
        name: levelForm.name.trim(),
        base_price: price,
        is_active: true,
        franchise_id: user?.franchise_id || null,
      }
      
      console.log('[Sets] Creating level with payload:', payload)
      console.log('[Sets] Current user:', { id: user?.id, franchise_id: user?.franchise_id, role: user?.role })
      
      let resp
      if (editingLevel) {
        resp = await supabase.from('package_levels').update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq('id', editingLevel.id)
      } else {
        resp = await supabase.from('package_levels').insert(payload)
      }
      
      console.log('[Sets] Supabase response:', resp)
      
      if (resp.error) throw resp.error
      toast.success(editingLevel ? 'Level updated' : 'Level created')
      await refetchData()
      setDialogs(prev=>({...prev, createLevel:false}))
      setEditingLevel(null)
      setLevelForm({ name: '', base_price: '0.00' })
    } catch (e:any) {
      toast.error(e.message || 'Failed to save level')
    }
  }

  const handleDeleteLevel = async (levelId: string) => {
    try {
      const resp = await supabase.from('package_levels').delete().eq('id', levelId)
      if (resp.error) throw resp.error
      toast.success('Level deleted')
      if (selectedLevel?.id === levelId) setSelectedLevel(null)
      await refetchData()
    } catch (e:any) {
      toast.error(e.message || 'Failed to delete level')
    }
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
      
      // Fetch categories with franchise filtering (non-super-admin only sees their franchise)
      let categoriesQuery = supabase
        .from("packages_categories")
        .select("*")
      
      if (user?.role !== "super_admin" && user?.franchise_id) {
        categoriesQuery = categoriesQuery.eq("franchise_id", user.franchise_id)
      }
      
      const { data: categoriesData, error: categoriesError } = await categoriesQuery.order("display_order")
      if (categoriesError) throw categoriesError

      // Fetch variants by category_id (franchise filter for non-super-admin)
      let variantsQuery = supabase.from("package_variants").select("*")
      if (user?.role !== "super_admin" && user?.franchise_id) {
        variantsQuery = variantsQuery.eq("franchise_id", user.franchise_id)
      }
      const { data: allVariants, error: variantsError } = await variantsQuery.order("display_order")
      if (variantsError) throw variantsError

      const variantIds = (allVariants || []).map((v: any) => v.id)
      let levelsData: any[] = []
      if (variantIds.length > 0) {
        const { data: lvlData, error: levelsError } = await supabase
          .from("package_levels")
          .select("*")
          .in("variant_id", variantIds)
          .order("display_order")
        if (levelsError) throw levelsError
        levelsData = lvlData || []
      }

      const levelIds = levelsData.map((l: any) => l.id)
      let pricingData: any[] = []
      if (levelIds.length > 0) {
        const { data: dpData, error: dpError } = await supabase
          .from("distance_pricing")
          .select("*")
          .in("package_level_id", levelIds)
          .order("min_distance_km")
        if (dpError) throw dpError
  pricingData = (dpData || []).map((dp:any) => ({ 
    ...dp, 
    range: dp.range ?? dp.range_name ?? dp.distance_range ?? '',
    min_km: dp.min_km ?? dp.min_distance_km ?? 0,
    max_km: dp.max_km ?? dp.max_distance_km ?? 0,
    base_price_addition: dp.base_price_addition ?? dp.additional_price ?? 0
  }))
      }

      const categoriesWithVariants = (categoriesData || []).map((category:any) => {
        const variants = (allVariants || []).filter((v:any) => v.category_id === category.id)
        const variantsWithLevels = variants.map((v:any) => {
          const vLevels = levelsData.filter((l:any) => l.variant_id === v.id)
          const vLevelsWithPricing = vLevels.map((lvl:any) => ({
            ...lvl,
            distance_pricing: pricingData.filter((dp:any) => dp.package_level_id === lvl.id || dp.level_id === lvl.id),
          }))
          return { ...v, package_levels: vLevelsWithPricing }
        })
        return { ...category, package_variants: variantsWithLevels }
      })

      setCategories(categoriesWithVariants)

      if (selectedCategory) {
        const updatedCategory = categoriesWithVariants.find((c:any) => c.id === selectedCategory.id)
        if (updatedCategory) setSelectedCategory(updatedCategory)
      }
      if (selectedVariant && selectedCategory) {
        const updatedCategory = categoriesWithVariants.find((c:any)=>c.id===selectedCategory.id)
        const updatedVariant = (updatedCategory?.package_variants||[]).find((v:any)=>v.id===selectedVariant.id)
        if (updatedVariant) {
          setSelectedVariant(updatedVariant)
          // Update selected level with fresh data including distance pricing
          if (selectedLevel) {
            const updatedLevel = (updatedVariant.package_levels||[]).find((l:any)=>l.id===selectedLevel.id)
            if (updatedLevel) setSelectedLevel(updatedLevel)
          }
        }
      }
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="border-brown-300 text-brown-700 hover:bg-brown-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
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
              {categories.reduce((acc, cat) => acc + (cat.package_variants || []).length, 0)}
            </div>
            <div className="text-brown-600">Variants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage-dark">
              {categories.reduce((acc, cat) => 
                acc + (cat.package_variants || []).reduce((vAcc, variant) => 
                  vAcc + (variant.package_levels || []).length, 0), 0
              )}
            </div>
            <div className="text-brown-600">Levels</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage-dark">
              {categories.reduce((acc, cat) => 
                acc + (cat.package_variants || []).reduce((vAcc, variant) => 
                  vAcc + (variant.package_levels || []).reduce((lAcc, level) => 
                    lAcc + (level.distance_pricing || []).length, 0), 0), 0
              )}
            </div>
            <div className="text-brown-600">Distance Tiers</div>
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
            value="variants"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <Palette className="w-4 h-4 mr-2" />
            Variants
          </TabsTrigger>
          <TabsTrigger
            value="levels"
            className="data-[state=active]:bg-heritage-dark data-[state=active]:text-gray-800"
          >
            <Layers className="w-4 h-4 mr-2" />
            Levels
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

        

        <TabsContent value="variants" className="space-y-4">
          {!selectedCategory ? (
            <div className="text-center py-8">
              <Palette className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Category</h3>
              <p className="text-brown-600 mb-4">Choose a category to view its variants</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="vintage-heading text-xl font-bold text-heritage-dark mb-2">{selectedCategory.name}</h3>
                  <p className="text-sm text-brown-600">
                    {(selectedCategory.package_variants || []).length} variants available
                  </p>
                </div>
                <Button
                  onClick={() => setDialogs((prev) => ({ ...prev, createVariant: true }))}
                  className="bg-heritage-dark hover:bg-heritage-dark/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedCategory.package_variants || []).map((variant: any) => (
                  <Card key={variant.id} className="card-heritage">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold vintage-heading text-heritage-dark">{variant.name}</h4>
                        <p className="text-sm text-brown-600 mt-1 line-clamp-2">{variant.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge className="bg-gold text-brown-800 font-semibold text-sm px-3 py-1">₹{variant.base_price?.toLocaleString() || "0"}</Badge>
                          {Array.isArray(variant.package_levels) && variant.package_levels.length > 0 && (
                            <span className="text-xs text-brown-500">{variant.package_levels.length} level(s)</span>
                          )}
                        </div>
                        {Array.isArray(variant.inclusions) && variant.inclusions.length > 0 && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <h5 className="text-sm font-bold text-purple-900 mb-2 uppercase tracking-wide">✨ Inclusions</h5>
                            <div className="flex flex-wrap gap-2">
                              {variant.inclusions.map((inc: string, idx: number) => {
                                const colors = [
                                  'bg-purple-500 text-white',
                                  'bg-blue-500 text-white',
                                  'bg-green-500 text-white',
                                  'bg-orange-500 text-white',
                                  'bg-pink-500 text-white',
                                  'bg-teal-500 text-white',
                                ]
                                const colorClass = colors[idx % colors.length]
                                return (
                                  <Badge key={idx} className={`${colorClass} font-semibold text-sm px-3 py-1.5 shadow-sm`}>
                                    {inc}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVariant(variant)
                            setActiveTab("levels")
                          }}
                        >
                          View Levels
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/30"
                            onClick={() => handleEditVariant(variant)}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add/Edit Variant Dialog */}
              <Dialog
                open={dialogs.createVariant}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, createVariant: open }))
                  if (!open) {
                    setEditingVariant(null)
                    setVariantForm({ name: "", description: "", extra_price: "0.00", extra_safa_price: "0.00", missing_safa_penalty: "0.00", inclusions: "" })
                  }
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="vintage-heading text-heritage-dark">
                      {editingVariant ? "Edit Variant" : "Create New Variant"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedCategory ? `Category: ${selectedCategory.name}` : "Select a category first"}
                    </DialogDescription>
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
                      <Label htmlFor="variant-price">Base Price (₹)</Label>
                      <Input
                        id="variant-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Base price for this variant"
                        value={variantForm.extra_price}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, extra_price: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">This is the base price for the variant.</p>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="extra-safa-price">Extra Safa Price (₹)</Label>
                        <Input
                          id="extra-safa-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price per extra safa"
                          value={variantForm.extra_safa_price}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, extra_safa_price: e.target.value }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Charge for additional safas</p>
                      </div>
                      <div>
                        <Label htmlFor="missing-safa-penalty">Missing Safa Penalty (₹)</Label>
                        <Input
                          id="missing-safa-penalty"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Penalty for missing safas"
                          value={variantForm.missing_safa_penalty}
                          onChange={(e) => setVariantForm((prev) => ({ ...prev, missing_safa_penalty: e.target.value }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Charge if safas are lost/damaged</p>
                      </div>
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
  {/* Removed stray legacy variant card block that caused JSX mismatch
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
                      <Label htmlFor="variant-price">Base Price (₹)</Label>
                      <Input
                        id="variant-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Base price for this variant"
                        value={variantForm.extra_price}
                        onChange={(e) => setVariantForm((prev) => ({ ...prev, extra_price: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">This is the base price for the variant.</p>
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
              */}

        <TabsContent value="levels" className="space-y-4">
          {!selectedVariant ? (
            <div className="text-center py-8">
              <Layers className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Variant</h3>
              <p className="text-brown-600 mb-4">Choose a variant to view its levels</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
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
                    <p className="text-sm text-brown-600">Manage levels for this variant</p>
                  </div>
                </div>
                <Button
                  onClick={() => setDialogs((prev) => ({ ...prev, createLevel: true }))}
                  className="bg-heritage-dark hover:bg-heritage-dark/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Level
                </Button>
              </div>

              <div className="grid gap-4">
                {(selectedVariant.package_levels || []).map((level) => {
                  const variantBase = selectedVariant.base_price || 0
                  const levelExtra = level.base_price || 0
                  const total = variantBase + levelExtra
                  return (
                  <Card key={level.id} className="card-heritage">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold">{level.name}</h4>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-brown-600">₹{variantBase.toLocaleString()} (base)</span>
                            <span className="text-brown-400">+</span>
                            <span className="text-sm text-brown-600">₹{levelExtra.toLocaleString()} (additional)</span>
                            <span className="text-brown-400">=</span>
                            <Badge className="bg-gold text-brown-800 font-semibold">₹{total.toLocaleString()}</Badge>
                            <span className="text-brown-400">•</span>
                            <Badge variant="outline" className="text-xs">
                              {(level.distance_pricing || []).length} distance tiers
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLevel(level)
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
                            onClick={() => {
                              setEditingLevel(level)
                              setLevelForm({ name: level.name, base_price: String(level.base_price || 0) })
                              setDialogs((prev) => ({ ...prev, createLevel: true }))
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50 bg-red-50/30"
                            onClick={() => handleDeleteLevel(level.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>

              <Dialog
                open={dialogs.createLevel}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, createLevel: open }))
                  if (!open) {
                    setEditingLevel(null)
                    setLevelForm({ name: "", base_price: "0.00" })
                  }
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="vintage-heading">
                      {editingLevel ? "Edit Level" : "Create New Level"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-brown-600">
                      {selectedVariant && (
                        <span>Variant Base Price: ₹{selectedVariant.base_price?.toLocaleString() || "0"}</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="level-name">Level Name</Label>
                      <Input
                        id="level-name"
                        placeholder="e.g., Basic, Premium, VIP"
                        value={levelForm.name}
                        onChange={(e) => setLevelForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="level-price">Additional Price (₹) - Optional</Label>
                      <Input
                        id="level-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={levelForm.base_price}
                        onChange={(e) => setLevelForm((prev) => ({ ...prev, base_price: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total = Variant Base (₹{selectedVariant?.base_price?.toLocaleString() || "0"}) + Additional (₹{levelForm.base_price || "0"})
                        {" = ₹"}
                        {((selectedVariant?.base_price || 0) + (Number.parseFloat(levelForm.base_price) || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogs((prev) => ({ ...prev, createLevel: false }))}>
                      Cancel
                    </Button>
                    <Button className="btn-heritage-dark" onClick={handleSaveLevel}>
                      {editingLevel ? "Update Level" : "Create Level"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>
        

        <TabsContent value="pricing" className="space-y-4">
          {!selectedLevel ? (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto text-brown-400 mb-4" />
              <h3 className="vintage-heading text-xl mb-2">Select a Level</h3>
              <p className="text-brown-600 mb-4">Choose a level to view and manage its distance pricing</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLevel(null)}
                    className="border-brown-300 text-brown-700 hover:bg-brown-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Levels
                  </Button>
                  <div>
                    <h3 className="vintage-heading text-lg font-semibold">{selectedLevel.name}</h3>
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
                {(selectedLevel.distance_pricing || []).map((pricing, index) => (
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
                                {(selectedLevel && selectedLevel.base_price)
                                  ? (calculatePrice(selectedLevel.base_price, selectedLevel.base_price, pricing)).toLocaleString()
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
                      <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">💰 Total Price Calculation:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Variant Base:</span>
                            <span className="font-semibold">₹{(selectedVariant?.base_price || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Level Additional:</span>
                            <span className="font-semibold">₹{(selectedLevel?.base_price || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-purple-200 pt-1">
                            <span className="text-gray-700 font-medium">Level Total:</span>
                            <span className="font-bold">₹{((selectedVariant?.base_price || 0) + (selectedLevel?.base_price || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">+ Distance Charge:</span>
                            <span className="font-semibold text-blue-600">₹{(distancePricingForm.base_price_addition || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t-2 border-purple-300 pt-1">
                            <span className="text-purple-700 font-bold">Final Price:</span>
                            <span className="font-bold text-lg text-purple-700">₹{((selectedVariant?.base_price || 0) + (selectedLevel?.base_price || 0) + (distancePricingForm.base_price_addition || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
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
      <ConfirmDialog
        open={showVariantDeleteDialog}
        title="Delete Variant"
        description={pendingVariantDelete ? `Delete variant "${pendingVariantDelete.name}"? This cannot be undone.` : ''}
        destructive
        confirmLabel="Delete"
        onConfirm={confirmDeleteVariant}
        onCancel={()=>{ setShowVariantDeleteDialog(false); setPendingVariantDelete(null) }}
      />
    </div>
  )
}

export default PackagesClient
