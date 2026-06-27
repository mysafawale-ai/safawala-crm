"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
const ACCENT = "#a855f7"
const BORDER = "#e4e4e7"
export default function DashboardProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (raw) { try { setUser(JSON.parse(raw)) } catch {} }
  }, [])
  async function logout() {
    try { await signOut() } catch {}
    localStorage.removeItem("safawala_user")
    router.push("/login/franchise")
  }
  if (!user) return null
  const initials = user.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"
  return (
    <div style={{ padding: "32px 36px", maxWidth: 480, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 900, color: "#18181b" }}>My Profile</h1>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 900 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#18181b" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>{user.role?.replace(/_/g, " ")}</div>
          </div>
        </div>
        {[["Email", user.email], ["Franchise", user.franchise_name], ["Branch Code", user.franchise_code], ["Department", user.department]].map(([l, v]) => v ? (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#18181b" }}>{v}</span>
          </div>
        ) : null)}
      </div>
      <button onClick={logout} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
        Sign Out
      </button>
    </div>
  )
}
