"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { toast } from "sonner"

/**
 * Checks every 60 seconds if the current session is still valid.
 * If another device has logged in with the same email,
 * this session is invalidated and the user is logged out with a message.
 */
export function useSessionGuard() {
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify-session", { credentials: "include" })
      const data = await res.json()

      if (!data.valid) {
        if (data.reason === "session_replaced") {
          toast.error("You've been logged out — your account was accessed from another device.", {
            duration: 8000,
          })
        } else if (data.reason === "account_inactive") {
          toast.error("Your account has been deactivated. Please contact admin.")
        }

        await signOut()
        router.push("/")
      }
    } catch {
      // Network error — don't log out, just skip this check
    }
  }, [router])

  useEffect(() => {
    // Check once on mount (after 5s to let the page settle)
    const initialTimer = setTimeout(checkSession, 5000)

    // Then check every 60 seconds
    const interval = setInterval(checkSession, 60_000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [checkSession])
}
