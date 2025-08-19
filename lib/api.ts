// API configuration and utility functions
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BACKEND_URL;

export interface SessionResponse {
  session_id: string;
  questions: Question[];
  time_limit: number;
}

export interface SessionResult {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken: number;
  wrong_answers: WrongAnswer[];
}

export interface WrongAnswer {
  question_id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  options: string[];
  explanation: string;
  shortcut: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  shortcut: string;
  difficulty: string;
}

export const api = {
  baseUrl: API_BASE_URL,
  
  // Create a new practice session with 10 questions
  createSession: async (examType: string, topic: string, difficulty: string = 'medium'): Promise<SessionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exam_type: examType,
        topic,
        difficulty,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Submit an answer for a question
  submitAnswer: async (sessionId: string, questionId: string, selectedAnswer: number, timeTaken: number) => {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit answer: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Complete the session and get results
  completeSession: async (sessionId: string): Promise<SessionResult> => {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Get session status
  getSessionStatus: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Generate questions (legacy - kept for backward compatibility)
  generateQuestions: async (examType: string, topic: string, difficulty: string = 'medium', count: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exam_type: examType,
        topic,
        difficulty,
        count,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate questions: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Generate feedback (legacy - kept for backward compatibility)
  generateFeedback: async (examType: string, topic: string, question: string, userAnswer: string, correctAnswer: string, isCorrect: boolean) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exam_type: examType,
        topic,
        question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate feedback: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Get exam types
  getExamTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/api/exam-types`);
    
    if (!response.ok) {
      throw new Error(`Failed to get exam types: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Get topics for exam type
  getTopics: async (examType: string) => {
    const response = await fetch(`${API_BASE_URL}/api/topics/${examType}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get topics: ${response.statusText}`);
    }
    
    return response.json();
  },
};
