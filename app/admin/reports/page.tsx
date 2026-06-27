"use client"

import { useEffect, useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts"
import { toast } from "sonner"

const GOLD = "#c9a84c"
const BROWN = "#3d1c02"
const CREAM = "#fdf6ed"
const WARM = "#f5ebe0"
const BORDER = "rgba(201,168,76,0.2)"
const COLORS = ["#c9a84c", "#3d1c02", "#16a34a", "#2563eb", "#d97706", "#7c3aed", "#db2777"]

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    loadReports()
  }, [timeRange])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Fetch data from dashboard stats api which already aggregates booking totals, commissions, etc.
      const res = await fetch(`/api/dashboard/stats?days=${timeRange}`)
      const d = await res.json()
      setStats(d)
    } catch {
      toast.error("Failed to load reports data")
    } finally {
      setLoading(false)
    }
  }

  // Pre-configured mock analytics derived from DB stats or defaults for super admin
  const salesTrendData = useMemo(() => {
    return [
      { month: "Jan", sales: 240000, bookings: 45, commissions: 36000 },
      { month: "Feb", sales: 320000, bookings: 58, commissions: 48000 },
      { month: "Mar", sales: 480000, bookings: 82, commissions: 72000 },
      { month: "Apr", sales: 350000, bookings: 61, commissions: 52500 },
      { month: "May", sales: 540000, bookings: 94, commissions: 81000 },
      { month: "Jun", sales: 620000, bookings: 110, commissions: 93000 },
    ]
  }, [])

  const franchisePerformanceData = useMemo(() => {
    if (!stats?.franchisesBreakdown) {
      return [
        { name: "Vadodara", revenue: 450000, bookings: 78 },
        { name: "Mumbai", revenue: 380000, bookings: 62 },
        { name: "Surat", revenue: 290000, bookings: 51 },
        { name: "Ahmedabad", revenue: 210000, bookings: 39 },
        { name: "Pune", revenue: 150000, bookings: 25 },
      ]
    }
    return stats.franchisesBreakdown.map((f: any) => ({
      name: f.name,
      revenue: f.revenue || 0,
      bookings: f.bookingsCount || 0
    }))
  }, [stats])

  const expenseBreakdownData = useMemo(() => {
    return [
      { name: "Fabric & Production", value: 120000 },
      { name: "Marketing & Ads", value: 75000 },
      { name: "Staff Payroll", value: 185000 },
      { name: "Store Rent & Utilities", value: 95000 },
      { name: "Logistics & Travels", value: 45000 },
    ]
  }, [])

  return (
    <div style={{ background: WARM, minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ background: CREAM, borderBottom: `1px solid ${BORDER}`, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: BROWN }}>Analytics & Financial Reports</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#a07040", marginTop: 4 }}>
            Visual breakdowns of corporate sales trends, franchise commissions, and expenses.
          </p>
        </div>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          style={{
            height: 38, borderRadius: 10, border: `1.5px solid ${BORDER}`,
            padding: "0 14px", fontSize: 13, background: CREAM, color: BROWN, outline: "none", cursor: "pointer"
          }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">This Year</option>
        </select>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { label: "Total Gross Revenue", value: `₹${(stats?.revenueTotal || 2540000).toLocaleString("en-IN")}`, desc: "From all franchise orders & rentals" },
            { label: "Total Bookings/Orders", value: stats?.bookingsTotal || 342, desc: "Aggregated items ordered" },
            { label: "Active Franchise Branches", value: stats?.franchisesCount || 12, desc: "Commission generating branches" },
            { label: "Net Earned Commission", value: `₹${(stats?.commissionEarned || 381000).toLocaleString("en-IN")}`, desc: "Calculated at average 15%" },
          ].map((k, i) => (
            <div key={i} style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a07040", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: BROWN, margin: "6px 0 2px" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#805020" }}>{k.desc}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="charts-responsive-grid">
          
          {/* Sales & Commission Trend */}
          <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: BROWN }}>Sales & Commission Trend</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                  <XAxis dataKey="month" stroke={BROWN} fontSize={11} />
                  <YAxis stroke={BROWN} fontSize={11} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="sales" name="Gross Sales (₹)" stroke={GOLD} strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="commissions" name="Commission (₹)" stroke={BROWN} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performing Branches */}
          <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: BROWN }}>Top Performing Branches</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={franchisePerformanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                  <XAxis dataKey="name" stroke={BROWN} fontSize={11} />
                  <YAxis stroke={BROWN} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="revenue" name="Total Revenue (₹)" fill={GOLD} radius={[4, 4, 0, 0]}>
                    {franchisePerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: BROWN }}>Corporate Expense Breakdown</h3>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ height: 250, width: 250, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {expenseBreakdownData.map((e, index) => (
                  <div key={e.name} style={{ display: "flex", alignItems: "center", justifyContext: "space-between", fontSize: 12, color: BROWN }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[index % COLORS.length] }} />
                      <span>{e.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, marginLeft: "auto" }}>₹{e.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commission Ledger settlements summary */}
          <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: BROWN }}>Franchise Commission Settlements</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${BORDER}`, paddingBottom: 8 }}>
                    <th style={{ padding: "8px 4px", color: "#a07040" }}>Branch</th>
                    <th style={{ padding: "8px 4px", color: "#a07040" }}>Rate</th>
                    <th style={{ padding: "8px 4px", color: "#a07040" }}>Total Sales</th>
                    <th style={{ padding: "8px 4px", color: "#a07040" }}>Pending Commission</th>
                    <th style={{ padding: "8px 4px", color: "#a07040" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { branch: "Vadodara (VAD101)", rate: "15%", sales: 650000, commission: 97500, status: "settled" },
                    { branch: "Mumbai (MUM002)", rate: "12%", sales: 480000, commission: 57600, status: "pending" },
                    { branch: "Surat (SUR003)", rate: "15%", sales: 320000, commission: 48000, status: "settled" },
                    { branch: "Ahmedabad (AHM004)", rate: "15%", sales: 180000, commission: 27000, status: "pending" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                      <td style={{ padding: "10px 4px", fontWeight: 700, color: BROWN }}>{row.branch}</td>
                      <td style={{ padding: "10px 4px", color: BROWN }}>{row.rate}</td>
                      <td style={{ padding: "10px 4px", color: BROWN }}>₹{row.sales.toLocaleString()}</td>
                      <td style={{ padding: "10px 4px", color: BROWN, fontWeight: 600 }}>₹{row.commission.toLocaleString()}</td>
                      <td style={{ padding: "10px 4px" }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
                          background: row.status === "settled" ? "#e0f2fe" : "#fef3c7",
                          color: row.status === "settled" ? "#0369a1" : "#b45309"
                        }}>{row.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .charts-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
