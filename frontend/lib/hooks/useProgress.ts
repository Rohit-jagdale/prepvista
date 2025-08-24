import { useState, useEffect } from 'react'

export interface ProgressStats {
  totalQuestions: number
  accuracyRate: number
  streakDays: number
  achievementsCount: number
}

export interface RecentActivity {
  date: string
  activity: string
  score: string
}

export interface PerformanceTrend {
  date: string
  score: number
  questions: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
  points: number
  isEarned: boolean
  earnedAt?: string
}

export interface ProgressData {
  stats: ProgressStats
  recentActivity: RecentActivity[]
  performanceTrend: PerformanceTrend[]
  achievements: Achievement[]
}

export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/progress')
      if (!response.ok) {
        throw new Error('Failed to fetch progress data')
      }
      
      const progressData = await response.json()
      setData(progressData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const refreshProgress = () => {
    fetchProgress()
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  return {
    data,
    loading,
    error,
    refreshProgress
  }
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/achievements')
      if (!response.ok) {
        throw new Error('Failed to fetch achievements')
      }
      
      const data = await response.json()
      setAchievements(data.achievements)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAchievements()
  }, [])

  return {
    achievements,
    loading,
    error,
    refreshAchievements: fetchAchievements
  }
}

export function useStudyStreaks() {
  const [currentStreak, setCurrentStreak] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStreaks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/streaks')
      if (!response.ok) {
        throw new Error('Failed to fetch streaks')
      }
      
      const data = await response.json()
      setCurrentStreak(data.currentStreak)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreaks()
  }, [])

  return {
    currentStreak,
    loading,
    error,
    refreshStreaks: fetchStreaks
  }
}
