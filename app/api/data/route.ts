import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")

    if (contentType?.includes("application/xml")) {
      const xmlData = await request.text()

      if (xmlData.includes("<!DOCTYPE") || xmlData.includes("<!ENTITY") || xmlData.includes("SYSTEM")) {
        return NextResponse.json({ error: "XML external entity detected" }, { status: 400 })
      }
    }

    const body = await request.json().catch(() => ({}))

    return NextResponse.json({
      success: true,
      message: "XML injection prevention working",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
