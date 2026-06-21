"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getPortalConfig, getDefaultPortalForRole } from "@/lib/portal-config"
import { PortalMobileLayout } from "@/components/portal/portal-mobile-layout"
import type { User } from "@/lib/types"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const dept = params.dept as string
  const [ready, setReady] = useState(false)
  const [config, setConfig] = useState(getPortalConfig(dept))

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (!raw) {
      router.replace(`/auth/login?redirect=/portal/${dept}`)
      return
    }

    let user: User
    try {
      user = JSON.parse(raw)
    } catch {
      router.replace("/auth/login")
      return
    }

    const resolvedConfig = getPortalConfig(dept)
    if (!resolvedConfig) {
      // Unknown dept — send to their correct portal
      const correctDept = user.department || getDefaultPortalForRole(user.role)
      router.replace(`/portal/${correctDept}`)
      return
    }

    // Role guard: super_admin can visit any portal
    if (user.role !== "super_admin" && user.role !== "franchise_admin") {
      const userDept = user.department || getDefaultPortalForRole(user.role)
      if (userDept !== dept) {
        router.replace(`/portal/${userDept}`)
        return
      }
    }

    setConfig(resolvedConfig)
    setReady(true)
  }, [dept, router])

  if (!ready || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5ebe0" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#22c55e", borderTopColor: "transparent" }} />
          <p className="text-xs font-semibold" style={{ color: "rgba(80,55,30,0.5)" }}>Loading portal...</p>
        </div>
      </div>
    )
  }

  return <PortalMobileLayout config={config}>{children}</PortalMobileLayout>
}
