#!/bin/bash

echo "🚀 Setting up PrepVista Backend with Poetry..."

# Check if we're in the right directory
if [ ! -f "ai-backend/main.py" ]; then
    echo "❌ Error: Please run this script from the PrepVista root directory"
    exit 1
fi

cd ai-backend

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "📦 Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    
    # Add Poetry to PATH for current session
    export PATH="$HOME/.local/bin:$PATH"
    
    echo "✅ Poetry installed successfully!"
else
    echo "✅ Poetry is already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit the .env file and add your Google Gemini API key"
    echo "   1. Get your API key from: https://makersuite.google.com/app/apikey"
    echo "   2. Edit ai-backend/.env and replace 'your_gemini_api_key_here' with your actual key"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies using Poetry
echo "📚 Installing dependencies with Poetry..."

poetry install

echo ""
echo "🎯 Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit ai-backend/.env and add your Google Gemini API key"
echo "2. Start the backend: cd ai-backend && poetry run uvicorn main:app --reload"
echo "3. Start the frontend: pnpm dev"
echo ""
echo "The backend will run on http://localhost:8000"
echo "The frontend will run on http://localhost:3000"
