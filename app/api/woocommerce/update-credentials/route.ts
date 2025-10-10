import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Updating WooCommerce credentials...")

    const { data, error } = await supabase.from("integration_settings").upsert(
      {
        integration_name: "woocommerce",
        is_active: true,
        settings: {
          store_url: "https://safawala.com",
          consumer_key: "ck_b0989eadb72d75ec0ba524e7af24ca476f62e5af",
          consumer_secret: "cs_af9b5e8a6c4d74b7e360f3ea264f55c7a9fb0ef4",
          webhook_secret: "",
        },
      },
      {
        onConflict: "integration_name",
      },
    )

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log("[v0] WooCommerce credentials updated successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error updating WooCommerce credentials:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
