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
  // Session guard disabled
  return
}
