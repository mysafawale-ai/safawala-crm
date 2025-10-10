"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Plus, Search, Download, CheckCircle, XCircle, AlertCircle, LogIn, LogOut, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { TimePicker } from "@/components/ui/time-picker"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface AttendanceRecord {
  id: string
  employee_name: string
  employee_id: string
  date: string
  check_in: string
  check_out?: string
  total_hours?: number
  status: "present" | "absent" | "late" | "half_day" | "on_leave"
  overtime_hours?: number
  user_id: string
  franchise_id: string
}

interface AttendanceStats {
  total_employees: number
  present_today: number
  absent_today: number
  late_today: number
  average_hours: number
}

interface Employee {
  id: string
  name: string
  email: string
  employee_id: string
  role: string
  franchise_id: string
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    total_employees: 0,
    present_today: 0,
    absent_today: 0,
    late_today: 0,
    average_hours: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [showMarkDialog, setShowMarkDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "late" | "half_day" | "on_leave">(
    "present",
  )
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [rangeMode, setRangeMode] = useState<'single' | 'range'>('single')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [recordPendingDelete, setRecordPendingDelete] = useState<AttendanceRecord | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [historyMode, setHistoryMode] = useState(false)
  const [historyMonth, setHistoryMonth] = useState(() => new Date().toISOString().slice(0,7)) // YYYY-MM
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  useEffect(() => {
    loadAttendanceData()
  }, [selectedDate, rangeMode, startDate, endDate, historyMode, historyMonth, employeeFilter, statusFilter])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading attendance data...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        toast.error("Please login to view attendance data")
        return
      }

      console.log(
        "[v0] Current user:",
        currentUser.name,
        "role:",
        currentUser.role,
        "franchise:",
        currentUser.franchise_id,
      )

      // Determine franchise filter based on user role
      const franchiseFilter = currentUser.role === "super_admin" ? null : currentUser.franchise_id

      // Load employees for the franchise
      await loadEmployees(franchiseFilter as string | null)

      // Load attendance records for selected date
      let attendanceQuery = supabase
        .from("attendance_records")
        .select(`
          id,
          user_id,
          franchise_id,
          date,
          check_in_time,
          check_out_time,
          total_hours,
          overtime_hours,
          status,
          users!user_id(name, email)
        `)

      if (historyMode) {
        const start = historyMonth + '-01'
        const startDateObj = new Date(start)
        const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth()+1, 0)
        const end = endDateObj.toISOString().slice(0,10)
        attendanceQuery = attendanceQuery.gte('date', start).lte('date', end)
      } else if (rangeMode === 'single') {
        attendanceQuery = attendanceQuery.eq("date", selectedDate)
      } else if (rangeMode === 'range' && startDate && endDate) {
        attendanceQuery = attendanceQuery.gte('date', startDate).lte('date', endDate)
      } else {
        attendanceQuery = attendanceQuery.eq('date', selectedDate)
      }

      if (franchiseFilter) {
        attendanceQuery = attendanceQuery.eq("franchise_id", franchiseFilter)
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery

      if (attendanceError) {
        console.error("[v0] Error fetching attendance:", attendanceError)
        toast.error("Failed to load attendance data")
        return
      }

      console.log("[v0] Attendance records fetched:", attendanceData?.length || 0)

      // Transform data to match interface
      const transformedRecords: AttendanceRecord[] = (attendanceData || []).map((record: any) => ({
        id: record.id,
        employee_name: record.users.name,
        employee_id: record.user_id.slice(-6).toUpperCase(), // Use last 6 chars of user_id as employee_id
        date: record.date,
        check_in: record.check_in_time
          ? new Date(record.check_in_time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        check_out: record.check_out_time
          ? new Date(record.check_out_time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
        total_hours: record.total_hours || 0,
        status: record.status as "present" | "absent" | "late" | "half_day" | "on_leave",
        overtime_hours: record.overtime_hours || 0,
        user_id: record.user_id,
        franchise_id: record.franchise_id,
      }))

      setAttendanceRecords(transformedRecords)

      // Calculate stats
      const totalEmployees = employees.length
      const presentToday = transformedRecords.filter((r) => r.status === "present").length
      const absentToday = transformedRecords.filter((r) => r.status === "absent").length
      const lateToday = transformedRecords.filter((r) => r.status === "late").length
      const avgHours =
        transformedRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0) / (transformedRecords.length || 1)

      setStats({
        total_employees: totalEmployees,
        present_today: presentToday,
        absent_today: absentToday,
        late_today: lateToday,
        average_hours: Math.round(avgHours * 10) / 10,
      })

      console.log("[v0] Attendance stats calculated:", {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        avgHours,
      })
      toast.success("Attendance data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading attendance data:", error)
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async (franchiseId: string | null) => {
    try {
      let employeeQuery = supabase
        .from("users")
        .select("id, name, email, role, franchise_id")
        .in("role", ["staff", "franchise_admin"])

      if (franchiseId) {
        employeeQuery = employeeQuery.eq("franchise_id", franchiseId)
      }

      const { data: employeeData, error: employeeError } = await employeeQuery

      if (employeeError) {
        console.error("[v0] Error fetching employees:", employeeError)
        return
      }

      const transformedEmployees: Employee[] = (employeeData || []).map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        employee_id: emp.id.slice(-6).toUpperCase(),
        role: emp.role,
        franchise_id: emp.franchise_id,
      }))

      setEmployees(transformedEmployees)
      console.log("[v0] Employees loaded:", transformedEmployees.length)
    } catch (error) {
      console.error("[v0] Error loading employees:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "half_day":
        return "bg-blue-100 text-blue-800"
      case "on_leave":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "half_day":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "on_leave":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const monthLabel = (ym: string) => {
    const [y,m] = ym.split('-').map(Number)
    return new Date(y, m-1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  const changeMonth = (delta:number) => {
    const [y,m] = historyMonth.split('-').map(Number)
    const d = new Date(y, m-1+delta, 1)
    // Avoid timezone shift by constructing string manually instead of toISOString()
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    setHistoryMonth(ym)
  }

  const filteredRecords = attendanceRecords.filter(
    (record) =>
      (record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (employeeFilter === 'all' || record.user_id === employeeFilter) &&
      (statusFilter.length === 0 || statusFilter.includes(record.status))
  )

  const handleMarkAttendance = async () => {
    try {
      if (submitting) return
      setSubmitting(true)
      if (!selectedEmployee || !attendanceStatus) {
        toast.error("Please select employee and status")
        return
      }

      // Prevent future date entries
      const todayISO = new Date().toISOString().split("T")[0]
      if (selectedDate > todayISO) {
        toast.error("Cannot mark attendance for a future date")
        return
      }

      // Time validation (if both provided)
      if (checkInTime && checkOutTime && checkOutTime <= checkInTime) {
        toast.error("Check-out time must be after check-in time")
        return
      }

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        toast.error("Please login to mark attendance")
        return
      }

      const selectedEmployeeData = employees.find((emp) => emp.id === selectedEmployee)
      if (!selectedEmployeeData) {
        toast.error("Selected employee not found")
        return
      }

      const franchiseId =
        currentUser.role === "super_admin" ? selectedEmployeeData.franchise_id : currentUser.franchise_id

      if (!franchiseId) {
        toast.error("Unable to determine franchise for attendance record")
        return
      }

      // Check if attendance already exists for this date
      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", selectedEmployee)
        .eq("date", selectedDate)
        .maybeSingle()

      const attendanceData = {
        user_id: selectedEmployee,
        franchise_id: franchiseId,
        date: selectedDate,
        status: attendanceStatus,
        check_in_time: checkInTime ? `${selectedDate}T${checkInTime}:00` : null,
        check_out_time: checkOutTime ? `${selectedDate}T${checkOutTime}:00` : null,
        updated_at: new Date().toISOString(),
      }

      if (existingRecord?.id) {
        const { error } = await supabase.from("attendance_records").update(attendanceData).eq("id", existingRecord.id)
        if (error) throw error
        toast.success("Attendance updated successfully")
      } else {
        const { error } = await supabase.from("attendance_records").insert([attendanceData])
        if (error) throw error
        toast.success("Attendance marked successfully")
      }

      setShowMarkDialog(false)
      setSelectedEmployee("")
      setAttendanceStatus("present")
      setCheckInTime("")
      setCheckOutTime("")
      await loadAttendanceData()
    } catch (error: any) {
      console.error("[v0] Error marking attendance:", error)
      toast.error(error?.message || "Failed to mark attendance")
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportReport = () => {
    try {
      const csvContent = [
        ["Employee Name", "Employee ID", "Date", "Check In", "Check Out", "Total Hours", "Status", "Overtime"],
        ...filteredRecords.map((record) => [
          record.employee_name,
          record.employee_id,
          record.date,
          record.check_in || "-",
          record.check_out || "-",
          record.total_hours ? `${record.total_hours}h` : "-",
            record.status.replace("_", " "),
          record.overtime_hours ? `${record.overtime_hours}h` : "-",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance-report-${selectedDate}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("CSV exported", { description: "Attendance CSV downloaded" })
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
      toast.error("Failed to export report")
    }
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(16)
      doc.text('Attendance Report', 14, 14)
      doc.setFontSize(10)
      doc.text(`Date: ${selectedDate}`, 14, 22)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Records: ${filteredRecords.length}`, 14, 34)

      const tableBody = filteredRecords.map(r => [
        r.employee_name,
        r.employee_id,
        r.check_in || '-',
        r.check_out || '-',
        r.total_hours ? `${r.total_hours}h` : '-',
        r.status.replace('_',' '),
        r.overtime_hours ? `${r.overtime_hours}h` : '-',
      ])

      autoTable(doc, {
        startY: 40,
        head: [["Employee", "ID", "In", "Out", "Hours", "Status", "Overtime"]],
        body: tableBody,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 163, 74] }, // Tailwind green-600
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 5)
        },
      })

      doc.save(`attendance-${selectedDate}.pdf`)
      toast.success('PDF exported', { description: 'Styled PDF downloaded' })
    } catch (e) {
      console.error('[v0] PDF export error', e)
      toast.error('Failed to export PDF')
    }
  }

  const handleQuickCheckIn = async (employeeId: string, employeeName: string) => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const employeeData = employees.find((emp) => emp.id === employeeId)
      if (!employeeData) {
        toast.error("Employee not found")
        return
      }

      const franchiseId = currentUser.role === "super_admin" ? employeeData.franchise_id : currentUser.franchise_id

      if (!franchiseId) {
        toast.error("Unable to determine franchise for attendance record")
        return
      }

      const now = new Date()
      const { error } = await supabase.from("attendance_records").upsert({
        user_id: employeeId,
        franchise_id: franchiseId, // Use the determined franchise_id
        date: selectedDate,
        check_in_time: now.toISOString(),
        status: "present",
      })

      if (error) throw error

      toast.success(`Check-in recorded for ${employeeName}`, {
        description: `Time: ${now.toLocaleTimeString()}`,
      })

      await loadAttendanceData()
    } catch (error) {
      console.error("[v0] Error recording check-in:", error)
      toast.error("Failed to record check-in")
    }
  }

  const handleQuickCheckOut = async (employeeId: string, employeeName: string) => {
    try {
      const now = new Date()
      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: now.toISOString(),
        })
        .eq("user_id", employeeId)
        .eq("date", selectedDate)

      if (error) throw error

      toast.success(`Check-out recorded for ${employeeName}`, {
        description: `Time: ${now.toLocaleTimeString()}`,
      })

      await loadAttendanceData()
    } catch (error) {
      console.error("[v0] Error recording check-out:", error)
      toast.error("Failed to record check-out")
    }
  }

  const applyPreset = (preset: string) => {
    const today = new Date()
    const format = (d: Date) => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setRangeMode('single')
      setStartDate(null)
      setEndDate(null)
      setSelectedDate(format(today))
    } else if (preset === '7d') {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      setRangeMode('range')
      setStartDate(format(start))
      setEndDate(format(today))
    } else if (preset === '30d') {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      setRangeMode('range')
      setStartDate(format(start))
      setEndDate(format(today))
    }
  }

  const handleDeleteRecord = async (record: AttendanceRecord) => {
    setRecordPendingDelete(record)
    setShowDeleteDialog(true)
  }

  const confirmDeleteRecord = async () => {
    if (!recordPendingDelete) return
    try {
      const { error } = await supabase.from('attendance_records').delete().eq('id', recordPendingDelete.id)
      if (error) throw error
      toast.success('Attendance deleted')
      setShowDeleteDialog(false)
      setRecordPendingDelete(null)
      await loadAttendanceData()
    } catch (e:any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  const startEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setSelectedEmployee(record.user_id)
    setAttendanceStatus(record.status)
    // Convert 24h displayed string back to 24h input; record.check_in already HH:MM string
    setCheckInTime(record.check_in ? record.check_in : '')
    setCheckOutTime(record.check_out ? record.check_out : '')
    setShowMarkDialog(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
            <p className="text-muted-foreground">Track employee attendance, working hours, and time management</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center justify-end">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Employee Attendance</DialogTitle>
                  <DialogDescription>Record attendance for employees on {selectedDate}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="employee" className="text-right">
                      Employee
                    </Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000]">
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select value={attendanceStatus} onValueChange={(value: any) => setAttendanceStatus(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[1000]">
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="checkin" className="text-right">
                      Check In
                    </Label>
                    <Input
                      id="checkin"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="col-span-3 hidden"
                    />
                    <div className="col-span-3">
                      <TimePicker value={checkInTime} onChange={setCheckInTime} order="AM_FIRST" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="checkout" className="text-right">
                      Check Out
                    </Label>
                    <Input
                      id="checkout"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="col-span-3 hidden"
                    />
                    <div className="col-span-3">
                      <TimePicker value={checkOutTime} onChange={setCheckOutTime} order="AM_FIRST" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={submitting} onClick={handleMarkAttendance}>{submitting ? 'Saving...' : 'Mark Attendance'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_employees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present_today}</div>
              <p className="text-xs text-muted-foreground">On time & working</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent_today}</div>
              <p className="text-xs text-muted-foreground">Not present</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late_today}</div>
              <p className="text-xs text-muted-foreground">Late arrivals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_hours}h</div>
              <p className="text-xs text-muted-foreground">Daily average</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Employee attendance records and time tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 flex-wrap">
              {/* History / Presets Block (moved from header) */}
              <div className="flex items-center gap-2">
                <Button variant={historyMode ? 'default':'outline'} size="sm" onClick={()=>setHistoryMode(h=>!h)}>
                  {historyMode ? 'History View' : 'History'}
                </Button>
                {historyMode ? (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={()=>changeMonth(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-40 text-center">{monthLabel(historyMonth)}</span>
                    <Button variant="outline" size="icon" onClick={()=>changeMonth(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('today')}>Today</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('7d')}>Last 7d</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('30d')}>30d</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setRangeMode(r => r === 'range' ? 'single':'range')}>
                      {rangeMode === 'range' ? 'Single Day' : 'Range'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              {!historyMode && (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={rangeMode === 'single' ? 'w-40' : 'w-40 hidden'}
                />
              )}
              {!historyMode && rangeMode === 'range' && (
                <div className="flex gap-2">
                  <Input type="date" value={startDate || ''} onChange={(e)=>setStartDate(e.target.value)} />
                  <Input type="date" value={endDate || ''} onChange={(e)=>setEndDate(e.target.value)} />
                </div>
              )}
              <div className="min-w-[180px]">
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] max-h-72">
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[200px] flex items-center gap-1 flex-wrap">
                {['present','late','absent','half_day','on_leave'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={()=> setStatusFilter(prev => prev.includes(st) ? prev.filter(x=>x!==st) : [...prev, st])}
                    className={`px-2 py-1 rounded border text-xs ${statusFilter.includes(st) ? 'bg-primary text-primary-foreground border-primary':'hover:bg-accent'}`}
                  >
                    {st.replace('_',' ')}
                  </button>
                ))}
                {statusFilter.length > 0 && (
                  <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-accent" onClick={()=>setStatusFilter([])}>Clear</button>
                )}
              </div>
            </div>

            {/* Attendance Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No attendance records found for {selectedDate}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <div>
                            <div className="font-medium">{record.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{record.employee_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.check_in || "-"}</TableCell>
                      <TableCell>{record.check_out || "-"}</TableCell>
                      <TableCell>{record.total_hours ? `${record.total_hours}h` : "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>{record.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{record.overtime_hours ? `${record.overtime_hours}h` : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!record.check_in && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickCheckIn(record.user_id, record.employee_name)}
                            >
                              <LogIn className="h-3 w-3" />
                            </Button>
                          )}
                          {record.check_in && !record.check_out && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickCheckOut(record.user_id, record.employee_name)}
                            >
                              <LogOut className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => startEditRecord(record)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRecord(record)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={(o)=>{ if(!o){ setShowDeleteDialog(false); setRecordPendingDelete(null);} }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              {recordPendingDelete ? `Delete attendance for ${recordPendingDelete.employee_name} on ${recordPendingDelete.date}? This action cannot be undone.` : 'No record selected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRecord}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
