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

    const body = await request.json()
    const { examType, topic, score, totalQuestions, timeSpent, difficulty } = body

    // Map exam types to exam categories
    const examTypeMapping: { [key: string]: string } = {
      'upsc': 'UPSC',
      'mpsc': 'MPSC', 
      'ibps': 'IBPS',
      'ssc': 'SSC',
      'cat': 'CAT',
      'college-placements': 'College Placements'
    }

    const examCategoryName = examTypeMapping[examType] || examType
    let examCategory = await prisma.examCategory.findUnique({
      where: { name: examCategoryName }
    })

    // Create exam category if it doesn't exist
    if (!examCategory) {
      examCategory = await prisma.examCategory.create({
        data: {
          name: examCategoryName,
          description: `${examCategoryName} examination preparation`,
          icon: '📚',
          color: '#3B82F6'
        }
      })
    }

    // Calculate accuracy percentage
    const accuracyRate = (score / totalQuestions) * 100

    // Create practice session
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: user.id,
        examCategoryId: examCategory.id,
        sessionName: `${examCategoryName} - ${topic}`,
        totalQuestions,
        correctAnswers: score,
        score: accuracyRate,
        timeSpent: timeSpent || 0,
        completedAt: new Date()
      }
    })

    // Check for achievements
    const achievements = await prisma.achievement.findMany()
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id }
    })

    const earnedAchievementIds = userAchievements.map(ua => ua.achievementId)
    const newlyEarnedAchievements = []

    // Check "First Steps" achievement
    const firstStepsAchievement = achievements.find(a => a.name === 'First Steps')
    if (firstStepsAchievement && !earnedAchievementIds.includes(firstStepsAchievement.id)) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: firstStepsAchievement.id
        }
      })
      newlyEarnedAchievements.push(firstStepsAchievement)
    }

    // Check "Accuracy Master" achievement
    const accuracyMasterAchievement = achievements.find(a => a.name === 'Accuracy Master')
    if (accuracyMasterAchievement && accuracyRate >= 90 && !earnedAchievementIds.includes(accuracyMasterAchievement.id)) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: accuracyMasterAchievement.id
        }
      })
      newlyEarnedAchievements.push(accuracyMasterAchievement)
    }

    // Check "Perfect Score" achievement
    const perfectScoreAchievement = achievements.find(a => a.name === 'Perfect Score')
    if (perfectScoreAchievement && accuracyRate === 100 && !earnedAchievementIds.includes(perfectScoreAchievement.id)) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: perfectScoreAchievement.id
        }
      })
      newlyEarnedAchievements.push(perfectScoreAchievement)
    }

    // Check "Speed Demon" achievement (if timeSpent is provided and under 10 minutes)
    if (timeSpent && timeSpent < 600) {
      const speedDemonAchievement = achievements.find(a => a.name === 'Speed Demon')
      if (speedDemonAchievement && !earnedAchievementIds.includes(speedDemonAchievement.id)) {
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: speedDemonAchievement.id
          }
        })
        newlyEarnedAchievements.push(speedDemonAchievement)
      }
    }

    // Check "Question Crusher" achievement (100+ correct answers total)
    const totalCorrectAnswers = await prisma.practiceSession.aggregate({
      where: { userId: user.id },
      _sum: { correctAnswers: true }
    })
    
    const totalCorrect = (totalCorrectAnswers._sum.correctAnswers || 0) + score
    const questionCrusherAchievement = achievements.find(a => a.name === 'Question Crusher')
    if (questionCrusherAchievement && totalCorrect >= 100 && !earnedAchievementIds.includes(questionCrusherAchievement.id)) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: questionCrusherAchievement.id
        }
      })
      newlyEarnedAchievements.push(questionCrusherAchievement)
    }

    // Check "Exam Explorer" achievement (practice in 3+ different categories)
    const uniqueCategories = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      select: { examCategoryId: true },
      distinct: ['examCategoryId']
    })
    
    const examExplorerAchievement = achievements.find(a => a.name === 'Exam Explorer')
    if (examExplorerAchievement && uniqueCategories.length >= 3 && !earnedAchievementIds.includes(examExplorerAchievement.id)) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: examExplorerAchievement.id
        }
      })
      newlyEarnedAchievements.push(examExplorerAchievement)
    }

    return NextResponse.json({ 
      success: true, 
      practiceSession,
      newlyEarnedAchievements,
      message: 'Practice session recorded successfully'
    })
  } catch (error) {
    console.error('Error recording practice session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
