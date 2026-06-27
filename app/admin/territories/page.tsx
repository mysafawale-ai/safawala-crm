"use client"

import { useState, useEffect } from "react"

const GOLD = "#c9a84c"
const BROWN = "#3d1c02"
const CREAM = "#fdf6ed"
const WARM = "#f5ebe0"
const BORDER = "rgba(201,168,76,0.2)"

interface Territory {
  id: string
  name: string
  cities: string[]
  pincodes: string[]
  is_locked: boolean
  assigned_franchise_id: string
}

export default function AdminTerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([
    { id: "1", name: "Vadodara Exclusive", cities: ["Vadodara", "Padra"], pincodes: ["390012", "390015", "391440"], is_locked: true, assigned_franchise_id: "cb3023d4-9a85-43e5-8a16-87bc578a7b94" },
    { id: "2", name: "Mumbai West Region", cities: ["Mumbai", "Bandra"], pincodes: ["400050", "400051", "400052"], is_locked: true, assigned_franchise_id: "" },
    { id: "3", name: "Surat Central Zone", cities: ["Surat", "Adajan"], pincodes: ["395009", "395003"], is_locked: false, assigned_franchise_id: "" },
  ])
  const [franchises, setFranchises] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Form & modal state
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    citiesRaw: "",
    pincodesRaw: "",
    is_locked: false,
    assigned_franchise_id: ""
  })

  useEffect(() => {
    fetchFranchises()
  }, [])

  function fetchFranchises() {
    fetch("/api/franchises")
      .then(r => r.json())
      .then(d => setFranchises(d.data ?? d ?? []))
      .catch(() => {})
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setSubmitting(true)

    const cities = form.citiesRaw.split(",").map(c => c.trim()).filter(Boolean)
    const pincodes = form.pincodesRaw.split(",").map(p => p.trim()).filter(Boolean)

    const newT: Territory = {
      id: Math.random().toString(36).substring(2),
      name: form.name,
      cities,
      pincodes,
      is_locked: form.is_locked,
      assigned_franchise_id: form.assigned_franchise_id
    }

    setTerritories([...territories, newT])
    setShowAdd(false)
    setForm({ name: "", citiesRaw: "", pincodesRaw: "", is_locked: false, assigned_franchise_id: "" })
    setSubmitting(false)
  }

  const toggleLock = (id: string) => {
    setTerritories(territories.map(t => t.id === id ? { ...t, is_locked: !t.is_locked } : t))
  }

  const assignFranchise = (id: string, franchiseId: string) => {
    setTerritories(territories.map(t => t.id === id ? { ...t, assigned_franchise_id: franchiseId } : t))
  }

  const filtered = territories.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.cities.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
    t.pincodes.some(p => p.includes(search))
  )

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 38, borderRadius: 8, border: "1.5px solid rgba(201,168,76,0.2)",
    padding: "0 12px", fontSize: 13, outline: "none", background: "#fff",
    color: BROWN, boxSizing: "border-box"
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a07040", marginBottom: 4
  }

  return (
    <div style={{ background: WARM, minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${BORDER}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: BROWN }}>Territory Management</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#a07040", marginTop: 2 }}>
            Define, lock, and assign exclusive regional territories to franchisees
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 10,
          background: BROWN, color: GOLD, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Territory
        </button>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Search by territory name, city or pincode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, maxWidth: 360, height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none"
            }}
          />
        </div>

        {/* Territories Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map(t => {
            const assigned = franchises.find(f => f.id === t.assigned_franchise_id)
            return (
              <div key={t.id} style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px", position: "relative" }}>
                
                {/* Title */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: BROWN }}>{t.name}</h3>
                  <button onClick={() => toggleLock(t.id)} style={{
                    border: "none", background: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                    backgroundColor: t.is_locked ? "#fef2f2" : "#f0fdf4",
                    color: t.is_locked ? "#dc2626" : "#16a34a",
                  }}>
                    {t.is_locked ? "🔒 Locked" : "🔓 Open"}
                  </button>
                </div>

                {/* Scope */}
                <div style={{ fontSize: 12, color: BROWN, display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <div>
                    <strong style={{ color: "#a07040" }}>Cities:</strong> {t.cities.join(", ") || "No cities assigned"}
                  </div>
                  <div>
                    <strong style={{ color: "#a07040" }}>Pincodes:</strong> {t.pincodes.join(", ") || "No pincodes assigned"}
                  </div>
                </div>

                {/* Assignment Selector */}
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: "#a07040" }}>
                    {assigned ? (
                      <span>Assigned: <strong>{assigned.name}</strong></span>
                    ) : (
                      <span style={{ color: "#999" }}>Not assigned to any franchise</span>
                    )}
                  </div>
                  <select
                    value={t.assigned_franchise_id}
                    onChange={e => assignFranchise(t.id, e.target.value)}
                    style={{
                      height: 30, borderRadius: 8, border: `1px solid ${BORDER}`,
                      padding: "0 8px", fontSize: 11, background: WARM, color: BROWN, cursor: "pointer"
                    }}
                  >
                    <option value="">Unassign</option>
                    {franchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

              </div>
            )
          })}
        </div>

      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <form onSubmit={handleCreate} style={{ background: CREAM, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, border: `1px solid ${BORDER}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: BROWN }}>Create Territory</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Territory Name *</label>
                <input required style={inputStyle} placeholder="e.g. South Vadodara Zone" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Cities (comma separated) *</label>
                <input required style={inputStyle} placeholder="e.g. Vadodara, Padra" value={form.citiesRaw} onChange={e => setForm({ ...form, citiesRaw: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Pincodes (comma separated) *</label>
                <input required style={inputStyle} placeholder="e.g. 390012, 390015" value={form.pincodesRaw} onChange={e => setForm({ ...form, pincodesRaw: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Franchise Assignment</label>
                <select style={inputStyle} value={form.assigned_franchise_id} onChange={e => setForm({ ...form, assigned_franchise_id: e.target.value })}>
                  <option value="">Leave Unassigned</option>
                  {franchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: BROWN, cursor: "pointer", marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={form.is_locked}
                  onChange={e => setForm({ ...form, is_locked: e.target.checked })}
                />
                <span>Lock Territory for exclusive assignment</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: BROWN, cursor: "pointer"
              }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none", background: BROWN, color: GOLD, fontWeight: 700, cursor: "pointer"
              }}>Save Territory</button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
