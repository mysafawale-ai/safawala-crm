"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#14b8a6"

export default function DeliveriesPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "pending", "dispatched", "delivered", "failed"]

  useEffect(() => { fetchDeliveries() }, [filter])

  async function fetchDeliveries() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/deliveries?${params}`)
      const data = await res.json()
      setDeliveries(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
    } catch { setDeliveries([]) }
    finally { setLoading(false) }
  }

  const filtered = deliveries.filter(d =>
    !search ||
    d.awb_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    (d.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="Dispatch & Shipping" subtitle={`${filtered.length} shipments`} color={COLOR} backHref="/portal/delivery" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search AWB, booking or customer..." />

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All" : f.replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="truck" title="No shipments found" subtitle="Dispatched orders will appear here" color={COLOR} />
        ) : filtered.map(d => (
          <PortalListCard
            key={d.id}
            title={d.awb_number ? `AWB: ${d.awb_number}` : (d.booking_number ?? "Shipment")}
            subtitle={`${(d.customer as any)?.name ?? d.customer_name ?? "Customer"} · ${d.courier ?? "Courier"}`}
            meta={d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN") : undefined}
            badge={d.status ?? "pending"}
            color={COLOR}
            icon="truck"
            onClick={() => router.push(`/portal/delivery/deliveries/${d.id}`)}
          />
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}
