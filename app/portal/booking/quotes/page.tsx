"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton, PortalFAB } from "@/components/portal/portal-shared"
import type { Quote } from "@/lib/types"

const COLOR = "#22c55e"

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "generated", "sent", "accepted", "converted"]

  useEffect(() => { fetchQuotes() }, [filter])

  async function fetchQuotes() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/quotes?${params}`)
      const data = await res.json()
      setQuotes(data.data ?? data ?? [])
    } catch { setQuotes([]) }
    finally { setLoading(false) }
  }

  const filtered = quotes.filter(q =>
    !search ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    (q.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="Quotes" subtitle={`${filtered.length} quotes`} color={COLOR} backHref="/portal/booking" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search quote # or customer..." />

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="document" title="No quotes found" subtitle="Create your first quote" color={COLOR} />
        ) : filtered.map(q => (
          <PortalListCard
            key={q.id}
            title={`${q.quote_number} — ${q.customer_name ?? (q.customer as any)?.name ?? "Customer"}`}
            subtitle={q.event_date ? `Event: ${new Date(q.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : q.type === "rental" ? "Rental" : "Direct Sale"}
            meta={`₹${(q.total_amount ?? 0).toLocaleString("en-IN")}`}
            badge={q.status}
            color={COLOR}
            icon="document"
            onClick={() => router.push(`/quotes`)}
          />
        ))}
      </div>
      <div className="h-4" />
      <PortalFAB label="New Quote" color={COLOR} onClick={() => router.push("/quotes")} icon="plus-circle" />
    </div>
  )
}
