"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getPortalConfig } from "@/lib/portal-config"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton, PortalStatusBadge, PortalFAB } from "@/components/portal/portal-shared"
import type { Booking } from "@/lib/types"

const COLOR = "#22c55e"

export default function BookingListPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "confirmed", "pending", "delivered", "returned", "order_complete", "cancelled"]

  useEffect(() => { fetchBookings() }, [filter])

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/bookings?${params}`)
      const data = await res.json()
      setBookings(data.data ?? data ?? [])
    } catch { setBookings([]) }
    finally { setLoading(false) }
  }

  const filtered = bookings.filter(b =>
    !search || b.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="Bookings" subtitle={`${filtered.length} bookings`} color={COLOR} backHref="/portal/booking" />

      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search booking # or customer..." />

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: filter === f ? COLOR : "rgba(255,255,255,0.7)",
              color: filter === f ? "white" : "rgba(80,55,30,0.5)",
              border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}`,
            }}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="calendar" title="No bookings found" subtitle="Try a different filter or search" color={COLOR} />
        ) : filtered.map(b => (
          <PortalListCard
            key={b.id}
            title={`${b.booking_number} — ${(b.customer as any)?.name ?? "Customer"}`}
            subtitle={`Event: ${b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}`}
            meta={`₹${(b.total_amount ?? 0).toLocaleString("en-IN")}`}
            badge={b.status}
            color={COLOR}
            icon="calendar"
            onClick={() => router.push(`/portal/booking/bookings/${b.id}`)}
          />
        ))}
      </div>

      <div className="h-4" />

      <PortalFAB label="New Booking" color={COLOR} onClick={() => router.push("/bookings/create")} icon="plus-circle" />
    </div>
  )
}
