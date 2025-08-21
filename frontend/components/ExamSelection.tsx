'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Percent, Clock, TrendingUp, BookOpen, Target } from 'lucide-react';
import QuestionPractice from './QuestionPractice';
import Header from './Header';
import { api } from '../lib/api';

interface ExamSelectionProps {
  examType: string;
  onBack: () => void;
}

const examTopics = {
  upsc: [
    { id: 'mathematics', name: 'Mathematics', icon: Calculator, description: 'Number systems, algebra, geometry, trigonometry' },
    { id: 'reasoning', name: 'Logical Reasoning', icon: Target, description: 'Verbal and non-verbal reasoning, analytical thinking' },
    { id: 'english', name: 'English Language', icon: BookOpen, description: 'Grammar, vocabulary, comprehension, verbal ability' },
    { id: 'general-awareness', name: 'General Awareness', icon: TrendingUp, description: 'Current affairs, static GK, economics' },
  ],
  mpsc: [
    { id: 'mathematics', name: 'Mathematics', icon: Calculator, description: 'Arithmetic, algebra, geometry, mensuration' },
    { id: 'reasoning', name: 'Reasoning Ability', icon: Target, description: 'Logical reasoning, analytical skills' },
    { id: 'english', name: 'English', icon: BookOpen, description: 'Grammar, vocabulary, comprehension' },
    { id: 'marathi', name: 'Marathi', icon: BookOpen, description: 'Marathi language and literature' },
  ],
  'college-placements': [
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: Calculator, description: 'Numbers, algebra, geometry, time & work' },
    { id: 'logical', name: 'Logical Reasoning', icon: Target, description: 'Puzzles, blood relations, coding-decoding' },
    { id: 'verbal', name: 'Verbal Ability', icon: BookOpen, description: 'Grammar, vocabulary, reading comprehension' },
    { id: 'data-interpretation', name: 'Data Interpretation', icon: TrendingUp, description: 'Charts, graphs, tables analysis' },
  ],
  ibps: [
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: Calculator, description: 'Arithmetic, algebra, data interpretation' },
    { id: 'reasoning', name: 'Reasoning', icon: Target, description: 'Logical reasoning, puzzles, seating arrangement' },
    { id: 'english', name: 'English Language', icon: BookOpen, description: 'Grammar, vocabulary, comprehension' },
    { id: 'computer-knowledge', name: 'Computer Knowledge', icon: TrendingUp, description: 'Basic computer concepts and applications' },
  ],
  ssc: [
    { id: 'mathematics', name: 'Mathematics', icon: Calculator, description: 'Arithmetic, algebra, geometry, trigonometry' },
    { id: 'reasoning', name: 'General Intelligence', icon: Target, description: 'Logical reasoning, analytical ability' },
    { id: 'english', name: 'English Language', icon: BookOpen, description: 'Grammar, vocabulary, comprehension' },
    { id: 'general-knowledge', name: 'General Knowledge', icon: TrendingUp, description: 'Current affairs, static GK, science' },
  ],
  cat: [
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: Calculator, description: 'Numbers, algebra, geometry, time & work' },
    { id: 'verbal', name: 'Verbal Ability', icon: BookOpen, description: 'Grammar, vocabulary, reading comprehension' },
    { id: 'data-interpretation', name: 'Data Interpretation', icon: TrendingUp, description: 'Charts, graphs, tables analysis' },
    { id: 'logical', name: 'Logical Reasoning', icon: Target, description: 'Puzzles, blood relations, coding-decoding' },
  ],
};

const examNames = {
  upsc: 'UPSC Civil Services',
  mpsc: 'MPSC',
  'college-placements': 'College Placements',
  ibps: 'IBPS',
  ssc: 'SSC',
  cat: 'CAT',
};

export default function ExamSelection({ examType, onBack }: ExamSelectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<Array<{id: string, name: string, icon: any, description: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  // Load topics from API
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const apiTopics = await api.getTopics(examType);
        // Map API topics to UI format
        const mappedTopics = apiTopics.topics.map(topicId => {
          const staticTopic = examTopics[examType as keyof typeof examTopics]?.find(t => t.id === topicId);
          return staticTopic || {
            id: topicId,
            name: topicId.charAt(0).toUpperCase() + topicId.slice(1).replace('-', ' '),
            icon: BookOpen,
            description: `Practice ${topicId} questions`
          };
        });
        setTopics(mappedTopics);
      } catch (error) {
        console.error('Failed to load topics from API:', error);
        // Fallback to static topics
        setTopics(examTopics[examType as keyof typeof examTopics] || []);
      } finally {
        setLoading(false);
      }
    };
    
    loadTopics();
  }, [examType]);

  if (selectedTopic) {
    return (
      <QuestionPractice 
        examType={examType}
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading topics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Back Button and Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Exam Selection
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {examNames[examType as keyof typeof examNames]} Preparation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose a topic to start practicing with AI-generated questions and get personalized feedback
            </p>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className="card hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg text-primary-600 dark:text-primary-400">
                    <topic.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {topic.name}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      15-20 min
                    </span>
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      10 questions
                    </span>
                  </div>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
                    <span>Start Practice</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Your Progress Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Topics Completed</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Questions Solved</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">0%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
