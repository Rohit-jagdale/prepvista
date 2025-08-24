'use client';

import { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, CheckCircle } from 'lucide-react';
import Header from './Header';

interface WrongAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  shortcut: string;
}

interface PracticeCompletionProps {
  score: number;
  totalQuestions: number;
  wrongAnswers?: WrongAnswer[];
  sessionTime?: number;
  examType?: string;
  topic?: string;
  onPracticeAgain: () => void;
  onBack: () => void;
  onBackToDashboard?: () => void;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export default function PracticeCompletion({
  score,
  totalQuestions,
  wrongAnswers,
  sessionTime,
  examType,
  topic,
  onPracticeAgain,
  onBack,
  onBackToDashboard,
  title = "Practice Complete!",
  subtitle = "Great job completing the practice session",
  showHeader = true
}: PracticeCompletionProps) {
  const scorePercentage = Math.round((score / totalQuestions) * 100);
  const [progressRecorded, setProgressRecorded] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [recordingProgress, setRecordingProgress] = useState(false);

  // Record progress when component mounts
  useEffect(() => {
    if (examType && topic && !progressRecorded) {
      recordProgress();
    }
  }, [examType, topic, progressRecorded]);

  const recordProgress = async () => {
    if (!examType || !topic) return;
    
    try {
      setRecordingProgress(true);
      
      // Record practice session
      const sessionResponse = await fetch('/api/progress/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examType,
          topic,
          score,
          totalQuestions,
          timeSpent: sessionTime || 0,
          difficulty: 'medium' // Default difficulty
        }),
      });

      if (sessionResponse.ok) {
        const result = await sessionResponse.json();
        setProgressRecorded(true);
        if (result.newlyEarnedAchievements && result.newlyEarnedAchievements.length > 0) {
          setNewAchievements(result.newlyEarnedAchievements);
        }
      }

      // Update study streak
      await fetch('/api/progress/streak', {
        method: 'POST'
      });

    } catch (error) {
      console.error('Failed to record progress:', error);
    } finally {
      setRecordingProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {showHeader && <Header />}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{subtitle}</p>
            
            {/* Progress Recording Status */}
            {recordingProgress && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Recording your progress...
                </div>
              </div>
            )}

            {/* New Achievements */}
            {newAchievements.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  New Achievements Unlocked! 🎉
                </h3>
                <div className="space-y-2">
                  {newAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-200">{achievement.name}</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{score}</div>
                <div className="text-gray-600 dark:text-gray-300">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">{totalQuestions}</div>
                <div className="text-gray-600 dark:text-gray-300">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{scorePercentage}%</div>
                <div className="text-gray-600 dark:text-gray-300">Score</div>
              </div>
              {sessionTime && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">Time Spent</div>
                </div>
              )}
            </div>

            {/* Wrong Answers Section */}
            {wrongAnswers && wrongAnswers.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Questions to Review
                </h3>
                <div className="space-y-4">
                  {wrongAnswers.map((wrongAnswer, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Question {index + 1}:
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {wrongAnswer.question}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">Your Answer:</span>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{wrongAnswer.userAnswer}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">Correct Answer:</span>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{wrongAnswer.correctAnswer}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Explanation:</span>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 leading-relaxed">
                          {wrongAnswer.explanation}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Quick Tip:</span>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 font-mono bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                          {wrongAnswer.shortcut}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={onPracticeAgain}
                className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold"
              >
                Practice Again
              </button>
              <button
                onClick={onBack}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-8 py-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Topics
              </button>
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
