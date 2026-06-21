"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#eab308"

export default function WorkOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/work-orders?limit=50")
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d.data) ? d.data : (Array.isArray(d) ? d : [])))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PortalPageHeader title="Work Orders" subtitle="All QC work orders" color={COLOR} backHref="/portal/qc" />

      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={6} /> : orders.length === 0 ? (
          <PortalEmptyState icon="clipboard" title="No work orders" color={COLOR} />
        ) : orders.map(o => (
          <PortalListCard
            key={o.id}
            title={o.title ?? o.order_number ?? "Work Order"}
            subtitle={o.description ?? o.type ?? ""}
            meta={o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : undefined}
            badge={o.status ?? "pending"}
            color={COLOR}
            icon="clipboard"
            onClick={() => router.push(`/portal/qc/work-orders/${o.id}`)}
          />
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}
