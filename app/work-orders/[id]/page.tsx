"use client"

import { useEffect, useState, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardErrorBoundary } from "@/components/error-boundary"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { 
  ArrowLeft, CheckCircle2, Clock, Play, Lock, AlertTriangle, 
  Warehouse, Package, Truck, MapPin, RotateCcw, DollarSign,
  ChevronRight, Upload, Sparkles, UserCheck, Eye, Trash2
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Task {
  id: string
  work_order_id: string
  department: 'warehouse' | 'packing' | 'dispatch' | 'event_team' | 'returns' | 'accounts'
  task_number: string
  title: string
  status: 'pending' | 'active' | 'picked' | 'shortage' | 'completed' | 'cancelled'
  instructions: string
  checklist: Array<{ text: string; checked: boolean }>
  photos: string[]
  metadata: Record<string, any>
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
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
  customer?: {
    name: string
    phone: string
    email: string
    address: string
  }
  items?: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product?: {
      name: string
      product_code: string
      color: string
      size: string
      image_url: string | null
    }
  }>
}

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const id = params.id

  const [user, setUser] = useState<User | null>(null)
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Execution state for Active Task
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [taskChecklist, setTaskChecklist] = useState<Array<{ text: string; checked: boolean }>>([])
  const [taskPhotos, setTaskPhotos] = useState<string[]>([])
  
  // Dispatch Inputs
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [vehicleNumber, setVehicleNumber] = useState("")

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

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

  const fetchWorkOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/work-orders/${id}`)
      if (!response.ok) {
        throw new Error("Failed to load work order details")
      }
      const resData = await response.json()
      const wo = resData.data
      setWorkOrder(wo)

      // Set the active task for execution
      // We look for the first task that is 'active'
      // Accounts (AC) runs in parallel, so we prioritize active operational tasks (WH, PK, DP, EV, RT)
      const tasks = wo.work_order_tasks || []
      const activeOpsTask = tasks.find((t: Task) => t.status === "active" && t.department !== "accounts")
      const activeAcctTask = tasks.find((t: Task) => t.status === "active" && t.department === "accounts")
      
      const currentActive = activeOpsTask || activeAcctTask || null
      setActiveTask(currentActive)

      if (currentActive) {
        setTaskChecklist(currentActive.checklist || [])
        setTaskPhotos(currentActive.photos || [])
        
        // Populate inputs if dispatch
        if (currentActive.department === "dispatch") {
          setDriverName(currentActive.metadata?.driver_name || "")
          setDriverPhone(currentActive.metadata?.driver_phone || "")
          setVehicleNumber(currentActive.metadata?.vehicle_number || "")
        }
      }
    } catch (error: any) {
      console.error(error)
      toast.error("Error loading work order details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) {
      fetchWorkOrderDetail()
    }
  }, [user, id])

  // Checklist updates
  const handleChecklistChange = (index: number, checked: boolean) => {
    setTaskChecklist((prev) => 
      prev.map((item, i) => (i === index ? { ...item, checked } : item))
    )
  }

  // File Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !activeTask) return

    setUploading(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("delivery_id", activeTask.id) // Re-use delivery ID field for task directory mapping

      const response = await fetch("/api/deliveries/upload-photo", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Failed to upload photo")
      }

      const uploadRes = await response.json()
      
      // Update checklist to mark photo upload completed automatically
      const updatedPhotos = [...taskPhotos, uploadRes.url]
      setTaskPhotos(updatedPhotos)

      setTaskChecklist((prev) => 
        prev.map((item) => 
          item.text.toLowerCase().includes("photo") 
            ? { ...item, checked: true } 
            : item
        )
      )

      toast.success("Photo uploaded successfully")
    } catch (error: any) {
      console.error(error)
      toast.error("Error uploading photo")
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = (photoIndex: number) => {
    setTaskPhotos((prev) => prev.filter((_, idx) => idx !== photoIndex))
    if (taskPhotos.length <= 1) {
      // Uncheck photo list item if zero photos remain
      setTaskChecklist((prev) => 
        prev.map((item) => 
          item.text.toLowerCase().includes("photo") 
            ? { ...item, checked: false } 
            : item
        )
      )
    }
  }

  // --- Signature pad logic ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#1e1b4b" // indigo-950
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Task Completion Submission
  const handleTaskSubmit = async (statusOverride?: 'picked' | 'shortage' | 'completed') => {
    if (!activeTask || !workOrder) return

    const finalStatus = statusOverride || (activeTask.department === "warehouse" ? "picked" : "completed")

    // Check checklist validation (excluding WH picking & accounts which are flexible)
    if (finalStatus === "completed" && activeTask.department !== "accounts") {
      const uncheckedItem = taskChecklist.find(c => !c.checked)
      if (uncheckedItem) {
        toast.error(`Please complete checklist item: "${uncheckedItem.text}"`)
        return
      }

      if (activeTask.department === "packing" && taskPhotos.length === 0) {
        toast.error("Packing requires at least 1 proof photo.")
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        status: finalStatus,
        checklist: taskChecklist,
        photos: taskPhotos,
        metadata: activeTask.metadata || {}
      }

      // Add dispatch metadata
      if (activeTask.department === "dispatch") {
        if (!driverName || !driverPhone || !vehicleNumber) {
          toast.error("Please fill in all driver & vehicle details.")
          setSubmitting(false)
          return
        }
        payload.metadata = {
          ...payload.metadata,
          driver_name: driverName,
          driver_phone: driverPhone,
          vehicle_number: vehicleNumber
        }
      }

      // Add signature to event team metadata
      if (activeTask.department === "event_team" && finalStatus === "completed") {
        const canvas = canvasRef.current
        if (canvas) {
          const signatureDataUrl = canvas.toDataURL("image/png")
          payload.metadata = {
            ...payload.metadata,
            client_signature_data_url: signatureDataUrl
          }
        }
      }

      const response = await fetch(`/api/work-orders/tasks/${activeTask.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to update task status")
      }

      toast.success(`Task ${activeTask.task_number} successfully ${finalStatus}!`)
      await fetchWorkOrderDetail() // Refresh workflow state
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error submitting task updates")
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualTaskSelect = (task: Task) => {
    setActiveTask(task)
    setTaskChecklist(task.checklist || [])
    setTaskPhotos(task.photos || [])
    if (task.department === "dispatch") {
      setDriverName(task.metadata?.driver_name || "")
      setDriverPhone(task.metadata?.driver_phone || "")
      setVehicleNumber(task.metadata?.vehicle_number || "")
    }
  }

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case "warehouse": return <Warehouse className="h-5 w-5" />
      case "packing": return <Package className="h-5 w-5" />
      case "dispatch": return <Truck className="h-5 w-5" />
      case "event_team": return <MapPin className="h-5 w-5" />
      case "returns": return <RotateCcw className="h-5 w-5" />
      case "accounts": return <DollarSign className="h-5 w-5" />
      default: return <ClipboardList className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "picked":
        return "bg-green-100 text-green-800 border-green-200"
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shortage":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
      default:
        return "bg-slate-100 text-slate-500 border-slate-200"
    }
  }

  if (loading && !workOrder) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-sm font-semibold text-slate-600">Retrieving operational parameters...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!workOrder) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-8 text-center min-h-screen">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Work Order Not Found</h2>
          <Button onClick={() => router.push("/work-orders")} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
            Return to Work Orders
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardErrorBoundary>
      <DashboardLayout userRole={user?.role}>
        <div className="container mx-auto p-4 max-w-7xl space-y-6">

          {/* Top Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => router.push("/work-orders")} className="p-0 h-auto hover:bg-transparent text-slate-500 hover:text-slate-800 font-semibold gap-1 text-xs">
                  <ArrowLeft className="h-3 w-3" /> Work Orders Board
                </Button>
                <span className="text-slate-300 text-xs">/</span>
                <span className="text-xs font-black text-indigo-600">{workOrder.work_order_number}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {workOrder.customer_name}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Booking ID: {workOrder.booking_number}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Event Date: {workOrder.event_date ? format(new Date(workOrder.event_date), "dd MMM yyyy") : "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize font-bold text-xs px-3 py-1">
                Source: {workOrder.booking_source.replace('_', ' ')}
              </Badge>
              <Badge className={`capitalize font-bold text-xs px-3 py-1 border ${getStatusColor(workOrder.status)}`}>
                WO Status: {workOrder.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Workflow Timeline */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-white border rounded-2xl shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-extrabold text-slate-800">Workflow Timeline</CardTitle>
                  <CardDescription className="text-xs">Click any active task to execute it.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                    {workOrder.work_order_tasks?.map((t) => {
                      const isTaskActive = activeTask?.id === t.id
                      const isComplete = t.status === "completed" || t.status === "picked"
                      
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            if (t.status === "active" || t.status === "completed" || t.status === "picked") {
                              handleManualTaskSelect(t)
                            } else {
                              toast.info("This task is locked. Complete the previous steps first.")
                            }
                          }}
                          className={`relative group cursor-pointer ${
                            isTaskActive ? 'opacity-100 scale-[1.02] translate-x-1' : 'opacity-85'
                          } transition-all`}
                        >
                          {/* Indicator Circle */}
                          <div className={`absolute -left-[37px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-colors ${
                            isComplete 
                              ? 'bg-green-600 border-green-700 text-white' 
                              : t.status === 'active' 
                                ? 'bg-blue-600 border-blue-700 text-white animate-pulse'
                                : t.status === 'shortage'
                                  ? 'bg-red-500 border-red-600 text-white'
                                  : 'bg-white border-slate-300 text-slate-400'
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <span className="text-[10px] font-black">{t.department === "warehouse" ? "WH" : t.department === "packing" ? "PK" : t.department === "dispatch" ? "DP" : t.department === "event_team" ? "EV" : t.department === "returns" ? "RT" : "AC"}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            isTaskActive 
                              ? 'bg-slate-50 border-indigo-500 shadow-inner' 
                              : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
                                {getDeptIcon(t.department)}
                                {t.department.replace('_', ' ')}
                              </span>
                              <Badge variant="outline" className={`text-[9px] font-bold ${getStatusColor(t.status)}`}>
                                {t.status}
                              </Badge>
                            </div>
                            <h4 className="text-xs font-bold text-slate-700 mt-1 line-clamp-1">
                              {t.title}
                            </h4>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items Summary */}
              {workOrder.items && workOrder.items.length > 0 && (
                <Card className="bg-white border rounded-2xl shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-extrabold text-slate-800">Assigned Stock items</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 max-h-60 overflow-y-auto space-y-2">
                    {workOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="h-9 w-9 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-slate-600">
                          {item.product?.image_url ? (
                            <img src={item.product.image_url} alt="" className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            "S"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.product?.name || "Product Item"}</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                            Code: {item.product?.product_code || "N/A"} • Size: {item.product?.size || "N/A"} • Color: {item.product?.color || "N/A"}
                          </p>
                        </div>
                        <div className="font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Active Task Execution Console */}
            <div className="lg:col-span-2 space-y-6">
              {activeTask ? (
                <Card className="bg-white border rounded-2xl shadow-md border-indigo-100">
                  <CardHeader className="bg-slate-50/50 pb-4 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                          {getDeptIcon(activeTask.department)}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{activeTask.task_number}</span>
                          <CardTitle className="text-lg font-black text-slate-800">{activeTask.title}</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Status:</span>
                        <Badge className={`capitalize font-black text-xs ${getStatusColor(activeTask.status)}`}>
                          {activeTask.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">

                    {/* Instruction Box */}
                    {activeTask.instructions && (
                      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-4 space-y-1.5">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Instructions & Items
                        </h5>
                        <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                          {activeTask.instructions}
                        </p>
                      </div>
                    )}

                    {/* Execution UI: Warehouse */}
                    {activeTask.department === "warehouse" && activeTask.status === "active" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={() => handleTaskSubmit("picked")}
                            disabled={submitting} 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold flex-1 h-12 shadow"
                          >
                            Mark All Items Picked
                          </Button>
                          <Button 
                            onClick={() => handleTaskSubmit("shortage")}
                            disabled={submitting} 
                            variant="destructive" 
                            className="font-bold flex-1 h-12"
                          >
                            Flag Stock Shortage
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Execution UI: Dispatch Metadata Form */}
                    {activeTask.department === "dispatch" && activeTask.status === "active" && (
                      <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-wide">Vehicle & Driver Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Driver Name</label>
                            <Input 
                              placeholder="e.g. Ramesh Kumar"
                              value={driverName}
                              onChange={(e) => setDriverName(e.target.value)}
                              className="bg-white h-10 text-xs font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Driver Phone</label>
                            <Input 
                              placeholder="e.g. +91 9876543210"
                              value={driverPhone}
                              onChange={(e) => setDriverPhone(e.target.value)}
                              className="bg-white h-10 text-xs font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Vehicle Number</label>
                            <Input 
                              placeholder="e.g. MH-01-AB-1234"
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value)}
                              className="bg-white h-10 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Checkbox Checklist Section (Active tasks for Packing, Dispatch, Event Setup, Returns, Accounts) */}
                    {taskChecklist.length > 0 && (
                      <div className="space-y-3.5">
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Execution Checklist</h5>
                        <div className="grid gap-2">
                          {taskChecklist.map((item, index) => (
                            <div 
                              key={index}
                              className={`flex items-center space-x-3 p-3 rounded-xl border transition-colors ${
                                item.checked 
                                  ? 'bg-green-50/40 border-green-200' 
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <Checkbox
                                id={`check-${index}`}
                                checked={item.checked}
                                disabled={activeTask.status !== "active" || item.text.toLowerCase().includes("photo")}
                                onCheckedChange={(checked) => handleChecklistChange(index, checked as boolean)}
                                className="rounded border-slate-300"
                              />
                              <label
                                htmlFor={`check-${index}`}
                                className={`text-xs font-semibold leading-none cursor-pointer flex-1 select-none ${
                                  item.checked ? 'text-green-800 line-through' : 'text-slate-700'
                                }`}
                              >
                                {item.text}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image proof uploader (Packing, Event Setup, Returns) */}
                    {activeTask.status === "active" && 
                     ['packing', 'event_team', 'returns'].includes(activeTask.department) && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Photo Evidence Proof</h5>
                        
                        {/* Image Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {taskPhotos.map((photo, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border bg-slate-100">
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                              <button 
                                onClick={() => deletePhoto(idx)}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          
                          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all">
                            <Upload className={`h-6 w-6 text-slate-400 ${uploading ? 'animate-bounce' : ''}`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1.5">
                              {uploading ? "Uploading..." : "Upload Photo"}
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handlePhotoUpload} 
                              disabled={uploading} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Execution UI: Client Signature Pad (Event Setup) */}
                    {activeTask.department === "event_team" && activeTask.status === "active" && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
                          <UserCheck className="h-4 w-4 text-indigo-600" /> Client Handover Signature
                        </h5>
                        <div className="border rounded-2xl overflow-hidden bg-slate-50">
                          <canvas 
                            ref={canvasRef}
                            width={500}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full bg-white touch-none border-b cursor-crosshair"
                          />
                          <div className="p-2 flex items-center justify-end gap-2 bg-slate-100/50">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={clearSignature}
                              className="text-xs px-3 h-8 bg-transparent"
                            >
                              Clear Pad
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dispatch Form values displayed if completed */}
                    {activeTask.status === "completed" && activeTask.department === "dispatch" && (
                      <div className="bg-slate-50 border rounded-xl p-4 text-xs space-y-2">
                        <h6 className="font-bold text-slate-700 uppercase">Dispatched Logistics Details:</h6>
                        <div className="grid grid-cols-3 gap-2">
                          <p><span className="text-slate-400">Driver:</span> {activeTask.metadata?.driver_name}</p>
                          <p><span className="text-slate-400">Phone:</span> {activeTask.metadata?.driver_phone}</p>
                          <p><span className="text-slate-400">Vehicle:</span> {activeTask.metadata?.vehicle_number}</p>
                        </div>
                      </div>
                    )}

                    {/* Customer signature displayed if completed */}
                    {activeTask.status === "completed" && activeTask.department === "event_team" && activeTask.metadata?.client_signature_data_url && (
                      <div className="border rounded-xl p-4 bg-slate-50/50 max-w-xs space-y-2">
                        <h6 className="text-xs font-bold text-slate-700 uppercase">Client Sign-off Signature:</h6>
                        <img src={activeTask.metadata.client_signature_data_url} alt="Signature" className="border bg-white rounded h-20 w-full object-contain" />
                      </div>
                    )}

                    {/* Execution Action Button */}
                    {activeTask.status === "active" && activeTask.department !== "warehouse" && (
                      <Button 
                        onClick={() => handleTaskSubmit()} 
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-md"
                      >
                        {submitting ? "Applying updates..." : `Mark ${activeTask.department.replace('_', ' ')} Task Completed`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border rounded-2xl p-8 text-center shadow-sm">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4 stroke-1 animate-bounce" />
                  <h3 className="text-lg font-extrabold text-slate-800">Workflow Fully Completed</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    All tasks for this Work Order have been completed successfully. The operations team is fully finished.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </DashboardErrorBoundary>
  )
}
