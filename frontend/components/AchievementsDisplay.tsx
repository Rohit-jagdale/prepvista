'use client'

import { Achievement } from '@/lib/hooks/useProgress'
import { Award, Lock } from 'lucide-react'

interface AchievementsDisplayProps {
  achievements: Achievement[]
  loading: boolean
}

export default function AchievementsDisplay({ achievements, loading }: AchievementsDisplayProps) {
  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const earnedAchievements = achievements.filter(a => a.isEarned)
  const unearnedAchievements = achievements.filter(a => !a.isEarned)

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Achievements</h2>
      
      {/* Progress Summary */}
      <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            Progress: {earnedAchievements.length} / {achievements.length}
          </span>
          <span className="text-sm text-primary-600 dark:text-primary-400">
            {Math.round((earnedAchievements.length / achievements.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-primary-200 dark:bg-primary-800 rounded-full h-2">
          <div 
            className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(earnedAchievements.length / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              achievement.isEarned
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                achievement.isEarned
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {achievement.isEarned ? (
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <h3 className={`font-medium ${
                  achievement.isEarned
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {achievement.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {achievement.points} points
                </p>
              </div>
            </div>
            
            <p className={`text-sm ${
              achievement.isEarned
                ? 'text-green-700 dark:text-green-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {achievement.description}
            </p>
            
            {achievement.isEarned && achievement.earnedAt && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Earned {new Date(achievement.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
