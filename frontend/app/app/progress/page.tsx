'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Target, Calendar, Award } from 'lucide-react'
import Header from '@/components/Header'

export default function ProgressPage() {
  const [selectedPeriod] = useState('month')

  const stats = [
    {
      title: 'Total Questions',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: Target
    },
    {
      title: 'Accuracy Rate',
      value: '78%',
      change: '+5%',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Study Streak',
      value: '15 days',
      change: '+2 days',
      changeType: 'positive',
      icon: Calendar
    },
    {
      title: 'Achievements',
      value: '8',
      change: '+1',
      changeType: 'positive',
      icon: Award
    }
  ]

  const recentActivity = [
    { date: 'Today', activity: 'Completed UPSC Quantitative Aptitude - 20 questions', score: '85%' },
    { date: 'Yesterday', activity: 'Practiced MPSC Reasoning - 15 questions', score: '72%' },
    { date: '2 days ago', activity: 'Finished IBPS English - 25 questions', score: '91%' },
    { date: '3 days ago', activity: 'Attempted SSC General Knowledge - 30 questions', score: '68%' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your learning journey and performance metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Chart */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Trend</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Period:</span>
              <select 
                value={selectedPeriod} 
                onChange={(e) => {}} 
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
          
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chart visualization will be implemented here</p>
              <p className="text-sm">Showing performance over time</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.activity}</p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {activity.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
