import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // File size validation (max 2MB for base64)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 2MB limit for base64 storage" }, { status: 400 })
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Generate unique filename for reference
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`
    
    console.log('Base64 image generated successfully, length:', base64String.length)

    // Return the base64 URL directly - this can be stored in the database
    // as the logo_url value
    return NextResponse.json({
      success: true,
      filename: fileName,
      filePath: fileName, // For compatibility with existing code
      url: base64String, // This is the base64 data URL that can be used directly in <img src="...">
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}