"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

/* ─── Department Config ─────────────────────────────── */
const DEPT_CONFIG: Record<string, {
  label: string
  subtitle: string
  email: string
  icon: string
  emoji: string
  color: string
  colorDark: string
  gradient: string
  glowColor: string
  bgPattern: string
  accentText: string
}> = {
  booking: {
    label: "Booking Portal",
    subtitle: "Sales & Customer Bookings",
    email: "booking@safawala.com",
    icon: "📋",
    emoji: "🎯",
    color: "#22c55e",
    colorDark: "#15803d",
    gradient: "linear-gradient(145deg, #166534, #16a34a, #22c55e)",
    glowColor: "rgba(34,197,94,0.35)",
    bgPattern: "#f0fdf4",
    accentText: "Manage bookings, leads & customer quotes",
  },
  warehouse: {
    label: "Warehouse Portal",
    subtitle: "Inventory & Stock Management",
    email: "warehouse@safawala.com",
    icon: "📦",
    emoji: "🏭",
    color: "#a855f7",
    colorDark: "#7e22ce",
    gradient: "linear-gradient(145deg, #581c87, #9333ea, #a855f7)",
    glowColor: "rgba(168,85,247,0.35)",
    bgPattern: "#faf5ff",
    accentText: "Pick, pack, scan & manage stock levels",
  },
  qc: {
    label: "QC Portal",
    subtitle: "Quality Control & Inspections",
    email: "qc@safawala.com",
    icon: "🔍",
    emoji: "✅",
    color: "#eab308",
    colorDark: "#a16207",
    gradient: "linear-gradient(145deg, #713f12, #ca8a04, #eab308)",
    glowColor: "rgba(234,179,8,0.35)",
    bgPattern: "#fefce8",
    accentText: "Inspect orders and report damage",
  },
  delivery: {
    label: "Delivery Portal",
    subtitle: "Dispatch & Returns",
    email: "delivery@safawala.com",
    icon: "🚚",
    emoji: "📍",
    color: "#14b8a6",
    colorDark: "#0f766e",
    gradient: "linear-gradient(145deg, #134e4a, #0d9488, #14b8a6)",
    glowColor: "rgba(20,184,166,0.35)",
    bgPattern: "#f0fdfa",
    accentText: "Manage shipments, routes & returns",
  },
  styling: {
    label: "Stylist Portal",
    subtitle: "Safa Styling Assignments",
    email: "styling@safawala.com",
    icon: "✂️",
    emoji: "💅",
    color: "#ec4899",
    colorDark: "#be185d",
    gradient: "linear-gradient(145deg, #831843, #db2777, #ec4899)",
    glowColor: "rgba(236,72,153,0.35)",
    bgPattern: "#fdf2f8",
    accentText: "View jobs, earnings & attendance",
  },
  accounts: {
    label: "Accounts Portal",
    subtitle: "Finance & Payment Records",
    email: "accounts@safawala.com",
    icon: "💰",
    emoji: "📊",
    color: "#ef4444",
    colorDark: "#b91c1c",
    gradient: "linear-gradient(145deg, #7f1d1d, #dc2626, #ef4444)",
    glowColor: "rgba(239,68,68,0.35)",
    bgPattern: "#fff1f2",
    accentText: "Payments, expenses & financial reports",
  },
  manager: {
    label: "Manager Portal",
    subtitle: "Branch Management",
    email: "manager@safawala.com",
    icon: "🏢",
    emoji: "📈",
    color: "#3b82f6",
    colorDark: "#1d4ed8",
    gradient: "linear-gradient(145deg, #1e3a8a, #2563eb, #3b82f6)",
    glowColor: "rgba(59,130,246,0.35)",
    bgPattern: "#eff6ff",
    accentText: "Bookings overview, staff & reports",
  },
  franchise: {
    label: "Franchise Portal",
    subtitle: "Franchise Operations",
    email: "franchise@safawala.com",
    icon: "🌐",
    emoji: "🏪",
    color: "#8b5cf6",
    colorDark: "#6d28d9",
    gradient: "linear-gradient(145deg, #4c1d95, #7c3aed, #8b5cf6)",
    glowColor: "rgba(139,92,246,0.35)",
    bgPattern: "#f5f3ff",
    accentText: "Revenue, inventory & franchise staff",
  },
  admin: {
    label: "Admin Portal",
    subtitle: "Super Administration",
    email: "admin@safawala.com",
    icon: "👑",
    emoji: "⚡",
    color: "#f97316",
    colorDark: "#c2410c",
    gradient: "linear-gradient(145deg, #7c2d12, #ea580c, #f97316)",
    glowColor: "rgba(249,115,22,0.35)",
    bgPattern: "#fff7ed",
    accentText: "Full system access across all franchises",
  },
}

export default function DeptLoginPage() {
  const params = useParams()
  const router = useRouter()
  const dept = (params.dept as string)?.toLowerCase()
  const config = DEPT_CONFIG[dept]

  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!config) router.replace("/auth/login")
  }, [config, router])

  if (!config) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
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
        body: JSON.stringify({ email: config.email, password, deviceId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")

      localStorage.setItem("safawala_user", JSON.stringify(data.user))

      // Set supabase session if available
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

      router.push(`/portal/${dept}`)
    } catch (e: any) {
      setError(e.message || "Login failed")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: config.bgPattern,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Hero Header ── */}
      <div
        style={{
          background: config.gradient,
          padding: "48px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -20,
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", top: 20, left: -30,
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Back link */}
          <button
            onClick={() => router.push("/auth/portals")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "6px 12px",
              color: "rgba(255,255,255,0.8)", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: 28,
              backdropFilter: "blur(10px)",
            }}
          >
            ← All Portals
          </button>

          {/* Icon */}
          <div
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, marginBottom: 18,
              boxShadow: `0 8px 32px ${config.glowColor}`,
            }}
          >
            {config.icon}
          </div>

          <h1
            style={{
              color: "white", fontSize: 26, fontWeight: 900,
              margin: "0 0 6px", letterSpacing: "-0.5px",
              textShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {config.label}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 4px", fontWeight: 500 }}>
            {config.subtitle}
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0, fontWeight: 400 }}>
            {config.accentText}
          </p>
        </div>
      </div>

      {/* ── Login Card ── */}
      <div style={{ flex: 1, padding: "0 20px 40px", marginTop: -20, position: "relative", zIndex: 2 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            borderRadius: 24, padding: "28px 24px",
            border: "1px solid rgba(255,255,255,1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 40px rgba(0,0,0,0.1)",
            animation: shake ? "shake 0.4s ease" : "none",
          }}
        >
          {/* Email display */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 10, fontWeight: 700,
              color: "rgba(80,55,30,0.5)",
              letterSpacing: 1.5, textTransform: "uppercase",
              marginBottom: 8,
            }}>
              Signing in as
            </label>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: `${config.color}10`,
                border: `1.5px solid ${config.color}30`,
                borderRadius: 14, padding: "12px 16px",
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: config.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0,
                }}
              >
                {config.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e1208" }}>
                  {config.email}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(80,55,30,0.4)", fontWeight: 500 }}>
                  {config.label}
                </p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={{
                  background: `${config.color}20`, color: config.colorDark,
                  fontSize: 9, fontWeight: 700, padding: "3px 8px",
                  borderRadius: 6, letterSpacing: 0.5,
                }}>
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 12, padding: "10px 14px",
              color: "#dc2626", fontSize: 12, fontWeight: 600,
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 10, fontWeight: 700,
                color: "rgba(80,55,30,0.5)",
                letterSpacing: 1.5, textTransform: "uppercase",
                marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    height: 52, borderRadius: 14, border: `1.5px solid ${password ? config.color + "60" : "rgba(0,0,0,0.1)"}`,
                    padding: "0 48px 0 16px",
                    fontSize: 15, fontWeight: 500, color: "#1e1208",
                    background: "white", outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: 16, padding: 4,
                    color: "rgba(80,55,30,0.4)",
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%", height: 54, borderRadius: 16,
                border: "none",
                background: loading || !password ? "rgba(0,0,0,0.1)" : config.gradient,
                color: loading || !password ? "rgba(0,0,0,0.3)" : "white",
                fontSize: 15, fontWeight: 800, cursor: loading || !password ? "not-allowed" : "pointer",
                boxShadow: loading || !password ? "none" : `0 6px 24px ${config.glowColor}`,
                transition: "all 0.25s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: 0.3,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <span style={{ fontSize: 18 }}>{config.icon}</span>
                  Enter {config.label}
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div
            style={{
              marginTop: 20, padding: "12px 16px",
              background: "rgba(0,0,0,0.03)", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>💡</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(80,55,30,0.5)", fontWeight: 500 }}>
                Demo password:
                <span
                  style={{
                    fontFamily: "monospace", fontWeight: 700,
                    color: config.color, marginLeft: 6,
                  }}
                >
                  Warehouse@5678
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: "rgba(80,55,30,0.35)", fontSize: 11, fontWeight: 500, margin: 0 }}>
            Safawala CRM • {config.label}
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
