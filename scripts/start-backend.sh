#!/bin/bash

echo "🚀 Starting PrepVista AI Backend with Poetry..."

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please run ./scripts/setup-backend.sh first"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "ai-backend/main.py" ]; then
    echo "❌ Error: Please run this script from the PrepVista root directory"
    exit 1
fi

cd ai-backend

# Check if dependencies are installed
if [ ! -f "poetry.lock" ]; then
    echo "📚 Installing dependencies..."
    poetry install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please copy env.example to .env and add your Google Gemini API key."
    echo "   You can get your API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

# Start the server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📖 API documentation will be available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
