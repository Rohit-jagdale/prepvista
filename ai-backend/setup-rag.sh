#!/bin/bash

# Setup script for RAG functionality in PrepVista AI Backend

echo "🚀 Setting up RAG functionality for PrepVista AI Backend..."

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please install Poetry first."
    echo "Visit: https://python-poetry.org/docs/#installation"
    exit 1
fi

# Install new dependencies
echo "📦 Installing new dependencies..."
poetry install --no-root

# Check if pgvector extension is available
echo "🔍 Checking PostgreSQL setup..."

# Create a simple test script to check pgvector
cat > test_pgvector.py << 'EOF'
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    with conn.cursor() as cur:
        # Check if vector extension exists
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector';")
        if cur.fetchone():
            print("✅ pgvector extension is installed")
        else:
            print("⚠️  pgvector extension not found. Installing...")
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            print("✅ pgvector extension installed")
    
    conn.close()
    print("✅ Database connection successful")
    
except Exception as e:
    print(f"❌ Database setup failed: {e}")
    print("Please ensure:")
    print("1. PostgreSQL is running")
    print("2. DATABASE_URL is set correctly in .env file")
    print("3. Your database user has CREATE EXTENSION privileges")
EOF

poetry run python test_pgvector.py
rm test_pgvector.py

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check environment variables
echo "🔧 Checking environment variables..."

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  GOOGLE_API_KEY not set. RAG functionality will be limited."
    echo "Please add GOOGLE_API_KEY to your .env file"
else
    echo "✅ GOOGLE_API_KEY is set"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please add it to your .env file"
    exit 1
else
    echo "✅ DATABASE_URL is set"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
echo "✅ Uploads directory created"

# Run database migration
echo "🗄️  Running database migration..."
cd ../frontend
npx prisma migrate deploy
cd ../ai-backend

echo "🎉 RAG setup completed!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has GOOGLE_API_KEY and DATABASE_URL"
echo "2. Start the backend: poetry run python main.py"
echo "3. Test the RAG endpoints:"
echo "   - POST /api/rag/upload-pdf"
echo "   - POST /api/rag/query"
echo "   - POST /api/rag/search"
echo "   - GET /api/rag/stats/{agent_id}"
echo ""
echo "For testing, you can use the debug endpoint: GET /debug"
