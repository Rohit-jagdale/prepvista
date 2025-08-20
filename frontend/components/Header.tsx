'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Brain, BookOpen, User, LogOut, ChevronDown, Home, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
  }

  // Don't show header on landing page as it has its own header
  if (isLandingPage) {
    return null
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/app" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PrepVista</h1>
                <p className="text-sm text-gray-600">AI-Powered Learning Platform</p>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/app" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <Link href="/app/practice" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Practice
            </Link>
            <Link href="/app/progress" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Progress
            </Link>
            <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
              Home
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user?.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/signin" className="btn-secondary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
