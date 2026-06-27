"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const ACCENT = "#a855f7"
const BORDER = "#e4e4e7"

function StatCard({ label, value, sub, color, href }: { label: string; value: string | number; sub?: string; color: string; href?: string }) {
  const inner = (
    <div
      style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", cursor: href ? "pointer" : "default" }}
      onMouseEnter={e => { if (href) (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#18181b", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 4 }}>{sub}</div>}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner
}

function DeptCard({ label, sub, color, href, emoji }: { label: string; sub: string; color: string; href: string; emoji: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>{label}</div>
          <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>{sub}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
      </div>
    </Link>
  )
}

export default function FranchiseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ todayBookings: 0, monthRevenue: 0, activeStaff: 0, pendingPayments: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (raw) { try { setUser(JSON.parse(raw)) } catch {} }
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const today = new Date().toISOString().split("T")[0]
      const [bRes, pRes, uRes] = await Promise.allSettled([
        fetch("/api/bookings?limit=100"),
        fetch("/api/payments?limit=200"),
        fetch("/api/users?limit=100"),
      ])

      let bookings: any[] = []
      let payments: any[] = []
      let users: any[] = []

      if (bRes.status === "fulfilled" && bRes.value.ok) { const d = await bRes.value.json(); bookings = d.data ?? d ?? [] }
      if (pRes.status === "fulfilled" && pRes.value.ok) { const d = await pRes.value.json(); payments = d.data ?? d ?? [] }
      if (uRes.status === "fulfilled" && uRes.value.ok) { const d = await uRes.value.json(); users = d.data ?? d ?? [] }

      const now = new Date()
      const monthRevenue = payments
        .filter((p: any) => { const d = new Date(p.payment_date || p.created_at || ""); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
        .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)

      setStats({
        todayBookings: bookings.filter((b: any) => (b.event_date || b.created_at || "").slice(0, 10) === today).length,
        monthRevenue,
        activeStaff: users.filter((u: any) => u.is_active !== false).length,
        pendingPayments: payments.filter((p: any) => ["pending", "unpaid", "partial"].includes(p.status)).length,
      })
      setRecentBookings(bookings.slice(0, 6))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
  })()

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "#dcfce7", text: "#16a34a" },
    pending: { bg: "#fef9c3", text: "#ca8a04" },
    cancelled: { bg: "#fee2e2", text: "#dc2626" },
    delivered: { bg: "#dbeafe", text: "#1d4ed8" },
    returned: { bg: "#f3e8ff", text: "#7c3aed" },
  }

  return (
    <DashboardLayout>
    <div style={{ padding: "32px 36px", maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, marginBottom: 4 }}>{greeting}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#18181b" }}>
          {user?.franchise_name || user?.name || "Franchise Dashboard"}
        </h1>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          {user?.franchise_code && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
              {user.franchise_code}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#a1a1aa" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Today's Bookings" value={loading ? "…" : stats.todayBookings} color="#22c55e" href="/bookings" />
        <StatCard label="Month Revenue" value={loading ? "…" : fmt(stats.monthRevenue)} color={ACCENT} href="/financials" />
        <StatCard label="Active Staff" value={loading ? "…" : stats.activeStaff} color="#6366f1" href="/hr" />
        <StatCard
          label="Pending Payments"
          value={loading ? "…" : stats.pendingPayments}
          sub={!loading ? (stats.pendingPayments > 0 ? "Needs attention" : "All cleared") : undefined}
          color={stats.pendingPayments > 0 ? "#ef4444" : "#22c55e"}
          href="/financials"
        />
      </div>

      {/* Main 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* Recent bookings table */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#18181b" }}>Recent Bookings</h3>
            <Link href="/bookings" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>

          {loading ? (
            <div style={{ padding: "16px 20px" }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f4f4f5", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    <div style={{ height: 12, background: "#f4f4f5", borderRadius: 6, width: "55%" }} />
                    <div style={{ height: 10, background: "#f4f4f5", borderRadius: 6, width: "35%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#a1a1aa", fontSize: 13 }}>No bookings yet</div>
          ) : (
            recentBookings.map((b, i) => {
              const s = STATUS_COLORS[b.status?.toLowerCase()] ?? { bg: "#f4f4f5", text: "#71717a" }
              return (
                <div key={b.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < recentBookings.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 800, color: ACCENT }}>
                    {(b.booking_number || b.id || "?").toString().slice(-2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.booking_number || `Booking #${i + 1}`}
                    </div>
                    <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 1 }}>
                      {b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"} · {(b.customer as any)?.name || b.customer_name || "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: s.bg, color: s.text, textTransform: "uppercase", letterSpacing: "0.03em" }}>{b.status || "—"}</span>
                    {b.total_amount && <span style={{ fontSize: 11, fontWeight: 700, color: "#18181b" }}>₹{Number(b.total_amount).toLocaleString("en-IN")}</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Department quick links */}
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#18181b" }}>Departments</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <DeptCard label="Booking & Sales"   sub="Bookings & customers"   color="#22c55e" href="/bookings"    emoji="📋" />
            <DeptCard label="HR & Staff"         sub="Payroll, attendance"    color="#6366f1" href="/staff"       emoji="👥" />
            <DeptCard label="Leads"              sub="Enquiries & follow-ups" color="#0891b2" href="/leads"       emoji="🎯" />
            <DeptCard label="Inventory"          sub="Products & stock"       color="#a855f7" href="/inventory"   emoji="📦" />
            <DeptCard label="Expenses"           sub="Payments & costs"       color="#ef4444" href="/expenses"    emoji="💳" />
            <DeptCard label="Laundry"            sub="Wash & care orders"     color="#eab308" href="/laundry"     emoji="🧺" />
            <DeptCard label="Deliveries"         sub="Dispatch & returns"     color="#14b8a6" href="/deliveries"  emoji="🚚" />
          </div>
        </div>

      </div>
    </div>
    </DashboardLayout>
  )
}
