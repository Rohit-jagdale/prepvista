/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable StrictMode to prevent double mounting
  output: 'standalone', // Enable standalone output for better deployment
  async rewrites() {
    // Only apply rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/questions/:path*',
          destination: 'http://localhost:8000/api/questions/:path*',
        },
        {
          source: '/api/exam-types/:path*',
          destination: 'http://localhost:8000/api/exam-types/:path*',
        },
        {
          source: '/api/topics/:path*',
          destination: 'http://localhost:8000/api/topics/:path*',
        },
        {
          source: '/health',
          destination: 'http://localhost:8000/health',
        },
        {
          source: '/model-info',
          destination: 'http://localhost:8000/model-info',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
