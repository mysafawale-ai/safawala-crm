"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#8b5cf6"

export default function FranchiseStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/users?limit=50")
      .then(r => r.json())
      .then(d => setStaff(d.data ?? d ?? []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = staff.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PortalPageHeader title="My Staff" subtitle={`${filtered.length} members`} color={COLOR} backHref="/portal/franchise" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search staff name or role..." />

      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? <PortalSkeleton rows={5} /> : filtered.length === 0 ? (
          <PortalEmptyState icon="users" title="No staff found" subtitle="Your franchise staff appear here" color={COLOR} />
        ) : filtered.map(s => (
          <PortalListCard
            key={s.id}
            title={s.name ?? s.email ?? "Staff"}
            subtitle={`${s.role ?? "—"} · ${s.department ?? "No dept"}`}
            badge={s.is_active !== false ? "active" : "inactive"}
            color={COLOR}
            icon="user"
          />
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}
