"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton, PortalFAB, PortalAmount } from "@/components/portal/portal-shared"

const COLOR = "#ef4444"

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const FILTERS = ["all", "paid", "partial", "pending", "refunded"]

  useEffect(() => { fetchPayments() }, [filter])

  async function fetchPayments() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      setPayments(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
    } catch { setPayments([]) }
    finally { setLoading(false) }
  }

  const filtered = payments.filter(p =>
    !search ||
    p.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    (p.customer as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.amount ?? "").includes(search)
  )

  const total = filtered.reduce((s, p) => s + (p.amount ?? 0), 0)

  return (
    <div>
      <PortalPageHeader title="Payments" subtitle={`${filtered.length} records`} color={COLOR} backHref="/portal/accounts" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search booking, customer..." />

      {!loading && filtered.length > 0 && (
        <div className="mx-4 mb-3 p-3 rounded-2xl flex items-center justify-between" style={{ background: `${COLOR}12`, border: `1px solid ${COLOR}20` }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLOR }}>Total ({filter === "all" ? "All" : filter})</p>
          <PortalAmount amount={total} size="lg" />
        </div>
      )}

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: filter === f ? COLOR : "rgba(255,255,255,0.7)", color: filter === f ? "white" : "rgba(80,55,30,0.5)", border: `1px solid ${filter === f ? COLOR : "rgba(255,255,255,0.9)"}` }}>
            {f === "all" ? "All" : f.replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="credit-card" title="No payments found" subtitle="Payment records appear here" color={COLOR} />
        ) : filtered.map(p => (
          <PortalListCard
            key={p.id}
            title={`${p.booking_number ?? (p.customer as any)?.name ?? "Payment"}`}
            subtitle={`${p.payment_method ?? "—"} · ${p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN") : "Date pending"}`}
            meta={`₹${(p.amount ?? 0).toLocaleString("en-IN")}`}
            badge={p.status ?? "paid"}
            color={COLOR}
            icon="credit-card"
          />
        ))}
      </div>

      <PortalFAB label="Record Payment" color={COLOR} icon="plus-circle" onClick={() => router.push("/portal/accounts/payments/new")} />
    </div>
  )
}
