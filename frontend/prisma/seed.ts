import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create exam categories
  const examCategories = [
    {
      name: 'UPSC',
      description: 'Union Public Service Commission - Civil Services Examination',
      icon: '🏛️',
      color: '#3B82F6'
    },
    {
      name: 'MPSC',
      description: 'Maharashtra Public Service Commission',
      icon: '🏛️',
      color: '#10B981'
    },
    {
      name: 'IBPS',
      description: 'Institute of Banking Personnel Selection',
      icon: '🏦',
      color: '#F59E0B'
    },
    {
      name: 'SSC',
      description: 'Staff Selection Commission',
      icon: '📋',
      color: '#8B5CF6'
    },
    {
      name: 'CAT',
      description: 'Common Admission Test for MBA',
      icon: '🎓',
      color: '#8B5CF6'
    },
    {
      name: 'College Placements',
      description: 'Campus recruitment aptitude tests',
      icon: '👥',
      color: '#EC4899'
    }
  ]

  for (const category of examCategories) {
    await prisma.examCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category
    })
  }

  console.log('✅ Exam categories created')

  // Create achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first practice session',
      icon: '🎯',
      criteria: 'Complete 1 practice session',
      points: 10
    },
    {
      name: 'Consistent Learner',
      description: 'Maintain a 7-day study streak',
      icon: '🔥',
      criteria: 'Study for 7 consecutive days',
      points: 25
    },
    {
      name: 'Accuracy Master',
      description: 'Achieve 90% accuracy in a session',
      icon: '⭐',
      criteria: 'Score 90% or higher in any practice session',
      points: 50
    },
    {
      name: 'Question Crusher',
      description: 'Answer 100 questions correctly',
      icon: '💪',
      criteria: 'Answer 100 questions correctly across all sessions',
      points: 100
    },
    {
      name: 'Exam Explorer',
      description: 'Practice in 3 different exam categories',
      icon: '🗺️',
      criteria: 'Complete practice sessions in 3 different exam categories',
      points: 75
    },
    {
      name: 'Speed Demon',
      description: 'Complete a session in under 10 minutes',
      icon: '⚡',
      criteria: 'Complete a practice session in less than 10 minutes',
      points: 30
    },
    {
      name: 'Perfect Score',
      description: 'Achieve 100% accuracy in a session',
      icon: '🏆',
      criteria: 'Score 100% in any practice session',
      points: 150
    },
    {
      name: 'Marathon Runner',
      description: 'Maintain a 30-day study streak',
      icon: '🏃',
      criteria: 'Study for 30 consecutive days',
      points: 200
    }
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement
    })
  }

  console.log('✅ Achievements created')



  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
