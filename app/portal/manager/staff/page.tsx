"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSearchBar, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#3b82f6"

export default function ManagerStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/users?limit=100")
      .then(r => r.json())
      .then(d => setStaff(d.data ?? d ?? []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = staff.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  const byDept = filtered.reduce((acc: Record<string, any[]>, s) => {
    const dept = s.department ?? "other"
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(s)
    return acc
  }, {})

  const DEPT_COLORS: Record<string, string> = {
    booking: "#22c55e", warehouse: "#a855f7", qc: "#eab308",
    delivery: "#14b8a6", styling: "#ec4899", accounts: "#ef4444",
    manager: COLOR, admin: "#f97316", franchise: "#8b5cf6",
  }

  return (
    <div>
      <PortalPageHeader title="Team Overview" subtitle={`${filtered.length} staff members`} color={COLOR} backHref="/portal/manager" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search staff by name or dept..." />

      {loading ? (
        <div className="mx-4"><PortalSkeleton rows={7} /></div>
      ) : filtered.length === 0 ? (
        <PortalEmptyState icon="users" title="No staff found" subtitle="Staff members will appear here" color={COLOR} />
      ) : Object.entries(byDept).map(([dept, members]) => (
        <div key={dept}>
          <div className="px-4 pt-4 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DEPT_COLORS[dept] ?? COLOR }}>
              {dept.replace(/\b\w/g, c => c.toUpperCase())} ({members.length})
            </span>
          </div>
          <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            {members.map(s => (
              <PortalListCard
                key={s.id}
                title={s.name ?? s.email ?? "Staff"}
                subtitle={s.role ?? "Staff"}
                badge={s.is_active !== false ? "active" : "inactive"}
                color={DEPT_COLORS[dept] ?? COLOR}
                icon="user"
              />
            ))}
          </div>
        </div>
      ))}
      <div className="h-4" />
    </div>
  )
}
