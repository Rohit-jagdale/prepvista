'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Brain, AlertCircle, RefreshCw, X } from 'lucide-react';
import Header from './Header';
import PracticeCompletion from './PracticeCompletion';
import GlobalLoading from './GlobalLoading';
import { api } from '../lib/api';

interface WrongAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  shortcut: string;
}

interface QuestionPracticeProps {
  examType: string;
  topic: string;
  onBack: () => void;
  onComplete: (score: number, totalQuestions: number, wrongAnswers: WrongAnswer[]) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  shortcut: string;
  difficulty: string;
}

export default function QuestionPractice({ examType, topic, onBack, onComplete }: QuestionPracticeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [difficulty, setDifficulty] = useState<string>('');
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);

  // Generate questions function
  const generateQuestions = async (selectedDifficulty: string) => {
    try {
      setLoading(true);
      setError(null);
      setDifficulty(selectedDifficulty);
      
      // Generate 5 questions for practice
      const questionsData = await api.generateQuestions(examType, topic, 5, selectedDifficulty);
      
      setQuestions(questionsData);
      setTotalQuestions(questionsData.length);
      setRetryCount(0); // Reset retry count on success
      setShowDifficultyModal(false);
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions.';
      
      if (errorMessage.includes('timed out')) {
        setError('Question generation is taking too long. The service might be slow. Please try again.');
      } else {
        setError(`Failed to generate questions: ${errorMessage}`);
      }
      
      // Auto-retry logic
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setError(`Attempt ${retryCount + 1} failed. Retrying...`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-retry on failure
  useEffect(() => {
    if (retryCount > 0 && retryCount < 3 && !loading && questions.length === 0) {
      const retryTimer = setTimeout(() => {
        setIsRetrying(true);
        // Retry will be triggered by the user clicking retry
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [retryCount, loading, questions.length]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    
    // Store answer locally
    setAnswers(prev => new Map(prev.set(currentQuestion.id, selectedAnswer)));
    
    // Check if answer is correct and track wrong answers
    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore(prev => prev + 1);
    } else {
      // Track wrong answer with explanation and shortcut
      const wrongAnswer: WrongAnswer = {
        question: currentQuestion.question,
        userAnswer: currentQuestion.options[selectedAnswer],
        correctAnswer: currentQuestion.options[currentQuestion.correct_answer],
        explanation: currentQuestion.explanation,
        shortcut: currentQuestion.shortcut,
      };
      setWrongAnswers(prev => [...prev, wrongAnswer]);
    }

    // Move to next question or complete practice
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // All questions answered - complete practice
      // Calculate final score and wrong answers
      const finalScore = score + (selectedAnswer === currentQuestion.correct_answer ? 1 : 0);
      const finalWrongAnswers = selectedAnswer !== currentQuestion.correct_answer 
        ? [...wrongAnswers, {
            question: currentQuestion.question,
            userAnswer: currentQuestion.options[selectedAnswer],
            correctAnswer: currentQuestion.options[currentQuestion.correct_answer],
            explanation: currentQuestion.explanation,
            shortcut: currentQuestion.shortcut,
          }]
        : wrongAnswers;
      
      onComplete(finalScore, questions.length, finalWrongAnswers);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers(new Map());
    setScore(0);
    setWrongAnswers([]);
    setShowDifficultyModal(true);
  };

  const handleNewPractice = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers(new Map());
    setScore(0);
    setWrongAnswers([]);
    setShowDifficultyModal(true);
  };

  // Loading state should come first
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <GlobalLoading 
          text={isRetrying ? 'Retrying...' : 'Generating your practice questions...'} 
          size="lg" 
          fullScreen={false}
        />
        {retryCount > 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Attempt {retryCount + 1} of 3</p>
          </div>
        )}
      </div>
    );
  }

  // Difficulty Selection Modal
  if (showDifficultyModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Brain className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Difficulty Level</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose the difficulty level for your {topic} practice questions
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { level: 'easy', label: 'Easy', description: 'Basic concepts and straightforward questions', color: 'bg-green-500 hover:bg-green-600' },
                { level: 'medium', label: 'Medium', description: 'Moderate complexity with some challenging aspects', color: 'bg-yellow-500 hover:bg-yellow-600' },
                { level: 'hard', label: 'Hard', description: 'Advanced concepts and complex problem-solving', color: 'bg-red-500 hover:bg-red-600' }
              ].map(({ level, label, description, color }) => (
                <button
                  key={level}
                  onClick={() => generateQuestions(level)}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${color} text-white hover:shadow-lg`}
                >
                  <div className="font-semibold text-lg mb-1">{label}</div>
                  <div className="text-sm opacity-90">{description}</div>
                </button>
              ))}
            </div>

            <button
              onClick={onBack}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Question Generation Failed</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
              <button
                onClick={onBack}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Topics
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Questions Available</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Failed to generate questions for this topic.</p>
            <button
              onClick={handleRetry}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Topics
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Session</h1>
              <p className="text-gray-600 dark:text-gray-300">{examType.toUpperCase()} - {topic}</p>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Question</div>
              <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          {/* New Practice Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleNewPractice}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Start New Practice Session
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {selectedAnswer === index && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Next Button */}
            <div className="text-center">
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  selectedAnswer === null
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLastQuestion ? 'Complete Practice' : 'Next Question'}
              </button>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex justify-center gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary-600'
                    : answers.has(questions[index].id)
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
