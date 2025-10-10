"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DollarSign,
  Users,
  Calendar,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Calculator,
  Info,
  Clock,
  Minus,
  CreditCard,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PayrollStats {
  total_employees: number
  total_payroll: number
  pending_payments: number
  processed_this_month: number
}

interface PayrollRecord {
  id: string
  user_id: string
  employee_name: string
  employee_id: string
  position: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  payroll_month: string
  overtime_hours?: number
  overtime_amount?: number
  bonus?: number
  salary_cuts?: number
  advance_salary?: number
}

interface PayrollAdjustment {
  employee_id: string
  employee_name: string
  type: "extra_salary" | "overtime" | "salary_cut" | "advance"
  amount: number
  hours?: number
  reason: string
  date: string
}

export default function PayrollPage() {
  const [stats, setStats] = useState<PayrollStats>({
    total_employees: 0,
    total_payroll: 0,
    pending_payments: 0,
    processed_this_month: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([])
  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [selectedEmployee, setSelectedEmployee] = useState<PayrollRecord | null>(null)
  const [extraSalaryDialog, setExtraSalaryDialog] = useState(false)
  const [overtimeDialog, setOvertimeDialog] = useState(false)
  const [salaryCutDialog, setSalaryCutDialog] = useState(false)
  const [advanceSalaryDialog, setAdvanceSalaryDialog] = useState(false)

  const [adjustmentForm, setAdjustmentForm] = useState({
    amount: "",
    hours: "",
    reason: "",
    type: "" as "extra_salary" | "overtime" | "salary_cut" | "advance",
  })

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [viewPayslipDialog, setViewPayslipDialog] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)

  const [editPayrollDialog, setEditPayrollDialog] = useState(false)
  const [selectedEditRecord, setSelectedEditRecord] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    basic_salary: 0,
    hra: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    overtime_amount: 0,
    bonus: 0,
    other_allowances: 0,
    pf_deduction: 0,
    esi_deduction: 0,
    tax_deduction: 0,
    loan_deduction: 0,
    other_deductions: 0,
    working_days: 30,
    present_days: 30,
    overtime_hours: 0,
  })

  const loadPayrollData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading payroll data...")

      const user = await getCurrentUser()
      setCurrentUser(user)
      console.log("[v0] Current user:", user?.name, "role:", user?.role, "franchise:", user?.franchise_id)

      // Determine franchise filter
      const franchiseFilter = user?.role === "super_admin" ? null : user?.franchise_id

      let employeeQuery = supabase.from("employee_profiles").select(`
          id,
          user_id,
          employee_id,
          department,
          designation,
          basic_salary,
          hra,
          transport_allowance,
          medical_allowance,
          other_allowances,
          pf_deduction,
          esi_deduction,
          tax_deduction,
          other_deductions,
          users!user_id(name, email, franchise_id)
        `)

      if (franchiseFilter) {
        // Filter by franchise through the users table
        employeeQuery = employeeQuery.eq("users.franchise_id", franchiseFilter)
      }

      const { data: employeesData, error: employeeError } = await employeeQuery

      if (employeeError) {
        console.error("[v0] Error fetching from employee_profiles:", employeeError)
      }

      console.log("[v0] Employee profiles loaded:", employeesData?.length || 0)

      let employees: any[] = []

      if (!employeesData || employeesData.length === 0) {
        console.log("[v0] No employee profiles found, fetching from users table...")

        let usersQuery = supabase
          .from("users")
          .select(`
          id,
          name,
          email,
          phone,
          role,
          franchise_id
        `)
          .neq("role", "super_admin") // Exclude super admin from payroll

        if (franchiseFilter) {
          usersQuery = usersQuery.eq("franchise_id", franchiseFilter)
        }

        const { data: usersData, error: usersError } = await usersQuery

        if (usersError) {
          console.error("[v0] Error fetching users:", usersError)
          toast.error("Failed to load employee data")
          return
        }

        console.log("[v0] Users loaded as employees:", usersData?.length || 0)

        // Transform users to employee format
  employees = (usersData || []).map((user: any) => ({
          id: user.id,
          user_id: user.id,
          employee_id: user.id.slice(0, 8), // Use first 8 chars of UUID as employee ID
          department: "General",
          designation: user.role === "franchise_admin" ? "Manager" : "Staff",
          basic_salary: user.role === "franchise_admin" ? 50000 : 25000, // Default salaries
          hra: user.role === "franchise_admin" ? 15000 : 7500,
          transport_allowance: 3000,
          medical_allowance: 2000,
          other_allowances: 1000,
          pf_deduction: user.role === "franchise_admin" ? 6000 : 3000,
          esi_deduction: 500,
          tax_deduction: user.role === "franchise_admin" ? 5000 : 2000,
          other_deductions: 0,
          users: {
            name: user.name,
            email: user.email,
            franchise_id: user.franchise_id,
          },
        }))
      } else {
        employees = employeesData
      }

      console.log("[v0] Final employees loaded:", employees?.length || 0)

      const attendanceMonth = selectedMonth + "-01"
      let attendanceQuery = supabase
        .from("attendance_records")
        .select(`
        id,
        user_id,
        date,
        check_in_time,
        check_out_time,
        total_hours,
        overtime_hours,
        status,
        users!user_id(name, email, franchise_id)
      `)
        .gte("date", attendanceMonth)
        .lt(
          "date",
          new Date(new Date(attendanceMonth).getFullYear(), new Date(attendanceMonth).getMonth() + 1, 1)
            .toISOString()
            .slice(0, 10),
        )

      if (franchiseFilter) {
        attendanceQuery = attendanceQuery.eq("franchise_id", franchiseFilter)
      }

      const { data: attendanceRecords, error: attendanceError } = await attendanceQuery
      if (attendanceError) {
        console.error("[v0] Error fetching attendance:", attendanceError)
      } else {
        setAttendanceData(attendanceRecords || [])
        console.log("[v0] Attendance records loaded:", attendanceRecords?.length || 0)
      }

      const payrollMonth = selectedMonth + "-01"

      let payrollQuery = supabase
        .from("payroll_records")
        .select(`
        id,
        user_id,
        payroll_month,
        basic_salary,
        hra,
        transport_allowance,
        medical_allowance,
        overtime_amount,
        bonus,
        other_allowances,
        gross_salary,
        pf_deduction,
        esi_deduction,
        tax_deduction,
        loan_deduction,
        other_deductions,
        total_deductions,
        net_salary,
        working_days,
        present_days,
        absent_days,
        leave_days,
        overtime_hours,
        status,
        payment_date,
        users!user_id(name, email, franchise_id)
      `)
        .eq("payroll_month", payrollMonth)

      if (franchiseFilter) {
        payrollQuery = payrollQuery.eq("franchise_id", franchiseFilter)
      }

      const { data: payrollRecords, error: payrollError } = await payrollQuery

      if (payrollError) {
        console.error("[v0] Error fetching payroll records:", payrollError)
        // Don't return here, continue with employee data
      }

      console.log("[v0] Payroll records loaded:", payrollRecords?.length || 0)

      // Transform data for display
      const transformedRecords: PayrollRecord[] = employees.map((emp: any) => {
        const payrollRecord = payrollRecords?.find((pr: any) => pr.user_id === emp.user_id)
        const totalAllowances =
          (emp.hra || 0) +
          (emp.transport_allowance || 0) +
          (emp.medical_allowance || 0) +
          (emp.other_allowances || 0) +
          (payrollRecord?.overtime_amount || 0) +
          (payrollRecord?.bonus || 0)
        const totalDeductions =
          (emp.pf_deduction || 0) +
          (emp.esi_deduction || 0) +
          (emp.tax_deduction || 0) +
          (emp.other_deductions || 0) +
          (payrollRecord?.loan_deduction || 0)

        const currentMonth = selectedMonth + "-01"

        return {
          id: payrollRecord?.id || emp.id,
          user_id: emp.user_id,
          employee_name: emp.users?.name || "Unknown",
          employee_id: emp.employee_id || "N/A",
          position: emp.designation || emp.department || "N/A",
          basic_salary: payrollRecord?.basic_salary || emp.basic_salary || 0,
          allowances: payrollRecord
            ? payrollRecord.hra +
              payrollRecord.transport_allowance +
              payrollRecord.medical_allowance +
              payrollRecord.overtime_amount +
              payrollRecord.bonus +
              payrollRecord.other_allowances
            : totalAllowances,
          deductions: payrollRecord?.total_deductions || totalDeductions,
          net_salary: payrollRecord?.net_salary || (emp.basic_salary || 0) + totalAllowances - totalDeductions,
          status: payrollRecord?.status || "pending",
          payroll_month: currentMonth,
          working_days: payrollRecord?.working_days || 30,
          present_days: payrollRecord?.present_days || 30,
          overtime_hours: payrollRecord?.overtime_hours || 0,
        }
      })

      setAllRecords(transformedRecords)
      setFilteredRecords(transformedRecords)

      // Calculate stats
      const totalEmployees = transformedRecords.length
      const totalPayroll = transformedRecords.reduce((sum, record) => sum + record.net_salary, 0)
      const pendingPayments = transformedRecords.filter((r) => r.status === "pending" || r.status === "draft").length
      const processedThisMonth = transformedRecords.filter(
        (r) => r.status === "processed" || r.status === "paid",
      ).length

      setStats({
        total_employees: totalEmployees,
        total_payroll: totalPayroll,
        pending_payments: pendingPayments,
        processed_this_month: processedThisMonth,
      })

      console.log("[v0] Payroll stats calculated:", {
        totalEmployees,
        totalPayroll,
        pendingPayments,
        processedThisMonth,
      })
    } catch (error) {
      console.error("[v0] Error loading payroll data:", error)
      toast.error("Failed to load payroll data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!allRecords.length) return

    let filtered = allRecords

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.position.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((record) => record.status.toLowerCase() === selectedStatus.toLowerCase())
    }

    setFilteredRecords(filtered)
  }, [searchTerm, selectedStatus, allRecords])

  const handleExportPayroll = async (format: 'csv' | 'pdf' = 'csv') => {
    if (filteredRecords.length === 0) {
      toast.error('No payroll data to export')
      return
    }
    if (format === 'csv') {
      const csvContent = [
        ['Employee Name','Employee ID','Position','Basic Salary','Allowances','Deductions','Net Salary','Status'],
        ...filteredRecords.map(record => [
          record.employee_name,
          record.employee_id,
          record.position,
          record.basic_salary,
          record.allowances,
          record.deductions,
          record.net_salary,
          record.status
        ])
      ].map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-${new Date().toISOString().slice(0,7)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Payroll CSV exported')
    } else {
      // Fetch company settings for branding
      let companyName = 'Company'
      let companyPhone = ''
      let companyEmail = ''
      let logoUrl: string | null = null
      try {
        const res = await fetch('/api/company-settings')
        if (res.ok) {
          const json = await res.json()
          companyName = json?.company_name || companyName
          companyPhone = json?.phone || ''
          companyEmail = json?.email || ''
          logoUrl = json?.logo_url || null
        }
      } catch (e) { /* non-blocking */ }

      const doc = new jsPDF({ orientation: 'landscape' })
      // Optionally add logo if accessible (will require CORS or same-origin)
      if (logoUrl) {
        try {
          const imgResp = await fetch(logoUrl)
          const blob = await imgResp.blob()
          const reader = new FileReader()
          const dataUrl: string = await new Promise((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(blob) })
          doc.addImage(dataUrl, 'PNG', 14, 8, 22, 22)
        } catch { /* ignore logo errors */ }
      }
      doc.setFontSize(18)
      doc.text(`${companyName} - Payroll Summary`, logoUrl ? 40 : 14, 16)
      doc.setFontSize(10)
      doc.text(`Month: ${new Date().toISOString().slice(0,7)}`, logoUrl ? 40 : 14, 22)
      doc.text(`Generated: ${new Date().toLocaleString()}`, logoUrl ? 40 : 14, 28)
      if (companyPhone || companyEmail) {
        doc.text(`Contact: ${[companyPhone, companyEmail].filter(Boolean).join(' | ')}`, logoUrl ? 40 : 14, 34)
      }
      autoTable(doc, {
        startY: companyPhone || companyEmail ? 40 : 36,
        head: [['Employee','ID','Position','Basic','Allowances','Deductions','Net','Status']],
        body: filteredRecords.map(r => [
          r.employee_name,
          r.employee_id,
          r.position,
          r.basic_salary,
          r.allowances,
          r.deductions,
          r.net_salary,
          r.status
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
        alternateRowStyles: { fillColor: [245,245,245] },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(`Page ${data.pageNumber} / ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 5)
          // Signature placeholder
          const sigY = doc.internal.pageSize.height - 20
          doc.text('Authorised Signature: ________________________', data.settings.margin.left + 90, sigY)
        }
      })
      doc.save(`payroll-${new Date().toISOString().slice(0,7)}.pdf`)
      toast.success('Payroll PDF exported')
    }
  }
  const [processing, setProcessing] = useState(false)
  const [showProcessConfirm, setShowProcessConfirm] = useState(false)
  const [pendingReprocessCount, setPendingReprocessCount] = useState<number>(0)

  const handleProcessPayroll = async () => {
    try {
      setProcessing(true)
      console.log("[v0] Starting payroll processing with attendance integration...")

      const user = await getCurrentUser()
      setCurrentUser(user)
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const payrollMonth = selectedMonth + "-01"

      const { data: existingPayroll, error: checkError } = await supabase
        .from("payroll_records")
        .select("user_id, id")
        .eq("payroll_month", payrollMonth)

      if (checkError) {
        console.error("[v0] Error checking existing payroll:", checkError)
        toast.error("Failed to check existing payroll records")
        return
      }

  const existingUserIds = existingPayroll?.map((record: any) => record.user_id) || []
      console.log("[v0] Found existing payroll records for", existingUserIds.length, "employees")

      if (existingUserIds.length > 0) {
        // trigger custom confirmation flow
        setPendingReprocessCount(existingUserIds.length)
        setShowProcessConfirm(true)
        return
      }

      const employees = allRecords.map((record) => ({
        user_id: record.user_id,
        basic_salary: record.basic_salary,
        hra: record.allowances * 0.4, // Approximate HRA from allowances
        transport_allowance: record.allowances * 0.2,
        medical_allowance: record.allowances * 0.2,
        other_allowances: record.allowances * 0.2,
        pf_deduction: record.deductions * 0.4,
        esi_deduction: record.deductions * 0.1,
        tax_deduction: record.deductions * 0.4,
        other_deductions: record.deductions * 0.1,
        users: {
          name: record.employee_name,
        },
      }))

      let successCount = 0
      let errorCount = 0

      for (const employee of employees) {
        try {
          // Get attendance data for this employee
          const employeeAttendance = attendanceData.filter((record) => record.user_id === employee.user_id)
          const presentDays = employeeAttendance.filter((record) => record.status === "present").length
          const totalWorkingDays = new Date(
            new Date(payrollMonth).getFullYear(),
            new Date(payrollMonth).getMonth() + 1,
            0,
          ).getDate()
          const absentDays = totalWorkingDays - presentDays
          const totalOvertimeHours = employeeAttendance.reduce((sum, record) => sum + (record.overtime_hours || 0), 0)

          // Calculate salary based on attendance
          const dailySalary = employee.basic_salary / totalWorkingDays
          const attendanceBasedSalary = dailySalary * presentDays
          const overtimeRate = employee.basic_salary / (totalWorkingDays * 8) // Assuming 8 hours per day
          const overtimeAmount = totalOvertimeHours * overtimeRate * 1.5 // 1.5x for overtime

          // Check for advance salary
          const { data: advanceRecords } = await supabase
            .from("payroll_records")
            .select("bonus, other_allowances")
            .eq("user_id", employee.user_id)
            .eq("status", "advance")
            .gte("payroll_month", payrollMonth)

          const advanceAmount =
            advanceRecords?.reduce((sum: any, record: any) => sum + (record.bonus || 0) + (record.other_allowances || 0), 0) || 0

          const grossSalary =
            attendanceBasedSalary +
            employee.hra +
            employee.transport_allowance +
            employee.medical_allowance +
            overtimeAmount
          const totalDeductions =
            employee.pf_deduction +
            employee.esi_deduction +
            employee.tax_deduction +
            employee.other_deductions +
            advanceAmount
          const netSalary = grossSalary - totalDeductions

          let franchiseId = user?.franchise_id

          if (!franchiseId && user?.role === "super_admin") {
            // For Super Admin, get the franchise_id from the original employee data
            const employeeData = allRecords.find((emp) => emp.user_id === employee.user_id)

            if (employeeData) {
              // Try to get franchise_id from the employee's user data
              const { data: userData } = await supabase
                .from("users")
                .select("franchise_id")
                .eq("id", employee.user_id)
                .single()

              franchiseId = userData?.franchise_id
            }
          }

          if (!franchiseId) {
            console.log(
              "[v0] No franchise_id found for employee:",
              employee.users?.name,
              "- assigning to default franchise",
            )
            const { data: defaultFranchise } = await supabase.from("franchises").select("id").limit(1).single()

            franchiseId = defaultFranchise?.id
          }

          if (!franchiseId) {
            console.error("[v0] No franchise_id available for employee:", employee.users?.name)
            toast.error(`Cannot process payroll for ${employee.users?.name}: No franchise assigned`)
            errorCount++
            continue
          }

          console.log("[v0] Processing payroll for", employee.users?.name, "with franchise_id:", franchiseId)

          const payrollData = {
            user_id: employee.user_id,
            franchise_id: franchiseId,
            payroll_month: payrollMonth,
            basic_salary: attendanceBasedSalary,
            hra: employee.hra,
            transport_allowance: employee.transport_allowance,
            medical_allowance: employee.medical_allowance,
            overtime_amount: overtimeAmount,
            bonus: employee.other_allowances || 0,
            other_allowances: employee.other_allowances || 0,
            gross_salary: grossSalary,
            pf_deduction: employee.pf_deduction,
            esi_deduction: employee.esi_deduction,
            tax_deduction: employee.tax_deduction,
            loan_deduction: 0,
            other_deductions: employee.other_deductions,
            total_deductions: totalDeductions,
            net_salary: netSalary,
            working_days: totalWorkingDays,
            present_days: presentDays,
            absent_days: absentDays,
            leave_days: 0,
            overtime_hours: totalOvertimeHours,
            status: "processed",
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "bank_transfer",
            generated_by: user.id,
            processed_by: user.id,
          }

          const isExistingEmployee = existingUserIds.includes(employee.user_id)

          let error
          if (isExistingEmployee) {
            // Update existing record
            const result = await supabase
              .from("payroll_records")
              .update(payrollData)
              .eq("user_id", employee.user_id)
              .eq("payroll_month", payrollMonth)
            error = result.error
          } else {
            // Insert new record
            const result = await supabase.from("payroll_records").insert([payrollData])
            error = result.error
          }

          if (error) {
            console.error("[v0] Error processing payroll for", employee.users?.name, error.message)
            toast.error(`Failed to process payroll for ${employee.users?.name}: ${error.message}`)
            errorCount++
          } else {
            console.log("[v0] Successfully processed payroll for", employee.users?.name)
            successCount++
          }
        } catch (employeeError) {
          console.error(`[v0] Error processing payroll for ${employee.users?.name}:`, employeeError)
          toast.error(`Failed to process payroll for ${employee.users?.name}`)
          errorCount++
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast.success(`Payroll processed successfully for ${successCount} employees with attendance integration!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Payroll processed for ${successCount} employees, but ${errorCount} failed`)
      } else if (errorCount > 0) {
        toast.error(`Failed to process payroll for ${errorCount} employees`)
      }

      await loadPayrollData()
    } catch (error) {
      console.error("[v0] Error processing payroll:", error)
      toast.error("Failed to process payroll")
    } finally {
      setProcessing(false)
    }
  }

  // Proceed with payroll processing (with optional overwrite of existing records)
  const proceedPayrollProcessing = async (overwrite: boolean = false) => {
    try {
      setProcessing(true)
      console.log('[v0] Proceeding with payroll processing. Overwrite =', overwrite)

      const user = await getCurrentUser()
      setCurrentUser(user)
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      const payrollMonth = selectedMonth + '-01'

      // Fetch existing payroll for this month
      const { data: existingPayroll, error: checkError } = await supabase
        .from('payroll_records')
        .select('user_id, id')
        .eq('payroll_month', payrollMonth)

      if (checkError) {
        console.error('[v0] Error checking existing payroll:', checkError)
        toast.error('Failed to check existing payroll records')
        return
      }

      const existingUserIds = existingPayroll?.map((r: any) => r.user_id) || []
      console.log('[v0] Existing payroll records:', existingUserIds.length)

      if (existingUserIds.length > 0 && !overwrite) {
        // If not overwriting, show confirm dialog again (fallback safety)
        setPendingReprocessCount(existingUserIds.length)
        setShowProcessConfirm(true)
        return
      }

      const employees = allRecords.map((record) => ({
        user_id: record.user_id,
        basic_salary: record.basic_salary,
        hra: record.allowances * 0.4,
        transport_allowance: record.allowances * 0.2,
        medical_allowance: record.allowances * 0.2,
        other_allowances: record.allowances * 0.2,
        pf_deduction: record.deductions * 0.4,
        esi_deduction: record.deductions * 0.1,
        tax_deduction: record.deductions * 0.4,
        other_deductions: record.deductions * 0.1,
        users: { name: record.employee_name },
      }))

      let successCount = 0
      let errorCount = 0

      for (const employee of employees) {
        try {
          const employeeAttendance = attendanceData.filter((rec) => rec.user_id === employee.user_id)
          const presentDays = employeeAttendance.filter((rec) => rec.status === 'present').length
          const totalWorkingDays = new Date(new Date(payrollMonth).getFullYear(), new Date(payrollMonth).getMonth() + 1, 0).getDate()
          const absentDays = totalWorkingDays - presentDays
          const totalOvertimeHours = employeeAttendance.reduce((sum, rec) => sum + (rec.overtime_hours || 0), 0)

          const dailySalary = employee.basic_salary / totalWorkingDays
          const attendanceBasedSalary = dailySalary * presentDays
          const overtimeRate = employee.basic_salary / (totalWorkingDays * 8)
          const overtimeAmount = totalOvertimeHours * overtimeRate * 1.5

          const { data: advanceRecords } = await supabase
            .from('payroll_records')
            .select('bonus, other_allowances')
            .eq('user_id', employee.user_id)
            .eq('status', 'advance')
            .gte('payroll_month', payrollMonth)

          const advanceAmount =
            advanceRecords?.reduce((sum: any, r: any) => sum + (r.bonus || 0) + (r.other_allowances || 0), 0) || 0

          const grossSalary = attendanceBasedSalary + employee.hra + employee.transport_allowance + employee.medical_allowance + overtimeAmount
          const totalDeductions = employee.pf_deduction + employee.esi_deduction + employee.tax_deduction + employee.other_deductions + advanceAmount
          const netSalary = grossSalary - totalDeductions

          let franchiseId = user?.franchise_id
          if (!franchiseId && user?.role === 'super_admin') {
            const { data: userData } = await supabase.from('users').select('franchise_id').eq('id', employee.user_id).single()
            franchiseId = userData?.franchise_id
          }
          if (!franchiseId) {
            const { data: defaultFranchise } = await supabase.from('franchises').select('id').limit(1).single()
            franchiseId = defaultFranchise?.id
          }
          if (!franchiseId) {
            console.error('[v0] No franchise_id available for employee:', employee.users?.name)
            toast.error(`Cannot process payroll for ${employee.users?.name}: No franchise assigned`)
            errorCount++
            continue
          }

          const payrollData = {
            user_id: employee.user_id,
            franchise_id: franchiseId,
            payroll_month: payrollMonth,
            basic_salary: attendanceBasedSalary,
            hra: employee.hra,
            transport_allowance: employee.transport_allowance,
            medical_allowance: employee.medical_allowance,
            overtime_amount: overtimeAmount,
            bonus: employee.other_allowances || 0,
            other_allowances: employee.other_allowances || 0,
            gross_salary: grossSalary,
            pf_deduction: employee.pf_deduction,
            esi_deduction: employee.esi_deduction,
            tax_deduction: employee.tax_deduction,
            loan_deduction: 0,
            other_deductions: employee.other_deductions,
            total_deductions: totalDeductions,
            net_salary: netSalary,
            working_days: totalWorkingDays,
            present_days: presentDays,
            absent_days: absentDays,
            leave_days: 0,
            overtime_hours: totalOvertimeHours,
            status: 'processed',
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'bank_transfer',
            generated_by: user.id,
            processed_by: user.id,
          }

          const isExistingEmployee = existingUserIds.includes(employee.user_id)
          let error
          if (isExistingEmployee) {
            const result = await supabase
              .from('payroll_records')
              .update(payrollData)
              .eq('user_id', employee.user_id)
              .eq('payroll_month', payrollMonth)
            error = result.error
          } else {
            const result = await supabase.from('payroll_records').insert([payrollData])
            error = result.error
          }
          if (error) {
            console.error('[v0] Error processing payroll for', employee.users?.name, error.message)
            toast.error(`Failed to process payroll for ${employee.users?.name}: ${error.message}`)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error('[v0] Error processing payroll for', employee.users?.name, err)
          toast.error(`Failed to process payroll for ${employee.users?.name}`)
          errorCount++
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast.success(`Payroll processed successfully for ${successCount} employees with attendance integration!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Payroll processed for ${successCount} employees, but ${errorCount} failed`)
      } else if (errorCount > 0) {
        toast.error(`Failed to process payroll for ${errorCount} employees`)
      }

      await loadPayrollData()
    } catch (err) {
      console.error('[v0] Error in proceedPayrollProcessing:', err)
      toast.error('Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "processed":
        return "bg-green-100 text-green-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewPayslip = (record: any) => {
    setSelectedPayslip(record)
    setViewPayslipDialog(true)
  }

  const handleEditPayroll = (record: any) => {
    console.log("[v0] Opening edit dialog for:", record.employee_name)
    setSelectedEditRecord(record)
    setEditFormData({
      basic_salary: record.basic_salary || 0,
      hra: record.hra || 0,
      transport_allowance: record.transport_allowance || 0,
      medical_allowance: record.medical_allowance || 0,
      overtime_amount: record.overtime_amount || 0,
      bonus: record.bonus || 0,
      other_allowances: record.other_allowances || 0,
      pf_deduction: record.pf_deduction || 0,
      esi_deduction: record.esi_deduction || 0,
      tax_deduction: record.tax_deduction || 0,
      loan_deduction: record.loan_deduction || 0,
      other_deductions: record.other_deductions || 0,
      working_days: record.working_days || 30,
      present_days: record.present_days || 30,
      overtime_hours: record.overtime_hours || 0,
    })
    setEditPayrollDialog(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedEditRecord) return

    try {
      console.log("[v0] Updating payroll for:", selectedEditRecord.employee_name)

      // Calculate totals
      const grossSalary =
        editFormData.basic_salary +
        editFormData.hra +
        editFormData.transport_allowance +
        editFormData.medical_allowance +
        editFormData.overtime_amount +
        editFormData.bonus +
        editFormData.other_allowances

      const totalDeductions =
        editFormData.pf_deduction +
        editFormData.esi_deduction +
        editFormData.tax_deduction +
        editFormData.loan_deduction +
        editFormData.other_deductions

      const netSalary = grossSalary - totalDeductions

      const updateData = {
        ...editFormData,
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("payroll_records").update(updateData).eq("id", selectedEditRecord.id)

      if (error) {
        console.error("[v0] Error updating payroll:", error)
        toast.error("Failed to update payroll record")
        return
      }

      toast.success(`Payroll updated successfully for ${selectedEditRecord.employee_name}`)
      setEditPayrollDialog(false)
      setSelectedEditRecord(null)

      // Refresh the data
      loadPayrollData()
    } catch (error) {
      console.error("[v0] Error updating payroll:", error)
      toast.error("Failed to update payroll record")
    }
  }

  useEffect(() => {
    loadPayrollData()
  }, [selectedMonth]) // Added selectedMonth dependency

  const handlePayrollAdjustment = async (type: "extra_salary" | "overtime" | "salary_cut" | "advance") => {
    if (!selectedEmployee) return

    try {
      const amount = Number.parseFloat(adjustmentForm.amount)
      const hours = adjustmentForm.hours ? Number.parseFloat(adjustmentForm.hours) : 0

      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      if (type === "overtime" && (isNaN(hours) || hours <= 0)) {
        toast.error("Please enter valid overtime hours")
        return
      }

      if (!adjustmentForm.reason.trim()) {
        toast.error("Please provide a reason for this adjustment")
        return
      }

      // Calculate overtime amount if applicable
      let finalAmount = amount
      if (type === "overtime") {
        const hourlyRate = selectedEmployee.basic_salary / (30 * 8) // Assuming 30 days, 8 hours per day
        finalAmount = hours * hourlyRate * 1.5 // 1.5x overtime rate
      }

      // Update the payroll record in database
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01"

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      switch (type) {
        case "extra_salary":
          updateData.bonus = (selectedEmployee.bonus || 0) + finalAmount
          break
        case "overtime":
          updateData.overtime_hours = (selectedEmployee.overtime_hours || 0) + hours
          updateData.overtime_amount = (selectedEmployee.overtime_amount || 0) + finalAmount
          break
        case "salary_cut":
          updateData.other_deductions = (selectedEmployee.deductions || 0) + finalAmount
          break
        case "advance":
          updateData.loan_deduction = (selectedEmployee.advance_salary || 0) + finalAmount
          break
      }

      const { error } = await supabase
        .from("payroll_records")
        .update(updateData)
        .eq("user_id", selectedEmployee.user_id)
        .eq("payroll_month", currentMonth)

      if (error) {
        console.error("[v0] Error updating payroll:", error)
        toast.error("Failed to update payroll")
        return
      }

      // Reset form and close dialog
      setAdjustmentForm({ amount: "", hours: "", reason: "", type: "" as any })
      setExtraSalaryDialog(false)
      setOvertimeDialog(false)
      setSalaryCutDialog(false)
      setAdvanceSalaryDialog(false)
      setSelectedEmployee(null)

      toast.success(`${type.replace("_", " ").toUpperCase()} added successfully`)
      loadPayrollData() // Reload data
    } catch (error) {
      console.error("[v0] Error processing adjustment:", error)
      toast.error("Failed to process adjustment")
    }
  }

  const openAdjustmentDialog = (
    employee: PayrollRecord,
    type: "extra_salary" | "overtime" | "salary_cut" | "advance",
  ) => {
    setSelectedEmployee(employee)
    setAdjustmentForm({ amount: "", hours: "", reason: "", type })

    switch (type) {
      case "extra_salary":
        setExtraSalaryDialog(true)
        break
      case "overtime":
        setOvertimeDialog(true)
        break
      case "salary_cut":
        setSalaryCutDialog(true)
        break
      case "advance":
        setAdvanceSalaryDialog(true)
        break
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payroll data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleDownloadPayslip = (record: any) => {
    // Create HTML content for the payslip
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${record.employee_name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #333; }
          .payslip-title { font-size: 18px; margin-top: 5px; }
          .employee-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-section { flex: 1; }
          .info-title { font-weight: bold; color: #555; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .info-row { margin: 5px 0; }
          .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .salary-table th { background-color: #f5f5f5; font-weight: bold; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .net-salary { font-size: 18px; font-weight: bold; color: #2563eb; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Safawala CRM</div>
          <div class="payslip-title">Salary Slip</div>
        </div>
        
        <div class="employee-info">
          <div class="info-section">
            <div class="info-title">Employee Information</div>
            <div class="info-row"><strong>Name:</strong> ${record.employee_name}</div>
            <div class="info-row"><strong>Employee ID:</strong> ${record.user_id}</div>
            <div class="info-row"><strong>Month:</strong> ${new Date(record.payroll_month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          </div>
          <div class="info-section">
            <div class="info-title">Attendance Details</div>
            <div class="info-row"><strong>Working Days:</strong> ${record.working_days || 30}</div>
            <div class="info-row"><strong>Present Days:</strong> ${record.present_days || 30}</div>
            <div class="info-row"><strong>Overtime Hours:</strong> ${record.overtime_hours || 0}</div>
          </div>
        </div>

        <table class="salary-table">
          <thead>
            <tr>
              <th>Earnings</th>
              <th>Amount (₹)</th>
              <th>Deductions</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>${(record.basic_salary || 0).toLocaleString()}</td>
              <td>PF Deduction</td>
              <td>${(record.pf_deduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>HRA</td>
              <td>${(record.hra || 0).toLocaleString()}</td>
              <td>ESI Deduction</td>
              <td>${(record.esi_deduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Transport Allowance</td>
              <td>${(record.transport_allowance || 0).toLocaleString()}</td>
              <td>Tax Deduction</td>
              <td>${(record.tax_deduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Medical Allowance</td>
              <td>${(record.medical_allowance || 0).toLocaleString()}</td>
              <td>Loan Deduction</td>
              <td>${(record.loan_deduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Overtime Amount</td>
              <td>${(record.overtime_amount || 0).toLocaleString()}</td>
              <td>Other Deductions</td>
              <td>${(record.other_deductions || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Bonus</td>
              <td>${(record.bonus || 0).toLocaleString()}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>Other Allowances</td>
              <td>${(record.other_allowances || 0).toLocaleString()}</td>
              <td></td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td><strong>Gross Salary</strong></td>
              <td><strong>${(record.gross_salary || 0).toLocaleString()}</strong></td>
              <td><strong>Total Deductions</strong></td>
              <td><strong>${(record.total_deductions || 0).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <div class="net-salary">Net Salary: ₹${(record.net_salary || 0).toLocaleString()}</div>
        </div>

        <div class="footer">
          <p>This is a computer-generated payslip and does not require a signature.</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `

    // Create a new window and print
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(payslipHTML)
      printWindow.document.close()

      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print()
        // Close the window after printing (optional)
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
    }

    toast.success("Payment slip download initiated!")
  }

  return (
    <DashboardLayout>
      <ConfirmDialog
        open={showProcessConfirm}
        title="Overwrite Existing Payroll?"
        description={`Payroll already exists for ${pendingReprocessCount} employees this month. Re-process to overwrite current figures.`}
        confirmLabel="Re-process"
        destructive
        onConfirm={()=>{ setShowProcessConfirm(false); proceedPayrollProcessing(true) }}
        onCancel={()=>{ setShowProcessConfirm(false); setProcessing(false); toast.info('Payroll processing cancelled') }}
      />
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
              <p className="text-muted-foreground">Manage employee salaries, allowances, and payment processing</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>handleExportPayroll('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={()=>handleExportPayroll('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button disabled={processing} onClick={handleProcessPayroll}>
                <Plus className="h-4 w-4 mr-2" />
                {processing ? "Processing..." : "Process Payroll"}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of active employees in the payroll system</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_employees}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total payroll amount for the current month including all allowances and deductions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.total_payroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of employees with pending salary payments that require processing</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending_payments}</div>
                <p className="text-xs text-muted-foreground">Require processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Processed</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of employees whose payroll has been processed and paid this month</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.processed_this_month}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll Period</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="month-select">Select Month:</Label>
                  <Input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CardTitle>Payroll Records</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete payroll records with salary breakdowns, allowances, and payment status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>Manage employee payroll and payment processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
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
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Payroll Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Basic Salary</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Base salary amount before allowances and deductions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Allowances</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Additional allowances like HRA, travel, medical, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Deductions</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deductions like PF, ESI, tax, loans, advances, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Net Salary</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Final take-home salary after all allowances and deductions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Payment status: Pending → Processed → Paid</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? "Loading payroll data..." : "No payroll records found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{record.employee_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{record.position}</TableCell>
                        <TableCell>₹{record.basic_salary.toLocaleString()}</TableCell>
                        <TableCell>₹{record.allowances.toLocaleString()}</TableCell>
                        <TableCell>₹{record.deductions.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{record.net_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewPayslip(record)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* Update the edit button to pass the full record instead of just employee name */}
                            <Button variant="ghost" size="sm" onClick={() => handleEditPayroll(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustmentDialog(record, "extra_salary")}
                              title="Add Extra Salary"
                            >
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustmentDialog(record, "overtime")}
                              title="Add Overtime"
                            >
                              <Clock className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustmentDialog(record, "salary_cut")}
                              title="Apply Salary Cut"
                            >
                              <Minus className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustmentDialog(record, "advance")}
                              title="Advance Salary"
                            >
                              <CreditCard className="h-4 w-4 text-purple-600" />
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

          {/* Extra Salary Dialog */}
          <Dialog open={extraSalaryDialog} onOpenChange={setExtraSalaryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Extra Salary</DialogTitle>
                <DialogDescription>Add bonus or extra salary for {selectedEmployee?.employee_name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="extra-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="extra-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="extra-reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="extra-reason"
                    placeholder="Reason for extra salary"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExtraSalaryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handlePayrollAdjustment("extra_salary")}>Add Extra Salary</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Overtime Dialog */}
          <Dialog open={overtimeDialog} onOpenChange={setOvertimeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Overtime</DialogTitle>
                <DialogDescription>
                  Add overtime hours and payment for {selectedEmployee?.employee_name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="overtime-hours" className="text-right">
                    Hours
                  </Label>
                  <Input
                    id="overtime-hours"
                    type="number"
                    placeholder="Overtime hours"
                    value={adjustmentForm.hours}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, hours: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="overtime-reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="overtime-reason"
                    placeholder="Reason for overtime"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                {adjustmentForm.hours && selectedEmployee && (
                  <div className="text-sm text-muted-foreground">
                    Estimated overtime amount: ₹
                    {Math.round(
                      Number.parseFloat(adjustmentForm.hours) * (selectedEmployee.basic_salary / (30 * 8)) * 1.5,
                    ).toLocaleString()}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOvertimeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handlePayrollAdjustment("overtime")}>Add Overtime</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Salary Cut Dialog */}
          <Dialog open={salaryCutDialog} onOpenChange={setSalaryCutDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Salary Cut</DialogTitle>
                <DialogDescription>Apply salary deduction for {selectedEmployee?.employee_name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cut-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="cut-amount"
                    type="number"
                    placeholder="Deduction amount"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cut-reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="cut-reason"
                    placeholder="Reason for salary cut"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSalaryCutDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => handlePayrollAdjustment("salary_cut")}>
                  Apply Salary Cut
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Advance Salary Dialog */}
          <Dialog open={advanceSalaryDialog} onOpenChange={setAdvanceSalaryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advance Salary</DialogTitle>
                <DialogDescription>Provide advance salary to {selectedEmployee?.employee_name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="advance-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="advance-amount"
                    type="number"
                    placeholder="Advance amount"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="advance-reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="advance-reason"
                    placeholder="Reason for advance salary"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  Note: This advance will be deducted from future salary payments
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdvanceSalaryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handlePayrollAdjustment("advance")}>Provide Advance</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={viewPayslipDialog} onOpenChange={setViewPayslipDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Payslip - {selectedPayslip?.employee_name}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedPayslip && handleDownloadPayslip(selectedPayslip)}
                    className="ml-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {selectedPayslip && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Employee Details</h3>
                      <p>Name: {selectedPayslip.employee_name}</p>
                      <p>
                        Month:{" "}
                        {new Date(selectedPayslip.payroll_month).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p>Working Days: {selectedPayslip.working_days}</p>
                      <p>Present Days: {selectedPayslip.present_days}</p>
                      <p>Overtime Hours: {selectedPayslip.overtime_hours}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Salary Breakdown</h3>
                      <p>Basic Salary: ₹{selectedPayslip.basic_salary?.toLocaleString()}</p>
                      <p>HRA: ₹{selectedPayslip.hra?.toLocaleString()}</p>
                      <p>Transport: ₹{selectedPayslip.transport_allowance?.toLocaleString()}</p>
                      <p>Medical: ₹{selectedPayslip.medical_allowance?.toLocaleString()}</p>
                      <p>Overtime: ₹{selectedPayslip.overtime_amount?.toLocaleString()}</p>
                      <p>Bonus: ₹{selectedPayslip.bonus?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Deductions</h3>
                      <p>PF: ₹{selectedPayslip.pf_deduction?.toLocaleString()}</p>
                      <p>ESI: ₹{selectedPayslip.esi_deduction?.toLocaleString()}</p>
                      <p>Tax: ₹{selectedPayslip.tax_deduction?.toLocaleString()}</p>
                      <p>Loan: ₹{selectedPayslip.loan_deduction?.toLocaleString()}</p>
                      <p>Other: ₹{selectedPayslip.other_deductions?.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p>Gross Salary: ₹{selectedPayslip.gross_salary?.toLocaleString()}</p>
                      <p>Total Deductions: ₹{selectedPayslip.total_deductions?.toLocaleString()}</p>
                      <p className="font-bold text-lg">Net Salary: ₹{selectedPayslip.net_salary?.toLocaleString()}</p>
                      <p>
                        Status:{" "}
                        <Badge className={getStatusColor(selectedPayslip.status)}>{selectedPayslip.status}</Badge>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          {/* Add edit payroll dialog before the closing div */}
          <Dialog open={editPayrollDialog} onOpenChange={setEditPayrollDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Payroll - {selectedEditRecord?.employee_name}</DialogTitle>
              </DialogHeader>
              {selectedEditRecord && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-3 text-green-600">Earnings</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="basic_salary">Basic Salary (₹)</Label>
                          <Input
                            id="basic_salary"
                            type="number"
                            value={editFormData.basic_salary}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, basic_salary: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="hra">HRA (₹)</Label>
                          <Input
                            id="hra"
                            type="number"
                            value={editFormData.hra}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, hra: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="transport_allowance">Transport Allowance (₹)</Label>
                          <Input
                            id="transport_allowance"
                            type="number"
                            value={editFormData.transport_allowance}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                transport_allowance: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="medical_allowance">Medical Allowance (₹)</Label>
                          <Input
                            id="medical_allowance"
                            type="number"
                            value={editFormData.medical_allowance}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                medical_allowance: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="overtime_amount">Overtime Amount (₹)</Label>
                          <Input
                            id="overtime_amount"
                            type="number"
                            value={editFormData.overtime_amount}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                overtime_amount: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="bonus">Bonus (₹)</Label>
                          <Input
                            id="bonus"
                            type="number"
                            value={editFormData.bonus}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, bonus: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="other_allowances">Other Allowances (₹)</Label>
                          <Input
                            id="other_allowances"
                            type="number"
                            value={editFormData.other_allowances}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                other_allowances: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-red-600">Deductions</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="pf_deduction">PF Deduction (₹)</Label>
                          <Input
                            id="pf_deduction"
                            type="number"
                            value={editFormData.pf_deduction}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, pf_deduction: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="esi_deduction">ESI Deduction (₹)</Label>
                          <Input
                            id="esi_deduction"
                            type="number"
                            value={editFormData.esi_deduction}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                esi_deduction: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="tax_deduction">Tax Deduction (₹)</Label>
                          <Input
                            id="tax_deduction"
                            type="number"
                            value={editFormData.tax_deduction}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                tax_deduction: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="loan_deduction">Loan Deduction (₹)</Label>
                          <Input
                            id="loan_deduction"
                            type="number"
                            value={editFormData.loan_deduction}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                loan_deduction: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="other_deductions">Other Deductions (₹)</Label>
                          <Input
                            id="other_deductions"
                            type="number"
                            value={editFormData.other_deductions}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                other_deductions: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="working_days">Working Days</Label>
                      <Input
                        id="working_days"
                        type="number"
                        value={editFormData.working_days}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, working_days: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="present_days">Present Days</Label>
                      <Input
                        id="present_days"
                        type="number"
                        value={editFormData.present_days}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, present_days: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtime_hours">Overtime Hours</Label>
                      <Input
                        id="overtime_hours"
                        type="number"
                        value={editFormData.overtime_hours}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, overtime_hours: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Calculated Totals</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">
                          Gross Salary: ₹
                          {(
                            editFormData.basic_salary +
                            editFormData.hra +
                            editFormData.transport_allowance +
                            editFormData.medical_allowance +
                            editFormData.overtime_amount +
                            editFormData.bonus +
                            editFormData.other_allowances
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-600">
                          Total Deductions: ₹
                          {(
                            editFormData.pf_deduction +
                            editFormData.esi_deduction +
                            editFormData.tax_deduction +
                            editFormData.loan_deduction +
                            editFormData.other_deductions
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-semibold">
                          Net Salary: ₹
                          {(
                            editFormData.basic_salary +
                            editFormData.hra +
                            editFormData.transport_allowance +
                            editFormData.medical_allowance +
                            editFormData.overtime_amount +
                            editFormData.bonus +
                            editFormData.other_allowances -
                            (editFormData.pf_deduction +
                              editFormData.esi_deduction +
                              editFormData.tax_deduction +
                              editFormData.loan_deduction +
                              editFormData.other_deductions)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditPayrollDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditSubmit}>Update Payroll</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  )
}
