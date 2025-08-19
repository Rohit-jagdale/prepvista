#!/usr/bin/env python
"""
Test script for the new session-based practice system
Updated for new project structure with Poetry
"""

import requests
import json
import time
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000"

def test_session_system():
    """Test the complete session-based practice system"""
    print("🧪 Testing Session-Based Practice System")
    print("=" * 50)
    
    try:
        # 1. Create a new session
        print("\n1. Creating practice session...")
        session_response = requests.post(f"{BASE_URL}/api/session", json={
            "exam_type": "ibps",
            "topic": "quantitative",
            "difficulty": "medium"
        })
        
        if session_response.status_code != 200:
            print(f"❌ Failed to create session: {session_response.status_code}")
            print(f"   Response: {session_response.text}")
            return
        
        session_data = session_response.json()
        session_id = session_data["session_id"]
        questions = session_data["questions"]
        
        print(f"✅ Session created: {session_id}")
        print(f"   Questions: {len(questions)}")
        print(f"   Time limit: {session_data['time_limit']} seconds")
        
        # 2. Submit answers for all questions
        print(f"\n2. Submitting answers for {len(questions)} questions...")
        
        for i, question in enumerate(questions):
            # Simulate user selecting first option for all questions
            selected_answer = 0
            time_taken = 2  # Simulate 2 seconds per question
            
            answer_response = requests.post(f"{BASE_URL}/api/session/{session_id}/answer", json={
                "session_id": session_id,
                "question_id": question["id"],
                "selected_answer": selected_answer,
                "time_taken": time_taken
            })
            
            if answer_response.status_code == 200:
                print(f"   ✅ Question {i+1}: Answer submitted")
            else:
                print(f"   ❌ Question {i+1}: Failed to submit answer")
                print(f"      Status: {answer_response.status_code}")
                print(f"      Response: {answer_response.text}")
        
        # 3. Complete the session
        print(f"\n3. Completing session...")
        complete_response = requests.post(f"{BASE_URL}/api/session/{session_id}/complete")
        
        if complete_response.status_code != 200:
            print(f"❌ Failed to complete session: {complete_response.status_code}")
            print(f"   Response: {complete_response.text}")
            return
        
        result = complete_response.json()
        print(f"✅ Session completed!")
        print(f"   Score: {result['correct_answers']}/{result['total_questions']} ({result['score_percentage']}%)")
        print(f"   Time taken: {result['time_taken']} seconds")
        print(f"   Wrong answers: {len(result['wrong_answers'])}")
        
        # 4. Show wrong answers with feedback
        if result['wrong_answers']:
            print(f"\n4. Wrong answers feedback:")
            for i, wrong_answer in enumerate(result['wrong_answers']):
                print(f"   Question {i+1}: {wrong_answer['question'][:50]}...")
                print(f"     Your answer: {wrong_answer['user_answer']}")
                print(f"     Correct answer: {wrong_answer['correct_answer']}")
                print(f"     Explanation: {wrong_answer['explanation'][:100]}...")
                print()
        
        # 5. Check session status
        print(f"\n5. Checking session status...")
        status_response = requests.get(f"{BASE_URL}/api/session/{session_id}/status")
        
        if status_response.status_code == 200:
            status = status_response.json()
            print(f"✅ Session status: {status['completed']}")
        else:
            print(f"❌ Failed to get session status")
        
        print("\n🎉 Session system test completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
        print("   Start the backend with: cd ai-backend && poetry run uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

def test_health_endpoints():
    """Test health and status endpoints"""
    print("\n🏥 Testing Health Endpoints")
    print("=" * 30)
    
    try:
        # Health check
        health_response = requests.get(f"{BASE_URL}/health")
        if health_response.status_code == 200:
            health = health_response.json()
            print(f"✅ Health: {health['status']}")
            print(f"   AI Service: {health['ai_service']}")
            print(f"   Mode: {health['mode']}")
        else:
            print(f"❌ Health check failed: {health_response.status_code}")
        
        # Model info
        model_response = requests.get(f"{BASE_URL}/model-info")
        if model_response.status_code == 200:
            model_info = model_response.json()
            print(f"✅ Model Info: {model_info['status']}")
            print(f"   Current Model: {model_info.get('current_model', 'N/A')}")
        else:
            print(f"❌ Model info failed: {model_response.status_code}")
        
        # Sessions status
        sessions_response = requests.get(f"{BASE_URL}/api/sessions/status")
        if sessions_response.status_code == 200:
            sessions = sessions_response.json()
            print(f"✅ Sessions: {sessions['total_sessions']} total, {sessions['active_sessions']} active")
        else:
            print(f"❌ Sessions status failed: {sessions_response.status_code}")
            
    except Exception as e:
        print(f"❌ Health test failed: {str(e)}")

def test_new_endpoints():
    """Test the new session management endpoints"""
    print("\n🆕 Testing New Session Endpoints")
    print("=" * 35)
    
    try:
        # Test sessions cleanup
        cleanup_response = requests.post(f"{BASE_URL}/api/sessions/cleanup")
        if cleanup_response.status_code == 200:
            cleanup_data = cleanup_response.json()
            print(f"✅ Cleanup endpoint: {cleanup_data['cleaned_sessions']} sessions cleaned")
        else:
            print(f"❌ Cleanup endpoint failed: {cleanup_response.status_code}")
        
        # Test sessions status
        status_response = requests.get(f"{BASE_URL}/api/sessions/status")
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"✅ Sessions status: {status_data['total_sessions']} total sessions")
        else:
            print(f"❌ Sessions status failed: {status_response.status_code}")
            
    except Exception as e:
        print(f"❌ New endpoints test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 PrepVista Session System Test")
    print("=" * 40)
    print(f"📍 Testing against: {BASE_URL}")
    print(f"📁 Project structure: Updated for new organization")
    print()
    
    test_health_endpoints()
    test_new_endpoints()
    test_session_system()
    
    print("\n✨ All tests completed!")
    print("\n📚 For more information, check:")
    print("   - docs/PROJECT_STRUCTURE.md")
    print("   - docs/SESSION_SYSTEM_README.md")
    print("   - README.md")
