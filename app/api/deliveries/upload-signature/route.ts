import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"

/**
 * POST /api/deliveries/upload-signature
 * Upload handover signature to Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "staff", requirePermission: "deliveries" })
    if (!auth.authorized) {
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const deliveryId = formData.get("delivery_id") as string

    if (!file || !deliveryId) {
      return NextResponse.json(
        { error: "File and delivery_id are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Create unique file path
    const fileName = `handover-signature-${deliveryId}-${Date.now()}.png`
    const filePath = `deliveries/${deliveryId}/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("delivery-handovers")
      .upload(filePath, file, {
        upsert: false
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload signature" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("delivery-handovers")
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath
    })

  } catch (error: any) {
    console.error("Error uploading signature:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
