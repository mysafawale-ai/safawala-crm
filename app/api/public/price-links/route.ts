import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ADMIN_PASSWORD = process.env.PACKAGES_ADMIN_PASSWORD || "Safawala@5678"

// GET: Fetch a price link by key
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from("package_price_links")
    .select("*")
    .eq("link_key", key)
    .eq("is_active", true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Price link not found or expired" }, { status: 404 })
  }

  // Increment view count
  await supabase
    .from("package_price_links")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", data.id)

  return NextResponse.json({ success: true, data })
}

// POST: Create a new price link (admin only)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password, custom_prices, label } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 })
  }

  if (!custom_prices || typeof custom_prices !== "object") {
    return NextResponse.json({ error: "Custom prices required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("package_price_links")
    .insert({ custom_prices, label: label || "Custom Quote", is_active: true })
    .select()
    .single()

  if (error) {
    console.error("[price-links] Insert error:", error)
    return NextResponse.json({ error: "Failed to create price link" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data, link_key: data.link_key })
}
