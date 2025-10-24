'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, MoreHorizontal, ArrowLeft, Filter, Tag, Layers, Package } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  is_active: boolean
  product_count: number
  created_at: string
}

interface SubCategory {
  id: string
  name: string
  description?: string
  parent_id: string
  is_active: boolean
  product_count: number
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      // Fetch current user to enforce franchise isolation
      const userRes = await fetch('/api/auth/user')
      if (!userRes.ok) throw new Error('Failed to fetch user')
      const user = await userRes.json()
      const isSuperAdmin = user?.role === 'super_admin'
      const franchiseId = user?.franchise_id
      
      // Fetch categories with product counts
      let categoriesQuery = supabase
        .from('product_categories')
        .select('*')
        .is('parent_id', null)
        .order('name')
      
      // Apply franchise isolation for non-super-admins
      if (!isSuperAdmin && franchiseId) {
        categoriesQuery = categoriesQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
      }
      
      const { data: categoriesData, error: categoriesError } = await categoriesQuery

      if (categoriesError) throw categoriesError

      // Get product counts separately for main categories
      const categoryCounts = await Promise.all(
        (categoriesData || []).map(async (category: any) => {
          let countQuery = supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          if (!isSuperAdmin && franchiseId) {
            countQuery = countQuery.eq('franchise_id', franchiseId)
          }

          const { count } = await countQuery
          
          return {
            ...category,
            product_count: count || 0
          }
        })
      )

      // Fetch subcategories
      let subCategoriesQuery = supabase
        .from('product_categories')
        .select('*')
        .not('parent_id', 'is', null)
        .order('name')
      
      // Apply franchise isolation for non-super-admins
      if (!isSuperAdmin && franchiseId) {
        subCategoriesQuery = subCategoriesQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
      }
      
      const { data: subCategoriesData, error: subCategoriesError } = await subCategoriesQuery

      if (subCategoriesError) throw subCategoriesError

      // Get product counts separately for subcategories
      const subCategoryCounts = await Promise.all(
        (subCategoriesData || []).map(async (category: any) => {
          let countQuery = supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          if (!isSuperAdmin && franchiseId) {
            countQuery = countQuery.eq('franchise_id', franchiseId)
          }

          const { count } = await countQuery
          
          return {
            ...category,
            product_count: count || 0
          }
        })
      )

      setCategories(categoryCounts)
      setSubCategories(subCategoryCounts)

    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      // Get current user for franchise_id
      const userRes = await fetch('/api/auth/user')
      if (!userRes.ok) throw new Error('Failed to fetch user')
      const user = await userRes.json()
      const isSuperAdmin = user?.role === 'super_admin'
      const franchiseId = user?.franchise_id

      const { error } = await supabase
        .from('product_categories')
        .insert([{
          name: formData.name,
          description: formData.description,
          parent_id: formData.parent_id || null,
          is_active: formData.is_active,
          // Set franchise_id for non-super-admins, null for super_admin (global categories)
          franchise_id: !isSuperAdmin && franchiseId ? franchiseId : null
        }])

      if (error) throw error

      toast.success('Category added successfully')
      setIsAddDialogOpen(false)
      setFormData({ name: '', description: '', parent_id: '', is_active: true })
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory) return

    try {
      // Get current user for franchise validation
      const userRes = await fetch('/api/auth/user')
      if (!userRes.ok) throw new Error('Failed to fetch user')
      const user = await userRes.json()
      const isSuperAdmin = user?.role === 'super_admin'
      const franchiseId = user?.franchise_id

      // Build update query with franchise isolation
      let updateQuery = supabase
        .from('product_categories')
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active
        })
        .eq('id', selectedCategory.id)
      
      // Non-super-admins can only update their own franchise categories or global categories
      if (!isSuperAdmin && franchiseId) {
        updateQuery = updateQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
      }

      const { error } = await updateQuery

      if (error) throw error

      toast.success('Category updated successfully')
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      setFormData({ name: '', description: '', parent_id: '', is_active: true })
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    showConfirmation({
      title: 'Delete category?',
      description: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          // Get current user for franchise validation
          const userRes = await fetch('/api/auth/user')
          if (!userRes.ok) throw new Error('Failed to fetch user')
          const user = await userRes.json()
          const isSuperAdmin = user?.role === 'super_admin'
          const franchiseId = user?.franchise_id

          // Build delete query with franchise isolation
          let deleteQuery = supabase
            .from('product_categories')
            .delete()
            .eq('id', id)
          
          // Non-super-admins can only delete their own franchise categories
          if (!isSuperAdmin && franchiseId) {
            deleteQuery = deleteQuery.eq('franchise_id', franchiseId)
          }

          const { error } = await deleteQuery

          if (error) throw error

          toast.success('Category deleted successfully')
          fetchCategories()
        } catch (error) {
          console.error('Error deleting category:', error)
          toast.error('Failed to delete category')
          // Re-throw so the dialog can show error state if it wants
          throw error
        }
      }
    })
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active
    })
    setIsEditDialogOpen(true)
  }

  const totalCategories = categories.length
  const totalSubCategories = subCategories.length
  const activeCategories = categories.filter(c => c.is_active).length
  // Fix: Don't double-count! Products belong to ONE category_id (could be main or sub)
  // Count all unique products across all categories (main + sub)
  const allCategories = [...categories, ...subCategories]
  const totalProducts = allCategories.reduce((sum, c) => sum + c.product_count, 0)

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Inventory
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
              <p className="text-muted-foreground">Organize your products with categories and subcategories</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category or subcategory for your products.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parent">Parent Category (Optional)</Label>
                  <select
                    id="parent"
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">None (Main Category)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Main Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                Primary categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubCategories}</div>
              <p className="text-xs text-muted-foreground">
                Secondary categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
              <Filter className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCategories}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Main Categories</CardTitle>
            <CardDescription>
              Primary product categories for your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No categories found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {category.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.product_count} products
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Subcategories */}
        {subCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
              <CardDescription>
                Secondary categories organized under main categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subcategory Name</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subCategories.map((subCategory) => {
                      const parentCategory = categories.find(c => c.id === subCategory.parent_id)
                      return (
                        <TableRow key={subCategory.id}>
                          <TableCell>
                            <div className="font-medium">{subCategory.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {parentCategory?.name || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {subCategory.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {subCategory.product_count} products
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subCategory.is_active ? 'default' : 'secondary'}>
                              {subCategory.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(subCategory as Category)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCategory(subCategory.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

  {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>Update Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Global confirmation dialog (used for deletions) */}
        <ConfirmationDialog />
      </div>
    </DashboardLayout>
  )
}
