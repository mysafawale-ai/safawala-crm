"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, AlertCircle, Plus, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { AssignTaskDialog } from "@/components/tasks/assign-task-dialog"
import type { User as UserType } from "@/lib/types"

interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string
  assigned_by: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  franchise_id: string | null
  created_at: string
  updated_at: string
  assigned_to_user?: {
    name: string
    email: string
  }
  assigned_by_user?: {
    name: string
    email: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchTasks()
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error || !userData) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load user data")
        return
      }

      setCurrentUser(userData)
    } catch (error) {
      console.error("Error fetching current user:", error)
      toast.error("Failed to load user data")
    }
  }

  const fetchTasks = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      console.log("[v0] Starting task fetch for user:", {
        id: currentUser.id,
        role: currentUser.role,
        franchise_id: currentUser.franchise_id,
      })

      const params = new URLSearchParams({
        userId: currentUser.id,
        userRole: currentUser.role,
        franchiseId: currentUser.franchise_id || "null",
      })

      const response = await fetch(`/api/tasks?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error fetching tasks:", errorData)
        toast.error("Failed to load tasks")
        return
      }

      const result = await response.json()
      console.log("[v0] Tasks fetched successfully:", result.tasks?.length || 0, "tasks")
      setTasks(result.tasks || [])
    } catch (error) {
      console.error("[v0] Error fetching tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      setUpdatingTasks((prev) => new Set(prev).add(taskId))
      console.log("[v0] Updating task status:", { taskId, newStatus, updatedBy: currentUser?.id })

      const response = await fetch("/api/tasks/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          updatedBy: currentUser?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error updating task status:", errorData)
        toast.error("Failed to update task status")
        return
      }

      console.log("[v0] Task status updated successfully")
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus, updated_at: new Date().toISOString() } : task,
        ),
      )

      toast.success("Task status updated successfully!")
    } catch (error) {
      console.error("[v0] Error updating task status:", error)
      toast.error("Failed to update task status")
    } finally {
      setUpdatingTasks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleTaskCheck = (task: Task, checked: boolean) => {
    const newStatus = checked ? "completed" : "pending"
    updateTaskStatus(task.id, newStatus)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">View and manage your assigned tasks</p>
          </div>
        </div>

        {(currentUser.role === "super_admin" || currentUser.role === "franchise_admin") && (
          <Button onClick={() => setShowAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Task
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>
            {currentUser.role === "staff" ? "Tasks assigned to you" : "All tasks in your organization"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading tasks...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No tasks found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={(checked) => handleTaskCheck(task, checked as boolean)}
                        disabled={
                          updatingTasks.has(task.id) ||
                          (currentUser.role === "staff" && task.assigned_to !== currentUser.id)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4
                            className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                          >
                            {task.title}
                          </h4>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>

                        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap gap-2">
                          <div className="flex items-center space-x-1">
                            <span>Assigned to: {task.assigned_to_user?.name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy 'at' h:mm a")}</span>
                          </div>
                          {new Date(task.due_date) < new Date() && task.status !== "completed" && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Overdue</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {currentUser && (
        <AssignTaskDialog open={showAssignDialog} onOpenChange={setShowAssignDialog} currentUser={currentUser} />
      )}
    </div>
  )
}
