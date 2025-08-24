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
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { points: 'asc' }
    })

    // Get user's earned achievements
    const userAchievements = user.achievements.map(ua => ua.achievement.id)

    // Mark which achievements the user has earned
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement,
      isEarned: userAchievements.includes(achievement.id)
    }))

    return NextResponse.json({
      achievements: achievementsWithStatus,
      totalEarned: user.achievements.length,
      totalAvailable: allAchievements.length
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
