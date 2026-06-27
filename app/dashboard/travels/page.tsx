"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
export default function DashboardTravels() {
  const router = useRouter()
  useEffect(() => { router.replace("/portal/travels") }, [router])
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#a1a1aa", fontSize: 13 }}>
      Redirecting to Travels portal...
    </div>
  )
}
