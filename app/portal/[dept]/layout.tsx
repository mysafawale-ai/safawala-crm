"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getPortalConfig, getDefaultPortalForRole } from "@/lib/portal-config"
import { PortalMobileLayout } from "@/components/portal/portal-mobile-layout"
import type { User } from "@/lib/types"

// Map known dept aliases to canonical portal slugs
const DEPT_ALIASES: Record<string, string> = {
  bookings: "booking",
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const rawDept = params.dept as string
  const dept = DEPT_ALIASES[rawDept] || rawDept
  const [ready, setReady] = useState(false)
  const [config, setConfig] = useState(getPortalConfig(dept))

  useEffect(() => {
    // If URL has an alias dept slug, redirect to canonical immediately
    if (rawDept !== dept) {
      router.replace(`/portal/${dept}`)
      return
    }

    const raw = localStorage.getItem("safawala_user")
    if (!raw) {
      router.replace(`/login/${dept}`)
      return
    }

    let user: User
    try {
      user = JSON.parse(raw)
    } catch {
      router.replace(`/login/${dept}`)
      return
    }

    const resolvedConfig = getPortalConfig(dept)
    if (!resolvedConfig) {
      // Unknown dept — send to their correct portal (normalize aliases)
      const rawCorrect = user.department || getDefaultPortalForRole(user.role)
      const correctDept = DEPT_ALIASES[rawCorrect] || rawCorrect
      router.replace(`/portal/${correctDept}`)
      return
    }

    // Role guard: super_admin and franchise_admin can visit any portal
    if (user.role !== "super_admin" && user.role !== "franchise_admin") {
      const rawUserDept = user.department || getDefaultPortalForRole(user.role)
      const userDept = DEPT_ALIASES[rawUserDept] || rawUserDept
      if (userDept !== dept) {
        router.replace(`/portal/${userDept}`)
        return
      }
    }

    setConfig(resolvedConfig)
    setReady(true)
  }, [dept, rawDept, router])

  if (!ready || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#a855f7", borderTopColor: "transparent" }} />
          <p className="text-xs font-semibold" style={{ color: "#a1a1aa" }}>Loading portal...</p>
        </div>
      </div>
    )
  }

  return <PortalMobileLayout config={config}>{children}</PortalMobileLayout>
}
