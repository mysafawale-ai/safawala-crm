"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalListCard, PortalEmptyState, PortalSkeleton, PortalInfoRow } from "@/components/portal/portal-shared"

const COLOR = "#a855f7"

export default function FranchiseRevenuePage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/payments?limit=100")
      .then(r => r.json())
      .then(d => setPayments(d.data ?? d ?? []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [])

  const total = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const thisMonth = payments.filter(p => {
    const d = new Date(p.created_at ?? p.payment_date ?? "")
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = thisMonth.reduce((s, p) => s + (p.amount ?? 0), 0)
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`

  return (
    <div>
      <PortalPageHeader title="Revenue" subtitle="My franchise earnings" color={COLOR} backHref="/portal/franchise" />

      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${COLOR}18, ${COLOR}06)`, border: `1px solid ${COLOR}22` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLOR }}>This Month</p>
              <p className="text-[22px] font-black" style={{ color: "#18181b" }}>{fmt(monthTotal)}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e4e4e7" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#71717a" }}>All Time</p>
              <p className="text-[22px] font-black" style={{ color: "#18181b" }}>{fmt(total)}</p>
            </div>
          </div>

          <PortalSectionLabel label="Recent Payments" />
          <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4e4e7" }}>
            {loading ? <PortalSkeleton rows={5} /> : payments.length === 0 ? (
              <PortalEmptyState icon="rupee" title="No payments yet" subtitle="Revenue collected will appear here" color={COLOR} />
            ) : payments.slice(0, 20).map(p => (
              <PortalListCard
                key={p.id}
                title={`${p.booking_number ?? (p.customer as any)?.name ?? "Payment"}`}
                subtitle={p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                meta={fmt(p.amount ?? 0)}
                badge={p.status ?? "paid"}
                color={COLOR}
                icon="rupee"
              />
            ))}
          </div>
        </>
      )}
      {loading && <div className="mx-4 mt-4"><PortalSkeleton rows={6} /></div>}
      <div className="h-4" />
    </div>
  )
}
