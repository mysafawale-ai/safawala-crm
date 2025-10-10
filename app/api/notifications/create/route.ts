import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating notification via API:", body.title)

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        title: body.title,
        message: body.message,
        type: body.type || "info",
        priority: body.priority || "medium",
        user_id: body.user_id || null,
        franchise_id: body.franchise_id || null,
        action_url: body.action_url || null,
        metadata: body.metadata || {},
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    console.log("[v0] Notification created successfully:", notification.id)
    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("[v0] Exception in notification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
