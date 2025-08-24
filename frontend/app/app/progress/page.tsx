'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Target, Calendar, Award, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import PerformanceChart from '@/components/PerformanceChart'
import AchievementsDisplay from '@/components/AchievementsDisplay'
import { useProgress, useAchievements, useStudyStreaks } from '@/lib/hooks/useProgress'

export default function ProgressPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const { data: progressData, loading: progressLoading, error: progressError, refreshProgress } = useProgress()
  const { achievements, loading: achievementsLoading } = useAchievements()
  const { currentStreak, loading: streaksLoading } = useStudyStreaks()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getChangeType = (current: number, previous: number) => {
    if (current > previous) return 'positive'
    if (current < previous) return 'negative'
    return 'neutral'
  }

  const getChangeValue = (current: number, previous: number) => {
    const diff = current - previous
    if (diff === 0) return '0%'
    return `${diff > 0 ? '+' : ''}${diff}%`
  }

  if (progressError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{progressError}</p>
            <button 
              onClick={refreshProgress}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Progress</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your learning journey and performance metrics</p>
          </div>
          <button
            onClick={refreshProgress}
            disabled={progressLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${progressLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressLoading ? '...' : progressData?.stats.totalQuestions.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {progressLoading ? 'Loading...' : 'All time total'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accuracy Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressLoading ? '...' : `${progressData?.stats.accuracyRate || 0}%`}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {progressLoading ? 'Loading...' : 'Overall performance'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streaksLoading ? '...' : `${currentStreak?.daysCount || 0} days`}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {streaksLoading ? 'Loading...' : 'Current streak'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {achievementsLoading ? '...' : progressData?.stats.achievementsCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {achievementsLoading ? 'Loading...' : 'Earned badges'}
              </span>
            </div>
          </div>
        </div>



        {/* Progress Chart */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Trend</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)} 
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <PerformanceChart 
              data={progressData?.performanceTrend || []} 
              period={selectedPeriod} 
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {progressLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))
            ) : progressData?.recentActivity && progressData.recentActivity.length > 0 ? (
              progressData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.activity}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {activity.score}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
                <p>No recent activity</p>
                <p className="text-sm">Complete some practice sessions to see your activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <AchievementsDisplay achievements={achievements} loading={achievementsLoading} />
      </main>
    </div>
  )
}
