import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/products/save
 * Create a new product + images using service role (bypasses RLS)
 * Body: { productData, images, franchiseId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, variants, _variation_count, category_name, product_code, franchiseId: bodyFranchiseId, ...productData } = body

    // Strip undefined / empty strings to null for UUID fields
    const cleanData: Record<string, any> = {}
    for (const [k, v] of Object.entries(productData)) {
      if (v !== undefined) cleanData[k] = v === "" ? null : v
    }
    // Make sure we never send id on insert
    delete cleanData.id

    const supabase = getServiceClient()

    // Resolve franchise_id: use passed franchiseId, or fall back to first active franchise
    let franchise_id = bodyFranchiseId || cleanData.franchise_id
    if (!franchise_id || franchise_id === "null" || franchise_id === "undefined") {
      const { data: franchises } = await supabase
        .from("franchises")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
      franchise_id = franchises?.[0]?.id ?? null
    }

    if (!franchise_id) {
      return NextResponse.json({ error: "No franchise found to assign product to" }, { status: 400 })
    }

    cleanData.franchise_id = franchise_id
    cleanData.created_at = new Date().toISOString()
    cleanData.updated_at = new Date().toISOString()

    const { data: newProduct, error } = await supabase
      .from("products")
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      console.error("[POST /api/products/save] insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const productId = newProduct.id

    // Insert images
    if (images && Array.isArray(images) && images.length > 0) {
      const imagesToInsert = images.map((img: any, idx: number) => ({
        product_id: productId,
        url: img.url,
        is_main: img.is_main,
        order: idx,
      }))
      const { error: imgErr } = await supabase.from("product_images").insert(imagesToInsert)
      if (imgErr) console.error("[POST /api/products/save] image insert error:", imgErr)
    }

    return NextResponse.json({ success: true, id: productId, product: newProduct }, { status: 201 })
  } catch (err: any) {
    console.error("[POST /api/products/save] unexpected error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
