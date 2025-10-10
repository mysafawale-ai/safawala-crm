import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { data, error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("[v0] SQL execution error:", error)
      return NextResponse.json({ error: "SQL execution failed", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "SQL executed successfully",
    })
  } catch (error: any) {
    console.error("[v0] Unexpected error in SQL execution:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
