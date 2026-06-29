import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { supabaseServer as supabase } from "@/lib/supabase-server-simple"

/*
  SQL to create team_messages table in Supabase (run once):

  CREATE TABLE team_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    franchise_id UUID,
    user_id UUID,
    user_name TEXT NOT NULL,
    user_role TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    voice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX ON team_messages (franchise_id, created_at DESC);
*/

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = auth.authContext?.user
  const franchiseId = user?.franchise_id
  const since = req.nextUrl.searchParams.get("since")

  let query = supabase
    .from("team_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100)

  if (franchiseId) query = query.eq("franchise_id", franchiseId)
  if (since) query = query.gt("created_at", since)

  const { data, error } = await query

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ data: [], needsSetup: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch seen receipts for these messages
  const messageIds = data?.map(m => m.id) || []
  if (messageIds.length > 0) {
    const { data: seenReceipts, error: seenError } = await supabase
      .from("team_message_seen")
      .select("message_id, user_name, user_id")
      .in("message_id", messageIds)

    if (!seenError && seenReceipts) {
      data.forEach(msg => {
        // Find other users who have seen this message (exclude the message sender themselves)
        const seens = seenReceipts.filter(r => r.message_id === msg.id && r.user_id !== msg.user_id)
        msg.seen_by = seens.map(r => r.user_name)
      })
    }
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { message, message_type = "text", voice_url } = body
  const user = auth.authContext?.user
  const franchiseId = user?.franchise_id

  if (!message?.trim() && message_type !== "voice") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("team_messages")
    .insert({
      franchise_id: franchiseId || null,
      user_id: user?.id || null,
      user_name: user?.name || "Unknown",
      user_role: user?.role || "staff",
      message: message?.trim() || "",
      message_type,
      voice_url: voice_url || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ error: "Team chat table not set up yet. Please run the SQL migration in Supabase.", needsSetup: true }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error } = await supabase.from("team_messages").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
