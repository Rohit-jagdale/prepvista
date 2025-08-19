#!/bin/bash

echo "🚀 Setting up PrepVista Backend..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Error: Please run this script from the PrepVista root directory"
    exit 1
fi

cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit the .env file and add your Google Gemini API key"
    echo "   1. Get your API key from: https://makersuite.google.com/app/apikey"
    echo "   2. Edit backend/.env and replace 'your_gemini_api_key_here' with your actual key"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing Python dependencies..."
    pip3 install -r requirements.txt
else
    echo "✅ Python dependencies already installed"
fi

echo ""
echo "🎯 Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your Google Gemini API key"
echo "2. Start the backend: cd backend && python3 main.py"
echo "3. Start the frontend: pnpm dev"
echo ""
echo "The backend will run on http://localhost:8000"
echo "The frontend will run on http://localhost:3000"
