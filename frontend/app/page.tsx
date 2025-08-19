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

export default function Home() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examTypesList, setExamTypesList] = useState(examTypes);
  const [loading, setLoading] = useState(true);

  // Load exam types from API
  useEffect(() => {
    const loadExamTypes = async () => {
      try {
        const apiExamTypes = await api.getExamTypes();
        // Map API exam types to UI format
        const mappedExamTypes = apiExamTypes.exam_types.map(examId => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading exam types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Aptitude with{' '}
            <span className="text-primary-600">AI-Powered</span> Learning
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Prepare smarter for competitive exams with personalized questions, instant feedback, 
            and shortcut tricks powered by advanced AI. Choose your exam and start your journey to success.
          </p>
        </div>

        {/* Exam Selection Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
            Select Your Exam Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examTypesList.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className="card hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg ${exam.color} text-white`}>
                    <exam.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-primary-600">
                    {exam.name}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {exam.description}
                </p>
                <div className="mt-4 flex items-center text-primary-600 font-medium">
                  <span>Start Practice</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12 text-center">
            Why Choose Aptitude Prep?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Topic-wise Practice</h3>
              <p className="text-gray-600">Organized questions by subject and difficulty level</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Feedback</h3>
              <p className="text-gray-600">Instant analysis and personalized improvement tips</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Shortcut Tricks</h3>
              <p className="text-gray-600">Learn time-saving techniques and strategies</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
