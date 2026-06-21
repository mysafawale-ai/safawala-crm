"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalListCard, PortalEmptyState, PortalSkeleton, PortalSectionLabel } from "@/components/portal/portal-shared"

const COLOR = "#a855f7"

export default function LaundryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLaundry() }, [])

  async function fetchLaundry() {
    try {
      const res = await fetch("/api/laundry?limit=50")
      const data = await res.json()
      setItems(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  const pending = items.filter(i => i.status === "pending" || i.status === "in_laundry" || !i.status)
  const done = items.filter(i => i.status === "completed" || i.status === "returned")

  return (
    <div>
      <PortalPageHeader title="Laundry Queue" subtitle={`${pending.length} pending`} color={COLOR} backHref="/portal/warehouse" />

      {loading ? (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
          <PortalSkeleton rows={5} />
        </div>
      ) : items.length === 0 ? (
        <PortalEmptyState icon="laundry" title="No items in laundry" subtitle="Items sent for washing will appear here" color={COLOR} />
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <PortalSectionLabel label={`Pending — ${pending.length}`} />
              <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
                {pending.map(i => (
                  <PortalListCard
                    key={i.id}
                    title={i.product_name ?? i.item_name ?? "Item"}
                    subtitle={i.notes ?? (i.sent_at ? `Sent: ${new Date(i.sent_at).toLocaleDateString("en-IN")}` : "In laundry")}
                    badge="in_progress"
                    color={COLOR}
                    icon="laundry"
                  />
                ))}
              </div>
            </>
          )}

          {done.length > 0 && (
            <>
              <PortalSectionLabel label={`Completed — ${done.length}`} />
              <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
                {done.map(i => (
                  <PortalListCard
                    key={i.id}
                    title={i.product_name ?? i.item_name ?? "Item"}
                    subtitle={i.completed_at ? `Done: ${new Date(i.completed_at).toLocaleDateString("en-IN")}` : "Returned to stock"}
                    badge="order_complete"
                    color={COLOR}
                    icon="check-circle"
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
      <div className="h-4" />
    </div>
  )
}
