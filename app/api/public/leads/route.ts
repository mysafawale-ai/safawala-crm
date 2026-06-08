import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ADMIN_PASSWORD = process.env.PACKAGES_ADMIN_PASSWORD || "Safawala@5678"

function checkPassword(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password") || new URL(req.url).searchParams.get("pw")
  return pw === ADMIN_PASSWORD
}

// GET — fetch leads (admin password required)
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

// PATCH — update lead status (admin password required)
export async function PATCH(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
