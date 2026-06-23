"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSectionLabel, PortalListCard, PortalEmptyState, PortalSkeleton } from "@/components/portal/portal-shared"

const COLOR = "#6366f1"

interface AttendanceRecord {
  id: string
  name: string
  department: string
  checkIn: string | null
  checkOut: string | null
  status: "present" | "absent" | "late" | "leave"
}

interface LeaveRequest {
  id: string
  name: string
  department: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected"
}

export default function HrAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  
  // Simulated initial records
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: "1", name: "Rajesh Kumar", department: "booking", checkIn: "09:15 AM", checkOut: null, status: "present" },
    { id: "2", name: "Amit Sharma", department: "warehouse", checkIn: "08:45 AM", checkOut: null, status: "present" },
    { id: "3", name: "Priya Patel", department: "styling", checkIn: "09:55 AM", checkOut: null, status: "late" },
    { id: "4", name: "Vikram Singh", department: "delivery", checkIn: null, checkOut: null, status: "leave" },
    { id: "5", name: "Sunil Verma", department: "qc", checkIn: null, checkOut: null, status: "absent" },
    { id: "6", name: "Anjali Mehta", department: "accounts", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "present" },
    { id: "7", name: "Karan Johar", department: "styling", checkIn: "09:10 AM", checkOut: null, status: "present" }
  ])

  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: "req-1", name: "Vikram Singh", department: "delivery", startDate: "2026-06-22", endDate: "2026-06-25", days: 4, reason: "Sister's wedding in Punjab", status: "pending" },
    { id: "req-2", name: "Anjali Mehta", department: "accounts", startDate: "2026-06-24", endDate: "2026-06-24", days: 1, reason: "Routine medical checkup", status: "pending" }
  ])

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  function handleAction(id: string, action: "approved" | "rejected") {
    setActioning(id)
    setTimeout(() => {
      setLeaves(prev =>
        prev.map(item => (item.id === id ? { ...item, status: action } : item))
      )
      setActioning(null)
    }, 450)
  }

  const totalPresent = attendance.filter(a => a.status === "present" || a.status === "late").length
  const totalAbsent = attendance.filter(a => a.status === "absent").length
  const pendingLeaves = leaves.filter(l => l.status === "pending").length

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <PortalPageHeader title="HR Attendance" subtitle="Daily Check-ins & Leaves" color={COLOR} backHref="/portal/hr" />

      {/* Demo Mode Notice Banner */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 flex items-center gap-2">
        <span>✨</span>
        <span>Running in Simulation Mode. Actions will update locally.</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-3">
        {[
          { label: "Present Today", value: totalPresent, color: "#16a34a" },
          { label: "Absent Today", value: totalAbsent, color: "#dc2626" },
          { label: "Pending Leaves", value: pendingLeaves, color: COLOR },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3.5 text-center" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <p className="text-[22px] font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Leave Requests Section */}
      <PortalSectionLabel label={`Pending Leaves (${pendingLeaves})`} />
      <div className="mx-4 space-y-2.5">
        {loading ? (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.65)" }}>
            <PortalSkeleton rows={2} />
          </div>
        ) : leaves.filter(l => l.status === "pending").length === 0 ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <PortalEmptyState icon="calendar" title="No Pending Requests" subtitle="All staff leave requests are processed" color={COLOR} />
          </div>
        ) : (
          leaves
            .filter(l => l.status === "pending")
            .map(l => (
              <div
                key={l.id}
                className="p-4 rounded-2xl border"
                style={{
                  background: "white",
                  borderColor: "rgba(99,102,241,0.15)",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.03)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">{l.name}</h3>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider mt-0.5">
                      {l.department}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {l.days} {l.days === 1 ? "day" : "days"}
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg italic">
                  &ldquo;{l.reason}&rdquo;
                </p>

                <div className="text-[10px] text-gray-400 mt-2 font-medium">
                  Dates: {l.startDate} to {l.endDate}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    disabled={actioning === l.id}
                    onClick={() => handleAction(l.id, "approved")}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {actioning === l.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    disabled={actioning === l.id}
                    onClick={() => handleAction(l.id, "rejected")}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Daily Check-in Logs */}
      <PortalSectionLabel label="Today's Check-in Logs" />
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)" }}>
        {loading ? (
          <PortalSkeleton rows={5} />
        ) : attendance.length === 0 ? (
          <PortalEmptyState icon="users" title="No check-ins yet" subtitle="Staff attendance entries will appear here" color={COLOR} />
        ) : (
          attendance.map(a => {
            const timeDesc = a.checkIn 
              ? `In: ${a.checkIn}${a.checkOut ? ` · Out: ${a.checkOut}` : " (Active)"}` 
              : "Not checked in"
            return (
              <PortalListCard
                key={a.id}
                title={a.name}
                subtitle={`${a.department.toUpperCase()} · ${timeDesc}`}
                badge={a.status}
                color={COLOR}
                icon="user"
              />
            )
          })
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
