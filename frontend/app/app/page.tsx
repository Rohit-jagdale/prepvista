'use client';

import { BookOpen, Target, TrendingUp, Award, Users, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🏠 App Dashboard - Component mounted:', {
      hasSession: !!session,
      status,
      user: session?.user,
      timestamp: new Date().toISOString()
    });
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to PrepVista Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ready to start your exam preparation journey? Click below to begin practicing with AI-powered questions tailored to your needs.
          </p>
        </div>

        <div className="flex justify-center">
          <Link 
            href="/app/practice"
            className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <BookOpen className="w-6 h-6 mr-3" />
            Start Practice
          </Link>
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Practice</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose from multiple exam types and topics</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Track Progress</h3>
              <p className="text-gray-600 dark:text-gray-400">Monitor your performance and improvement</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">Get personalized questions and explanations</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
