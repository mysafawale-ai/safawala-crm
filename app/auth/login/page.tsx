"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/lib/auth"
import { getDefaultPortalForRole } from "@/lib/portal-config"
import { toast } from "@/hooks/use-toast"

export default function AuthLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsCheckingAuth(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const data = await signIn(email, password)
      toast({ title: "Success", description: "Logged in successfully" })
      const urlParams = new URLSearchParams(window.location.search)
      const explicitRedirect = urlParams.get("redirect")
      if (explicitRedirect) {
        router.push(explicitRedirect)
      } else if (data?.user?.role === "super_admin") {
        window.location.href = "/admin"
      } else if (["franchise_admin", "franchise_owner", "manager"].includes(data?.user?.role || "")) {
        window.location.href = "/dashboard"
      } else if (data?.user?.department) {
        router.push(`/portal/${data.user.department}`)
      } else {
        const portalSlug = getDefaultPortalForRole(data?.user?.role || "staff")
        router.push(`/portal/${portalSlug}`)
      }
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5ebe0" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 border-t-stone-700 mx-auto mb-4"></div>
          <p className="text-stone-500 font-medium text-xs">Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-auth-bg" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "32px 16px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <img
              src="/safawalalogo.svg"
              alt="Safawala Logo"
              style={{ height: 70, width: "auto", display: "block", objectFit: "contain" }}
            />
            <p style={{
              margin: "10px 0 0", fontSize: 11, color: "#92714a",
              fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              CRM Portal
            </p>
          </div>

          {/* Card */}
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 8px 40px rgba(120,80,20,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ padding: "28px 28px 8px", textAlign: "center" }}>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#2c1810", letterSpacing: "-0.3px" }}>
                Welcome Back
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "#92714a", fontStyle: "italic" }}>
                "Manage your traditional business with world class tech."
              </p>
            </div>

            <div style={{ padding: "20px 28px 28px" }}>
              {error && (
                <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-900 rounded-xl p-3 mb-4">
                  <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Email */}
                <div>
                  <Label htmlFor="email" style={{
                    display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "#92714a", marginBottom: 6,
                  }}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="yourname@safawala.com"
                    disabled={isLoading}
                    style={{
                      height: 44, borderRadius: 12,
                      background: "rgba(255,255,255,0.7)",
                      border: "1.5px solid rgba(180,140,80,0.25)",
                      fontSize: 14, color: "#2c1810",
                    }}
                    className="focus-visible:ring-1 focus-visible:ring-amber-400"
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" style={{
                    display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "#92714a", marginBottom: 6,
                  }}>
                    Password
                  </Label>
                  <div style={{ position: "relative" }}>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      disabled={isLoading}
                      style={{
                        height: 44, borderRadius: 12, paddingRight: 44,
                        background: "rgba(255,255,255,0.7)",
                        border: "1.5px solid rgba(180,140,80,0.25)",
                        fontSize: 14, color: "#2c1810",
                      }}
                      className="focus-visible:ring-1 focus-visible:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#b89a6a",
                        display: "flex", alignItems: "center", padding: 0,
                      }}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div style={{ textAlign: "right", marginTop: -8 }}>
                  <a href="/auth/forgot-password" style={{
                    fontSize: 12, color: "#92714a", textDecoration: "none", fontWeight: 500,
                  }}>
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    height: 48, borderRadius: 14, fontSize: 14, fontWeight: 700,
                    background: isLoading ? "#c4a882" : "linear-gradient(135deg, #2c1810, #5c3520)",
                    border: "none", letterSpacing: "0.02em",
                  }}
                  className="w-full text-white transition-all hover:opacity-90"
                >
                  {isLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Signing in...
                    </div>
                  ) : "Sign In"}
                </Button>
              </form>
            </div>
          </div>

        </div>
    </div>
  )
}
