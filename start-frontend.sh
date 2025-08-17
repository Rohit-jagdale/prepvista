#!/bin/bash

echo "🚀 Starting Aptitude Prep Frontend (Next.js)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📚 Installing dependencies..."
    pnpm install
fi

# Start the development server
echo "🌐 Starting Next.js development server on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

pnpm dev
