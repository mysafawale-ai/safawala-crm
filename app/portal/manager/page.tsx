"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const COLOR = "#3b82f6"
const COLOR_DARK = "#1d4ed8"

const DEPARTMENTS = [
  {
    dept: "booking",
    label: "Booking",
    subtitle: "Sales & Bookings",
    icon: "📋",
    color: "#22c55e",
    bg: "linear-gradient(135deg, #22c55e, #16a34a)",
    stat: "bookings",
  },
  {
    dept: "warehouse",
    label: "Warehouse",
    subtitle: "Inventory & Stock",
    icon: "📦",
    color: "#a855f7",
    bg: "linear-gradient(135deg, #a855f7, #9333ea)",
    stat: "inventory",
  },
  {
    dept: "qc",
    label: "Quality Control",
    subtitle: "QC & Inspections",
    icon: "🔍",
    color: "#eab308",
    bg: "linear-gradient(135deg, #eab308, #ca8a04)",
    stat: "workOrders",
  },
  {
    dept: "delivery",
    label: "Delivery",
    subtitle: "Dispatch & Returns",
    icon: "🚚",
    color: "#14b8a6",
    bg: "linear-gradient(135deg, #14b8a6, #0d9488)",
    stat: "deliveries",
  },
  {
    dept: "styling",
    label: "Styling",
    subtitle: "Safa Stylists",
    icon: "✂️",
    color: "#ec4899",
    bg: "linear-gradient(135deg, #ec4899, #db2777)",
    stat: "assignments",
  },
  {
    dept: "accounts",
    label: "Accounts",
    subtitle: "Finance & Payments",
    icon: "💰",
    color: "#ef4444",
    bg: "linear-gradient(135deg, #ef4444, #dc2626)",
    stat: "payments",
  },
  {
    dept: "hr",
    label: "HR Department",
    subtitle: "Human Resources & Payroll",
    icon: "👥",
    color: "#6366f1",
    bg: "linear-gradient(135deg, #6366f1, #4f46e5)",
    stat: "staff",
  },
]

export default function ManagerHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (raw) {
      try { setUser(JSON.parse(raw)) } catch {}
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [bookingsRes, workOrdersRes, deliveriesRes, staffRes] = await Promise.allSettled([
          fetch("/api/bookings?limit=200").then(r => r.json()),
          fetch("/api/work-orders?limit=200").then(r => r.json()),
          fetch("/api/deliveries?limit=200").then(r => r.json()),
          fetch("/api/users?limit=200").then(r => r.json()),
        ])

        const bookings = bookingsRes.status === "fulfilled" ? (bookingsRes.value.data ?? bookingsRes.value ?? []) : []
        const wos = workOrdersRes.status === "fulfilled" ? (workOrdersRes.value.data ?? workOrdersRes.value ?? []) : []
        const deliveries = deliveriesRes.status === "fulfilled" ? (deliveriesRes.value.data ?? deliveriesRes.value ?? []) : []
        const staff = staffRes.status === "fulfilled" ? (staffRes.value.data ?? staffRes.value ?? []) : []

        const today = new Date().toISOString().split("T")[0]

        setStats({
          bookings: Array.isArray(bookings) ? bookings.filter((b: any) => b.status === "confirmed" || b.status === "pending").length : 0,
          workOrders: Array.isArray(wos) ? wos.filter((w: any) => w.status === "pending" || w.status === "in_progress").length : 0,
          deliveries: Array.isArray(deliveries) ? deliveries.filter((d: any) => d.status === "dispatched" || d.status === "pending").length : 0,
          staff: Array.isArray(staff) ? staff.length : 0,
        })
      } catch {}
      setLoadingStats(false)
    }
    load()
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #eff6ff 0%, #dbeafe 100%)", fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 100 }}>

      {/* Hero Header */}
      <div style={{ background: `linear-gradient(135deg, ${COLOR_DARK}, ${COLOR})`, padding: "28px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "0 0 4px", fontWeight: 500 }}>{greeting} 👋</p>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
            {user?.franchise_name || user?.name || "Manager Portal"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "0 0 20px" }}>
            {user?.franchise_code ? `Branch: ${user.franchise_code}` : "Franchise Management"}
          </p>

          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Active Bookings", value: stats.bookings ?? "—", color: "#bbf7d0" },
              { label: "Pending QC", value: stats.workOrders ?? "—", color: "#fef08a" },
              { label: "In Delivery", value: stats.deliveries ?? "—", color: "#bae6fd" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 12px", backdropFilter: "blur(10px)" }}>
                <p style={{ color: s.color, fontSize: 20, fontWeight: 900, margin: "0 0 2px" }}>
                  {loadingStats ? "…" : s.value}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 700, margin: 0, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.3 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ color: "rgba(30,60,120,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 14px 4px" }}>
          Departments
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DEPARTMENTS.map(dept => (
            <button
              key={dept.dept}
              onClick={() => router.push(`/portal/${dept.dept}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px",
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.95)",
                borderRadius: 18, cursor: "pointer",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                textAlign: "left", width: "100%",
                fontFamily: "inherit",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: dept.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
                boxShadow: `0 4px 14px ${dept.color}40`,
              }}>
                {dept.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 14, color: "#1e1208" }}>
                  {dept.label}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(80,55,30,0.45)", fontWeight: 500 }}>
                  {dept.subtitle}
                </p>
              </div>

              {/* Stat badge */}
              {stats[dept.stat] !== undefined && stats[dept.stat] > 0 && (
                <div style={{
                  minWidth: 26, height: 26, borderRadius: 13,
                  background: dept.color, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, flexShrink: 0, padding: "0 7px",
                }}>
                  {stats[dept.stat]}
                </div>
              )}

              {/* Arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,55,30,0.25)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          ))}
        </div>

        {/* Manager tools */}
        <p style={{ color: "rgba(30,60,120,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "24px 0 14px 4px" }}>
          Management Tools
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Reports", icon: "📊", href: "/portal/manager/reports", color: COLOR },
            { label: "Team", icon: "👤", href: "/portal/manager/staff", color: COLOR },
            { label: "Bookings", icon: "📅", href: "/portal/manager/bookings", color: COLOR },
            { label: "My Profile", icon: "⚙️", href: "/portal/manager/profile", color: COLOR },
          ].map(tool => (
            <button key={tool.label} onClick={() => router.push(tool.href)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px",
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.95)",
                borderRadius: 16, cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%",
              }}>
              <span style={{ fontSize: 20 }}>{tool.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e1208" }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
    </div>
  )
}
