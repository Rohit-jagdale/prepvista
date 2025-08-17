'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Brain, Lightbulb, TrendingUp } from 'lucide-react';
import Header from './Header';

interface QuestionPracticeProps {
  examType: string;
  topic: string;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  shortcut: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Feedback {
  isCorrect: boolean;
  explanation: string;
  shortcut: string;
  improvement: string;
}

export default function QuestionPractice({ examType, topic, onBack }: QuestionPracticeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [score, setScore] = useState(0);

  // Mock questions for demonstration - in real app, these would come from FastAPI
  const mockQuestions: Question[] = [
    {
      id: '1',
      question: 'If a train travels at 60 km/h for 2 hours and then at 80 km/h for 3 hours, what is the average speed for the entire journey?',
      options: ['68 km/h', '70 km/h', '72 km/h', '75 km/h'],
      correctAnswer: 1,
      explanation: 'Total distance = (60 × 2) + (80 × 3) = 120 + 240 = 360 km. Total time = 2 + 3 = 5 hours. Average speed = 360/5 = 72 km/h.',
      shortcut: 'Use weighted average: (60×2 + 80×3)/(2+3) = 72 km/h',
      difficulty: 'medium'
    },
    {
      id: '2',
      question: 'A number when divided by 6 leaves a remainder of 3. What will be the remainder when the same number is divided by 9?',
      options: ['0', '3', '6', 'Cannot be determined'],
      correctAnswer: 1,
      explanation: 'Let the number be N. N = 6k + 3. When N is divided by 9, N = 9m + r. Substituting: 6k + 3 = 9m + r. Since 6k is divisible by 3, the remainder is 3.',
      shortcut: 'If N = 6k + 3, then N mod 9 = (6k + 3) mod 9 = 3',
      difficulty: 'hard'
    },
    {
      id: '3',
      question: 'In a class of 40 students, 25 students like Mathematics and 20 students like Science. If 15 students like both subjects, how many students like neither?',
      options: ['5', '10', '15', '20'],
      correctAnswer: 1,
      explanation: 'Using set theory: n(M∪S) = n(M) + n(S) - n(M∩S) = 25 + 20 - 15 = 30. Students who like neither = Total - n(M∪S) = 40 - 30 = 10.',
      shortcut: 'Use formula: Neither = Total - (A + B - Both) = 40 - (25 + 20 - 15) = 10',
      difficulty: 'medium'
    }
  ];

  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setQuestions(mockQuestions);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, showFeedback]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Generate AI feedback using FastAPI
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_type: examType,
          topic,
          question: currentQuestion.question,
          user_answer: currentQuestion.options[selectedAnswer],
          correct_answer: currentQuestion.options[currentQuestion.correctAnswer],
          is_correct: isCorrect,
        }),
      });

      if (response.ok) {
        const aiFeedback = await response.json();
        setFeedback(aiFeedback);
      } else {
        // Fallback to local feedback
        setFeedback({
          isCorrect,
          explanation: currentQuestion.explanation,
          shortcut: currentQuestion.shortcut,
          improvement: isCorrect 
            ? 'Great job! Keep practicing to maintain this level.' 
            : 'Review the concept and try similar questions.',
        });
      }
    } catch (error) {
      // Fallback to local feedback
      setFeedback({
        isCorrect,
        explanation: currentQuestion.explanation,
        shortcut: currentQuestion.shortcut,
        improvement: isCorrect 
          ? 'Great job! Keep practicing to maintain this level.' 
          : 'Review the concept and try similar questions.',
      });
    }

    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setFeedback(null);
    }
  };

  const handleFinish = () => {
    // Show results and navigate back
    onBack();
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
            <p className="text-lg text-gray-600">Generating AI-powered questions...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
                {topic.charAt(0).toUpperCase() + topic.slice(1)} Practice
              </h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-red-600">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
              </div>
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                Score: {score}/{currentQuestionIndex + 1}
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
            {!showFeedback ? (
              <>
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

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      selectedAnswer === null
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    Submit Answer
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Feedback */}
                <div className="mb-8">
                  <div className={`flex items-center space-x-3 mb-6 ${
                    feedback?.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feedback?.isCorrect ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <XCircle className="w-8 h-8" />
                    )}
                    <h2 className="text-2xl font-bold">
                      {feedback?.isCorrect ? 'Correct!' : 'Incorrect'}
                    </h2>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Explanation:</h3>
                    <p className="text-gray-700 leading-relaxed">{feedback?.explanation}</p>
                  </div>

                  {/* Shortcut Trick */}
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-gray-800">Shortcut Trick:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{feedback?.shortcut}</p>
                  </div>

                  {/* Improvement Tip */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">Improvement Tip:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{feedback?.improvement}</p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={onBack}
                    className="btn-secondary"
                  >
                    Back to Topics
                  </button>
                  
                  <div className="space-x-3">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="btn-primary"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleFinish}
                        className="btn-primary"
                      >
                        Finish Practice
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
