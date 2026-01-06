import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"
export const runtime = 'nodejs'

/**
 * POST /api/deliveries/upload-photo
 * Upload handover photo to Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "staff" })
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
    const fileName = `handover-photo-${deliveryId}-${Date.now()}.jpg`
    const filePath = `deliveries/${deliveryId}/${fileName}`

    // Upload to storage
    const { error: uploadError, data } = await supabase.storage
      .from("delivery-handovers")
      .upload(filePath, file, {
        upsert: false
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload photo" },
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
    console.error("Error uploading photo:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
