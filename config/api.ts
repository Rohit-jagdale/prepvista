// API Configuration
export const API_CONFIG = {
  // Backend API base URL
  BACKEND_URL: 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    QUESTIONS: '/api/questions',
    FEEDBACK: '/api/feedback',
    EXAM_TYPES: '/api/exam-types',
    TOPICS: '/api/topics',
  },
  
  // CORS settings
  CORS: {
    ORIGINS: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  },
} as const;
