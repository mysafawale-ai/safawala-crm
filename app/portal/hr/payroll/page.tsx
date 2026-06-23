"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#6366f1"

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

interface StaffSalary {
  id: string
  name: string
  department: string
  baseSalary: number
  commission: number
  commissionType: string
  status: "disbursed" | "pending"
}

export default function HrPayrollPage() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  
  const [salaries, setSalaries] = useState<StaffSalary[]>([
    { id: "1", name: "Rajesh Kumar", department: "Booking", baseSalary: 25000, commission: 12500, commissionType: "Sales", status: "disbursed" },
    { id: "2", name: "Amit Sharma", department: "Warehouse", baseSalary: 20000, commission: 0, commissionType: "—", status: "disbursed" },
    { id: "3", name: "Priya Patel", department: "Styling", baseSalary: 18000, commission: 15400, commissionType: "Styling", status: "disbursed" },
    { id: "4", name: "Vikram Singh", department: "Delivery", baseSalary: 16000, commission: 2400, commissionType: "Trips", status: "pending" },
    { id: "5", name: "Sunil Verma", department: "QC", baseSalary: 18000, commission: 0, commissionType: "—", status: "disbursed" },
    { id: "6", name: "Anjali Mehta", department: "Accounts", baseSalary: 30000, commission: 0, commissionType: "—", status: "disbursed" },
    { id: "7", name: "Karan Johar", department: "Styling", baseSalary: 18000, commission: 8900, commissionType: "Styling", status: "pending" }
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  function runPayroll() {
    setRunning(true)
    setSuccessMsg("")
    
    setTimeout(() => {
      // Mark all pending as disbursed
      const pendingCount = salaries.filter(s => s.status === "pending").length
      const totalPendingAmt = salaries
        .filter(s => s.status === "pending")
        .reduce((sum, s) => sum + s.baseSalary + s.commission, 0)
        
      setSalaries(prev =>
        prev.map(item => ({ ...item, status: "disbursed" }))
      )
      
      setRunning(false)
      setSuccessMsg(`Disbursed ${fmt(totalPendingAmt)} to ${pendingCount} staff members successfully!`)
    }, 1500)
  }

  const totalDisbursed = salaries
    .filter(s => s.status === "disbursed")
    .reduce((sum, s) => sum + s.baseSalary + s.commission, 0)
    
  const totalPending = salaries
    .filter(s => s.status === "pending")
    .reduce((sum, s) => sum + s.baseSalary + s.commission, 0)

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <PortalPageHeader title="HR Payroll" subtitle="Salaries & Commissions" color={COLOR} backHref="/portal/hr" />

      {/* Demo Mode Notice Banner */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 flex items-center gap-2">
        <span>✨</span>
        <span>Running in Simulation Mode. Actions will update locally.</span>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
          🎉 {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
          <p className="text-[20px] font-black text-emerald-600">{fmt(totalDisbursed)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-gray-500">Disbursed This Month</p>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
          <p className="text-[20px] font-black text-rose-600">{fmt(totalPending)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-gray-500">Pending Approvals</p>
        </div>
      </div>

      {/* Action Button */}
      {totalPending > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={runPayroll}
            disabled={running}
            className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white transition-opacity"
            style={{ background: COLOR, opacity: running ? 0.7 : 1 }}
          >
            {running ? "Processing Payouts..." : `Disburse Pending Payroll (${fmt(totalPending)})`}
          </button>
        </div>
      )}

      {/* Compensation List */}
      <PortalSectionLabel label="Staff Compensation Breakdown" />
      <div className="mx-4 space-y-2.5">
        {loading ? (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.65)" }}>
            <PortalSkeleton rows={4} />
          </div>
        ) : salaries.length === 0 ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <PortalEmptyState icon="rupee" title="No payroll entries" subtitle="Employee salary details will appear here" color={COLOR} />
          </div>
        ) : (
          salaries.map(s => {
            const total = s.baseSalary + s.commission
            const commissionDesc = s.commission > 0 
              ? `Base: ${fmt(s.baseSalary)} + ${s.commissionType} Comm: ${fmt(s.commission)}`
              : `Base: ${fmt(s.baseSalary)} (No commissions)`
              
            return (
              <PortalListCard
                key={s.id}
                title={s.name}
                subtitle={`${s.department.toUpperCase()} · Total: ${fmt(total)}`}
                meta={commissionDesc}
                badge={s.status}
                color={COLOR}
                icon="rupee"
              />
            )
          })
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
