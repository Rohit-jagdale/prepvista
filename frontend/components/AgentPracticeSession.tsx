'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Brain,
  FileText,
  BookOpen,
  BarChart3,
  Trophy,
  AlertCircle
} from 'lucide-react';

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  explanation?: string;
  expectedAnswer?: string;
  keyPoints?: string[];
  evaluationCriteria?: string[];
  centralConcept?: string;
  expectedBranches?: string[];
  difficulty: string;
}

interface AgentPracticeSessionProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

export default function AgentPracticeSession({ agentId, agentName, onClose }: AgentPracticeSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    generateQuestions();
  }, [agentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const generateQuestions = async () => {
    try {
      setIsLoading(true);
      
      // Use RAG system to generate questions
      const response = await fetch('/api/ai-agents/questions/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          exam_type: 'general',
          topic: 'comprehensive',
          difficulty: 'medium',
          count: 10,
          use_rag: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.questions && Array.isArray(data.questions)) {
          // Ensure questions have the correct structure
          const validatedQuestions = data.questions.map((q: any, index: number) => ({
            id: q.id || `q_${index + 1}`,
            type: q.type || 'mcq',
            question: q.question || `Question ${index + 1}`,
            options: q.options || [],
            correctAnswer: q.correctAnswer || 0,
            explanation: q.explanation || '',
            expectedAnswer: q.expectedAnswer || '',
            keyPoints: q.keyPoints || [],
            evaluationCriteria: q.evaluationCriteria || [],
            centralConcept: q.centralConcept || '',
            expectedBranches: q.expectedBranches || [],
            difficulty: q.difficulty || 'medium'
          }));
          
          setQuestions(validatedQuestions);
        } else {
          console.error('Invalid RAG questions data:', data);
          throw new Error('Invalid RAG questions data received');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to generate RAG questions:', response.status, errorData);
        throw new Error(`Failed to generate RAG questions: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating RAG questions:', error);
      // Set empty questions array to prevent rendering errors
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = (answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishSession = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    let correctAnswers = 0;
    const sessionQuestions = questions.map((question, index) => {
      const userAnswer = userAnswers[question.id];
      let isCorrect = false;
      
      if (userAnswer !== undefined) {
        if (question.type === 'mcq' && userAnswer === question.correctAnswer) {
          correctAnswers++;
          isCorrect = true;
        } else if (question.type === 'objective' && userAnswer === question.correctAnswer) {
          correctAnswers++;
          isCorrect = true;
        }
        // For other question types, we'd need more sophisticated scoring
      }
      
      return {
        questionId: question.id,
        userAnswer: userAnswer || '',
        isCorrect,
        timeSpent: 0 // TODO: Calculate individual question time
      };
    });

    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    
    try {
      // Save practice session to database
      const response = await fetch(`/api/agents/${agentId}/practice-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionName: `Practice Session - ${new Date().toLocaleDateString()}`,
          totalQuestions: questions.length,
          correctAnswers,
          score: finalScore,
          timeSpent,
          questions: sessionQuestions
        }),
      });

      if (!response.ok) {
        console.error('Failed to save practice session');
      }
    } catch (error) {
      console.error('Error saving practice session:', error);
    }
    
    setScore(finalScore);
    setSessionComplete(true);
    setIsSubmitting(false);
  };

  const getQuestionIcon = (type: string) => {
    // Normalize question type for consistent handling
    const normalizedType = type.toLowerCase().replace(/[-_]/g, '');
    
    switch (normalizedType) {
      case 'mcq':
        return <Target className="w-5 h-5" />;
      case 'mindmap':
        return <Brain className="w-5 h-5" />;
      case 'objective':
        return <FileText className="w-5 h-5" />;
      case 'shortanswer':
        return <BookOpen className="w-5 h-5" />;
      case 'essay':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating questions...</p>
        </div>
      </div>
    );
  }

  // Handle case when no questions are available
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Questions Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unable to generate questions for this agent. Please try again or contact support.
            </p>
            <div className="space-y-3">
              <button
                onClick={generateQuestions}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Agents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {score >= 80 ? (
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            ) : score >= 60 ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h2>
            
            <div className="text-6xl font-bold text-primary-600 mb-4">
              {score}%
            </div>
            
            <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span>{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Spent:</span>
                <span>{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span>Agent:</span>
                <span>{agentName}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Agents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion.id];

  // Safety check to ensure currentQuestion exists
  if (!currentQuestion) {
    console.error('Current question is undefined!');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Question Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unable to load the current question. Please try again.
            </p>
            <button
              onClick={generateQuestions}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {agentName}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(userAnswers).length}/{questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              {getQuestionIcon(currentQuestion.type)}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {currentQuestion.type.replace(/[-_]/g, ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>
            
            <h2 className="text-xl font-medium text-gray-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Section */}
          <div className="mb-8">
            {(currentQuestion.type === 'mcq' || currentQuestion.type === 'MCQ') && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      userAnswer === index
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion.id}`}
                      value={index}
                      checked={userAnswer === index}
                      onChange={(e) => handleAnswerSubmit(parseInt(e.target.value))}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'objective' || currentQuestion.type === 'OBJECTIVE') && (
              <div>
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={userAnswer || ''}
                  onChange={(e) => handleAnswerSubmit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'SHORT_ANSWER') && (
              <div>
                <textarea
                  placeholder="Type your detailed answer here..."
                  value={userAnswer || ''}
                  onChange={(e) => handleAnswerSubmit(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Fallback for other question types */}
            {!['mcq', 'MCQ', 'objective', 'OBJECTIVE', 'short-answer', 'SHORT_ANSWER'].includes(currentQuestion.type) && (
              <div>
                <textarea
                  placeholder="Type your answer here..."
                  value={userAnswer || ''}
                  onChange={(e) => handleAnswerSubmit(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Question type: {currentQuestion.type}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex space-x-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleFinishSession}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculating Score...
                    </>
                  ) : (
                    <>
                      Finish Session
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
