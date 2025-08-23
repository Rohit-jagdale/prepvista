'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, User, LogOut, ChevronDown, Home, BarChart3, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import Link from 'next/link'
import Logo from './Logo'

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/app" className="flex items-center space-x-3">
              <Logo />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/app" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <Link href="/app/practice" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Practice
            </Link>
            <Link href="/app/progress" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Progress
            </Link>
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
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

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white text-base">{user?.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium">Sign out</span>
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
