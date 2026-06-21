"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalSkeleton, PortalInfoRow } from "@/components/portal/portal-shared"

const COLOR = "#3b82f6"

export default function ManagerReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/bookings?limit=300").then(r => r.json()),
      fetch("/api/leads?limit=300").then(r => r.json()),
      fetch("/api/customers?limit=300").then(r => r.json()),
    ]).then(([bRes, lRes, cRes]) => {
      const bookings = (bRes.status === "fulfilled" ? bRes.value.data ?? bRes.value : []) ?? []
      const leads = (lRes.status === "fulfilled" ? lRes.value.data ?? lRes.value : []) ?? []
      const customers = (cRes.status === "fulfilled" ? cRes.value.data ?? cRes.value : []) ?? []

      const now = new Date()
      const thisMonth = bookings.filter((b: any) => {
        const d = new Date(b.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const pending = bookings.filter((b: any) => b.status === "pending").length
      const confirmed = bookings.filter((b: any) => b.status === "confirmed").length
      const completed = bookings.filter((b: any) => b.status === "order_complete").length
      const openLeads = leads.filter((l: any) => l.status !== "converted" && l.status !== "lost").length
      const revenue = bookings.reduce((s: number, b: any) => s + (b.advance_amount ?? 0), 0)

      setStats({ totalBookings: bookings.length, thisMonthBookings: thisMonth.length, pending, confirmed, completed, openLeads, totalLeads: leads.length, totalCustomers: customers.length, revenue })
    })
    .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PortalPageHeader title="Performance Reports" subtitle="Operations overview" color={COLOR} backHref="/portal/manager" />

      {loading ? (
        <div className="mx-4 mt-4"><PortalSkeleton rows={8} /></div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
            {[
              { label: "Total Bookings", value: stats.totalBookings, color: COLOR },
              { label: "This Month", value: stats.thisMonthBookings, color: "#16a34a" },
              { label: "Confirmed", value: stats.confirmed, color: "#8b5cf6" },
              { label: "Completed", value: stats.completed, color: "#14b8a6" },
              { label: "Open Leads", value: stats.openLeads, color: "#f59e0b" },
              { label: "Customers", value: stats.totalCustomers, color: "#ec4899" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(80,55,30,0.4)" }}>{s.label}</p>
                <p className="text-[24px] font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <PortalSectionLabel label="Operations Summary" />
          <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <PortalInfoRow label="Total Bookings" value={String(stats.totalBookings)} />
            <PortalInfoRow label="Pending Bookings" value={String(stats.pending)} />
            <PortalInfoRow label="Confirmed" value={String(stats.confirmed)} />
            <PortalInfoRow label="Completed Orders" value={String(stats.completed)} />
            <PortalInfoRow label="Total Leads" value={String(stats.totalLeads)} />
            <PortalInfoRow label="Open Leads" value={String(stats.openLeads)} />
            <PortalInfoRow label="Total Customers" value={String(stats.totalCustomers)} />
          </div>
          <div className="h-6" />
        </>
      )}
    </div>
  )
}
