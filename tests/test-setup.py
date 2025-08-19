#!/usr/bin/env python
"""
Test script to verify the PrepVista backend setup with Poetry
"""

import sys
import os

def test_python_version():
    """Test Python version"""
    print("🐍 Testing Python version...")
    if sys.version_info >= (3, 8):
        print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} is compatible")
        return True
    else:
        print(f"❌ Python {sys.version_info.major}.{sys.version_info.minor} is too old. Need 3.8+")
        return False

def test_dependencies():
    """Test if required packages can be imported"""
    print("\n📦 Testing dependencies...")
    
    try:
        import fastapi
        print("✅ FastAPI is available")
    except ImportError:
        print("❌ FastAPI not found. Run: poetry install")
        return False
    
    try:
        import google.generativeai
        print("✅ Google Generative AI is available")
    except ImportError:
        print("❌ Google Generative AI not found. Run: poetry install")
        return False
    
    try:
        import pydantic
        print("✅ Pydantic is available")
    except ImportError:
        print("❌ Pydantic not found. Run: poetry install")
        return False
    
    return True

def test_environment():
    """Test environment configuration"""
    print("\n🔧 Testing environment...")
    
    # Check if .env file exists
    if os.path.exists("ai-backend/.env"):
        print("✅ Backend .env file found")
        
        # Check if GOOGLE_API_KEY is set
        from dotenv import load_dotenv
        load_dotenv("ai-backend/.env")
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key and api_key != "your_gemini_api_key_here":
            print("✅ Google Gemini API key is configured")
            return True
        else:
            print("⚠️  Google Gemini API key not configured or using placeholder")
            print("   Please edit ai-backend/.env and add your actual API key")
            return False
    else:
        print("❌ Backend .env file not found")
        print("   Please copy ai-backend/env.example to ai-backend/.env and configure it")
        return False

def test_frontend():
    """Test frontend setup"""
    print("\n🎨 Testing frontend...")
    
    if os.path.exists("frontend/package.json"):
        print("✅ package.json found")
        
        if os.path.exists("frontend/node_modules"):
            print("✅ Node modules installed")
            return True
        else:
            print("⚠️  Node modules not installed. Run: pnpm install")
            return False
    else:
        print("❌ package.json not found")
        return False

def main():
    """Main test function"""
    print("🧪 Testing PrepVista Setup with Poetry")
    print("=" * 40)
    
    tests = [
        test_python_version,
        test_dependencies,
        test_environment,
        test_frontend
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            print()
    
    print("=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Setup is complete.")
        print("\n🚀 You can now start the system:")
        print("   ./scripts/start-system.sh")
    else:
        print("⚠️  Some tests failed. Please check the setup.")
        print("\n💡 Setup commands:")
        print("   ./scripts/setup-backend.sh  # Setup backend with Poetry")
        print("   cd frontend && pnpm install # Setup frontend")
    
    return passed == total

if __name__ == "__main__":
    main()
