import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // Protect all /app routes
  if (pathname.startsWith('/app')) {
    if (!token) {
      // Redirect to landing page if no session
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect authenticated users from / to /app
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/app', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
  ],
}
