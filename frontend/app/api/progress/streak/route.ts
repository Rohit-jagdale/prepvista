import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      // Check if streak is from today
      const streakDate = new Date(activeStreak.startDate)
      streakDate.setHours(0, 0, 0, 0)
      
      if (streakDate.getTime() === today.getTime()) {
        // Already practiced today, streak continues
        return NextResponse.json({ 
          streak: activeStreak, 
          action: 'continued',
          message: 'Streak continued for today'
        })
      } else if (streakDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
        // Yesterday, continue streak
        const updatedStreak = await prisma.studyStreak.update({
          where: { id: activeStreak.id },
          data: {
            daysCount: activeStreak.daysCount + 1,
            updatedAt: new Date()
          }
        })

        return NextResponse.json({ 
          streak: updatedStreak, 
          action: 'updated',
          message: 'Streak updated for today'
        })
      } else {
        // Streak broken, start new one
        await prisma.studyStreak.update({
          where: { id: activeStreak.id },
          data: {
            isActive: false,
            endDate: new Date()
          }
        })

        const newStreak = await prisma.studyStreak.create({
          data: {
            userId: user.id,
            startDate: today,
            daysCount: 1,
            isActive: true
          }
        })

        return NextResponse.json({ 
          streak: newStreak, 
          action: 'new',
          message: 'New streak started'
        })
      }
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

      return NextResponse.json({ 
        streak: newStreak, 
        action: 'created',
        message: 'First streak created'
      })
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
