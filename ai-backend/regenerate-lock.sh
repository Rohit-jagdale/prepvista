#!/bin/bash

# Script to regenerate poetry.lock file

echo "🔄 Regenerating poetry.lock file..."

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please run ./setup-poetry.sh first"
    exit 1
fi

# Remove existing lock file if it exists
if [ -f "poetry.lock" ]; then
    echo "🗑️  Removing existing poetry.lock..."
    rm poetry.lock
fi

# Generate new lock file
echo "📦 Generating new poetry.lock file..."
poetry lock

echo "✅ poetry.lock file regenerated successfully!"
echo "📚 You can now run 'poetry install' to install dependencies"
