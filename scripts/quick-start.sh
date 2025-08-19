#!/bin/bash

echo "🚀 Starting PrepVista - AI-Powered Exam Preparation Platform"
echo "================================================================"
echo ""

# Check if .env file exists in ai-backend
if [ ! -f "ai-backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "   Please copy ai-backend/env.example to ai-backend/.env and add your Google Gemini API key."
    echo "   You can get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
    echo "   Example:"
    echo "   cd ai-backend"
    echo "   cp env.example .env"
    echo "   # Edit .env and add your API key"
    echo ""
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "🌐 Starting FastAPI Backend..."
cd ai-backend

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please run ./scripts/setup-backend.sh first"
    exit 1
fi

# Start backend with Poetry
poetry run uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🎨 Starting Next.js Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 PrepVista is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
