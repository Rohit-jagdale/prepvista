#!/usr/bin/env python3
"""
Simple API testing script for Aptitude Prep backend
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running?")
        print("   Start with: ./start-backend.sh")
        return False

def test_exam_types():
    """Test getting available exam types"""
    try:
        response = requests.get(f"{BASE_URL}/api/exam-types")
        if response.status_code == 200:
            data = response.json()
            print("✅ Exam types endpoint working")
            print(f"   Available exams: {', '.join(data['exam_types'])}")
            return True
        else:
            print(f"❌ Exam types endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing exam types: {e}")
        return False

def test_topics():
    """Test getting topics for an exam type"""
    try:
        response = requests.get(f"{BASE_URL}/api/topics/upsc")
        if response.status_code == 200:
            data = response.json()
            print("✅ Topics endpoint working")
            print(f"   UPSC topics: {', '.join(data['topics'])}")
            return True
        else:
            print(f"❌ Topics endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing topics: {e}")
        return False

def test_question_generation():
    """Test AI question generation"""
    try:
        payload = {
            "exam_type": "upsc",
            "topic": "mathematics",
            "difficulty": "medium",
            "count": 2
        }
        
        print("🤖 Testing AI question generation...")
        response = requests.post(f"{BASE_URL}/api/questions", json=payload)
        
        if response.status_code == 200:
            questions = response.json()
            print("✅ Question generation working")
            print(f"   Generated {len(questions)} questions")
            
            # Show first question
            if questions:
                q = questions[0]
                print(f"   Sample question: {q['question'][:100]}...")
                print(f"   Options: {q['options']}")
                print(f"   Correct answer: {q['correct_answer']}")
            
            return True
        else:
            print(f"❌ Question generation returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing question generation: {e}")
        return False

def test_feedback_generation():
    """Test AI feedback generation"""
    try:
        payload = {
            "exam_type": "upsc",
            "topic": "mathematics",
            "question": "What is 15% of 200?",
            "user_answer": "25",
            "correct_answer": "30",
            "is_correct": False
        }
        
        print("💡 Testing AI feedback generation...")
        response = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        
        if response.status_code == 200:
            feedback = response.json()
            print("✅ Feedback generation working")
            print(f"   Explanation: {feedback['explanation'][:100]}...")
            print(f"   Shortcut: {feedback['shortcut'][:100]}...")
            print(f"   Improvement: {feedback['improvement'][:100]}...")
            return True
        else:
            print(f"❌ Feedback generation returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing feedback generation: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Aptitude Prep API")
    print("=" * 40)
    
    tests = [
        test_backend_health,
        test_exam_types,
        test_topics,
        test_question_generation,
        test_feedback_generation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()  # Add spacing between tests
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            print()
    
    print("=" * 40)
    print(f"📊 API Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All API tests passed! The backend is working correctly.")
        print("\n🚀 You can now:")
        print("   1. Start the frontend: ./start-frontend.sh")
        print("   2. Open http://localhost:3000 in your browser")
        print("   3. Start practicing with AI-powered questions!")
    else:
        print("⚠️  Some API tests failed. Please check the backend logs.")
        print("\n💡 Common issues:")
        print("   1. Backend not running - start with: ./start-backend.sh")
        print("   2. Missing API key - check backend/.env file")
        print("   3. Network issues - check if ports 8000 and 3000 are available")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
