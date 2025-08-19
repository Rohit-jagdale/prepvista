#!/bin/bash

# Setup script for PrepVista AI Backend with Poetry

echo "🚀 Setting up PrepVista AI Backend with Poetry..."

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

# Install dependencies
echo "📚 Installing project dependencies..."
poetry install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

echo "🎉 Setup complete! You can now run the application with:"
echo "   poetry run uvicorn main:app --reload"
echo ""
echo "Other useful commands:"
echo "   poetry add <package>     - Add a new dependency"
echo "   poetry remove <package>  - Remove a dependency"
echo "   poetry update            - Update all dependencies"
echo "   poetry show              - Show installed packages"
echo "   poetry shell             - Activate virtual environment"
