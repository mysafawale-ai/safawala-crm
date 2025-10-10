import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { taskId, status, updatedBy } = await request.json()

    if (!taskId || !status || !updatedBy) {
      return NextResponse.json({ error: "Missing required fields: taskId, status, updatedBy" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["pending", "in_progress", "completed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: pending, in_progress, completed" },
        { status: 400 },
      )
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update task status
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()

    if (error) {
      console.error("Error updating task status:", error)
      return NextResponse.json({ error: "Failed to update task status", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task: data[0] })
  } catch (error) {
    console.error("Error in update task status API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
