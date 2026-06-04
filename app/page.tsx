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
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Auto-login disabled - users must manually enter credentials
    // This prevents unnecessary redirects and error loops on the login page
    setIsCheckingAuth(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await signIn(email, password)

      // Wait a bit for session to be properly set
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get("redirect") || "/dashboard"
      
      // Use window.location for full page reload to ensure session is loaded
      window.location.href = redirectTo
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      const errorMessage = error.message || "Login failed. Please check your credentials."
      setError(errorMessage)
      toast.error(errorMessage)
      setIsLoading(false) // Only reset loading on error
    }
    // Don't set isLoading to false on success - let the redirect happen
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-800 mx-auto"></div>
          </div>
          <p className="text-slate-500 font-medium text-xs">Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center text-center">
          <img 
            src="/safawalalogo.png" 
            alt="Safawala Logo" 
            className="h-[120px] w-auto object-contain mb-2" 
            style={{ 
              imageRendering: "-webkit-optimize-contrast",
            }}
          />
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">CRM Portal</p>
        </div>

        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="text-center pt-6 pb-4 px-6">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">Sign in to manage your franchise portal</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-900 rounded-lg p-3">
                <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="h-10 bg-slate-50/50 border border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="h-10 bg-slate-50/50 border border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email.trim()) {
                      setError("Please enter your email address first.")
                      return
                    }
                    try {
                      const { createClient } = await import("@/lib/supabase/client")
                      const supabase = createClient()
                      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                      })
                      if (resetError) throw resetError
                      setError("")
                      alert(`Password reset link sent to ${email}. Please check your inbox.`)
                    } catch (err: any) {
                      setError(err.message || "Failed to send reset email.")
                    }
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-2"
                >
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
