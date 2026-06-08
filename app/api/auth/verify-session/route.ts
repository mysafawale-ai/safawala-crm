import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Checks if the current session token in the cookie matches
 * the latest session_token stored in the DB for this user.
 * If they don't match, another device has logged in → this session is invalid.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieRaw = request.cookies.get("safawala_user")?.value
    if (!cookieRaw) {
      return NextResponse.json({ valid: false, reason: "no_cookie" })
    }

    let parsed: any
    try {
      parsed = JSON.parse(cookieRaw)
    } catch {
      return NextResponse.json({ valid: false, reason: "bad_cookie" })
    }

    const { id: userId, session_token: cookieToken } = parsed

    if (!userId || !cookieToken) {
      // Old session without token — still valid (no enforcement yet)
      return NextResponse.json({ valid: true, reason: "legacy_session" })
    }

    const serviceAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await serviceAdmin
      .from("users")
      .select("session_token, is_active")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ valid: false, reason: "user_not_found" })
    }

    if (!user.is_active) {
      return NextResponse.json({ valid: false, reason: "account_inactive" })
    }

    if (!user.session_token) {
      // No session token in DB yet — valid (backward compat)
      return NextResponse.json({ valid: true, reason: "no_db_token" })
    }

    if (user.session_token !== cookieToken) {
      return NextResponse.json({
        valid: false,
        reason: "session_replaced",
        message: "You have been logged out because your account was accessed from another device.",
      })
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error("[verify-session]", err)
    return NextResponse.json({ valid: true }) // Fail open to avoid locking users out on transient errors
  }
}
