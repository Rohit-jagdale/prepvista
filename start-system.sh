#!/bin/bash

echo "🚀 Starting PrepVista Session System"
echo "====================================="

# Check if backend is already running
if pgrep -f "python.*main.py" > /dev/null; then
    echo "⚠️  Backend is already running"
else
    echo "🔧 Starting Backend..."
    cd backend
    python3 main.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
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
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
fi

echo ""
echo "🌐 System Status:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   Health:   http://localhost:8000/health"
echo ""
echo "🧪 Test the new session system:"
echo "   1. Open http://localhost:3000"
echo "   2. Select exam type and topic"
echo "   3. Complete a 10-question session in 2 minutes"
echo "   4. Review results and wrong answer feedback"
echo ""
echo "📊 Test endpoints:"
echo "   python3 test-session.py"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
