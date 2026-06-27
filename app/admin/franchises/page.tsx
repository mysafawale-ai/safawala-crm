"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const GOLD = "#c9a84c"
const BROWN = "#3d1c02"
const CREAM = "#fdf6ed"
const WARM = "#f5ebe0"
const BORDER = "rgba(201,168,76,0.2)"

interface Franchise {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  owner_name: string
  manager_name: string
  gst_number: string
  pan_number: string
  commission_rate: number
  is_active: boolean
  created_at: string
}

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modals state
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [selected, setSelected] = useState<Franchise | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [form, setForm] = useState({
    name: "", code: "", owner_name: "", manager_name: "",
    phone: "", email: "", address: "", city: "", state: "",
    pincode: "", gst_number: "", pan_number: "", commission_rate: "15",
    is_active: true
  })

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    fetch("/api/franchises")
      .then(r => r.json())
      .then(d => {
        setFranchises(d.data ?? d ?? [])
      })
      .catch(() => setFranchises([]))
      .finally(() => setLoading(false))
  }

  const filtered = franchises.filter(f => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      f.name?.toLowerCase().includes(q) ||
      f.code?.toLowerCase().includes(q) ||
      f.city?.toLowerCase().includes(q) ||
      f.owner_name?.toLowerCase().includes(q)
    
    if (statusFilter === "active") return matchesSearch && f.is_active === true
    if (statusFilter === "inactive") return matchesSearch && f.is_active === false
    return matchesSearch
  })

  const resetForm = (f?: Franchise) => {
    if (f) {
      setForm({
        name: f.name || "",
        code: f.code || "",
        owner_name: f.owner_name || "",
        manager_name: f.manager_name || "",
        phone: f.phone || "",
        email: f.email || "",
        address: f.address || "",
        city: f.city || "",
        state: f.state || "",
        pincode: f.pincode || "",
        gst_number: f.gst_number || "",
        pan_number: f.pan_number || "",
        commission_rate: String(f.commission_rate ?? 15),
        is_active: f.is_active !== false
      })
    } else {
      setForm({
        name: "", code: "", owner_name: "", manager_name: "",
        phone: "", email: "", address: "", city: "", state: "",
        pincode: "", gst_number: "", pan_number: "", commission_rate: "15",
        is_active: true
      })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.city) return

    // Auto-generate a simple code in background: 3 letters of name + 3 digits
    const cleanedName = form.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    const generatedCode = cleanedName.length >= 3 
      ? cleanedName.slice(0, 3) + Math.floor(100 + Math.random() * 900)
      : cleanedName + Math.floor(100 + Math.random() * 900)

    setSubmitting(true)
    try {
      const res = await fetch("/api/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: generatedCode,
          commission_rate: parseFloat(form.commission_rate || "15")
        })
      })
      if (res.ok) {
        setShowAdd(false)
        load()
      } else {
        const err = await res.json()
        alert(err.error || "Failed to create franchise")
      }
    } catch {
      alert("Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/franchises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          ...form,
          commission_rate: parseFloat(form.commission_rate || "15")
        })
      })
      if (res.ok) {
        setShowEdit(false)
        setSelected(null)
        load()
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update franchise")
      }
    } catch {
      alert("Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (f: Franchise) => {
    try {
      const res = await fetch("/api/franchises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: f.id,
          is_active: !f.is_active
        })
      })
      if (res.ok) load()
    } catch {}
  }

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

      {/* Page Header */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${BORDER}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: BROWN }}>Franchise Management</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#a07040", marginTop: 2 }}>
            {loading ? "Loading..." : `${franchises.length} branches registered`}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true) }} style={{
          fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 10,
          background: BROWN, color: GOLD, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Franchise
        </button>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Branches", value: String(franchises.length), color: BROWN },
            { label: "Active Branches", value: String(franchises.filter(f => f.is_active).length), color: "#16a34a" },
            { label: "Suspended Branches", value: String(franchises.filter(f => !f.is_active).length), color: "#dc2626" },
            { label: "Avg Commisson Rate", value: `${(franchises.reduce((s, f) => s + (f.commission_rate || 0), 0) / (franchises.length || 1)).toFixed(1)}%`, color: GOLD }
          ].map((st, idx) => (
            <div key={idx} style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#a07040", textTransform: "uppercase", letterSpacing: "0.06em" }}>{st.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: st.color, marginTop: 4 }}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Search by branch name, code, city, owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, maxWidth: 360, height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none"
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none", cursor: "pointer"
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Franchises Table */}
        <div style={{ background: CREAM, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a07040" }}>Loading franchises data...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a07040" }}>No franchises found matching criteria.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(201,168,76,0.08)", borderBottom: `1px solid ${BORDER}` }}>
                  {["Branch Code", "Branch Name", "Owner Name", "Location", "Commission", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 700, color: "#a07040", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(201,168,76,0.1)" : "none" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: BROWN }}>{f.code}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: BROWN }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#a07040" }}>{f.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: BROWN }}>{f.owner_name || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: BROWN }}>{f.city}, {f.state}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: BROWN }}>{f.commission_rate ?? 15}%</td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => toggleStatus(f)}
                        style={{
                          border: "none", background: "none", cursor: "pointer",
                          fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          backgroundColor: f.is_active ? "#f0fdf4" : "#fef2f2",
                          color: f.is_active ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {f.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setSelected(f); setShowView(true) }} style={{
                          fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 8,
                          background: "transparent", border: `1px solid ${BORDER}`, color: BROWN, cursor: "pointer",
                        }}>View</button>
                        <button onClick={() => { setSelected(f); resetForm(f); setShowEdit(true) }} style={{
                          fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 8,
                          background: "transparent", border: `1px solid ${BORDER}`, color: BROWN, cursor: "pointer",
                        }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <form onSubmit={handleCreate} style={{ background: CREAM, borderRadius: 20, padding: 28, width: "100%", maxWidth: 640, border: `1px solid ${BORDER}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: BROWN }}>Add New Franchise</h3>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: BROWN, display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
                <label style={labelStyle}>Company Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Owner Name</label>
                <input style={inputStyle} value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Manager Name</label>
                <input style={inputStyle} value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Mobile / Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
                <label style={labelStyle}>Street Address</label>
                <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>City *</label>
                <input required style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Pincode</label>
                <input style={inputStyle} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>GST Number</label>
                <input style={inputStyle} value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>PAN Number</label>
                <input style={inputStyle} value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Commission Rate (%)</label>
                <input style={inputStyle} type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: BROWN, cursor: "pointer"
              }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none", background: BROWN, color: GOLD, fontWeight: 700, cursor: "pointer"
              }}>{submitting ? "Creating..." : "Save Franchise"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <form onSubmit={handleUpdate} style={{ background: CREAM, borderRadius: 20, padding: 28, width: "100%", maxWidth: 640, border: `1px solid ${BORDER}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: BROWN }}>Edit Franchise: {selected.code}</h3>
              <button type="button" onClick={() => { setShowEdit(false); setSelected(null) }} style={{ background: "none", border: "none", cursor: "pointer", color: BROWN, display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Company Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Branch Code *</label>
                <input required disabled style={{ ...inputStyle, background: "#e8ddd0", cursor: "not-allowed" }} value={form.code} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Owner Name</label>
                <input style={inputStyle} value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Manager Name</label>
                <input style={inputStyle} value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Mobile / Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
                <label style={labelStyle}>Street Address</label>
                <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>City *</label>
                <input required style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Pincode</label>
                <input style={inputStyle} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>GST Number</label>
                <input style={inputStyle} value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>PAN Number</label>
                <input style={inputStyle} value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Commission Rate (%)</label>
                <input style={inputStyle} type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setShowEdit(false); setSelected(null) }} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: BROWN, cursor: "pointer"
              }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none", background: BROWN, color: GOLD, fontWeight: 700, cursor: "pointer"
              }}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {showView && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, border: `1px solid ${BORDER}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: BROWN }}>Franchise Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, fontSize: 13, color: BROWN }}>
              <div><strong>Branch Code:</strong> {selected.code}</div>
              <div><strong>Company Name:</strong> {selected.name}</div>
              <div><strong>Owner Name:</strong> {selected.owner_name || "—"}</div>
              <div><strong>Manager Name:</strong> {selected.manager_name || "—"}</div>
              <div><strong>Phone:</strong> {selected.phone || "—"}</div>
              <div><strong>Email:</strong> {selected.email || "—"}</div>
              <div><strong>Address:</strong> {selected.address || "—"}, {selected.city}, {selected.state} - {selected.pincode}</div>
              <div><strong>GSTIN:</strong> {selected.gst_number || "—"}</div>
              <div><strong>PAN Card:</strong> {selected.pan_number || "—"}</div>
              <div><strong>Commission rate:</strong> {selected.commission_rate}%</div>
              <div><strong>Status:</strong> {selected.is_active ? "Active" : "Suspended"}</div>
            </div>

            <button onClick={() => { setShowView(false); setSelected(null) }} style={{
              width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: BROWN, cursor: "pointer"
            }}>Close Panel</button>
          </div>
        </div>
      )}

    </div>
  )
}
