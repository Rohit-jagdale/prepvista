import { Metadata } from 'next'
import AuthGuard from '@/components/AuthGuard'

export const metadata: Metadata = {
  title: 'Dashboard - PrepVista',
  description: 'Your personalized exam preparation dashboard with AI-powered practice questions.',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthGuard>
  )
}
