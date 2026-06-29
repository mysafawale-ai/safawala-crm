import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

// Convert base64 data URL to a Blob-compatible Buffer + mime type
function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string; ext: string } {
  const [header, b64] = dataUrl.split(",")
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg"
  const ext = mimeType === "image/png" ? "png" : "jpg"
  return { buffer: Buffer.from(b64, "base64"), mimeType, ext }
}

// Build a FormData body for the image edits endpoint
async function buildEditForm(
  personBuffer: Buffer,
  personMime: string,
  personExt: string,
  prompt: string
): Promise<{ body: FormData }> {
  const form = new FormData()
  const blob = new Blob([personBuffer], { type: personMime })
  form.append("image[]", blob, `person.${personExt}`)
  form.append("model", "gpt-image-1")
  form.append("prompt", prompt)
  form.append("n", "1")
  form.append("size", "1024x1024")
  return { body: form }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, { minRole: "readonly" })
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { personImageBase64, productImageBase64, productName } = body

    if (!personImageBase64 || !productImageBase64) {
      return NextResponse.json({ error: "Both person and product images are required" }, { status: 400 })
    }

    // Step 1: Describe the product using GPT-4o vision (product only — avoids face policy)
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This is a ${productName || "safa turban"} product image for a wedding accessories business.
Describe it precisely for use in an AI image generation prompt:
- Exact colors and pattern (bandhani/plain/embroidered/etc.)
- Fabric texture
- How it is wrapped/tied
- Any decorative elements (feather, brooch, jewels etc.)
2-3 sentences only.`,
              },
              { type: "image_url", image_url: { url: productImageBase64, detail: "high" } },
            ],
          },
        ],
      }),
    })

    const visionData = await visionRes.json()
    const productDescription = visionData.choices?.[0]?.message?.content || `a ${productName || "safa turban"}`

    // Step 2: Use gpt-image-1 image edits to place the turban on the ACTUAL person photo
    // This edits the real photo rather than generating from scratch — much more realistic
    const { buffer: personBuffer, mimeType: personMime, ext: personExt } = parseDataUrl(personImageBase64)

    const angles = [
      { label: "Front View",  prompt: `This is a real photo of a person. Keep their face, skin tone, clothing, and body EXACTLY as they appear. Add only a ${productName || "safa turban"} on their head: ${productDescription}. The turban must look photorealistic, naturally placed on the head, front-facing view. Do not change anything else about the person.` },
      { label: "Side View",   prompt: `This is a real photo of a person. Keep their face, skin tone, clothing, and body EXACTLY as they appear. Add only a ${productName || "safa turban"} on their head: ${productDescription}. Show the turban from a left side profile angle. Photorealistic. Do not change anything else.` },
      { label: "3/4 View",    prompt: `This is a real photo of a person. Keep their face, skin tone, clothing, and body EXACTLY as they appear. Add only a ${productName || "safa turban"} on their head: ${productDescription}. Show from a 3/4 angle view. Photorealistic. Do not change anything else.` },
      { label: "Back View",   prompt: `This is a real photo of a person. Keep their clothing and body EXACTLY as they appear. Add only a ${productName || "safa turban"} on their head: ${productDescription}. Show the back of the turban, back-of-head view, studio background. Photorealistic.` },
    ]

    const imagePromises = angles.map(async ({ label, prompt }) => {
      try {
        const { body: form } = await buildEditForm(personBuffer, personMime, personExt, prompt)

        const r = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: form,
        })

        if (!r.ok) {
          const e = await r.json()
          return { label, error: e.error?.message || "Generation failed" }
        }
        const d = await r.json()
        const item = d.data?.[0]
        const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null)
        return { label, url }
      } catch (e: any) {
        return { label, error: e.message }
      }
    })

    // Run all 4 in parallel
    const results = await Promise.all(imagePromises)

    return NextResponse.json({ description: productDescription, results })
  } catch (err: any) {
    console.error("[VirtualTrial] Error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
