interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl = ""

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Get user data for authentication headers
      const userDataStr = localStorage.getItem("safawala_user")
      const userData = userDataStr ? JSON.parse(userDataStr) : null

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          // Send authentication headers that match our middleware
          ...(userData && {
            "X-User-ID": userData.id,
            "X-User-Email": userData.email,
            "X-Session-ID": `session-${Date.now()}`
          }),
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          // Prefer string messages. If API returns structured error object, extract message or stringify.
          if (typeof errorData === 'string') {
            errorMessage = errorData
          } else if (errorData && typeof errorData === 'object') {
            if (errorData.error) {
              // ApiErrorResponse shape
              const errObj = errorData.error
              errorMessage = errObj.message || errObj.error || JSON.stringify(errObj)
            } else {
              errorMessage = errorData.message || JSON.stringify(errorData)
            }
          } else {
            errorMessage = errorMessage
          }
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        return { success: false, error: errorMessage }
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`[v0] API request failed for ${endpoint}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
