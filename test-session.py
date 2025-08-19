#!/usr/bin/env python3
"""
Test script for the new session-based practice system
"""

import requests
import json
import time

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
        
        # 3. Complete the session
        print(f"\n3. Completing session...")
        complete_response = requests.post(f"{BASE_URL}/api/session/{session_id}/complete")
        
        if complete_response.status_code != 200:
            print(f"❌ Failed to complete session: {complete_response.status_code}")
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
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

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

if __name__ == "__main__":
    print("🚀 PrepVista Session System Test")
    print("=" * 40)
    
    test_health_endpoints()
    test_session_system()
    
    print("\n✨ All tests completed!")
