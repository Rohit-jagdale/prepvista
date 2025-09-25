#!/bin/bash

echo "🚀 Setting up PrepVista Authentication System"
echo "=============================================="

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Setting up Prisma..."
pnpm db:generate

echo "📝 Creating .env.local template..."
cat > .env.local.template << EOL
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (Supabase recommended)
# For Prisma migrations and reliability, point BOTH to the non-pooled 5432 URL from
# Supabase > Project Settings > Database > Connection string > URI.
# Example:
#   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require
# If you later use PgBouncer (6543), keep DIRECT_URL on 5432 and you may set DATABASE_URL to 6543 with
#   pgbouncer=true&connection_limit=1
# but don't do that until everything works.
DATABASE_URL="postgresql://username:password@localhost:5432/prepvista?schema=public&sslmode=disable"
DIRECT_URL="postgresql://username:password@localhost:5432/prepvista?schema=public&sslmode=disable"

# App Configuration
NEXT_PUBLIC_APP_NAME=PrepVista
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Supabase client (frontend)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EOL

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.local.template to .env.local"
echo "2. Update .env.local with your actual values:"
echo "   - Get Google OAuth credentials from Google Cloud Console"
echo "   - Set up PostgreSQL database"
echo "   - Generate a strong NEXTAUTH_SECRET"
echo "   - Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. Run: pnpm db:push (to create database tables)"
echo "4. Run: pnpm dev (to start development server)"
echo ""
echo "🌐 New Routing Structure:"
echo "   - / (root) → Landing page with pricing and sign up"
echo "   - /app → Dashboard (requires authentication)"
echo "   - /app/practice → Practice questions"
echo "   - /app/progress → Progress tracking"
echo "   - /auth/signin → Sign in page"
echo "   - /auth/signup → Sign up page"
echo ""
echo "📚 See AUTHENTICATION_SETUP.md for detailed instructions"
echo "🔍 Run 'pnpm db:studio' to view your database data"
echo "🎯 Authenticated users will automatically redirect to /app"
