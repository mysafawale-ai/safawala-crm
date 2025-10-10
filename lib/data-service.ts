import { apiClient } from "./api-client"
import type { Customer, Booking } from "./types"

interface DataCache {
  customers: Customer[]
  bookings: Booking[]
  lastFetch: { [key: string]: number }
  cachedData: { [key: string]: any }
}

class DataService {
  private cache: DataCache = {
    customers: [],
    bookings: [],
    lastFetch: {},
    cachedData: {},
  }

  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private isCacheValid(key: string): boolean {
    const lastFetch = this.cache.lastFetch[key]
    return Boolean(lastFetch && Date.now() - lastFetch < this.CACHE_DURATION)
  }

  private updateCache(key: string, data: any) {
    this.cache[key as keyof DataCache] = data
    this.cache.lastFetch[key] = Date.now()
  }

  async getCustomers(forceRefresh = false, params: Record<string, any> = {}): Promise<Customer[]> {
    if (!forceRefresh && this.isCacheValid("customers") && Object.keys(params).length === 0) {
      return this.cache.customers
    }

    // If caller didn't provide a franchise_id, try to read it from the stored user
    try {
      if (!params.franchise_id && typeof window !== 'undefined') {
        const stored = localStorage.getItem('safawala_user')
        if (stored) {
          const user = JSON.parse(stored)
          if (user && user.franchise_id) {
            params = { ...params, franchise_id: user.franchise_id }
          }
        }
      }
    } catch (e) {
      // ignore JSON parse errors and proceed without franchise_id
    }

    // Add include_staff and include_notes to get the related data
    const queryParams = new URLSearchParams({
      include_staff: 'true',
      include_notes: 'true',
      ...params
    }).toString();

    const response = await apiClient.get<{ customers: Customer[], total: number }>(`/api/customers?${queryParams}`)
    if (response.success && response.data) {
      // Extract customers array from the nested response structure
      const customers = response.data.customers || []
      
      // Only update the cache for default (non-filtered) requests
      if (Object.keys(params).length === 0) {
        this.updateCache("customers", customers)
      }
      
      return customers
    }

    throw new Error(response.error || "Failed to fetch customers")
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.post<Customer>("/api/customers", customerData)
    if (response.success && response.data) {
      // Update cache
      this.cache.customers = [response.data, ...this.cache.customers]
      return response.data
    }

    throw new Error(response.error || "Failed to create customer")
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/api/customers/${id}`, customerData)
    if (response.success && response.data) {
      // Update cache
      const index = this.cache.customers.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.cache.customers[index] = response.data
      }
      return response.data
    }

    throw new Error(response.error || "Failed to update customer")
  }

  async deleteCustomer(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/customers/${id}`)
    if (response.success) {
      // Update cache
      this.cache.customers = this.cache.customers.filter((c) => c.id !== id)
      return
    }

    throw new Error(response.error || "Failed to delete customer")
  }

  async getBookings(forceRefresh = false): Promise<Booking[]> {
    if (!forceRefresh && this.isCacheValid("bookings")) {
      return this.cache.bookings
    }

    const response = await apiClient.get<Booking[]>("/api/bookings")
    if (response.success && response.data) {
      this.updateCache("bookings", response.data)
      return response.data
    }

    throw new Error(response.error || "Failed to fetch bookings")
  }

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const response = await apiClient.post<Booking>("/api/bookings", bookingData)
    if (response.success && response.data) {
      // Update cache
      this.cache.bookings = [response.data, ...this.cache.bookings]
      return response.data
    }

    throw new Error(response.error || "Failed to create booking")
  }

  async getDashboardStats(forceRefresh = false): Promise<any> {
    const cacheKey = "dashboard-stats"
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.cachedData[cacheKey]
    }

    try {
      const response = await apiClient.get("/api/dashboard/stats")
      if (response.success && response.data) {
        this.cache.lastFetch[cacheKey] = Date.now()
        this.cache.cachedData[cacheKey] = response.data
        return response.data
      }
    } catch (error) {
      console.log("Dashboard stats API not available, using mock data")
    }
    
    // Return mock data if API fails or doesn't exist yet
    const mockStats = {
      totalBookings: 15,
      activeBookings: 8,
      totalCustomers: 7,
      totalRevenue: 125000,
      monthlyGrowth: 15.5,
      lowStockItems: 3
    }
    
    this.cache.lastFetch[cacheKey] = Date.now()
    this.cache.cachedData[cacheKey] = mockStats
    return mockStats
  }

  async getRecentBookings(forceRefresh = false): Promise<Booking[]> {
    const bookings = await this.getBookings(true)
    return bookings.slice(0, 5) // Return 5 most recent bookings
  }

  async getCalendarBookings(forceRefresh = false): Promise<any[]> {
    const bookings = await this.getBookings(true)
    return bookings.map(booking => ({
      id: booking.id,
      title: `${booking.customer?.name || 'Customer'} - ${booking.event_type || 'Event'}`,
      start: booking.event_date,
      end: booking.event_date,
      status: booking.status
    }))
  }

  clearCache() {
    this.cache = {
      customers: [],
      bookings: [],
      lastFetch: {},
      cachedData: {},
    }
  }
}

export const dataService = new DataService()
