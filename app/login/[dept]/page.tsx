"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

/* ─── Department Config ─────────────────────────────── */
const DEPT_CONFIG: Record<string, {
  label: string
  subtitle: string
  defaultEmail: string
  icon: string
  color: string
  colorDark: string
  gradient: string
  glowColor: string
  bgGradient: string
}> = {
  booking: {
    label: "Booking Portal",
    subtitle: "Sales & Customer Bookings",
    defaultEmail: "booking@safawala.com",
    icon: "🎯",
    color: "#22c55e",
    colorDark: "#15803d",
    gradient: "linear-gradient(145deg, #166534, #16a34a, #22c55e)",
    glowColor: "rgba(34,197,94,0.4)",
    bgGradient: "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)",
  },
  warehouse: {
    label: "Warehouse Portal",
    subtitle: "Inventory & Stock Management",
    defaultEmail: "warehouse@safawala.com",
    icon: "📦",
    color: "#a855f7",
    colorDark: "#7e22ce",
    gradient: "linear-gradient(145deg, #581c87, #9333ea, #a855f7)",
    glowColor: "rgba(168,85,247,0.4)",
    bgGradient: "linear-gradient(160deg, #faf5ff 0%, #f3e8ff 60%, #e9d5ff 100%)",
  },
  qc: {
    label: "QC Portal",
    subtitle: "Quality Control & Inspections",
    defaultEmail: "qc@safawala.com",
    icon: "✅",
    color: "#eab308",
    colorDark: "#a16207",
    gradient: "linear-gradient(145deg, #713f12, #ca8a04, #eab308)",
    glowColor: "rgba(234,179,8,0.4)",
    bgGradient: "linear-gradient(160deg, #fefce8 0%, #fef9c3 60%, #fde68a 100%)",
  },
  delivery: {
    label: "Delivery Portal",
    subtitle: "Dispatch & Returns",
    defaultEmail: "delivery@safawala.com",
    icon: "🚚",
    color: "#14b8a6",
    colorDark: "#0f766e",
    gradient: "linear-gradient(145deg, #134e4a, #0d9488, #14b8a6)",
    glowColor: "rgba(20,184,166,0.4)",
    bgGradient: "linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 60%, #99f6e4 100%)",
  },
  styling: {
    label: "Stylist Portal",
    subtitle: "Safa Styling Assignments",
    defaultEmail: "styling@safawala.com",
    icon: "✂️",
    color: "#ec4899",
    colorDark: "#be185d",
    gradient: "linear-gradient(145deg, #831843, #db2777, #ec4899)",
    glowColor: "rgba(236,72,153,0.4)",
    bgGradient: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 60%, #fbcfe8 100%)",
  },
  accounts: {
    label: "Accounts Portal",
    subtitle: "Finance & Payment Records",
    defaultEmail: "accounts@safawala.com",
    icon: "💰",
    color: "#ef4444",
    colorDark: "#b91c1c",
    gradient: "linear-gradient(145deg, #7f1d1d, #dc2626, #ef4444)",
    glowColor: "rgba(239,68,68,0.4)",
    bgGradient: "linear-gradient(160deg, #fff1f2 0%, #fee2e2 60%, #fecaca 100%)",
  },
  manager: {
    label: "Manager Portal",
    subtitle: "Branch Management",
    defaultEmail: "manager@safawala.com",
    icon: "🏢",
    color: "#3b82f6",
    colorDark: "#1d4ed8",
    gradient: "linear-gradient(145deg, #1e3a8a, #2563eb, #3b82f6)",
    glowColor: "rgba(59,130,246,0.4)",
    bgGradient: "linear-gradient(160deg, #eff6ff 0%, #dbeafe 60%, #bfdbfe 100%)",
  },
  franchise: {
    label: "Franchise Portal",
    subtitle: "Franchise Operations",
    defaultEmail: "franchise@safawala.com",
    icon: "🏪",
    color: "#8b5cf6",
    colorDark: "#6d28d9",
    gradient: "linear-gradient(145deg, #4c1d95, #7c3aed, #8b5cf6)",
    glowColor: "rgba(139,92,246,0.4)",
    bgGradient: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)",
  },
  admin: {
    label: "Admin Portal",
    subtitle: "Super Administration",
    defaultEmail: "admin@safawala.com",
    icon: "👑",
    color: "#f97316",
    colorDark: "#c2410c",
    gradient: "linear-gradient(145deg, #7c2d12, #ea580c, #f97316)",
    glowColor: "rgba(249,115,22,0.4)",
    bgGradient: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)",
  },
  hr: {
    label: "HR Portal",
    subtitle: "Human Resources & Payroll",
    defaultEmail: "hr@safawala.com",
    icon: "👥",
    color: "#6366f1",
    colorDark: "#4f46e5",
    gradient: "linear-gradient(145deg, #312e81, #4f46e5, #6366f1)",
    glowColor: "rgba(99,102,241,0.4)",
    bgGradient: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)",
  },
}

export default function DeptLoginPage() {
  const params = useParams()
  const router = useRouter()
  const dept = (params.dept as string)?.toLowerCase()
  const config = DEPT_CONFIG[dept]

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  useEffect(() => {
    if (!config) {
      router.replace("/auth/portals")
      return
    }
    setEmail(config.defaultEmail)
  }, [config, router])

  if (!config) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError("")

    try {
      const deviceId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2)

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, deviceId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid email or password")

      localStorage.setItem("safawala_user", JSON.stringify(data.user))

      if (data.session?.access_token) {
        try {
          const { createClient } = await import("@/lib/supabase/client")
          const supabase = createClient()
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        } catch {}
      }

      // Redirect to the canonical portal for this dept
      router.push(`/portal/${dept}`)
    } catch (e: any) {
      setError(e.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (focused: boolean, hasValue: boolean) => ({
    width: "100%",
    boxSizing: "border-box" as const,
    height: 54,
    borderRadius: 14,
    border: `1.5px solid ${focused ? config.color : hasValue ? config.color + "50" : "rgba(0,0,0,0.1)"}`,
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 500,
    color: "#111",
    background: focused ? "white" : "rgba(255,255,255,0.8)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s, background 0.2s",
    boxShadow: focused ? `0 0 0 3px ${config.color}20` : "none",
  })

  return (
    <div style={{
      minHeight: "100vh",
      background: config.bgGradient,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Hero Header ── */}
      <div style={{
        background: config.gradient,
        padding: "44px 24px 64px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -70, left: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", top: 30, left: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Back button */}
          <button
            onClick={() => router.push("/auth/portals")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10, padding: "7px 14px",
              color: "rgba(255,255,255,0.85)", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: 32,
              backdropFilter: "blur(10px)",
              fontFamily: "inherit",
            }}
          >
            ← All Portals
          </button>

          {/* Icon */}
          <div style={{
            width: 76, height: 76, borderRadius: 24,
            background: "rgba(255,255,255,0.18)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, marginBottom: 20,
            boxShadow: `0 12px 40px ${config.glowColor}`,
          }}>
            {config.icon}
          </div>

          <h1 style={{
            color: "white", fontSize: 28, fontWeight: 900,
            margin: "0 0 6px", letterSpacing: "-0.5px",
            textShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            {config.label}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, fontWeight: 500 }}>
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* ── Login Card ── */}
      <div style={{ flex: 1, padding: "0 20px 48px", marginTop: -28, position: "relative", zIndex: 2 }}>
        <div style={{
          background: "white",
          borderRadius: 28,
          padding: "32px 24px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(255,255,255,0.8)",
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#111" }}>
            Sign in
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}>
            Enter your credentials to continue
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 12, padding: "12px 16px",
              color: "#dc2626", fontSize: 13, fontWeight: 600,
              marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email field */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "rgba(0,0,0,0.45)", letterSpacing: 1, textTransform: "uppercase",
                marginBottom: 8,
              }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, pointerEvents: "none",
                }}>
                  ✉️
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@safawala.com"
                  required
                  autoComplete="email"
                  style={{ ...inputStyle(emailFocused, !!email), paddingLeft: 44 }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "rgba(0,0,0,0.45)", letterSpacing: 1, textTransform: "uppercase",
                marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, pointerEvents: "none",
                }}>
                  🔒
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle(passFocused, !!password), paddingLeft: 44, paddingRight: 52 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 18, padding: 4, color: "rgba(0,0,0,0.35)", lineHeight: 1,
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: "100%", height: 56, borderRadius: 16, border: "none",
                marginTop: 8,
                background: loading || !email || !password
                  ? "rgba(0,0,0,0.08)"
                  : config.gradient,
                color: loading || !email || !password ? "rgba(0,0,0,0.3)" : "white",
                fontSize: 16, fontWeight: 800,
                cursor: loading || !email || !password ? "not-allowed" : "pointer",
                boxShadow: loading || !email || !password
                  ? "none"
                  : `0 8px 28px ${config.glowColor}`,
                transition: "all 0.25s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: 0.2, fontFamily: "inherit",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  Signing in…
                </>
              ) : (
                <>
                  <span style={{ fontSize: 18 }}>{config.icon}</span>
                  Sign In to {config.label.replace(" Portal", "")}
                </>
              )}
            </button>
          </form>

        </div>

        {/* Brand footer */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(0,0,0,0.3)", fontWeight: 500 }}>
          Safawala CRM · Secure Login
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
