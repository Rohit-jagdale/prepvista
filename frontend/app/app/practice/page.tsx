'use client'

import { useState } from 'react'
import { BookOpen, Target, TrendingUp, Award, Users, Building2, Play, Clock, BarChart3 } from 'lucide-react'
import Header from '@/components/Header'
import Link from 'next/link'

const examTypes = [
  {
    id: 'upsc',
    name: 'UPSC Civil Services',
    description: 'Union Public Service Commission - Civil Services Examination',
    icon: Award,
    color: 'bg-blue-500',
    topics: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Knowledge']
  },
  {
    id: 'mpsc',
    name: 'MPSC',
    description: 'Maharashtra Public Service Commission',
    icon: Building2,
    color: 'bg-green-500',
    topics: ['General Studies', 'Aptitude', 'Marathi Language', 'English']
  },
  {
    id: 'college-placements',
    name: 'College Placements',
    description: 'Campus recruitment aptitude tests',
    icon: Users,
    color: 'bg-purple-500',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation']
  },
  {
    id: 'ibps',
    name: 'IBPS',
    description: 'Institute of Banking Personnel Selection',
    icon: Target,
    color: 'bg-orange-500',
    topics: ['Reasoning', 'English', 'Quantitative Aptitude', 'General Awareness']
  },
  {
    id: 'ssc',
    name: 'SSC',
    description: 'Staff Selection Commission',
    icon: TrendingUp,
    color: 'bg-red-500',
    topics: ['General Intelligence', 'General Knowledge', 'Quantitative Aptitude', 'English']
  },
  {
    id: 'cat',
    name: 'CAT',
    description: 'Common Admission Test for MBA',
    icon: BookOpen,
    color: 'bg-indigo-500',
    topics: ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation', 'Logical Reasoning']
  }
]

export default function PracticePage() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null)

  if (selectedExam) {
    const exam = examTypes.find(e => e.id === selectedExam)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <button 
              onClick={() => setSelectedExam(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Exam Types
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {exam?.name} Practice
            </h1>
            <p className="text-gray-600">{exam?.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exam?.topics.map((topic, index) => (
              <div key={index} className="card hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{topic}</h3>
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Questions Available</span>
                    <span className="font-medium">150+</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Difficulty Levels</span>
                    <span className="font-medium">Easy, Medium, Hard</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Time per Question</span>
                    <span className="font-medium">2-3 min</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link 
                    href={`/app/practice/${selectedExam}/${topic.toLowerCase().replace(/\s+/g, '-')}`}
                    className="btn-primary flex-1 text-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice
                  </Link>
                  <button className="btn-secondary">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Practice Area
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select an exam type and topic to start practicing with AI-powered questions tailored to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examTypes.map((exam) => (
            <div
              key={exam.id}
              className="card hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedExam(exam.id)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 ${exam.color} rounded-lg flex items-center justify-center`}>
                  <exam.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{exam.description}</p>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Topics covered:</p>
                <div className="flex flex-wrap gap-1">
                  {exam.topics.slice(0, 3).map((topic, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {topic}
                    </span>
                  ))}
                  {exam.topics.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      +{exam.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                Start Practice
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
