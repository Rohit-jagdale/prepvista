// API Configuration for PrepVista
// Supports both local development and production deployment

const isDevelopment = process.env.NODE_ENV === 'development';

// API URL configuration
export const API_CONFIG = {
  // Development: Use local backend
  // Production: Use deployed backend URL
  BASE_URL: isDevelopment 
    ? 'http://localhost:8000' 
    : process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.railway.app',
  
  // API endpoints
  ENDPOINTS: {
    // Session management
    SESSION: '/api/session',
    SESSION_ANSWER: (id: string) => `/api/session/${id}/answer`,
    SESSION_COMPLETE: (id: string) => `/api/session/${id}/complete`,
    SESSION_STATUS: (id: string) => `/api/session/${id}/status`,
    SESSIONS_STATUS: '/api/sessions/status',
    SESSIONS_CLEANUP: '/api/sessions/cleanup',
    
    // Question generation
    QUESTIONS: '/api/questions',
    FEEDBACK: '/api/feedback',
    
    // System health
    HEALTH: '/health',
    MODEL_INFO: '/model-info',
    TEST_AI: '/test-ai',
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'Unauthorized. Please check your credentials.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION_ERROR: 'Invalid data provided.',
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get environment info
export const getEnvironmentInfo = () => ({
  isDevelopment,
  apiUrl: API_CONFIG.BASE_URL,
  nodeEnv: process.env.NODE_ENV,
  apiUrlEnv: process.env.NEXT_PUBLIC_API_URL,
});

export default API_CONFIG;
