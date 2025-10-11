import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login API called")

    // Check Supabase configuration first
    let supabase
    try {
      supabase = createClient()
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

    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    console.log("[v0] Login attempt from IP:", clientIP)

    if (password.length < 3) {
      console.log("[v0] Password too short")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    let userProfile
    try {
      console.log("[v0] Querying database for user:", email)
      const { data, error: profileError } = await supabase
        .from("users")
        .select(`
          *,
          franchises (
            id,
            name,
            code
          )
        `)
        .eq("email", email)
        .eq("is_active", true)
        .single()

      if (profileError) {
        console.error("[v0] Database query error:", profileError)
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      userProfile = data
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    if (!userProfile) {
      console.log("[v0] User not found:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("[v0] User found:", userProfile.name)

    // Create a simple session identifier
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    console.log("[v0] Session created successfully")

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

    console.log("[v0] Creating response for user:", user.name, "franchise:", user.franchise_id)

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user
    })

    try {
      // Store user session data in a cookie
      const sessionData = {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        sessionId: sessionId
      }
      
      response.cookies.set("safawala_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 hours
        path: "/",
      })
      console.log("[v0] Session cookie set successfully")
    } catch (cookieError) {
      console.error("[v0] Cookie setting error:", cookieError)
      // Don't fail the request if cookie setting fails
    }

    console.log("[v0] Login successful for:", email)
    return response
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
