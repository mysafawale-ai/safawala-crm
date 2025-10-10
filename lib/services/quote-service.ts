import { supabase } from "@/lib/supabase"
import type { Quote, CreateQuoteData, QuoteFilters } from "@/lib/types"

export class QuoteService {
  static async create(data: CreateQuoteData): Promise<Quote> {
    try {
      console.log("Creating quote with data:", data)

      // Generate quote number
      const { data: quoteNumberData, error: quoteNumberError } = await supabase.rpc("generate_quote_number")

      if (quoteNumberError) {
        console.error("Error generating quote number:", quoteNumberError)
        throw quoteNumberError
      }

      console.log("Generated quote number:", quoteNumberData)
      const quoteNumber = quoteNumberData as string

      // Calculate valid until date (7 days from now)
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 7)

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          quote_number: quoteNumber,
          customer_id: data.customer_id || null,
          type: data.type || "rental",
          event_type: data.event_type || "wedding",
          event_date: data.event_date || null,
          delivery_date: data.delivery_date || null,
          return_date: data.return_date || null,

          customer_name: data.customer_name || "",
          customer_phone: data.customer_phone || "",
          customer_whatsapp: data.customer_whatsapp,
          customer_email: data.customer_email || "",
          customer_address: data.customer_address || "",
          customer_city: data.customer_city,
          customer_pincode: data.customer_pincode,
          customer_state: data.customer_state,

          event_for: data.event_for || "both",
          groom_name: data.groom_name,
          bride_name: data.bride_name,
          venue_name: data.venue_name || "",
          venue_address: data.venue_address || "",

          total_amount: data.total_amount,
          security_deposit: data.security_deposit || 0,
          tax_amount: data.tax_amount || 0,
          discount_amount: data.discount_amount || 0,

          special_instructions: data.special_instructions || "",
          notes: data.notes,

          valid_until: validUntil.toISOString().split("T")[0],
          status: "generated",
        })
        .select()
        .single()

      if (quoteError) {
        console.error("Error inserting quote:", quoteError)
        throw quoteError
      }

      // Create quote items
      if (data.items && data.items.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(
          data.items.map((item) => ({
            quote_id: quote.id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            product_code: item.product_code,
            category: item.category || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            security_deposit: item.security_deposit || 0,
          })),
        )

        if (itemsError) {
          console.error("Error inserting quote items:", itemsError)
          throw itemsError
        }
      }

      console.log("Successfully created quote:", quote)
      return quote
    } catch (error) {
      console.error("Error creating quote:", error)
      throw error
    }
  }

  static async getAll(filters: QuoteFilters = {}): Promise<Quote[]> {
    try {
      console.log("Fetching quotes with filters:", filters)

      // Fetch from product_orders where is_quote=true
      let productQuery = supabase
        .from("product_orders")
        .select(`
          *,
          customer:customers(name, phone, email),
          product_order_items(
            *,
            product:products(name)
          )
        `)
        .eq("is_quote", true)
        .order("created_at", { ascending: false })

      // Fetch from package_bookings where is_quote=true
      let packageQuery = supabase
        .from("package_bookings")
        .select(`
          *,
          customer:customers(name, phone, email),
          package_booking_items(
            *,
            package:package_sets(name)
          )
        `)
        .eq("is_quote", true)
        .order("created_at", { ascending: false })

      // Apply filters
      if (filters.status) {
        productQuery = productQuery.eq("status", filters.status)
        packageQuery = packageQuery.eq("status", filters.status)
      }

      if (filters.customer_id) {
        productQuery = productQuery.eq("customer_id", filters.customer_id)
        packageQuery = packageQuery.eq("customer_id", filters.customer_id)
      }

      if (filters.date_from) {
        productQuery = productQuery.gte("created_at", filters.date_from)
        packageQuery = packageQuery.gte("created_at", filters.date_from)
      }

      if (filters.date_to) {
        productQuery = productQuery.lte("created_at", filters.date_to)
        packageQuery = packageQuery.lte("created_at", filters.date_to)
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`
        productQuery = productQuery.or(`
          order_number.ilike.${searchPattern},
          groom_name.ilike.${searchPattern},
          bride_name.ilike.${searchPattern}
        `)
        packageQuery = packageQuery.or(`
          package_number.ilike.${searchPattern},
          groom_name.ilike.${searchPattern},
          bride_name.ilike.${searchPattern}
        `)
      }

      const [productResult, packageResult] = await Promise.all([
        productQuery,
        packageQuery
      ])

      console.log("📦 Product orders query result:", {
        success: !productResult.error,
        count: productResult.data?.length || 0,
        error: productResult.error ? {
          message: productResult.error.message,
          code: productResult.error.code,
          details: productResult.error.details,
        } : null
      })

      console.log("📋 Package bookings query result:", {
        success: !packageResult.error,
        count: packageResult.data?.length || 0,
        error: packageResult.error ? {
          message: packageResult.error.message,
          code: packageResult.error.code,
          details: packageResult.error.details,
        } : null
      })

      if (productResult.error) {
        console.error("Error fetching product quotes:", productResult.error)
        if (typeof window !== 'undefined') {
          ;(window as any).__QUOTE_SCHEMA_ERROR__ = true
        }
        // Don't throw - continue with package data
      }

      if (packageResult.error) {
        console.error("Error fetching package quotes:", packageResult.error)
        if (typeof window !== 'undefined') {
          ;(window as any).__QUOTE_SCHEMA_ERROR__ = true
        }
        // Don't throw - continue with product data
      }

      // Transform data to Quote format
      const productQuotes = (productResult.data || []).map((order: any) => ({
        id: order.id,
        quote_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customer?.name || '',
        customer_phone: order.customer?.phone || '',
        customer_email: order.customer?.email || '',
        event_type: order.event_type,
        event_date: order.event_date,
        delivery_date: order.delivery_date,
        return_date: order.return_date,
        groom_name: order.groom_name,
        bride_name: order.bride_name,
        venue_address: order.venue_address,
        total_amount: order.total_amount,
        subtotal_amount: order.subtotal_amount,
        tax_amount: order.tax_amount,
        status: order.status,
        notes: order.notes,
        created_at: order.created_at,
        quote_items: order.product_order_items,
        booking_type: 'product',
        booking_subtype: order.booking_type || 'rental' // rental or sale
      }))

      const packageQuotes = (packageResult.data || []).map((booking: any) => ({
        id: booking.id,
        quote_number: booking.package_number,
        customer_id: booking.customer_id,
        customer_name: booking.customer?.name || '',
        customer_phone: booking.customer?.phone || '',
        customer_email: booking.customer?.email || '',
        event_type: booking.event_type,
        event_date: booking.event_date,
        delivery_date: booking.delivery_date,
        return_date: booking.return_date,
        groom_name: booking.groom_name,
        bride_name: booking.bride_name,
        venue_address: booking.venue_address,
        total_amount: booking.total_amount,
        subtotal_amount: booking.subtotal_amount,
        tax_amount: booking.tax_amount,
        status: booking.status,
        notes: booking.notes,
        created_at: booking.created_at,
        quote_items: booking.package_booking_items,
        booking_type: 'package',
        booking_subtype: 'rental' // packages are always rental
      }))

      // Combine and sort by created_at
      const allQuotes = [...productQuotes, ...packageQuotes].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      console.log("✅ Successfully fetched quotes:", {
        total: allQuotes.length,
        product: productQuotes.length,
        package: packageQuotes.length,
      })
      console.log("Sample quotes:", allQuotes.slice(0, 2))
      
      return allQuotes
    } catch (error) {
      if (typeof window !== 'undefined') {
        ;(window as any).__QUOTE_SCHEMA_ERROR__ = true
      }
      console.error("Error fetching quotes:", error)
      throw error
    }
  }

  static async getById(id: string): Promise<Quote | null> {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          customer:customers(name, phone, email, address, city),
          quote_items(*)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching quote:", error)
      throw error
    }
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    try {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error updating quote status:", error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error deleting quote:", error)
      throw error
    }
  }

  static async getStats(): Promise<{
    total: number
    generated: number
    sent: number
    accepted: number
    rejected: number
    converted: number
    expired: number
  }> {
    try {
      console.log("Fetching quote stats")

      // Fetch from both product_orders and package_bookings where is_quote=true
      const [productResult, packageResult] = await Promise.all([
        supabase.from("product_orders").select("status").eq("is_quote", true),
        supabase.from("package_bookings").select("status").eq("is_quote", true)
      ])

      console.log("📊 Stats query results:", {
        productSuccess: !productResult.error,
        productCount: productResult.data?.length || 0,
        packageSuccess: !packageResult.error,
        packageCount: packageResult.data?.length || 0,
      })

      if (productResult.error) {
        console.error("Error in getStats product query:", productResult.error)
        if (typeof window !== 'undefined') (window as any).__QUOTE_SCHEMA_ERROR__ = true
        // Don't throw - continue with package data
      }

      if (packageResult.error) {
        console.error("Error in getStats package query:", packageResult.error)
        if (typeof window !== 'undefined') (window as any).__QUOTE_SCHEMA_ERROR__ = true
        // Don't throw - continue with product data
      }

      const data = [...(productResult.data || []), ...(packageResult.data || [])]

      console.log("Stats data total:", data.length)

      const stats = {
        total: data.length,
        generated: data.filter((q: any) => q.status === "generated").length,
        sent: data.filter((q: any) => q.status === "sent").length,
        accepted: data.filter((q: any) => q.status === "accepted").length,
        rejected: data.filter((q: any) => q.status === "rejected").length,
        converted: data.filter((q: any) => q.status === "converted").length,
        expired: data.filter((q: any) => q.status === "expired").length,
      }

      console.log("📈 Final stats:", stats)
      return stats
    } catch (error) {
      if (typeof window !== 'undefined') (window as any).__QUOTE_SCHEMA_ERROR__ = true
      console.error("Error fetching quote stats:", error)
      // Return zeros instead of throwing
      return {
        total: 0,
        generated: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        converted: 0,
        expired: 0,
      }
    }
  }

  static async getQuoteAnalytics(dateRange?: { from: string; to: string }) {
    try {
      let query = supabase.from("quotes").select("total_amount, status, created_at, type")

      if (dateRange) {
        query = query.gte("created_at", dateRange.from).lte("created_at", dateRange.to)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate analytics
      const totalRevenue = data.reduce((sum: number, quote: any) => sum + (quote.total_amount || 0), 0)
      const avgQuoteValue = data.length > 0 ? totalRevenue / data.length : 0
      const conversionRate =
        data.length > 0 ? (data.filter((q: any) => q.status === "converted").length / data.length) * 100 : 0

      const revenueByType = data.reduce(
        (acc: Record<string, number>, quote: any) => {
          acc[quote.type] = (acc[quote.type] || 0) + (quote.total_amount || 0)
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalRevenue,
        avgQuoteValue,
        conversionRate,
        revenueByType,
        totalQuotes: data.length,
      }
    } catch (error) {
      console.error("Error fetching quote analytics:", error)
      throw error
    }
  }

  static async getQuotesByDateRange(from: string, to: string): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          customer:customers(name, phone, email),
          quote_items(*)
        `)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching quotes by date range:", error)
      throw error
    }
  }
}

// Export both the class and an instance for backward compatibility
export const quoteService = new QuoteService()

// Re-export types for convenience
export type { CreateQuoteData, QuoteFilters } from "@/lib/types"
