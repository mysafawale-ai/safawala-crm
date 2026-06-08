"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardErrorBoundary } from "@/components/error-boundary"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { 
  ClipboardList, Search, Warehouse, Package, Truck, 
  MapPin, RotateCcw, DollarSign, Calendar, Clock, 
  ChevronRight, RefreshCw, AlertCircle, ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Task {
  id: string
  department: 'warehouse' | 'packing' | 'dispatch' | 'event_team' | 'returns' | 'accounts'
  task_number: string
  title: string
  status: 'pending' | 'active' | 'picked' | 'shortage' | 'completed' | 'cancelled'
  instructions: string
  checklist: Array<{ text: string; checked: boolean }>
  created_at: string
  due_date: string | null
}

interface WorkOrder {
  id: string
  work_order_number: string
  booking_id: string
  booking_source: string
  booking_number: string
  event_date: string | null
  customer_name: string
  customer_phone: string
  status: 'new' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  work_order_tasks: Task[]
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, new, in_progress, completed
  const [activeTab, setActiveTab] = useState<'warehouse' | 'packing' | 'dispatch' | 'event_team' | 'returns' | 'accounts'>('warehouse')

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)
    }
    loadUser()
  }, [router])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/work-orders")
      if (!response.ok) {
        throw new Error("Failed to fetch work orders")
      }
      const resData = await response.json()
      setWorkOrders(resData.data || [])
    } catch (error: any) {
      console.error(error)
      toast.error("Error loading work orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWorkOrders()
    }
  }, [user])

  // Filters logic
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // 1. Search filter
      const matchesSearch = 
        wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

      // 2. Status filter
      const matchesStatus = statusFilter === "all" || wo.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [workOrders, searchQuery, statusFilter])

  // Get tasks matching the active tab (department) from filtered work orders
  const departmentTasks = useMemo(() => {
    const list: Array<{ workOrder: WorkOrder; task: Task }> = []
    
    filteredWorkOrders.forEach((wo) => {
      const task = wo.work_order_tasks?.find((t) => t.department === activeTab)
      if (task) {
        list.push({ workOrder: wo, task })
      }
    })
    
    return list
  }, [filteredWorkOrders, activeTab])

  // Compute counts for each department for badges
  const departmentCounts = useMemo(() => {
    const counts = {
      warehouse: 0,
      packing: 0,
      dispatch: 0,
      event_team: 0,
      returns: 0,
      accounts: 0
    }
    
    workOrders.forEach((wo) => {
      wo.work_order_tasks?.forEach((t) => {
        if (t.status === 'active' || t.status === 'pending') {
          counts[t.department] = (counts[t.department] || 0) + 1
        }
      })
    })
    
    return counts
  }, [workOrders])

  const getPriorityColor = (dateStr: string | null) => {
    if (!dateStr) return "bg-slate-100 text-slate-700"
    
    const today = new Date()
    const targetDate = new Date(dateStr)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) return "bg-red-100 text-red-800 border-red-200" // Critical (Within 24 Hours)
    if (diffDays <= 3) return "bg-orange-100 text-orange-800 border-orange-200" // High
    if (diffDays <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200" // Medium
    return "bg-green-100 text-green-800 border-green-200" // Low
  }

  const getPriorityLabel = (dateStr: string | null) => {
    if (!dateStr) return "Low"
    
    const today = new Date()
    const targetDate = new Date(dateStr)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) return "Critical (Immediate)"
    if (diffDays <= 3) return "High"
    if (diffDays <= 7) return "Medium"
    return "Low"
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Active</Badge>
      case "picked":
        return <Badge className="bg-green-600 text-white hover:bg-green-600">Picked</Badge>
      case "shortage":
        return <Badge className="bg-red-500 text-white hover:bg-red-500">Shortage</Badge>
      case "completed":
        return <Badge className="bg-green-600 text-white hover:bg-green-600">Completed</Badge>
      case "pending":
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-200">Waiting</Badge>
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground animate-pulse">Loading Operations Hub...</div>
      </div>
    )
  }

  return (
    <DashboardErrorBoundary>
      <DashboardLayout userRole={user.role}>
        <div className="container mx-auto p-4 max-w-7xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-8 w-8 text-indigo-600" /> Work Orders Hub
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Workflow-driven automated execution tasks for the Safawala operations team.
                </p>
              </div>
            </div>

            <Button onClick={fetchWorkOrders} disabled={loading} variant="outline" className="self-start md:self-auto gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Board
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="relative min-w-[240px] max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search order #, booking # or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm bg-white"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10 text-xs border-slate-200">
                  <SelectValue placeholder="Work Order Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-xs">All Work Orders</SelectItem>
                  <SelectItem value="new" className="text-xs">New</SelectItem>
                  <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-100 p-1 rounded-xl border">
            {(
              [
                { id: 'warehouse', label: 'Warehouse', icon: Warehouse },
                { id: 'packing', label: 'Packing', icon: Package },
                { id: 'dispatch', label: 'Dispatch', icon: Truck },
                { id: 'event_team', label: 'Event Team', icon: MapPin },
                { id: 'returns', label: 'Returns', icon: RotateCcw },
                { id: 'accounts', label: 'Accounts', icon: DollarSign }
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              const count = departmentCounts[tab.id] || 0
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all border ${
                    isActive 
                      ? 'bg-white text-indigo-600 border-slate-200 shadow-sm font-bold' 
                      : 'text-slate-600 border-transparent hover:bg-slate-50/50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <span className="text-[11px] font-semibold tracking-wide uppercase">{tab.label}</span>
                  {count > 0 && (
                    <Badge className="mt-1 bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 text-[10px] px-1.5 py-0.5 rounded-full">
                      {count} Active
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* Loading or Content Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border shadow-sm">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-sm font-semibold text-slate-600">Syncing board tasks...</p>
            </div>
          ) : departmentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-100 shadow-sm text-center">
              <ClipboardList className="h-16 w-16 text-slate-300 stroke-1 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-700">No Operations Pending</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1 px-4">
                No active or waiting tasks were found for the **{activeTab.replace('_', ' ')}** department.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departmentTasks.map(({ workOrder, task }) => {
                const totalChecklist = task.checklist?.length || 0
                const checkedChecklist = task.checklist?.filter(c => c.checked).length || 0
                const isUrgent = getPriorityLabel(workOrder.event_date).includes("Critical")

                return (
                  <Card 
                    key={task.id}
                    onClick={() => router.push(`/work-orders/${workOrder.id}`)}
                    className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer border-t-4 ${
                      isUrgent ? 'border-t-red-500' : 'border-t-indigo-500'
                    }`}
                  >
                    <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-indigo-600 tracking-wider">
                            {task.task_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">•</span>
                          <span className="text-xs font-semibold text-slate-500">
                            {workOrder.work_order_number}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-800 line-clamp-1">
                          {workOrder.customer_name}
                        </CardTitle>
                      </div>
                      
                      {getTaskStatusBadge(task.status)}
                    </CardHeader>

                    <CardContent className="pb-4 px-4 space-y-3">
                      {/* Priority Badges */}
                      <div className="flex items-center justify-between gap-2 border-y py-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Event: {workOrder.event_date ? format(new Date(workOrder.event_date), "dd MMM yyyy") : "N/A"}
                        </span>
                        
                        <Badge variant="outline" className={`text-[9px] border font-bold ${getPriorityColor(workOrder.event_date)}`}>
                          {getPriorityLabel(workOrder.event_date)}
                        </Badge>
                      </div>

                      {/* Task Info & Progress */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-700 leading-snug">
                          {task.title}
                        </p>
                        
                        {task.instructions && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.instructions.replace(/•/g, '').trim()}
                          </p>
                        )}
                      </div>

                      {/* Checklist Progress Bar */}
                      {totalChecklist > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>Checklist Progress</span>
                            <span>{checkedChecklist}/{totalChecklist} ({Math.round((checkedChecklist/totalChecklist)*100)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${(checkedChecklist/totalChecklist)*100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Button Indicator */}
                      <div className="flex items-center justify-end text-[11px] text-indigo-600 font-bold pt-1 gap-0.5 hover:translate-x-0.5 transition-transform">
                        Execute Workflow
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </DashboardErrorBoundary>
  )
}
