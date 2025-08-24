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
        studyStreaks: {
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentStreak = user.studyStreaks.find(streak => streak.isActive)
    const allStreaks = user.studyStreaks

    return NextResponse.json({
      currentStreak,
      allStreaks,
      totalStreaks: allStreaks.length,
      longestStreak: allStreaks.length > 0 ? Math.max(...allStreaks.map(s => s.daysCount)) : 0
    })
  } catch (error) {
    console.error('Error fetching streaks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if user has an active streak
    const activeStreak = await prisma.studyStreak.findFirst({
      where: {
        userId: user.id,
        isActive: true
      }
    })

    if (activeStreak) {
      // Update existing streak
      const updatedStreak = await prisma.studyStreak.update({
        where: { id: activeStreak.id },
        data: {
          daysCount: activeStreak.daysCount + 1,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ streak: updatedStreak, action: 'updated' })
    } else {
      // Create new streak
      const newStreak = await prisma.studyStreak.create({
        data: {
          userId: user.id,
          startDate: today,
          daysCount: 1,
          isActive: true
        }
      })

      return NextResponse.json({ streak: newStreak, action: 'created' })
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
