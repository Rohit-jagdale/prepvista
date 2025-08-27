// API Configuration for PrepVista
// Supports both local development and production deployment

const isDevelopment = process.env.NODE_ENV === 'development';

// API URL configuration
export const API_CONFIG = {
  // Base URL for the main API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  
  // AI Backend URL for Gemini integration
  AI_BACKEND_URL: process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    // Question generation
    QUESTIONS: '/api/questions',
    
    // System health
    HEALTH: '/health',
    MODEL_INFO: '/model-info',
    
    // AI Agents
    AGENTS: '/api/agents',
    AGENT_QUESTIONS: (id: string) => `/api/agents/${id}/questions`,
    AGENT_PRACTICE_SESSION: (id: string) => `/api/agents/${id}/practice-session`,
    AI_AGENT_QUESTIONS: '/api/ai-agents/questions'
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
