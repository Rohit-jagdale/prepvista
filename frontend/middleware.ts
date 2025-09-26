import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.url
  
  // Debug logging
  console.log('🔍 MIDDLEWARE DEBUG:', {
    pathname,
    url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    cookies: request.headers.get('cookie'),
    timestamp: new Date().toISOString()
  })
  
  // Skip middleware for API routes, auth routes, and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    console.log('⏭️ Skipping middleware for:', pathname)
    return NextResponse.next()
  }
  
  // Only protect /app routes - let other routes pass through
  if (pathname.startsWith('/app')) {
    console.log('🔒 Protecting /app route:', pathname)
    
    try {
      console.log('🔑 Checking for token...')
      console.log('Environment check:', {
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      })
      
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET
      })
      
      console.log('🎫 Token result:', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : null,
        tokenId: token?.id,
        tokenEmail: token?.email
      })
      
      if (!token) {
        console.log('❌ No token found, redirecting to signin')
        const redirectUrl = new URL('/auth/signin', request.url)
        console.log('🔄 Redirecting to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)
      }
      
      console.log('✅ Token found, allowing access to:', pathname)
    } catch (error) {
      console.error('💥 Middleware error:', error)
      console.log('🔄 Error occurred, redirecting to signin')
      const redirectUrl = new URL('/auth/signin', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  console.log('✅ Allowing request to proceed:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
