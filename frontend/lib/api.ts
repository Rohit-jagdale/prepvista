import API_CONFIG, { buildApiUrl } from '../config/api';

// Types for the simplified question generation system
export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  shortcut: string;
  difficulty: string;
}

export interface ExamTypesResponse {
  exam_types: string[];
}

export interface TopicsResponse {
  exam_type: string;
  topics: string[];
}



// API client class with improved error handling
class ApiClient {
  private baseUrl: string;
  private config: typeof API_CONFIG.REQUEST_CONFIG;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.config = API_CONFIG.REQUEST_CONFIG;
  }

  // Helper method for making HTTP requests with timeout
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...this.config,
        ...options,
        signal: controller.signal,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
      
      throw new Error('Network error');
    }
  }



  // Question Generation APIs
  async generateQuestions(
    examType: string,
    topic: string,
    count: number = 10,
    difficulty: string = 'medium'
  ): Promise<Question[]> {
    return this.request<Question[]>(API_CONFIG.ENDPOINTS.QUESTIONS, {
      method: 'POST',
      body: JSON.stringify({
        exam_type: examType,
        topic: topic,
        difficulty: difficulty,
        count: count,
      }),
    }, 15000); // 15 second timeout for question generation
  }



  // Health Check APIs
  async checkHealth(): Promise<{ status: string; ai_service: string; mode: string }> {
    return this.request<{ status: string; ai_service: string; mode: string }>(
      API_CONFIG.ENDPOINTS.HEALTH,
      {},
      5000 // 5 second timeout for health check
    );
  }

  async getModelInfo(): Promise<{ status: string; current_model?: string }> {
    return this.request<{ status: string; current_model?: string }>(
      API_CONFIG.ENDPOINTS.MODEL_INFO,
      {},
      5000 // 5 second timeout for model info
    );
  }

  // Exam Management APIs
  async getExamTypes(): Promise<ExamTypesResponse> {
    return this.request<ExamTypesResponse>('/api/exam-types', {}, 5000);
  }

  async getTopics(examType: string): Promise<TopicsResponse> {
    return this.request<TopicsResponse>(`/api/topics/${examType}`, {}, 5000);
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

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();
