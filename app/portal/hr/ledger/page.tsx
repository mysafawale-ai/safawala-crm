"use client"

import { useState, useEffect, useCallback } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalEmptyState, PortalSkeleton, PortalSearchBar } from "@/components/portal/portal-shared"

const COLOR = "#6366f1"
const COLOR_DARK = "#4f46e5"

const DEPT_COLORS: Record<string, string> = {
  booking: "#22c55e", warehouse: "#a855f7", qc: "#eab308",
  delivery: "#14b8a6", styling: "#ec4899", accounts: "#ef4444",
  hr: "#6366f1", manager: "#3b82f6",
}

const TX_TYPES = [
  { key: "advance", label: "Salary Advance", color: "#ef4444", sign: -1 },
  { key: "loan", label: "Loan", color: "#f97316", sign: -1 },
  { key: "recovery", label: "Advance Recovery", color: "#22c55e", sign: 1 },
  { key: "bonus", label: "Bonus", color: "#22c55e", sign: 1 },
  { key: "deduction", label: "Deduction", color: "#ef4444", sign: -1 },
  { key: "reimbursement", label: "Reimbursement", color: "#22c55e", sign: 1 },
  { key: "trip_allowance", label: "Trip Allowance", color: "#22c55e", sign: 1 },
]

function fmt(n: number) { return `₹${Math.abs(n).toLocaleString("en-IN")}` }

const EMPTY_TX = { type: "advance", amount: "", notes: "", date: new Date().toISOString().split("T")[0] }

export default function StaffLedgerPage() {
  const [ledgers, setLedgers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_TX })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  useEffect(() => {
    fetch("/api/staff-ledgers")
      .then(r => r.json())
      .then(d => setLedgers(d.data ?? []))
      .catch(() => setLedgers([]))
      .finally(() => setLoading(false))
  }, [])

  async function loadTransactions(userId: string) {
    setTxLoading(true)
    try {
      const res = await fetch(`/api/staff-ledgers/${userId}/transactions`).then(r => r.json())
      setTransactions(res.data ?? [])
    } catch { setTransactions([]) }
    setTxLoading(false)
  }

  function openStaff(s: any) {
    setSelected(s)
    loadTransactions(s.id)
  }

  async function addTransaction() {
    if (!form.amount || !selected) return
    setSaving(true)
    try {
      const txType = TX_TYPES.find(t => t.key === form.type)!
      const amount = parseFloat(form.amount) * txType.sign
      const res = await fetch(`/api/staff-ledgers/${selected.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, amount, notes: form.notes, date: form.date }),
      })
      if (res.ok) {
        const d = await res.json()
        setTransactions(prev => [d.data ?? { type: form.type, amount, notes: form.notes, date: form.date, created_at: new Date().toISOString() }, ...prev])
        // Update ledger balance
        setLedgers(prev => prev.map(l => l.id === selected.id
          ? { ...l, utilizedCredit: (l.utilizedCredit ?? 0) - (form.type === "recovery" ? parseFloat(form.amount) : 0) + (form.type === "advance" || form.type === "loan" ? parseFloat(form.amount) : 0) }
          : l
        ))
        setForm({ ...EMPTY_TX })
        setShowAdd(false)
        showToast("Transaction added ✓")
      } else { showToast("Failed to add transaction") }
    } catch { showToast("Error") }
    setSaving(false)
  }

  const filtered = ledgers.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.department?.toLowerCase().includes(search.toLowerCase()))

  const totalOutstanding = ledgers.reduce((s, l) => s + (l.utilizedCredit ?? 0), 0)

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", background: COLOR_DARK, color: "white", borderRadius: 12, padding: "8px 20px", fontSize: 12, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {selected ? (
        // Transaction detail view
        <div>
          <PortalPageHeader title={`Ledger — ${selected.name}`} subtitle={selected.department?.toUpperCase()} color={COLOR} backHref="#" />
          <button onClick={() => { setSelected(null); setTransactions([]) }}
            style={{ margin: "0 16px 12px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            ← All Staff
          </button>

          {/* Balance summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 12px" }}>
            <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: 14, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: "#dc2626" }}>{fmt(selected.utilizedCredit ?? 0)}</p>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(80,55,30,0.4)" }}>Outstanding Balance</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: 14, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: COLOR }}>{fmt(selected.baseSalary ?? 0)}</p>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(80,55,30,0.4)" }}>Base Salary / Month</p>
            </div>
          </div>

          <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{ flex: 1, height: 44, borderRadius: 14, border: "none", background: COLOR, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Add Transaction
            </button>
          </div>

          <PortalSectionLabel label="Transaction History" />
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {txLoading ? (
              <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: 16 }}><PortalSkeleton rows={4} /></div>
            ) : transactions.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16 }}>
                <PortalEmptyState icon="rupee" title="No transactions" subtitle="Add advance, loan, or bonus transactions" color={COLOR} />
              </div>
            ) : (
              transactions.map((tx, i) => {
                const txMeta = TX_TYPES.find(t => t.key === tx.type)
                const isDebit = (txMeta?.sign ?? 1) < 0
                return (
                  <div key={tx.id ?? i} style={{ background: "white", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isDebit ? "#fee2e2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {isDebit ? "↓" : "↑"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{txMeta?.label ?? tx.type}</p>
                      {tx.notes && <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(80,55,30,0.4)" }}>{tx.notes}</p>}
                      <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(80,55,30,0.3)" }}>{tx.date ?? tx.created_at?.slice(0, 10)}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: isDebit ? "#dc2626" : "#16a34a" }}>
                      {isDebit ? "- " : "+ "}{fmt(Math.abs(tx.amount ?? 0))}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* Add Transaction Sheet */}
          {showAdd && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={() => setShowAdd(false)} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "24px 24px 0 0", padding: "20px 20px calc(env(safe-area-inset-bottom,20px)+20px)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 900 }}>Add Transaction</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                      {TX_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  {[
                    { key: "amount", label: "Amount (₹)", type: "number" },
                    { key: "date", label: "Date", type: "date" },
                    { key: "notes", label: "Notes", type: "text" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <button onClick={addTransaction} disabled={saving}
                    style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: COLOR, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Adding…" : "Add Transaction"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Staff list view
        <div>
          <PortalPageHeader title="Staff Ledger" subtitle="Advances, loans & allowances" color={COLOR} backHref="/portal/hr" />

          {/* Summary */}
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: 14, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#dc2626" }}>{loading ? "…" : fmt(totalOutstanding)}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.4)" }}>Total Outstanding Advances</p>
            </div>
          </div>

          <PortalSearchBar value={search} onChange={setSearch} placeholder="Search staff name or department…" />

          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: 16 }}><PortalSkeleton rows={5} /></div>
            ) : filtered.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16 }}>
                <PortalEmptyState icon="rupee" title="No staff ledgers" subtitle="Staff ledgers will appear here" color={COLOR} />
              </div>
            ) : (
              filtered.map(s => {
                const deptColor = DEPT_COLORS[s.department] ?? COLOR
                const outstanding = s.utilizedCredit ?? 0
                return (
                  <div key={s.id} onClick={() => openStaff(s)} style={{ background: "white", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${deptColor}20`, display: "flex", alignItems: "center", justifyContent: "center", color: deptColor, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {(s.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{s.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(80,55,30,0.45)", fontWeight: 600, textTransform: "uppercase" }}>{s.department}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {outstanding > 0
                        ? <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#dc2626" }}>- {fmt(outstanding)}</p>
                        : <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#16a34a" }}>Clear ✓</p>
                      }
                      <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(80,55,30,0.35)", fontWeight: 600 }}>Base: {fmt(s.baseSalary ?? 0)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
