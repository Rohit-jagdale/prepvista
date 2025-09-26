'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  // Debug logging for session changes
  useEffect(() => {
    console.log('🔄 AuthProvider - Session status changed:', {
      status,
      hasSession: !!session,
      user: session?.user,
      timestamp: new Date().toISOString()
    })
    
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status, session])

  const handleSignIn = async (provider: string = 'google') => {
    console.log('🔐 AuthProvider - Sign in initiated:', {
      provider,
      callbackUrl: '/app',
      timestamp: new Date().toISOString()
    })
    
    try {
      const result = await signIn(provider, { callbackUrl: '/app' })
      console.log('✅ AuthProvider - Sign in result:', result)
    } catch (error) {
      console.error('❌ AuthProvider - Sign in error:', error)
    }
  }

  const handleSignOut = async () => {
    console.log('🚪 AuthProvider - Sign out initiated:', {
      callbackUrl: '/',
      timestamp: new Date().toISOString()
    })
    
    try {
      const result = await signOut({ callbackUrl: '/' })
      console.log('✅ AuthProvider - Sign out result:', result)
    } catch (error) {
      console.error('❌ AuthProvider - Sign out error:', error)
    }
  }

  const value = {
    user: session?.user || null,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session?.user,
  }

  console.log('🎯 AuthProvider - Current auth state:', {
    isAuthenticated: value.isAuthenticated,
    loading: value.loading,
    hasUser: !!value.user,
    userEmail: value.user?.email,
    timestamp: new Date().toISOString()
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
