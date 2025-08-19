#!/bin/bash

echo "🚀 Starting PrepVista Session System"
echo "====================================="

# Check if backend is already running
if pgrep -f "uvicorn.*main:app" > /dev/null; then
    echo "⚠️  Backend is already running"
else
    echo "🔧 Starting AI Backend..."
    cd ai-backend
    
    # Check if Poetry is installed
    if ! command -v poetry &> /dev/null; then
        echo "❌ Poetry is not installed. Please run ./scripts/setup-backend.sh first"
        exit 1
    fi
    
    # Start backend with Poetry
    poetry run uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "✅ AI Backend started with PID: $BACKEND_PID"
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    sleep 5
fi

# Check if frontend is already running
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Frontend is already running"
else
    echo "🎨 Starting Frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
    cd ..
fi

echo ""
echo "🌐 System Status:"
echo "   AI Backend: http://localhost:8000"
echo "   Frontend:   http://localhost:3000"
echo "   Health:     http://localhost:8000/health"
echo ""
echo "🧪 Test the new session system:"
echo "   1. Open http://localhost:3000"
echo "   2. Select exam type and topic"
echo "   3. Complete a 10-question session in 2 minutes"
echo "   4. Review results and wrong answer feedback"
echo ""
echo "📊 Test endpoints:"
echo "   poetry run python tests/test-session.py"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
