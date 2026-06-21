"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#3b82f6"

export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "confirmed", "pending", "delivered", "returned", "order_complete", "cancelled"]

  useEffect(() => { fetchBookings() }, [filter])

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/bookings?${params}`)
      const data = await res.json()
      setBookings(data.data ?? data ?? [])
    } catch { setBookings([]) }
    finally { setLoading(false) }
  }

  const filtered = bookings.filter(b =>
    !search ||
    b.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer as any)?.phone?.includes(search)
  )

  return (
    <div>
      <PortalPageHeader title="All Bookings" subtitle={`${filtered.length} bookings`} color={COLOR} backHref="/portal/manager" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search booking number or customer..." />

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={7} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="calendar" title="No bookings found" subtitle="Bookings will appear here" color={COLOR} />
        ) : filtered.map(b => (
          <PortalListCard
            key={b.id}
            title={`${b.booking_number ?? "—"} · ${(b.customer as any)?.name ?? "Customer"}`}
            subtitle={`${b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"} · ₹${(b.total_amount ?? 0).toLocaleString("en-IN")}`}
            badge={b.status ?? "confirmed"}
            color={COLOR}
            icon="calendar"
          />
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}
