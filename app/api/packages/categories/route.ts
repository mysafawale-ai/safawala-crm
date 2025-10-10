import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"

export async function GET(request: NextRequest) {
  try {
    // Remove JWT authentication for simplicity

    const { data, error } = await supabaseServer
      .from("packages_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching package categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })

  } catch (error) {
    console.error("Package categories API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Remove JWT authentication for simplicity

    const body = await request.json()
    const { name, description, display_order = 1 } = body

    const { data, error } = await supabaseServer
      .from("packages_categories")
      .insert({
        name,
        description,
        display_order,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error("Category creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}