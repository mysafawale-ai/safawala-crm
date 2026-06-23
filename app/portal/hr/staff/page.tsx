"use client"

import { useState, useEffect, useCallback } from "react"
import { PortalPageHeader, PortalSearchBar, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#6366f1"
const DEPT_COLORS: Record<string, string> = {
  booking: "#22c55e", warehouse: "#a855f7", qc: "#eab308",
  delivery: "#14b8a6", styling: "#ec4899", accounts: "#ef4444",
  manager: "#3b82f6", admin: "#f97316", franchise: "#8b5cf6", hr: "#6366f1",
}

const DEPTS = ["all", "booking", "warehouse", "qc", "delivery", "styling", "accounts", "hr"]
const ROLES = ["staff", "franchise_admin", "booking_staff", "warehouse_staff", "qc_staff", "delivery_staff", "hr_staff", "accounts_staff", "stylist"]

const EMPTY_FORM = { name: "", email: "", phone: "", department: "booking", role: "staff", password: "", base_salary: "" }

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")
  const [selected, setSelected] = useState<any | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (filter !== "all") params.set("department", filter)
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setStaff(data.data ?? [])
    } catch { setStaff([]) }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  async function addStaff() {
    if (!form.name || !form.email || !form.password) {
      showToast("Name, email, and password required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          department: form.department,
          role: form.role,
          password: form.password,
          base_salary: form.base_salary ? parseFloat(form.base_salary) : null,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setStaff(prev => [d.user ?? d.data ?? d, ...prev])
        setForm({ ...EMPTY_FORM })
        setShowAdd(false)
        showToast("Staff member added ✓")
      } else {
        const err = await res.json()
        showToast(err.error ?? err.message ?? "Failed to add staff")
      }
    } catch { showToast("Error adding staff") }
    setSaving(false)
  }

  async function toggleStatus(s: any) {
    setToggling(s.id)
    try {
      const res = await fetch(`/api/staff/${s.id}/toggle-status`, { method: "POST" })
      if (res.ok) {
        setStaff(prev => prev.map(m => m.id === s.id ? { ...m, is_active: !m.is_active } : m))
        setSelected((prev: any) => prev?.id === s.id ? { ...prev, is_active: !prev.is_active } : prev)
        showToast(s.is_active ? "Staff deactivated" : "Staff activated ✓")
      }
    } catch {}
    setToggling(null)
  }

  const filtered = staff.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", background: "#4f46e5", color: "white", borderRadius: 12, padding: "8px 20px", fontSize: 12, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <PortalPageHeader title="Staff Management" subtitle={`${filtered.length} members`} color={COLOR} backHref="/portal/hr" />
      <PortalSearchBar value={search} onChange={setSearch} placeholder="Search name, email or department..." />

      {/* Dept filter chips */}
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
        {DEPTS.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: filter === d ? (DEPT_COLORS[d] ?? COLOR) : "rgba(255,255,255,0.7)", color: filter === d ? "white" : "rgba(80,55,30,0.6)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", textTransform: "capitalize" }}>
            {d === "all" ? "All Depts" : d}
          </button>
        ))}
      </div>

      {/* Staff list */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: 16 }}><PortalSkeleton rows={7} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16 }}>
            <PortalEmptyState icon="users" title="No staff found" subtitle="Tap + to add staff members" color={COLOR} />
          </div>
        ) : (
          filtered.map(s => {
            const deptColor = DEPT_COLORS[s.department ?? ""] ?? COLOR
            return (
              <div key={s.id} style={{ background: "white", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSelected(selected?.id === s.id ? null : s)}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${deptColor}, ${deptColor}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 900, flexShrink: 0, position: "relative" }}>
                    {(s.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    {s.is_active === false && (
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#ef4444", border: "2px solid white" }} />
                    )}
                  </div>
                  {/* Name + dept badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#1e1208" }}>{s.name ?? s.email}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {/* Department pill */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${deptColor}18`, color: deptColor, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", letterSpacing: 0.2 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: deptColor, flexShrink: 0 }} />
                        {s.department ?? "No dept"}
                      </span>
                      {/* Role */}
                      <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(80,55,30,0.4)", textTransform: "capitalize" }}>
                        {s.role?.replace(/_/g, " ") ?? "staff"}
                      </span>
                    </div>
                  </div>
                  {/* Active status */}
                  <span style={{ background: s.is_active !== false ? "#dcfce7" : "#fee2e2", color: s.is_active !== false ? "#15803d" : "#b91c1c", fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: 0.3 }}>
                    {s.is_active !== false ? "● Active" : "● Inactive"}
                  </span>
                </div>

                {selected?.id === s.id && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: 14 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(80,55,30,0.45)" }}>{s.email}</p>
                    {s.phone && <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(80,55,30,0.45)" }}>📞 {s.phone}</p>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => toggleStatus(s)} disabled={toggling === s.id}
                        style={{ flex: 1, height: 38, borderRadius: 12, border: "none", background: s.is_active !== false ? "#fee2e2" : "#dcfce7", color: s.is_active !== false ? "#dc2626" : "#16a34a", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: toggling === s.id ? 0.6 : 1 }}>
                        {toggling === s.id ? "…" : s.is_active !== false ? "Deactivate" : "Activate"}
                      </button>
                      {s.phone && (
                        <a href={`https://wa.me/91${s.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          style={{ width: 38, height: 38, borderRadius: 12, background: "#25d366", color: "white", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 16 }}>
                          💬
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        style={{ position: "fixed", bottom: "calc(76px + env(safe-area-inset-bottom,0px))", right: 20, width: 56, height: 56, borderRadius: 18, border: "none", background: COLOR, color: "white", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.4)", zIndex: 50 }}>
        +
      </button>

      {/* Add Staff Sheet */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={() => setShowAdd(false)} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "24px 24px 0 0", padding: "20px 20px calc(env(safe-area-inset-bottom,20px)+20px)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)" }} />
            </div>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 900 }}>Add Staff Member</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "name", label: "Full Name *", type: "text" },
                { key: "email", label: "Email *", type: "email" },
                { key: "phone", label: "Phone / WhatsApp", type: "tel" },
                { key: "password", label: "Temporary Password *", type: "password" },
                { key: "base_salary", label: "Base Salary (₹/month)", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Department *</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  {DEPTS.filter(d => d !== "all").map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Role *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <button onClick={addStaff} disabled={saving}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: COLOR, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1, marginTop: 4 }}>
                {saving ? "Adding…" : "Add Staff Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
