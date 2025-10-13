import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Protect dashboard: if no session cookie, redirect to public website
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("safawala_session")?.value

    if (!session) {
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1"
      const redirectUrl = isLocal ? new URL("/", request.url) : new URL("https://mysafawala.com/")
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run on dashboard routes; avoids API and other paths
  matcher: ["/dashboard/:path*"],
}
