import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { variant_name, price, inclusions, category_name } = body

  if (!variant_name) {
    return NextResponse.json({ error: "Package name required" }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 })
  }

  const inclusionText = inclusions?.length
    ? `Inclusions: ${inclusions.join(", ")}`
    : "Standard wedding accessories package"

  const systemPrompt = `You are a friendly, warm assistant for Safawala — a premium Indian wedding accessories business based in India.
Your job is to explain a wedding package to a customer in simple, everyday language — like a friend explaining it.

Guidelines:
- Write 2-3 short paragraphs max
- Use simple Hindi-English mix where natural (e.g. "shaadi", "baraat", "dulha")
- Explain what's included and how it works (we deliver, they use, we collect)
- Make them excited about it — mention how it will look at the wedding
- Keep it under 120 words total
- No bullet points, no markdown, just warm flowing text`

  const userMessage = `Package: ${variant_name}
Category: ${category_name || "Wedding Package"}
Price: ₹${price?.toLocaleString("en-IN") || "Custom"}
${inclusionText}

Explain this package to a customer in layman's language.`

  try {
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
          { role: "user", content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[explain-package] OpenAI error:", err)
      return NextResponse.json({ error: "AI failed" }, { status: 500 })
    }

    const json = await res.json()
    const explanation = json.choices?.[0]?.message?.content?.trim() || ""

    return NextResponse.json({ success: true, explanation })
  } catch (err) {
    console.error("[explain-package] Error:", err)
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 })
  }
}
