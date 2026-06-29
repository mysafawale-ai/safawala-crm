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
                text: `You are helping generate a fashion try-on illustration for a wedding accessories business.
Image 1 shows a model wearing ethnic Indian attire. Image 2 shows a ${productName || "safa/turban"} product.

Describe the following for use in an AI image generation prompt:
1. Model appearance: approximate skin tone (light/medium/dark), clothing (kurta color, style), facial hair if any, build
2. The ${productName || "safa/turban"}: exact color(s), fabric texture, pattern (bandhani/plain/embroidered etc.), how it is wrapped and any decorative elements

Keep it factual and concise — 3-4 sentences total. This is for a professional fashion catalog.`,
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

    // Note: images are AI-generated illustrations based on descriptions, not using real face data.
    // This is a consented business fashion catalog tool for wedding accessories.
    const basePrompt = `Indian wedding fashion illustration, professional catalog style.
A Indian man with ${description}
He is wearing a ${productName || "safa turban"} on his head, properly tied in traditional Indian groom style.
Full body portrait, studio lighting, plain white background.
Illustrated style, no real person, fashion catalog artwork.`

    const imagePromises = angles.map(({ label, angle }) =>
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: `${basePrompt} View: ${angle}. High quality, sharp details.`,
          n: 1,
          size: "1024x1024",
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const e = await r.json()
          return { label, error: e.error?.message || "Generation failed" }
        }
        const d = await r.json()
        const item = d.data[0]
        // gpt-image-1 returns b64_json, convert to data URL
        const url = item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : null)
        return { label, url }
      })
    )

    const results = await Promise.all(imagePromises)

    return NextResponse.json({ description, results })
  } catch (err: any) {
    console.error("[VirtualTrial] Error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
