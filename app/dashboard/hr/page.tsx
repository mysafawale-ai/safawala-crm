"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
export default function DashboardHR() {
  const router = useRouter()
  useEffect(() => { router.replace("/portal/hr") }, [router])
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#a1a1aa", fontSize: 13 }}>
      Redirecting to HR portal...
    </div>
  )
}
