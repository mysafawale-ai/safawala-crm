import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Public endpoint — no auth, fetches active package categories + variants
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Fetch package categories
    const { data: categories, error: catError } = await supabase
      .from("packages_categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (catError) {
      console.error("[Public Packages] Categories error:", catError)
    }

    // Fetch active package variants
    const { data: variants, error: varError } = await supabase
      .from("package_variants")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (varError) {
      console.error("[Public Packages] Variants error:", varError)
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
      variants: variants || [],
    })
  } catch (err) {
    console.error("[Public Packages] Error:", err)
    return NextResponse.json({ error: "Failed to load packages" }, { status: 500 })
  }
}
