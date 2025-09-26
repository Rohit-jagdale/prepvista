'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { FcGoogle } from 'react-icons/fc'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import UnauthGuard from '@/components/UnauthGuard'
import Logo from '@/components/Logo'
import { useTheme } from '@/lib/theme'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

  const handleGoogleSignIn = async () => {
    console.log('🔐 SignIn Page - Google sign in initiated')
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔄 SignIn Page - Calling signIn with Google')
      const result = await signIn('google', { 
        callbackUrl: '/app',
        redirect: false 
      })
      
      console.log('📋 SignIn Page - Google sign in result:', result)
      
      if (result?.error) {
        console.error('❌ SignIn Page - Google sign in error:', result.error)
        setError('Failed to sign in with Google. Please try again.')
      } else if (result?.url) {
        console.log('✅ SignIn Page - Google sign in successful, redirecting to:', result.url)
        router.push(result.url)
      }
    } catch (error) {
      console.error('💥 SignIn Page - Google sign in exception:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 SignIn Page - Credentials sign in initiated')
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔄 SignIn Page - Calling signIn with credentials')
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/app',
        redirect: false,
      })
      
      console.log('📋 SignIn Page - Credentials sign in result:', result)
      
      if (result?.error) {
        console.error('❌ SignIn Page - Credentials sign in error:', result.error)
        setError('Invalid email or password')
      } else if (result?.url) {
        console.log('✅ SignIn Page - Credentials sign in successful, redirecting to:', result.url)
        router.push(result.url)
      }
    } catch (error) {
      console.error('💥 SignIn Page - Credentials sign in exception:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <UnauthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Link 
                href="/" 
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
              <Logo size="sm" showText={false} showSubtitle={false} />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-900 px-2 text-sm text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </UnauthGuard>
  )
}
