import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Simple test log to ensure middleware is running
  console.log('🚀 MIDDLEWARE IS RUNNING!', pathname)
  
  // For now, let's just log and allow everything through
  // This will help us confirm middleware is working
  console.log('🔍 MIDDLEWARE DEBUG:', {
    pathname,
    url: request.url,
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
  
  console.log('✅ Allowing request to proceed:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
  ],
}
