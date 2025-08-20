import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect all /app routes
  if (pathname.startsWith('/app')) {
    // Check if user has a session cookie
    const hasSession = request.cookies.has('next-auth.session-token') || 
                      request.cookies.has('__Secure-next-auth.session-token')
    
    if (!hasSession) {
      // Redirect to landing page if no session
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/app/:path*',
  ],
}
