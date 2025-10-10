import { type NextRequest, NextResponse } from "next/server"
import { wooCommerceService } from "@/lib/woocommerce-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] WooCommerce auto-setup API called")

    const success = await wooCommerceService.autoSetup()

    if (success) {
      return NextResponse.json({
        success: true,
        message: "WooCommerce integration setup successfully",
        storeUrl: "https://safawala.com",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to setup WooCommerce integration",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] WooCommerce auto-setup API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during auto-setup",
      },
      { status: 500 },
    )
  }
}
