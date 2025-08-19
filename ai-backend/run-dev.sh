#!/bin/bash

# Development script for PrepVista AI Backend

echo "🚀 Starting PrepVista AI Backend in development mode..."

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please run ./setup-poetry.sh first"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d ".venv" ] && [ ! -f "poetry.lock" ]; then
    echo "📚 Installing dependencies..."
    poetry install
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
fi

echo "✅ Starting development server..."
echo "🌐 Server will be available at: http://localhost:8000"
echo "📖 API documentation at: http://localhost:8000/docs"
echo "🔄 Auto-reload enabled"
echo ""
echo "Press Ctrl+C to stop the server"

# Run the application with Poetry
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
