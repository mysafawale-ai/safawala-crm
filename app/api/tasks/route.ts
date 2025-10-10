import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, getDefaultFranchiseId } from "@/lib/supabase-server-simple"
import { ApiResponseBuilder } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    // Remove JWT auth and use default franchise
    const franchiseId = await getDefaultFranchiseId()
    const userId = "system"
    const userRole = "admin"

    let query = supabaseServer
      .from("tasks")
      .select(`
        *,
        assigned_to_user:users!assigned_to(name, email),
        assigned_by_user:users!assigned_by(name, email)
      `)
      .order("created_at", { ascending: false })

    if (userRole === "staff") {
      query = query.eq("assigned_to", userId)
    } else if (userRole === "franchise_admin" && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[v0] Error fetching tasks:", error)
      return NextResponse.json(ApiResponseBuilder.serverError("Failed to fetch tasks", error.message), { status: 500 })
    }

    return NextResponse.json(
      ApiResponseBuilder.success(data || [], "Tasks retrieved successfully", {
        total: count || data?.length || 0,
      }),
    )
  } catch (error) {
    console.error("[v0] Error in task fetching API:", error)
    return NextResponse.json(ApiResponseBuilder.serverError(), { status: 500 })
  }
}
