'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Target, TrendingUp, Award, Users, Building2 } from 'lucide-react';
import ExamSelection from '@/components/ExamSelection';
import Header from '@/components/Header';
import { api } from '@/lib/api';

const examTypes = [
  {
    id: 'upsc',
    name: 'UPSC Civil Services',
    description: 'Union Public Service Commission - Civil Services Examination',
    icon: Award,
    color: 'bg-blue-500',
  },
  {
    id: 'mpsc',
    name: 'MPSC',
    description: 'Maharashtra Public Service Commission',
    icon: Building2,
    color: 'bg-green-500',
  },
  {
    id: 'college-placements',
    name: 'College Placements',
    description: 'Campus recruitment aptitude tests',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    id: 'ibps',
    name: 'IBPS',
    description: 'Institute of Banking Personnel Selection',
    icon: Target,
    color: 'bg-orange-500',
  },
  {
    id: 'ssc',
    name: 'SSC',
    description: 'Staff Selection Commission',
    icon: TrendingUp,
    color: 'bg-red-500',
  },
  {
    id: 'cat',
    name: 'CAT',
    description: 'Common Admission Test for MBA',
    icon: BookOpen,
    color: 'bg-indigo-500',
  },
];

export default function Dashboard() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examTypesList, setExamTypesList] = useState(examTypes);
  const [loading, setLoading] = useState(true);

  // Load exam types from API
  useEffect(() => {
    const loadExamTypes = async () => {
      try {
        const apiExamTypes = await api.getExamTypes();
        // Map API exam types to UI format
        const mappedExamTypes = apiExamTypes.exam_types.map((examId: string) => {
          const staticExam = examTypes.find(e => e.id === examId);
          return staticExam || {
            id: examId,
            name: examId.charAt(0).toUpperCase() + examId.slice(1).replace('-', ' '),
            description: `${examId} examination preparation`,
            icon: BookOpen,
            color: 'bg-gray-500',
          };
        });
        setExamTypesList(mappedExamTypes);
      } catch (error) {
        console.error('Failed to load exam types from API:', error);
        // Fallback to static exam types
        setExamTypesList(examTypes);
      } finally {
        setLoading(false);
      }
    };
    
    loadExamTypes();
  }, []);

  if (selectedExam) {
    return <ExamSelection examType={selectedExam} onBack={() => setSelectedExam(null)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading exam types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your exam type and start practicing with AI-powered questions tailored to your preparation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examTypesList.map((exam) => (
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exam.name}</h3>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{exam.description}</p>
              <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
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
  );
}
