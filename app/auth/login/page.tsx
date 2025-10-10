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
import { toast } from "@/hooks/use-toast"
import { Crown, Sparkles, Star, Gem } from "lucide-react"

export default function AuthLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get("redirect")

          if (redirectTo) {
            console.log("[v0] User already authenticated, redirecting to:", redirectTo)
            router.push(redirectTo)
            return
          }
        }
      } catch (error) {
        console.log("[v0] No existing authentication found")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Attempting login with:", email)
      await signIn(email, password)
      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      console.log("[v0] Login successful, redirecting to dashboard")
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get("redirect") || "/dashboard"
      router.push(redirectTo)
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      const errorMessage = error.message || "Login failed. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory pattern-jaali">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brown-200 border-t-brown-500 mx-auto"></div>
            <Crown className="h-6 w-6 text-brown-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-brown-700 font-medium">Loading your royal experience...</p>
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
                <Crown className="h-12 w-12 text-white relative z-10" />
                <div className="absolute top-1 right-1 w-3 h-3 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-white/20 rounded-full"></div>
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-brown-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -left-1">
                <Star className="h-4 w-4 text-brown-300" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-playfair font-bold text-heritage-brown mb-3">Safawala.com</h1>
          <p className="text-xl text-brown-700 font-medium mb-2">Premium Wedding Turban & Accessories</p>
          <p className="text-sm text-brown-600 italic">Heritage meets Modern SaaS</p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="w-8 h-0.5 bg-brown-400 rounded-full"></div>
            <Gem className="h-3 w-3 text-brown-500" />
            <div className="w-16 h-1 gradient-heritage rounded-full"></div>
            <Gem className="h-3 w-3 text-brown-500" />
            <div className="w-8 h-0.5 bg-brown-400 rounded-full"></div>
          </div>
        </div>

        <Card className="card-heritage border-0 p-3 relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brown-300 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brown-300 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brown-300 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brown-300 rounded-br-2xl"></div>

          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-playfair font-semibold text-heritage-brown">Welcome Back</CardTitle>
            <CardDescription className="text-brown-600 text-base">Sign in to access your premium CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-maroon/30 bg-red-50/80">
                <AlertDescription className="text-maroon">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-brown-800 uppercase tracking-wide">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  className="h-12 input-heritage rounded-xl text-base"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-brown-800 uppercase tracking-wide">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
