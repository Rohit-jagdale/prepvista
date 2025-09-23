'use client'

import { PerformanceTrend } from '@/lib/hooks/useProgress'

interface PerformanceChartProps {
  data: PerformanceTrend[]
  period: string
}

export default function PerformanceChart({ data, period }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No performance data available</p>
          <p className="text-sm">Complete some practice sessions to see your progress</p>
        </div>
      </div>
    )
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Find min and max scores for scaling
  const scores = sortedData.map((d: { score: number }) => d.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const scoreRange = maxScore - minScore

  return (
    <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between h-full">
        {sortedData.map((point, index) => {
          const height = scoreRange > 0 ? ((point.score - minScore) / scoreRange) * 100 : 50
          const width = 100 / sortedData.length
          
          return (
            <div key={index} className="flex flex-col items-center" style={{ width: `${width}%` }}>
              <div className="flex-1 flex items-end justify-center w-full px-1">
                <div 
                  className="w-full bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-600"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.score}% (${point.questions} questions)`}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{maxScore}%</span>
        <span>{Math.round((maxScore + minScore) / 2)}%</span>
        <span>{minScore}%</span>
      </div>
    </div>
  )
}
