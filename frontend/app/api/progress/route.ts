import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        practiceSessions: {
          include: {
            examCategory: true,
            questions: {
              include: {
                question: true
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: 10
        },
        achievements: {
          include: {
            achievement: true
          },
          orderBy: { earnedAt: 'desc' }
        },
        studyStreaks: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalQuestions = user.practiceSessions.reduce((sum, session) => sum + session.totalQuestions, 0)
    const totalCorrect = user.practiceSessions.reduce((sum, session) => sum + session.correctAnswers, 0)
    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    
    // Get current study streak
    const currentStreak = user.studyStreaks[0] || null
    const streakDays = currentStreak ? currentStreak.daysCount : 0
    
    // Get recent activity
    const recentActivity = user.practiceSessions.slice(0, 5).map((session: { completedAt: Date; examCategory: { name: string }; totalQuestions: number; score: number }) => ({
      date: session.completedAt,
      activity: `Completed ${session.examCategory.name} - ${session.totalQuestions} questions`,
      score: `${Math.round(session.score)}%`
    }))

    // Get performance trend data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const weeklySessions = user.practiceSessions.filter(
      (session: { completedAt: Date }) => session.completedAt >= sevenDaysAgo
    )

    const performanceTrend = weeklySessions.map((session: { completedAt: Date; score: number; totalQuestions: number }) => ({
      date: session.completedAt.toISOString().split('T')[0],
      score: session.score,
      questions: session.totalQuestions
    }))

    return NextResponse.json({
      stats: {
        totalQuestions,
        accuracyRate,
        streakDays,
        achievementsCount: user.achievements.length
      },
      recentActivity,
      performanceTrend,
      achievements: user.achievements.map((ua: { achievement: { id: string; name: string; description: string; icon: string }; earnedAt: Date }) => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        earnedAt: ua.earnedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
