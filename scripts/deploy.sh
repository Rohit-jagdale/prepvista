#!/bin/bash

# 🚀 PrepVista Deployment Script
# This script automates deployment to Vercel (frontend) and Railway (backend)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="ai-backend"
PROJECT_NAME="PrepVista"

echo -e "${BLUE}🚀 $PROJECT_NAME Deployment Script${NC}"
echo "======================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists poetry; then
    print_warning "Poetry is not installed. Backend deployment will be skipped."
    SKIP_BACKEND=true
fi

if ! command_exists git; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_status "Prerequisites check completed"

# Check if we're in the right directory
if [ ! -d "$FRONTEND_DIR" ] || [ ! -d "$BACKEND_DIR" ]; then
    print_error "Please run this script from the PrepVista root directory"
    exit 1
fi

# Frontend Deployment
echo ""
echo "📱 Frontend Deployment"
echo "----------------------"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    cd ..
fi

print_info "Building frontend..."
cd "$FRONTEND_DIR"
npm run build
cd ..

if command_exists vercel; then
    print_info "Deploying to Vercel..."
    cd "$FRONTEND_DIR"
    
    # Check if project is already linked
    if [ -f ".vercel/project.json" ]; then
        print_info "Project already linked to Vercel, deploying..."
        vercel --prod --yes
    else
        print_info "First time deployment, linking project..."
        vercel --prod
    fi
    
    cd ..
    print_status "Frontend deployment completed"
else
    print_warning "Vercel CLI not installed. Installing..."
    npm install -g vercel
    
    print_info "Deploying to Vercel..."
    cd "$FRONTEND_DIR"
    vercel --prod
    cd ..
    print_status "Frontend deployment completed"
fi

# Backend Deployment
echo ""
echo "🧠 Backend Deployment"
echo "---------------------"

if [ "$SKIP_BACKEND" = true ]; then
    print_warning "Skipping backend deployment (Python not available)"
else
    print_info "Preparing backend for deployment..."
    cd "$BACKEND_DIR"
    
    # Update requirements.txt
    if command_exists pip3; then
        print_info "Updating requirements.txt..."
        pip3 freeze > requirements.txt
    elif command_exists pip; then
        print_info "Updating requirements.txt..."
        pip freeze > requirements.txt
    fi
    
    cd ..
    
    print_info "Backend prepared for Railway deployment"
    print_info "Push to GitHub to trigger Railway auto-deployment:"
    echo ""
    echo "  git add ."
    echo "  git commit -m 'Deploy to production'"
    echo "  git push origin main"
    echo ""
fi

# Environment Variables Setup
echo ""
echo "🔧 Environment Variables Setup"
echo "------------------------------"

print_info "Frontend Environment Variables (set in Vercel):"
echo "  NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app"
echo ""

print_info "Backend Environment Variables (set in Railway):"
echo "  GOOGLE_API_KEY = your_gemini_api_key_here"
echo "  PORT = 8000"
echo ""

# Post-deployment instructions
echo ""
echo "🎉 Deployment Summary"
echo "====================="
print_status "Frontend: Deployed to Vercel"
if [ "$SKIP_BACKEND" != true ]; then
    print_status "Backend: Prepared for Railway deployment"
fi
echo ""

echo "📋 Next Steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Set environment variables in Railway dashboard"
echo "3. Push backend changes to GitHub (if not skipped)"
echo "4. Test your deployed application"
echo ""

echo "🔗 Useful Links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Railway Dashboard: https://railway.app/dashboard"
echo "- Deployment Guide: docs/DEPLOYMENT.md"
echo ""

print_status "Deployment script completed successfully!"
echo ""
echo "🌐 Your PrepVista platform will be live once you complete the environment variable setup!"
