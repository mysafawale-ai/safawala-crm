import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login"]
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie
  const session = request.cookies.get("safawala_session")?.value

  if (!session) {
    // Redirect to login with original URL as redirect param
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1"
    
    if (isLocal) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      // Production: redirect to main website
      return NextResponse.redirect(new URL("https://mysafawala.com/", request.url))
    }
  }

  // Optional: Validate session cookie content
  try {
    const sessionData = JSON.parse(session)
    if (!sessionData.id || !sessionData.email) {
      throw new Error("Invalid session data")
    }
  } catch (error) {
    // Invalid session → Clear cookie and redirect to login
    console.error("[Middleware] Invalid session cookie:", error)
    const loginUrl = new URL("/auth/login", request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set("safawala_session", "", { 
      maxAge: 0,
      path: "/" 
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Protect all routes except static files, API routes, and public assets
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, etc.)
     * - api routes (they have their own auth)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
