'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Brain, Lightbulb, TrendingUp, Timer, Trophy, AlertCircle } from 'lucide-react';
import Header from './Header';
import { api, SessionResponse, SessionResult, WrongAnswer } from '../lib/api';

interface QuestionPracticeProps {
  examType: string;
  topic: string;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  shortcut: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function QuestionPractice({ examType, topic, onBack }: QuestionPracticeProps) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        const sessionData = await api.createSession(examType, topic, 'medium');
        setSession(sessionData);
        setTimeLeft(sessionData.time_limit);
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error('Failed to create session:', error);
        setError('Failed to create practice session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [examType, topic]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !sessionComplete && session) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto-complete session
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, sessionComplete, session]);

  // Track question start time
  useEffect(() => {
    if (session && currentQuestionIndex < session.questions.length) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, session]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null || !session) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Store answer locally
    setAnswers(prev => new Map(prev.set(currentQuestion.id, selectedAnswer)));
    
    // Submit answer to backend
    try {
      await api.submitAnswer(session.session_id, currentQuestion.id, selectedAnswer, timeTaken);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

    // Move to next question or complete session
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // All questions answered - complete session
      handleSessionComplete();
    }
  };

  const handleSessionComplete = async () => {
    if (!session) return;
    
    try {
      setSessionComplete(true);
      const result = await api.completeSession(session.session_id);
      setSessionResult(result);
    } catch (error) {
      console.error('Failed to complete session:', error);
      setError('Failed to complete session. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Creating your practice session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onBack}
              className="btn-primary"
            >
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (sessionComplete && sessionResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Topics
            </button>

            {/* Results Summary */}
            <div className="card mb-8">
              <div className="text-center mb-8">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Session Complete!</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">{sessionResult.correct_answers}</div>
                    <div className="text-green-700">Correct Answers</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{sessionResult.score_percentage}%</div>
                    <div className="text-blue-700">Score</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{formatTime(sessionResult.time_taken)}</div>
                    <div className="text-purple-700">Time Taken</div>
                  </div>
                </div>

                <div className="text-lg text-gray-600">
                  You answered {sessionResult.correct_answers} out of {sessionResult.total_questions} questions correctly.
                </div>
              </div>
            </div>

            {/* Feedback on Wrong Answers */}
            {sessionResult.wrong_answers.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Review Wrong Answers
                </h2>
                
                <div className="space-y-6">
                  {sessionResult.wrong_answers.map((wrongAnswer, index) => (
                    <div key={wrongAnswer.question_id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-500 uppercase tracking-wide">
                          Question {index + 1}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {wrongAnswer.question}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="text-sm text-red-600 font-medium mb-1">Your Answer:</div>
                          <div className="text-red-700">{wrongAnswer.user_answer}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-sm text-green-600 font-medium mb-1">Correct Answer:</div>
                          <div className="text-green-700">{wrongAnswer.correct_answer}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Explanation:</h4>
                        <p className="text-gray-700">{wrongAnswer.explanation}</p>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-semibold text-gray-800">Shortcut Trick:</h4>
                        </div>
                        <p className="text-gray-700">{wrongAnswer.shortcut}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center mt-8">
              <button
                onClick={onBack}
                className="btn-primary"
              >
                Back to Topics
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
  const questionsAnswered = answers.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header and Progress */}
        <div className="max-w-4xl mx-auto mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Topics
          </button>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {topic.charAt(0).toUpperCase() + topic.slice(1)} Practice Session
              </h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-red-600">
                <Timer className="w-5 h-5" />
                <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
              </div>
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {questionsAnswered}/{session.questions.length} Answered
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="max-w-4xl mx-auto">
          <div className="card">
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                  {currentQuestion.difficulty} difficulty
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">
                {questionsAnswered} of {session.questions.length} questions answered
              </div>
              
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  selectedAnswer === null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Complete Session'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
