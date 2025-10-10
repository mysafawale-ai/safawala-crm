import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

export interface CreateProductData {
  name: string
  description?: string
  category: string
  product_code: string
  price: number
  rental_price: number
  cost_price: number
  stock_available: number
  min_stock_level: number
  security_deposit?: number
  franchise_id?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

class ProductService {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  }

  async getAvailable(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock_available", 0)
        .order("name", { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error fetching available products:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

      if (error) throw error

      return data
    } catch (error) {
      console.error("Error fetching product:", error)
      throw error
    }
  }

  async create(productData: CreateProductData): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: productData.name,
          description: productData.description,
          category: productData.category,
          product_code: productData.product_code,
          price: productData.price,
          rental_price: productData.rental_price,
          cost_price: productData.cost_price,
          stock_available: productData.stock_available,
          min_stock_level: productData.min_stock_level,
          security_deposit: productData.security_deposit || 0,
          franchise_id: productData.franchise_id || "",
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error("Error creating product:", error)
      throw error
    }
  }

  async update(productData: UpdateProductData): Promise<Product> {
    try {
      const { id, ...updateData } = productData

      const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select().single()

      if (error) throw error

      return data
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    try {
      const { error } = await supabase.from("products").update({ stock_available: quantity }).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating product stock:", error)
      throw error
    }
  }

  async getLowStock(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .filter("stock_available", "lte", "min_stock_level")
        .order("stock_available", { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error fetching low stock products:", error)
      throw error
    }
  }
}

export const productService = new ProductService()
