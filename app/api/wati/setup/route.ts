import { supabaseServer as supabase } from "@/lib/supabase-server-simple"
import { invalidateWATIConfigCache } from "@/lib/services/wati-service"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Setting up WATI integration...")

    const watiConfig = {
      integration_name: "whatsapp-wati",
      api_key:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwibmFtZWlkIjoibXlzYWZhd2FsZUBnbWFpbC5jb20iLCJlbWFpbCI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDYvMDEvMjAyNiAxNzoxMTo0MiIsInRlbmFudF9pZCI6IjQ4MTQ1NSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.AQBq7FL7jHyL5pXhJkPEOWuIAbzpC49Mzskg85dvnbA",
      base_url: "https://live-mt-server.wati.io/481455",
      instance_id: "481455",
      test_phone: "919725295692",
      is_active: true,
      settings: {
        webhook_url: null,
        auto_notifications: true,
        business_hours: {
          enabled: true,
          start: "09:00",
          end: "18:00",
          timezone: "Asia/Kolkata",
        },
      },
    }

    const { data, error } = await supabase
      .from("integration_settings")
      .upsert(watiConfig, {
        onConflict: "integration_name",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving WATI config:", error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] WATI integration configured successfully:", data)
    invalidateWATIConfigCache()

    return Response.json({
      success: true,
      message: "WATI integration configured successfully",
      config: data[0],
    })
  } catch (error) {
    console.error("[v0] Error setting up WATI integration:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to setup WATI integration",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("integration_name", "whatsapp-wati")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching WATI config:", error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      config: data || null,
      isConfigured: !!data,
    })
  } catch (error) {
    console.error("[v0] Error fetching WATI config:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to fetch WATI configuration",
      },
      { status: 500 },
    )
  }
}
