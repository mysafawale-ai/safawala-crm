import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

// Describe the person using GPT-4o vision, then generate 4-angle DALL-E images
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, { minRole: "readonly" })
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { personImageBase64, productImageBase64, productName } = body

    if (!personImageBase64 || !productImageBase64) {
      return NextResponse.json({ error: "Both person and product images are required" }, { status: 400 })
    }

    // Step 1: Describe the person and product using GPT-4o vision
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at these two images. Image 1 is a person. Image 2 is a ${productName || "safa/turban"} product.
Describe in detail:
1. The person: skin tone, face shape, approximate age, clothing style, body build
2. The product: exact color, fabric texture, style, pattern, how it is tied/worn
Be precise and concise. This description will be used to generate realistic AI images.`,
              },
              { type: "image_url", image_url: { url: personImageBase64, detail: "high" } },
              { type: "image_url", image_url: { url: productImageBase64, detail: "high" } },
            ],
          },
        ],
      }),
    })

    if (!visionRes.ok) {
      const err = await visionRes.json()
      return NextResponse.json({ error: err.error?.message || "Vision analysis failed" }, { status: 500 })
    }

    const visionData = await visionRes.json()
    const description = visionData.choices[0].message.content

    // Step 2: Generate 4 angle views using DALL-E 3
    const angles = [
      { label: "Front View", angle: "front-facing, looking straight at camera" },
      { label: "Side View", angle: "side profile, facing left" },
      { label: "3/4 View", angle: "three-quarter angle, slight turn to the right" },
      { label: "Back View", angle: "seen from behind, back of head visible" },
    ]

    const basePrompt = `Professional wedding photography style, ultra realistic photo.
${description}
The person is wearing the described ${productName || "safa turban"} on their head, properly tied in traditional Indian wedding style.
High quality studio lighting, clean white or soft gradient background.
Sharp focus, photorealistic, no cartoon, no illustration.`

    const imagePromises = angles.map(({ label, angle }) =>
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `${basePrompt}\nAngle: ${angle}.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const e = await r.json()
          return { label, error: e.error?.message || "Generation failed" }
        }
        const d = await r.json()
        return { label, url: d.data[0].url }
      })
    )

    const results = await Promise.all(imagePromises)

    return NextResponse.json({ description, results })
  } catch (err: any) {
    console.error("[VirtualTrial] Error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
