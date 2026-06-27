"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

const GOLD = "#c9a84c"
const BROWN = "#3d1c02"
const CREAM = "#fdf6ed"
const WARM = "#f5ebe0"
const BORDER = "rgba(201,168,76,0.2)"

export default function FranchisePaymentsPage() {
  const [franchises, setFranchises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Ledger transactions
  const [transactions, setTransactions] = useState<any[]>([
    { id: "TX101", franchiseName: "Vadodara Branch", date: "2026-06-01", type: "income", category: "Setup Fee", amount: 1000000, notes: "First milestone setup fee received" },
    { id: "TX102", franchiseName: "Mumbai Branch", date: "2026-06-03", type: "expense", category: "Legal Fees", amount: 45000, notes: "Agreement drafting and notary stamp charges" },
    { id: "TX103", franchiseName: "Pune Candidate", date: "2026-06-11", type: "income", category: "Token Money", amount: 200000, notes: "Token deposit received for territory locking" },
    { id: "TX104", franchiseName: "Surat Branch", date: "2026-06-14", type: "expense", category: "Marketing & Ads", amount: 75000, notes: "Google Ads campaign for candidate lead generation" },
    { id: "TX105", franchiseName: "Mumbai Branch", date: "2026-06-18", type: "income", category: "Security Deposit", amount: 500000, notes: "Franchise security deposit received in full" },
    { id: "TX106", franchiseName: "Ahmedabad Branch", date: "2026-06-21", type: "expense", category: "Travel & Audits", amount: 28000, notes: "Audit site visit expenses for branch signoff" },
  ])

  // New Transaction Form State
  const [form, setForm] = useState({
    franchiseId: "",
    candidateName: "",
    type: "income",
    category: "Setup Fee",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  })

  useEffect(() => {
    fetch("/api/franchises")
      .then(r => r.json())
      .then(d => {
        setFranchises(d.data ?? d ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalIncome = 0
    let totalExpense = 0
    transactions.forEach(t => {
      if (t.type === "income") totalIncome += t.amount
      else totalExpense += t.amount
    })
    return {
      income: totalIncome,
      expense: totalExpense,
      profit: totalIncome - totalExpense
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase()
      const matchSearch = !q || 
        t.franchiseName?.toLowerCase().includes(q) || 
        t.category?.toLowerCase().includes(q) || 
        t.notes?.toLowerCase().includes(q)
      const matchType = !filterType || t.type === filterType
      return matchSearch && matchType
    })
  }, [transactions, search, filterType])

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || (!form.franchiseId && !form.candidateName)) {
      toast.error("Please fill in the amount and branch/candidate name")
      return
    }

    const name = form.franchiseId 
      ? (franchises.find(f => f.id === form.franchiseId)?.name || "Franchise Branch")
      : form.candidateName

    const newTx = {
      id: `TX${Math.floor(100 + Math.random() * 900)}`,
      franchiseName: name,
      date: form.date,
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      notes: form.notes
    }

    setTransactions([newTx, ...transactions])
    toast.success("Transaction recorded in ledger")
    setShowAdd(false)
    setForm({
      franchiseId: "",
      candidateName: "",
      type: "income",
      category: "Setup Fee",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    })
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

      {/* Header */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${BORDER}`, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: BROWN }}>Franchise Payments Ledger</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#a07040", marginTop: 4 }}>
            Record setup fees, royalty payments, advertising pools, legal bills, and travels.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: BROWN, color: GOLD, border: "none", borderRadius: 10,
          padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }}>
          + Record Transaction
        </button>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Metrics Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { label: "Franchise Sold Income", value: `₹${metrics.income.toLocaleString("en-IN")}`, color: "#16a34a", desc: "Total franchise setup and security fees" },
            { label: "Acquisition Expenses", value: `₹${metrics.expense.toLocaleString("en-IN")}`, color: "#dc2626", desc: "Legal drafting, visits, and ad costs" },
            { label: "Net Selling Profit", value: `₹${metrics.profit.toLocaleString("en-IN")}`, color: GOLD, desc: "Platform profit before tax deductions" },
          ].map((m, i) => (
            <div key={i} style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a07040", textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color, margin: "6px 0 2px" }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#805020" }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search by branch or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", maxWidth: 300, height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none"
            }}
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
              padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none", cursor: "pointer"
            }}
          >
            <option value="">All Transactions</option>
            <option value="income">Incomes only (+)</option>
            <option value="expense">Expenses only (-)</option>
          </select>
        </div>

        {/* Table / Ledger */}
        <div style={{ background: CREAM, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a07040" }}>Loading ledger...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a07040" }}>No transactions match your search.</div>
          ) : (
            <>
              {/* Desktop view */}
              <div style={{ display: "none" }} className="desktop-view-block">
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "rgba(201,168,76,0.08)", borderBottom: `1px solid ${BORDER}` }}>
                      {["Tx ID", "Franchise Branch / Candidate", "Date", "Category", "Amount (₹)", "Type", "Notes"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, color: "#a07040", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: idx < filteredTransactions.length - 1 ? "1px solid rgba(201,168,76,0.1)" : "none" }}>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: BROWN }}>{t.id}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: BROWN }}>{t.franchiseName}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#a07040" }}>{t.date}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: BROWN }}>{t.category}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                          {t.type === "income" ? "+" : "-"} ₹{t.amount.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 10,
                            background: t.type === "income" ? "#f0fdf4" : "#fef2f2",
                            color: t.type === "income" ? "#16a34a" : "#dc2626"
                          }}>{t.type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#805020" }}>{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="mobile-view-block" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14 }}>
                {filteredTransactions.map(t => (
                  <div key={t.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 13, color: BROWN }}>{t.id} - {t.franchiseName}</strong>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
                        background: t.type === "income" ? "#f0fdf4" : "#fef2f2",
                        color: t.type === "income" ? "#16a34a" : "#dc2626"
                      }}>{t.type.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: BROWN }}><strong>Category:</strong> {t.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                      Amount: {t.type === "income" ? "+" : "-"} ₹{t.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 11, color: "#a07040" }}><strong>Date:</strong> {t.date}</div>
                    {t.notes && <div style={{ fontSize: 11, color: "#805020", background: "#fdfdfb", padding: 6, borderRadius: 6, border: "1px solid rgba(0,0,0,0.03)" }}>{t.notes}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowAdd(false)}>
          <form onSubmit={handleAddSubmit} style={{ background: CREAM, borderRadius: 20, padding: 24, width: "100%", maxWidth: 500, border: `1px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: BROWN }}>Record Acquisition Payment</h3>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: BROWN, display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Select Franchise Branch</label>
                  <select style={inputStyle} value={form.franchiseId} onChange={e => setForm({ ...form, franchiseId: e.target.value })}>
                    <option value="">-- OR select candidate below --</option>
                    {franchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>OR Candidate Lead Name</label>
                  <input placeholder="e.g. Pune Candidate" style={inputStyle} value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Transaction Type</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? "Setup Fee" : "Legal Fees" })}>
                    <option value="income">Income (+)</option>
                    <option value="expense">Expense (-)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ledger Category</label>
                  {form.type === "income" ? (
                    <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="Setup Fee">Setup Fee</option>
                      <option value="Token Money">Token Money</option>
                      <option value="Security Deposit">Security Deposit</option>
                      <option value="Royalty Payment">Royalty Fee</option>
                    </select>
                  ) : (
                    <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="Legal Fees">Legal Fees</option>
                      <option value="Marketing & Ads">Marketing & Ads</option>
                      <option value="Travel & Audits">Travel & Audits</option>
                      <option value="Training collateral">Training collateral</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Amount (₹) *</label>
                  <input required type="number" placeholder="e.g. 50000" style={inputStyle} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Transaction Date</label>
                  <input type="date" style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes / Description</label>
                <textarea rows={2} placeholder="Explain transaction details..." style={{ ...inputStyle, height: 50, padding: 8, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: BROWN, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, height: 38, borderRadius: 8, border: "none", background: BROWN, color: GOLD, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Record Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Responsive layout selectors */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-view-block {
            display: block !important;
          }
          .mobile-view-block {
            display: none !important;
          }
        }
      `}</style>

    </div>
  )
}
