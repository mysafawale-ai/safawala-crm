import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login API called")

    // Initialize clients
    let authClient
    try {
      const cookieStore = cookies()
      authClient = createRouteHandlerClient({ cookies: () => cookieStore })
    } catch (configError) {
      console.error("[v0] Supabase configuration error:", configError)
      return NextResponse.json({ 
        error: "Server configuration error. Please contact administrator.",
        details: configError instanceof Error ? configError.message : String(configError)
      }, { status: 500 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email, password } = body
  console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[v0] Invalid email format:", email)
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const ldapPatterns = [/\)\(/g, /\|\|/g, /&&/g, /\*/g]
    if (ldapPatterns.some((pattern) => pattern.test(email))) {
      console.log("[v0] LDAP injection attempt detected")
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Authenticate with Supabase Auth (secure password check by Supabase)
    let { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password
    })

    // Fallback: if user isn't in Supabase Auth yet, verify against legacy users table
    if (signInError || !signInData?.user) {
      console.log("[v0] Supabase Auth sign-in failed, attempting legacy auth fallback:", signInError?.message)

      // Fetch legacy user with hashed password
      const serviceAdminForLegacy = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: legacyUser, error: legacyError } = await serviceAdminForLegacy
        .from("users")
        .select("id, email, password_hash, is_active")
        .ilike("email", email)
        .single()

      if (legacyError || !legacyUser || !legacyUser.is_active) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      // Compare bcrypt hash
      const passwordOk = await bcrypt.compare(password, legacyUser.password_hash || "")
      if (!passwordOk) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      // Create Supabase Auth user via Admin API (first-time migration)
      try {
        await serviceAdminForLegacy.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { legacy_user_id: legacyUser.id }
        })
      } catch (createErr: any) {
        // If user already exists, ignore; else log error
        const msg = createErr?.message || String(createErr)
        if (!/User already registered/i.test(msg)) {
          console.error("[v0] Failed to create Supabase Auth user during migration:", createErr)
        }
      }

      // Try Supabase Auth sign-in again now that user should exist
      const retry = await authClient.auth.signInWithPassword({ email, password })
      signInData = retry.data
      signInError = retry.error

      if (signInError || !signInData?.user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }
    }

    // Fetch user profile (role, franchise, permissions) using service role client
    const serviceAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userProfile, error: profileError } = await serviceAdmin
      .from("users")
      .select(`
        *,
        franchises (
          id,
          name,
          code
        )
      `)
      .ilike("email", email)
      .eq("is_active", true)
      .single()

    if (profileError || !userProfile) {
      console.error("[v0] Profile fetch failed after auth:", profileError)
      // Also sign out to clear any partial session
      await authClient.auth.signOut()
      return NextResponse.json({ error: "Account is inactive or missing profile" }, { status: 401 })
    }

    const user = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      franchise_id: userProfile.franchise_id,
      franchise_name: userProfile.franchises?.name || null,
      franchise_code: userProfile.franchises?.code || null,
      is_active: userProfile.is_active,
      permissions: userProfile.permissions || {},
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
    }

    console.log("[v0] Login successful for:", email)

    // Build response and set an HTTP-only auth cookie for middleware checks
    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      user,
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
        expires_at: signInData.session?.expires_at,
        expires_in: signInData.session?.expires_in
      }
    })

    try {
      // Minimal cookie payload to identify user server-side (no tokens)
      const cookiePayload = JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        franchise_id: user.franchise_id,
      })
      res.cookies.set('safawala_user', cookiePayload, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    } catch (cookieErr) {
      console.warn('[v0] Failed to set safawala_user cookie:', cookieErr)
    }

    return res
  } catch (error) {
    console.error("[v0] Unexpected login error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
