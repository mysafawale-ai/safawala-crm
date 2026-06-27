"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
export default function DashboardInventory() {
  const router = useRouter()
  useEffect(() => { router.replace("/portal/warehouse/inventory") }, [router])
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#a1a1aa", fontSize: 13 }}>
      Redirecting to Inventory...
    </div>
  )
}
