"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#22c55e"

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "new", "contacted", "qualified", "converted", "lost"]

  useEffect(() => { fetchLeads() }, [filter])

  async function fetchLeads() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      setLeads(data.data ?? data ?? [])
    } catch { setLeads([]) }
    finally { setLoading(false) }
  }

  const filtered = leads.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="Leads" subtitle={`${filtered.length} leads`} color={COLOR} backHref="/portal/booking" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search name, phone..." />

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
          <PortalEmptyState icon="target" title="No leads found" subtitle="All enquiries will appear here" color={COLOR} />
        ) : filtered.map(l => (
          <PortalListCard
            key={l.id}
            title={l.name ?? "Unknown Lead"}
            subtitle={`${l.phone ?? ""}${l.event_type ? ` · ${l.event_type}` : ""}`}
            meta={l.event_date ? new Date(l.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : undefined}
            badge={l.status ?? "new"}
            color={COLOR}
            icon="user"
            onClick={() => router.push(`/leads`)}
          />
        ))}
      </div>
    </div>
  )
}
