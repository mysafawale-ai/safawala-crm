"use client"

import type { User } from "./types"

export async function signIn(email: string, password: string) {
  try {
    console.log("[v0] Attempting login with:", email)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      let errorMessage = "Login failed"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = `Server error: ${response.status}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const { user } = data

    // Store user data securely and wait for it to complete
    try {
      localStorage.setItem("safawala_user", JSON.stringify(user))
      // Verify it was stored
      const stored = localStorage.getItem("safawala_user")
      if (!stored) {
        throw new Error("Failed to store session")
      }
    } catch (storageError) {
      console.error("[v0] localStorage error:", storageError)
      throw new Error("Failed to save session. Please try again.")
    }

    return { user, userData: user }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    throw error
  }
}

export async function signOut() {
  try {
    localStorage.removeItem("safawala_user")
    
    // Clear server-side cookie
    await fetch("/api/auth/logout", { method: "POST" })
  } catch (error) {
    console.error("[v0] Sign out error:", error)
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (typeof window === "undefined") return null

    const storedUser = localStorage.getItem("safawala_user")
    if (!storedUser) return null

    return JSON.parse(storedUser)
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return null
  }
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    super_admin: 4,
    franchise_admin: 3,
    staff: 2,
    readonly: 1,
  }

  return (
    roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy]
  )
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("safawala_user") !== null
}

// Permission helper functions
export function canViewFinancials(userRole: string): boolean {
  return ["super_admin", "franchise_admin"].includes(userRole)
}

export function canManageStaff(userRole: string): boolean {
  return ["super_admin", "franchise_admin"].includes(userRole)
}

export function canManageFranchises(userRole: string): boolean {
  return userRole === "super_admin"
}

export function canDeleteData(userRole: string): boolean {
  return ["super_admin", "franchise_admin"].includes(userRole)
}

export function canEditPricing(userRole: string): boolean {
  return ["super_admin", "franchise_admin"].includes(userRole)
}

export function canViewReports(userRole: string): boolean {
  return ["super_admin", "franchise_admin", "readonly"].includes(userRole)
}
