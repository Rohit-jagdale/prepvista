/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable StrictMode to prevent double mounting
  async rewrites() {
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
  },
};

module.exports = nextConfig;
