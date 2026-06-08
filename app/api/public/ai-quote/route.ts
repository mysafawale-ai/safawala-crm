import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const ADMIN_PASSWORD = process.env.PACKAGES_ADMIN_PASSWORD || "Safawala@5678"

function roundToHundred(n: number): number {
  return Math.round(n / 100) * 100
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password, command, variants } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }
  if (!command?.trim()) {
    return NextResponse.json({ error: "Command required" }, { status: 400 })
  }
  if (!variants?.length) {
    return NextResponse.json({ error: "No variants provided" }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
  }

  const variantList = variants
    .map((v: any) => `- ID: ${v.id} | Name: "${v.name}" | Base Price: ₹${v.base_price}`)
    .join("\n")

  const systemPrompt = `You are a pricing assistant for Safawala — a premium Indian wedding accessories business.
Packages include safas (turbans), malas, kalgis, etc. named like "21 Safa", "41 Safa", "51 Safa", "71 Safa", etc.

When the user gives a command:
1. Identify which packages they want (by number like "41, 51, 71" or "all" or "41 and 51")
2. Apply the price change (increase/decrease by %, or set a fixed price)
3. Round ALL prices to the nearest ₹100 (no paise, no decimals — 6750 becomes 6800)
4. Return ONLY valid JSON with no extra text

Return this exact JSON format:
{
  "selected": [
    { "id": "<variant_id>", "name": "<variant_name>", "original_price": <number>, "new_price": <number> }
  ],
  "summary": "<1 line summary of what was done>"
}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Available packages:\n${variantList}\n\nCommand: "${command}"` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[ai-quote] OpenAI error:", err)
    let userMsg = "AI processing failed."
    try {
      const errJson = JSON.parse(err)
      userMsg = errJson?.error?.message || userMsg
    } catch {}
    return NextResponse.json({ error: userMsg }, { status: 500 })
  }

  const json = await res.json()
  const raw = (json.choices?.[0]?.message?.content || "").trim()
  console.log("[ai-quote] raw response:", raw.slice(0, 200))

  if (!raw) {
    return NextResponse.json({ error: "AI returned empty response. Try again." }, { status: 500 })
  }

  // Strip markdown code blocks if present (```json ... ```)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

  try {
    const result = JSON.parse(cleaned)
    if (!result.selected || !Array.isArray(result.selected)) {
      return NextResponse.json({ error: "AI did not select any packages. Try a more specific command." }, { status: 400 })
    }
    // Enforce rounding on all prices
    result.selected = result.selected.map((item: any) => ({
      ...item,
      new_price: roundToHundred(Number(item.new_price) || 0),
    }))
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    console.error("[ai-quote] JSON parse error:", e, "raw:", raw)
    return NextResponse.json({ error: "AI returned an unreadable response. Please try again." }, { status: 500 })
  }
}
