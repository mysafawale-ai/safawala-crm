"use client"

import { useState, useEffect, useCallback } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"
import { PortalIcon } from "@/components/portal/portal-icons"

const COLOR = "#6366f1"
const COLOR_DARK = "#4f46e5"

const STAGES: { key: string; label: string; color: string; icon: string }[] = [
  { key: "applied",              label: "Applied",             color: "#94a3b8", icon: "clipboard" },
  { key: "screening",           label: "Screening",           color: "#eab308", icon: "search" },
  { key: "interview_scheduled", label: "Interview Scheduled", color: "#3b82f6", icon: "calendar" },
  { key: "interview_done",      label: "Interview Done",      color: "#8b5cf6", icon: "check-circle" },
  { key: "offer_made",          label: "Offer Made",          color: "#f97316", icon: "handshake" },
  { key: "joined",              label: "Joined",              color: "#22c55e", icon: "award" },
  { key: "rejected",            label: "Rejected",            color: "#ef4444", icon: "x-circle" },
]

const DEPTS = ["booking", "warehouse", "qc", "delivery", "styling", "accounts", "hr"]
const SOURCES = ["Direct Walk-in", "Reference", "Job Portal", "Instagram", "WhatsApp", "LinkedIn"]

const EMPTY_FORM = { name: "", phone: "", email: "", department: "", position: "", interview_date: "", interview_time: "", interviewer: "", notes: "", source: "Direct Walk-in" }

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [toast, setToast] = useState("")

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (stageFilter !== "all") params.set("status", stageFilter)
      const res = await fetch(`/api/recruitment?${params}`)
      const d = await res.json()
      setCandidates(d.data ?? [])
    } catch {}
    setLoading(false)
  }, [stageFilter])

  useEffect(() => { load() }, [load])

  async function addCandidate() {
    if (!form.name || !form.department) { showToast("Name and department required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const d = await res.json()
        setCandidates(prev => [d.data, ...prev])
        setForm({ ...EMPTY_FORM })
        setShowAdd(false)
        showToast("Candidate added ✓")
      } else {
        const err = await res.json()
        showToast(err.error || "Failed to add")
      }
    } catch { showToast("Error adding candidate") }
    setSaving(false)
  }

  async function moveStage(id: string, status: string) {
    setActionId(id)
    try {
      const res = await fetch("/api/recruitment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        const d = await res.json()
        setCandidates(prev => prev.map(c => c.id === id ? d.data : c))
        setSelected(d.data)
        showToast(`Moved to ${STAGES.find(s => s.key === status)?.label} ✓`)
      }
    } catch {}
    setActionId(null)
  }

  const filtered = stageFilter === "all" ? candidates : candidates.filter(c => c.status === stageFilter)

  const stageCounts = Object.fromEntries(STAGES.map(s => [s.key, candidates.filter(c => c.status === s.key).length]))
  const nextStage = (status: string) => {
    const idx = STAGES.findIndex(s => s.key === status)
    const next = STAGES[idx + 1]
    return next && next.key !== "rejected" ? next : null
  }

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", background: COLOR_DARK, color: "white", borderRadius: 12, padding: "8px 20px", fontSize: 12, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <PortalPageHeader title="Recruitment" subtitle={`${candidates.length} candidates`} color={COLOR} backHref="/portal/hr" />

      {/* Pipeline overview */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {[{ key: "all", label: "All", color: COLOR, icon: "team" }, ...STAGES].map(s => (
          <button key={s.key} onClick={() => setStageFilter(s.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 12px", borderRadius: 14, border: stageFilter === s.key ? `2px solid ${s.color}` : "2px solid transparent", background: stageFilter === s.key ? `${s.color}15` : "rgba(255,255,255,0.6)", cursor: "pointer", flexShrink: 0, fontFamily: "inherit", color: stageFilter === s.key ? s.color : "rgba(80,55,30,0.4)" }}>
            <PortalIcon name={s.icon} size={18} />
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, color: stageFilter === s.key ? s.color : "rgba(80,55,30,0.45)" }}>{s.label}</span>
            {s.key !== "all" && <span style={{ fontSize: 11, fontWeight: 900, color: s.color }}>{stageCounts[s.key] ?? 0}</span>}
          </button>
        ))}
      </div>

      <PortalSectionLabel label={`Candidates (${filtered.length})`} />
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: 16 }}><PortalSkeleton rows={4} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16 }}>
            <PortalEmptyState icon="users" title="No candidates" subtitle="Add candidates to start tracking recruitment" color={COLOR} />
          </div>
        ) : (
          filtered.map(c => {
            const stage = STAGES.find(s => s.key === c.status) ?? STAGES[0]
            return (
              <div key={c.id} style={{ background: "white", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: "14px 14px 10px", cursor: "pointer" }} onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1e1208" }}>{c.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 600, color: "rgba(80,55,30,0.45)", textTransform: "uppercase" }}>
                        {c.department} {c.position ? `· ${c.position}` : ""}
                      </p>
                    </div>
                    <span style={{ background: `${stage.color}20`, color: stage.color, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                      <PortalIcon name={stage.icon} size={12} />
                      {stage.label}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 10, color: "rgba(80,55,30,0.4)", alignItems: "center" }}>
                    {c.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><PortalIcon name="smartphone" size={11} />{c.phone}</span>}
                    {c.interview_date && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><PortalIcon name="calendar" size={11} />{c.interview_date} {c.interview_time ?? ""}</span>}
                    {c.source && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><PortalIcon name="map-pin" size={11} />{c.source}</span>}
                  </div>
                </div>

                {selected?.id === c.id && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: 14 }}>
                    {c.notes && (
                      <p style={{ margin: "0 0 12px", fontSize: 11, color: "#475569", background: "#f8fafc", borderRadius: 10, padding: "8px 12px", fontStyle: "italic" }}>"{c.notes}"</p>
                    )}
                    {c.interviewer && <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(80,55,30,0.5)" }}>Interviewer: {c.interviewer}</p>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {nextStage(c.status) && (
                        <button onClick={() => moveStage(c.id, nextStage(c.status)!.key)} disabled={actionId === c.id}
                          style={{ flex: 1, height: 38, borderRadius: 12, border: "none", background: nextStage(c.status)!.color, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minWidth: 120, opacity: actionId === c.id ? 0.6 : 1 }}>
                          {actionId === c.id ? "…" : `Move → ${nextStage(c.status)!.label}`}
                        </button>
                      )}
                      {c.status !== "rejected" && c.status !== "joined" && (
                        <button onClick={() => moveStage(c.id, "rejected")} disabled={actionId === c.id}
                          style={{ height: 38, padding: "0 16px", borderRadius: 12, border: "none", background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: actionId === c.id ? 0.6 : 1 }}>
                          Reject
                        </button>
                      )}
                      {c.phone && (
                        <a href={`https://wa.me/91${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          style={{ height: 38, padding: "0 14px", borderRadius: 12, background: "#25d366", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                          <PortalIcon name="whatsapp" size={14} /> WA
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

      {/* Add candidate sheet */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={() => setShowAdd(false)} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "24px 24px 0 0", padding: "20px 20px calc(env(safe-area-inset-bottom,20px)+20px)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)" }} />
            </div>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 900 }}>Add Candidate</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "name", label: "Full Name *", type: "text" },
                { key: "phone", label: "Phone / WhatsApp", type: "tel" },
                { key: "email", label: "Email", type: "email" },
                { key: "position", label: "Position / Role Applied", type: "text" },
                { key: "interview_date", label: "Interview Date", type: "date" },
                { key: "interview_time", label: "Interview Time", type: "time" },
                { key: "interviewer", label: "Interviewer Name", type: "text" },
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
                  <option value="">Select department…</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Source</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                  style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={addCandidate} disabled={saving}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: COLOR, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1, marginTop: 4 }}>
                {saving ? "Adding…" : "Add Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
