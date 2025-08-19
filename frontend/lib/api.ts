import API_CONFIG, { buildApiUrl } from '../config/api';

// Types for the session-based practice system
export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  shortcut: string;
  difficulty: string;
}

export interface SessionRequest {
  exam_type: string;
  topic: string;
  difficulty?: string;
}

export interface SessionResponse {
  session_id: string;
  questions: Question[];
  time_limit: number;
}

export interface AnswerSubmission {
  session_id: string;
  question_id: string;
  selected_answer: number;
  time_taken: number;
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

export interface SessionResult {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken: number;
  wrong_answers: WrongAnswer[];
}

export interface FeedbackRequest {
  exam_type: string;
  topic: string;
  question: string;
  user_answer: string;
  correct_answer?: string;
  is_correct: boolean;
}

// API client class
class ApiClient {
  private baseUrl: string;
  private config: typeof API_CONFIG.REQUEST_CONFIG;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.config = API_CONFIG.REQUEST_CONFIG;
  }

  // Helper method for making HTTP requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        ...this.config,
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Session Management APIs
  async createSession(request: SessionRequest): Promise<SessionResponse> {
    return this.request<SessionResponse>(API_CONFIG.ENDPOINTS.SESSION, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async submitAnswer(submission: AnswerSubmission): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      API_CONFIG.ENDPOINTS.SESSION_ANSWER(submission.session_id),
      {
        method: 'POST',
        body: JSON.stringify(submission),
      }
    );
  }

  async completeSession(sessionId: string): Promise<SessionResult> {
    return this.request<SessionResult>(
      API_CONFIG.ENDPOINTS.SESSION_COMPLETE(sessionId),
      {
        method: 'POST',
      }
    );
  }

  async getSessionStatus(sessionId: string): Promise<{ completed: boolean }> {
    return this.request<{ completed: boolean }>(
      API_CONFIG.ENDPOINTS.SESSION_STATUS(sessionId)
    );
  }

  async getSessionsStatus(): Promise<{ total_sessions: number; active_sessions: number }> {
    return this.request<{ total_sessions: number; active_sessions: number }>(
      API_CONFIG.ENDPOINTS.SESSIONS_STATUS
    );
  }

  // Question Generation APIs (for backward compatibility)
  async generateQuestions(
    examType: string,
    topic: string,
    count: number = 10
  ): Promise<Question[]> {
    return this.request<Question[]>(API_CONFIG.ENDPOINTS.QUESTIONS, {
      method: 'POST',
      body: JSON.stringify({
        exam_type: examType,
        topic: topic,
        count: count,
      }),
    });
  }

  async generateFeedback(request: FeedbackRequest): Promise<{
    feedback: string;
    explanation: string;
    shortcut: string;
    improvement_tip: string;
  }> {
    return this.request<{
      feedback: string;
      explanation: string;
      shortcut: string;
      improvement_tip: string;
    }>(API_CONFIG.ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Health Check APIs
  async checkHealth(): Promise<{ status: string; ai_service: string; mode: string }> {
    return this.request<{ status: string; ai_service: string; mode: string }>(
      API_CONFIG.ENDPOINTS.HEALTH
    );
  }

  async getModelInfo(): Promise<{ status: string; current_model?: string }> {
    return this.request<{ status: string; current_model?: string }>(
      API_CONFIG.ENDPOINTS.MODEL_INFO
    );
  }

  // Utility methods
  getBaseUrl(): string {
    return this.baseUrl;
  }

  getEnvironmentInfo() {
    return {
      baseUrl: this.baseUrl,
      isDevelopment: process.env.NODE_ENV === 'development',
      nodeEnv: process.env.NODE_ENV,
      apiUrlEnv: process.env.NEXT_PUBLIC_API_URL,
    };
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export type {
  Question,
  SessionRequest,
  SessionResponse,
  AnswerSubmission,
  WrongAnswer,
  SessionResult,
  FeedbackRequest,
};
