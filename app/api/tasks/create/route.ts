import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await supabase.from("tasks").insert([body]).select().single()

    if (error) {
      console.error("Error creating task:", error)
      return NextResponse.json({ error: "Failed to create task", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task: data })
  } catch (error) {
    console.error("Error in task creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
