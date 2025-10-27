"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn, getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import { Crown, Sparkles, Star, Gem } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("admin@safawala.com")
  const [password, setPassword] = useState("admin123")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
    toast.success("Demo credentials filled! Click Sign In to continue.")
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get("redirect") || "/dashboard"
          
          // Prevent redirect loop - don't redirect if already on login page
          if (redirectTo === "/" || redirectTo === window.location.pathname) {
            router.push("/dashboard")
          } else {
            router.push(redirectTo)
          }
          return
        }
      } catch (error) {
        console.log("No existing authentication found")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    // Slight delay to avoid race conditions
    setTimeout(checkAuth, 100)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Attempting login with:", email)
      await signIn(email, password)
      
      // Wait a bit for session to be properly set
      await new Promise(resolve => setTimeout(resolve, 300))
      
      toast.success("Logged in successfully")
      console.log("[v0] Login successful, redirecting to dashboard")
      
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
      <div className="min-h-screen flex items-center justify-center bg-ivory pattern-jaali">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-200 border-t-gold-500 mx-auto"></div>
            <Crown className="h-6 w-6 text-gold-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gold-700 font-medium">Loading your royal experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory pattern-jaali py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-6 gradient-heritage rounded-3xl shadow-glow relative overflow-hidden">
                <Crown className="h-12 w-12 relative z-10" style={{ color: "#102516" }} />
                <div className="absolute top-1 right-1 w-3 h-3 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-white/20 rounded-full"></div>
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-gold-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -left-1">
                <Star className="h-4 w-4 text-gold-300" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-playfair font-bold text-heritage-gold mb-3">Safawala.com</h1>
          <p className="text-xl text-gold-700 font-medium mb-2">Premium Wedding Turban & Accessories</p>
          <p className="text-sm text-gold-600 italic">Heritage meets Modern SaaS</p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="w-8 h-0.5 bg-gold-400 rounded-full"></div>
            <Gem className="h-3 w-3 text-gold-500" />
            <div className="w-16 h-1 gradient-heritage rounded-full"></div>
            <Gem className="h-3 w-3 text-gold-500" />
            <div className="w-8 h-0.5 bg-gold-400 rounded-full"></div>
          </div>
        </div>

        <Card className="card-heritage border-0 p-3 relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold-300 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold-300 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold-300 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold-300 rounded-br-2xl"></div>

          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-playfair font-semibold text-heritage-gold">Welcome Back</CardTitle>
            <CardDescription className="text-gold-600 text-base">Sign in to access your premium CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-maroon/30 bg-red-50/80">
                <AlertDescription className="text-maroon">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gold-800 uppercase tracking-wide">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@safawala.com"
                  disabled={isLoading}
                  className="h-12 input-heritage rounded-xl text-base"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gold-800 uppercase tracking-wide">
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
                  className="h-12 input-heritage rounded-xl text-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 btn-primary rounded-xl text-lg font-semibold relative overflow-hidden"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 p-6 bg-gold-50/80 rounded-2xl border-2 border-gold-200/50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, var(--gold-400) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                ></div>
              </div>

              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="p-2 bg-gold-200 rounded-lg">
                  <Crown className="h-5 w-5 text-gold-700" />
                </div>
                <h3 className="text-lg font-playfair font-semibold text-gold-900">Demo Credentials</h3>
              </div>

              <div className="space-y-4 text-sm relative z-10">
                {/* Super Admin */}
                <div className="p-4 bg-white/90 rounded-xl border-2 border-gold-300 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-gold-100 rounded">
                        <Crown className="h-4 w-4 text-gold-600" />
                      </div>
                      <p className="font-bold text-gold-900 text-base">Super Admin</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDemoLogin("admin@safawala.com", "admin123")}
                      className="bg-gold-600 hover:bg-gold-700 text-white text-xs px-3 py-1 h-7"
                    >
                      Use This
                    </Button>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">Email: <span className="text-gold-800">admin@safawala.com</span></p>
                  <p className="text-gray-700 font-medium">Password: <span className="text-gold-800">admin123</span></p>
                  <p className="text-xs text-gold-600 mt-2 italic">Full system access, all franchises</p>
                </div>

                {/* Franchise Owner */}
                <div className="p-4 bg-white/90 rounded-xl border-2 border-peacock/30 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1.5 bg-peacock/10 rounded">
                      <Gem className="h-4 w-4 text-peacock" />
                    </div>
                    <p className="font-bold text-peacock text-base">Franchise Owner</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-peacock/5 rounded-lg">
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium text-xs">Email: <span className="text-peacock">mysafawale@gmail.com</span></p>
                        <p className="text-xs text-gray-600">→ Dahod Franchise</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleDemoLogin("mysafawale@gmail.com", "abc")}
                        className="bg-peacock hover:bg-peacock/90 text-white text-xs px-3 py-1 h-7 ml-2"
                      >
                        Use
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-peacock/5 rounded-lg">
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium text-xs">Email: <span className="text-peacock">nishitishere@gmail.com</span></p>
                        <p className="text-xs text-gray-600">→ Bangalore Franchise</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleDemoLogin("nishitishere@gmail.com", "abc")}
                        className="bg-peacock hover:bg-peacock/90 text-white text-xs px-3 py-1 h-7 ml-2"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium mt-3 text-center text-xs bg-peacock/10 py-2 rounded">Password: <span className="text-peacock font-bold">any3chars</span></p>
                  <p className="text-xs text-peacock mt-2 italic text-center">Manage own franchise, staff & bookings</p>
                </div>

                {/* Staff */}
                <div className="p-4 bg-white/90 rounded-xl border-2 border-maroon/30 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1.5 bg-maroon/10 rounded">
                      <Star className="h-4 w-4 text-maroon" />
                    </div>
                    <p className="font-bold text-maroon text-base">Staff Members</p>
                  </div>
                  <p className="text-gray-700 mb-2">Email: <span className="text-maroon">Check staff list in your franchise</span></p>
                  <p className="text-gray-700 font-medium">Password: <span className="text-maroon">any3chars</span></p>
                  <p className="text-xs text-maroon mt-2 italic">Create bookings, manage customers</p>
                </div>

                {/* Info Note */}
                <div className="text-xs text-gold-800 bg-gold-100/80 p-4 rounded-xl border border-gold-300">
                  <p className="font-bold mb-2 flex items-center space-x-2">
                    <Sparkles className="h-3 w-3" />
                    <span>Quick Start Guide:</span>
                  </p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Click <strong>"Use This"</strong> or <strong>"Use"</strong> button to auto-fill credentials</li>
                    <li>Then click <strong>"Sign In"</strong> to login</li>
                    <li>Use <strong>Super Admin</strong> for complete system control</li>
                    <li>Use <strong>Franchise Owner</strong> to manage specific location</li>
                    <li>Use <strong>Staff</strong> for day-to-day operations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
