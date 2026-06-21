"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortalPageHeader, PortalListCard, PortalEmptyState, PortalSkeleton, PortalSectionLabel } from "@/components/portal/portal-shared"

const COLOR = "#ec4899"

export default function AssignmentsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAssignments() }, [])

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/bookings?limit=50&status=confirmed")
      const data = await res.json()
      setBookings(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
    } catch { setBookings([]) }
    finally { setLoading(false) }
  }

  const today = new Date().toISOString().split("T")[0]
  const upcoming = bookings.filter(b => b.event_date >= today)
  const past = bookings.filter(b => b.event_date < today)

  const BookingCard = (b: any) => (
    <PortalListCard
      key={b.id}
      title={`${(b.customer as any)?.name ?? "Customer"} — ${b.groom_name ?? ""}`}
      subtitle={`${b.venue_name ?? b.venue_address ?? "Venue TBC"}`}
      meta={b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—"}
      badge={b.status}
      color={COLOR}
      icon="scissors"
      onClick={() => router.push(`/bookings/${b.id}`)}
    />
  )

  return (
    <div>
      <PortalPageHeader title="My Assignments" subtitle="Safa styling jobs" color={COLOR} backHref="/portal/styling" />

      {loading ? (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
          <PortalSkeleton rows={5} />
        </div>
      ) : bookings.length === 0 ? (
        <PortalEmptyState icon="clipboard" title="No assignments yet" subtitle="Jobs assigned to you will appear here" color={COLOR} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <PortalSectionLabel label={`Upcoming — ${upcoming.length}`} />
              <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
                {upcoming.map(b => <BookingCard key={b.id} {...b} />)}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <PortalSectionLabel label={`Past — ${past.length}`} />
              <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
                {past.map(b => <BookingCard key={b.id} {...b} />)}
              </div>
            </>
          )}
        </>
      )}
      <div className="h-4" />
    </div>
  )
}
