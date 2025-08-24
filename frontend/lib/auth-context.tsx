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

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  const handleSignIn = async (provider: string = 'google') => {
    try {
      await signIn(provider, { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user: session?.user || null,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session?.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
