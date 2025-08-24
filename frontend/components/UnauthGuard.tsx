'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import GlobalLoading from './GlobalLoading'

interface UnauthGuardProps {
  children: React.ReactNode
}

export default function UnauthGuard({ children }: UnauthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/app')
    }
  }, [isAuthenticated, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <GlobalLoading text="Checking authentication..." size="lg" fullScreen={true} />
      </div>
    )
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <GlobalLoading text="Redirecting to dashboard..." size="lg" fullScreen={true} />
      </div>
    )
  }

  // User is not authenticated, show the auth page
  return <>{children}</>
}
