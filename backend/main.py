from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import logging
import traceback
import time
import re
import uuid
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Session storage (in production, use Redis or database)
active_sessions = {}

def cleanup_expired_sessions():
    """Remove sessions that have exceeded their time limit"""
    current_time = datetime.now()
    expired_sessions = []
    
    for session_id, session_data in active_sessions.items():
        elapsed_time = (current_time - session_data["start_time"]).total_seconds()
        if elapsed_time > session_data["time_limit"] and not session_data["completed"]:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del active_sessions[session_id]
        logger.info(f"Cleaned up expired session: {session_id}")
    
    return len(expired_sessions)

# Load environment variables
load_dotenv()

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
logger.info(f"GOOGLE_API_KEY loaded: {'Yes' if GOOGLE_API_KEY else 'No'}")

if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY environment variable is required")
    logger.error("Please check your .env file or environment variables")
    raise ValueError("GOOGLE_API_KEY environment variable is required")

# Validate API key format (basic check)
if len(GOOGLE_API_KEY) < 20:
    logger.warning(f"GOOGLE_API_KEY seems too short: {len(GOOGLE_API_KEY)} characters")

logger.info("Initializing Gemini AI with API key")
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    
    # Use only free Gemini models
    free_models = [
        'gemini-1.5-flash',  # Free, fast model
        'gemini-1.0-pro'     # Free, stable model
    ]
    
    model = None
    working_model = None
    
    for model_name in free_models:
        try:
            logger.info(f"Trying free model: {model_name}")
            model = genai.GenerativeModel(model_name)
            # Test the model with a simple request
            test_response = model.generate_content("Hello")
            if test_response.text:
                logger.info(f"Successfully initialized free model: {model_name}")
                working_model = model_name
                break
        except Exception as e:
            logger.warning(f"Free model {model_name} failed: {str(e)}")
            continue
    
    if not model:
        logger.error("All free Gemini models failed to initialize")
        logger.info("System will use fallback questions only")
        model = None  # Set to None to indicate no AI model available
    else:
        logger.info(f"Gemini AI model initialized successfully with: {working_model}")
    
except Exception as e:
    logger.error(f"Failed to initialize Gemini AI: {str(e)}")
    logger.error(f"Initialization error traceback: {traceback.format_exc()}")
    logger.info("System will use fallback questions only")
    model = None  # Set to None to indicate no AI model available

app = FastAPI(
    title="Aptitude Prep API",
    description="AI-powered aptitude exam preparation platform using Gemini AI",
    version="1.0.0"
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Log request body for POST requests
    if request.method == "POST":
        try:
            body = await request.body()
            if body:
                logger.info(f"Request body: {body.decode()[:500]}...")
        except Exception as e:
            logger.warning(f"Could not read request body: {e}")
    
    # Process request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed after {process_time:.3f}s: {str(e)}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {type(exc).__name__}: {str(exc)}")
    logger.error(f"Request URL: {request.url}")
    logger.error(f"Request method: {request.method}")
    logger.error(f"Exception traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__
        }
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Question(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    shortcut: str
    difficulty: str

class QuestionRequest(BaseModel):
    exam_type: str
    topic: str
    difficulty: str = "medium"
    count: int = 10  # Changed default to 10 questions

class SessionRequest(BaseModel):
    exam_type: str
    topic: str
    difficulty: str = "medium"

class SessionResponse(BaseModel):
    session_id: str
    questions: List[Question]
    time_limit: int = 120  # 2 minutes in seconds

class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    selected_answer: int
    time_taken: int  # seconds taken to answer

class WrongAnswer(BaseModel):
    question_id: str
    question: str
    user_answer: str
    correct_answer: str
    options: List[str]
    explanation: str
    shortcut: str

class SessionResult(BaseModel):
    session_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    time_taken: int
    wrong_answers: List[WrongAnswer]  # Questions with wrong answers for feedback

class FeedbackRequest(BaseModel):
    exam_type: str
    topic: str
    question: str
    user_answer: str
    correct_answer: Optional[str] = None
    is_correct: bool

class Feedback(BaseModel):
    is_correct: bool
    explanation: str
    shortcut: str
    improvement: str

# Question generation prompts for different exam types
EXAM_PROMPTS = {
    "upsc": "Generate aptitude questions suitable for UPSC Civil Services examination. Focus on logical reasoning, analytical thinking, and problem-solving skills.",
    "mpsc": "Generate aptitude questions suitable for Maharashtra Public Service Commission examination. Include questions on reasoning, mathematics, and general aptitude.",
    "college-placements": "Generate aptitude questions commonly asked in campus recruitment tests. Focus on quantitative aptitude, logical reasoning, and verbal ability.",
    "ibps": "Generate aptitude questions suitable for Institute of Banking Personnel Selection examination. Include banking-related aptitude and reasoning questions.",
    "ssc": "Generate aptitude questions suitable for Staff Selection Commission examination. Focus on general intelligence and reasoning.",
    "cat": "Generate aptitude questions suitable for Common Admission Test (CAT). Focus on quantitative aptitude, verbal ability, and data interpretation."
}

TOPIC_PROMPTS = {
    "mathematics": "Generate mathematical aptitude questions covering arithmetic, algebra, geometry, and number systems.",
    "quantitative": "Generate quantitative aptitude questions covering numbers, algebra, geometry, time & work, and percentages.",
    "reasoning": "Generate logical reasoning questions covering verbal and non-verbal reasoning, analytical thinking, and puzzles.",
    "logical": "Generate logical reasoning questions covering puzzles, blood relations, coding-decoding, and seating arrangements.",
    "english": "Generate English language questions covering grammar, vocabulary, comprehension, and verbal ability.",
    "verbal": "Generate verbal ability questions covering grammar, vocabulary, reading comprehension, and verbal reasoning.",
    "data-interpretation": "Generate data interpretation questions covering charts, graphs, tables, and data analysis.",
    "general-awareness": "Generate general awareness questions covering current affairs, static GK, economics, and polity.",
    "general-knowledge": "Generate general knowledge questions covering current affairs, static GK, science, and geography.",
    "computer-knowledge": "Generate computer knowledge questions covering basic computer concepts, applications, and technology.",
    "marathi": "Generate Marathi language questions covering grammar, vocabulary, and comprehension."
}

@app.get("/")
async def root():
    return {"message": "Aptitude Prep API - AI-powered exam preparation platform"}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API status"""
    try:
        if model:
            # Test Gemini AI connection
            test_response = model.generate_content("Hello")
            ai_status = "healthy" if test_response.text else "unhealthy"
            logger.info("Health check: Gemini AI connection test successful")
        else:
            ai_status = "not_available"
            logger.info("Health check: No AI model available, using fallback mode")
    except Exception as e:
        ai_status = f"error: {str(e)}"
        logger.error(f"Health check: Gemini AI connection test failed: {str(e)}")
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "ai_service": ai_status,
        "api_version": "1.0.0",
        "mode": "ai_enabled" if model else "fallback_only"
    }

@app.get("/test-ai")
async def test_ai():
    """Test endpoint to verify Gemini AI is working"""
    if not model:
        return {
            "status": "no_model",
            "message": "No AI model available, system is running in fallback mode",
            "mode": "fallback_only"
        }
    
    try:
        logger.info("Testing Gemini AI connection")
        response = model.generate_content("Generate a simple math question: What is 2 + 2?")
        logger.info(f"AI test successful: {response.text[:100]}...")
        return {
            "status": "success",
            "ai_response": response.text,
            "response_length": len(response.text),
            "mode": "ai_enabled"
        }
    except Exception as e:
        logger.error(f"AI test failed: {str(e)}")
        logger.error(f"AI test error traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "mode": "ai_enabled"
        }

@app.get("/test-feedback")
async def test_feedback():
    """Test endpoint to verify feedback generation is working"""
    if not model:
        return {
            "status": "no_model",
            "message": "No AI model available, system is running in fallback mode",
            "mode": "fallback_only"
        }
    
    try:
        logger.info("Testing feedback generation")
        
        # Create a test feedback request
        test_request = FeedbackRequest(
            exam_type="ibps",
            topic="quantitative",
            question="What is 2 + 2?",
            user_answer="3",
            is_correct=False
        )
        
        # Generate feedback
        feedback = await generate_feedback(test_request)
        
        return {
            "status": "success",
            "feedback": feedback.dict(),
            "mode": "ai_enabled"
        }
    except Exception as e:
        logger.error(f"Feedback test failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "mode": "ai_enabled"
        }

@app.get("/debug-feedback")
async def debug_feedback():
    """Debug endpoint to test feedback generation with sample data"""
    if not model:
        return {
            "status": "no_model",
            "message": "No AI model available"
        }
    
    try:
        logger.info("Testing feedback generation with sample data")
        
        # Test case 1: Correct answer
        correct_request = FeedbackRequest(
            exam_type="ibps",
            topic="quantitative",
            question="What is the area of a rectangle with length 20m and width 15m?",
            user_answer="300 sq m",
            is_correct=True
        )
        
        # Test case 2: Incorrect answer
        incorrect_request = FeedbackRequest(
            exam_type="ibps",
            topic="quantitative",
            question="What is the area of a rectangle with length 20m and width 15m?",
            user_answer="250 sq m",
            is_correct=False
        )
        
        # Generate feedback for both
        correct_feedback = await generate_feedback(correct_request)
        incorrect_feedback = await generate_feedback(incorrect_request)
        
        return {
            "status": "success",
            "test_cases": {
                "correct_answer": {
                    "request": correct_request.dict(),
                    "feedback": correct_feedback.dict()
                },
                "incorrect_answer": {
                    "request": incorrect_request.dict(),
                    "feedback": incorrect_feedback.dict()
                }
            }
        }
    except Exception as e:
        logger.error(f"Debug feedback test failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.get("/model-info")
async def get_model_info():
    """Get information about the current Gemini AI model and available models"""
    try:
        if not model:
            return {
                "status": "no_model",
                "message": "No AI model available, system is running in fallback mode",
                "mode": "fallback_only",
                "api_key_configured": bool(GOOGLE_API_KEY),
                "api_key_length": len(GOOGLE_API_KEY) if GOOGLE_API_KEY else 0
            }
        
        # Get current model info
        current_model = getattr(model, 'model_name', 'Unknown')
        
        # Try to list all available models
        try:
            available_models = genai.list_models()
            model_list = [m.name for m in available_models]
        except Exception as e:
            model_list = [f"Error listing models: {str(e)}"]
        
        return {
            "status": "model_available",
            "current_model": current_model,
            "available_models": model_list,
            "api_key_configured": bool(GOOGLE_API_KEY),
            "api_key_length": len(GOOGLE_API_KEY) if GOOGLE_API_KEY else 0,
            "mode": "ai_enabled"
        }
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "mode": "unknown"
        }

@app.post("/api/questions", response_model=List[Question])
async def generate_questions(request: QuestionRequest):
    """Generate AI-powered questions for the specified exam type and topic"""
    logger.info(f"Received question generation request: exam_type={request.exam_type}, topic={request.topic}, difficulty={request.difficulty}, count={request.count}")
    
    try:
        # Validate request parameters
        if request.count <= 0 or request.count > 20:
            logger.warning(f"Invalid count requested: {request.count}, limiting to 5")
            request.count = 5
        
        if request.difficulty not in ["easy", "medium", "hard"]:
            logger.warning(f"Invalid difficulty requested: {request.difficulty}, defaulting to medium")
            request.difficulty = "medium"
        
        exam_prompt = EXAM_PROMPTS.get(request.exam_type, "")
        topic_prompt = TOPIC_PROMPTS.get(request.topic, "")
        
        logger.info(f"Using exam prompt: {exam_prompt[:100]}...")
        logger.info(f"Using topic prompt: {topic_prompt[:100]}...")
        
        if not exam_prompt or not topic_prompt:
            logger.error(f"Invalid exam type or topic: exam_type={request.exam_type}, topic={request.topic}")
            raise HTTPException(status_code=400, detail="Invalid exam type or topic")
        
        # Create the prompt for Gemini AI
        prompt = f"""
        {exam_prompt}
        
        {topic_prompt}
        
        Generate {request.count} aptitude questions with {request.difficulty} difficulty level.
        
        For each question, provide:
        1. A clear and concise question
        2. Four multiple choice options (A, B, C, D)
        3. The correct answer (0-3, where 0=A, 1=B, 2=C, 3=D)
        4. A detailed explanation of the solution
        5. A shortcut trick or time-saving method to solve the question
        6. Difficulty level (easy/medium/hard)
        
        Format the response as a JSON array with the following structure:
        [
            {{
                "id": "unique_id",
                "question": "question_text",
                "options": ["option_A", "option_B", "option_C", "option_D"],
                "correct_answer": correct_index,
                "explanation": "detailed_explanation",
                "shortcut": "shortcut_trick",
                "difficulty": "difficulty_level"
            }}
        ]
        
        Make sure the questions are relevant to {request.exam_type} examination and {request.topic} topic.
        Ensure the response is valid JSON and contains exactly {request.count} questions.
        """
        
        logger.info("Sending prompt to Gemini AI")
        logger.debug(f"Full prompt: {prompt}")
        
        # Check if AI model is available
        if not model:
            logger.info("No AI model available, using fallback questions")
            return generate_fallback_questions(request)
        
        # Generate response using Gemini AI
        try:
            response = model.generate_content(prompt)
            logger.info(f"Received response from Gemini AI: {len(response.text)} characters")
            logger.debug(f"AI Response: {response.text[:500]}...")
            
            # Check if response is empty or too short
            if not response.text or len(response.text.strip()) < 50:
                logger.warning("AI response is too short or empty, using fallback")
                return generate_fallback_questions(request)
                
        except Exception as ai_error:
            logger.error(f"Error calling Gemini AI: {str(ai_error)}")
            logger.error(f"AI Error traceback: {traceback.format_exc()}")
            logger.info("Using fallback questions due to AI error")
            return generate_fallback_questions(request)
        
        # Parse the response
        try:
            logger.info("Attempting to parse AI response as JSON")
            
            # Clean the response text - remove markdown formatting if present
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            logger.debug(f"Cleaned response text: {clean_text[:200]}...")
            
            questions_data = json.loads(clean_text)
            logger.info(f"Successfully parsed JSON with {len(questions_data)} questions")
            
            # Validate the parsed data
            if not isinstance(questions_data, list):
                logger.error("AI response is not a list, using fallback")
                return generate_fallback_questions(request)
            
            if len(questions_data) == 0:
                logger.warning("AI response contains no questions, using fallback")
                return generate_fallback_questions(request)
            
            questions = []
            for i, q_data in enumerate(questions_data):
                logger.debug(f"Processing question {i+1}: {q_data.get('question', 'No question text')[:50]}...")
                
                # Validate required fields
                required_fields = ["question", "options", "correct_answer", "explanation", "shortcut", "difficulty"]
                missing_fields = [field for field in required_fields if field not in q_data]
                if missing_fields:
                    logger.warning(f"Question {i+1} missing fields: {missing_fields}")
                
                # Validate options
                options = q_data.get("options", [])
                if not isinstance(options, list) or len(options) != 4:
                    logger.warning(f"Question {i+1} has invalid options: {options}")
                    options = ["Option A", "Option B", "Option C", "Option D"]
                
                # Validate correct answer
                correct_answer = q_data.get("correct_answer", 0)
                if not isinstance(correct_answer, int) or correct_answer < 0 or correct_answer > 3:
                    logger.warning(f"Question {i+1} has invalid correct_answer: {correct_answer}, defaulting to 0")
                    correct_answer = 0
                
                question = Question(
                    id=str(i + 1),
                    question=q_data.get("question", f"Question {i+1}"),
                    options=options,
                    correct_answer=correct_answer,
                    explanation=q_data.get("explanation", "Explanation not available"),
                    shortcut=q_data.get("shortcut", "Shortcut not available"),
                    difficulty=q_data.get("difficulty", "medium")
                )
                questions.append(question)
            
            logger.info(f"Successfully generated {len(questions)} questions")
            return questions
            
        except json.JSONDecodeError as json_error:
            logger.error(f"Failed to parse AI response as JSON: {str(json_error)}")
            logger.error(f"Raw AI response: {response.text}")
            logger.info("Falling back to manual question generation")
            return generate_fallback_questions(request)
        except Exception as parse_error:
            logger.error(f"Error processing AI response: {str(parse_error)}")
            logger.error(f"Parse error traceback: {traceback.format_exc()}")
            logger.info("Falling back to manual question generation")
            return generate_fallback_questions(request)
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_questions: {str(e)}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/api/feedback", response_model=Feedback)
async def generate_feedback(request: FeedbackRequest):
    """Generate AI-powered feedback for user answers"""
    logger.info(f"Received feedback request: exam_type={request.exam_type}, topic={request.topic}, is_correct={request.is_correct}")
    logger.info(f"Question: {request.question[:100]}...")
    logger.info(f"User Answer: {request.user_answer}")
    logger.info(f"Correct Answer: {request.correct_answer}")
    logger.info(f"Is Correct Flag: {request.is_correct} (type: {type(request.is_correct)})")
    
    try:
        # Create the prompt for Gemini AI
        prompt = f"""
        You are an expert aptitude tutor for {request.exam_type} examination.
        
        Question: {request.question}
        User's Answer: {request.user_answer}
        Topic: {request.topic}
        """
        
        if request.correct_answer:
            prompt += f"Correct Answer: {request.correct_answer}\n"
        
        prompt += f"""
        The user's answer is {'CORRECT' if request.is_correct else 'INCORRECT'}.
        
        Provide detailed feedback including:
        1. A clear explanation of why the answer is correct or incorrect
        2. A shortcut trick or time-saving method to solve this type of question
        3. An improvement tip for the student
        
        IMPORTANT: 
        - Return ONLY the JSON response without any markdown formatting, code blocks, or additional text.
        - The "is_correct" field must be exactly {str(request.is_correct).lower()}
        - Do not change the correctness assessment - use the provided value.
        
        Format the response as clean JSON:
        {{
            "is_correct": {str(request.is_correct).lower()},
            "explanation": "detailed_explanation",
            "shortcut": "shortcut_trick",
            "improvement": "improvement_tip"
        }}
        
        Make the feedback encouraging and educational, helping the student understand the concept better.
        """
        
        logger.info("Sending feedback prompt to Gemini AI")
        logger.debug(f"Feedback prompt: {prompt}")
        
        # Check if AI model is available
        if not model:
            logger.info("No AI model available, using fallback feedback")
            feedback_text = f"{'Your answer is correct!' if request.is_correct else 'Your answer is incorrect.'}"
            if request.correct_answer:
                feedback_text += f" The correct answer is {request.correct_answer}."
            
            return Feedback(
                is_correct=request.is_correct,
                explanation=feedback_text,
                shortcut="Practice similar questions to improve your speed and accuracy.",
                improvement="Review the concept and try more questions on this topic."
            )
        
        # Generate response using Gemini AI
        try:
            response = model.generate_content(prompt)
            logger.info(f"Received feedback response from Gemini AI: {len(response.text)} characters")
            logger.debug(f"AI Feedback Response: {response.text[:500]}...")
        except Exception as ai_error:
            logger.error(f"Error calling Gemini AI for feedback: {str(ai_error)}")
            logger.error(f"AI Error traceback: {traceback.format_exc()}")
            logger.info("Using fallback feedback due to AI error")
            
            feedback_text = f"{'Your answer is correct!' if request.is_correct else 'Your answer is incorrect.'}"
            if request.correct_answer:
                feedback_text += f" The correct answer is {request.correct_answer}."
            
            return Feedback(
                is_correct=request.is_correct,
                explanation=feedback_text,
                shortcut="Practice similar questions to improve your speed and accuracy.",
                improvement="Review the concept and try more questions on this topic."
            )
        
        # Parse the response
        try:
            logger.info("Attempting to parse feedback response as JSON")
            
            # Clean the response text - remove markdown formatting if present
            clean_text = response.text.strip()
            
            # Handle markdown-wrapped JSON responses
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]  # Remove ```json
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]   # Remove ```
            
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]  # Remove trailing ```
            
            clean_text = clean_text.strip()
            
            logger.debug(f"Cleaned feedback response: {clean_text[:200]}...")
            
            feedback_data = json.loads(clean_text)
            logger.info("Successfully parsed feedback JSON")
            
            # Validate that the AI response matches the expected correctness
            ai_is_correct = feedback_data.get("is_correct", request.is_correct)
            if ai_is_correct != request.is_correct:
                logger.warning(f"AI response correctness mismatch: expected {request.is_correct}, got {ai_is_correct}")
                logger.warning("Correcting AI response to match expected correctness")
                ai_is_correct = request.is_correct
            
            feedback = Feedback(
                is_correct=ai_is_correct,
                explanation=feedback_data.get("explanation", "Explanation not available"),
                shortcut=feedback_data.get("shortcut", "Shortcut not available"),
                improvement=feedback_data.get("improvement", "Keep practicing!")
            )
            return feedback
            
        except json.JSONDecodeError as json_error:
            logger.error(f"Failed to parse feedback response as JSON: {str(json_error)}")
            logger.error(f"Raw feedback response: {response.text}")
            
            # Try to extract JSON content from markdown more aggressively
            try:
                # Look for JSON content between any markdown blocks
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    json_content = json_match.group(0)
                    logger.info("Attempting to parse extracted JSON content")
                    feedback_data = json.loads(json_content)
                    
                    feedback = Feedback(
                        is_correct=request.is_correct,
                        explanation=feedback_data.get("explanation", "Explanation not available"),
                        shortcut=feedback_data.get("shortcut", "Shortcut not available"),
                        improvement=feedback_data.get("improvement", "Keep practicing!")
                    )
                    logger.info("Successfully parsed extracted JSON content")
                    return feedback
            except Exception as extract_error:
                logger.warning(f"Failed to extract JSON content: {str(extract_error)}")
            
            logger.info("Using fallback feedback")
            # Fallback feedback
            feedback_text = f"{'Your answer is correct!' if request.is_correct else 'Your answer is incorrect.'}"
            if request.correct_answer:
                feedback_text += f" The correct answer is {request.correct_answer}."
            
            return Feedback(
                is_correct=request.is_correct,
                explanation=feedback_text,
                shortcut="Practice similar questions to improve your speed and accuracy.",
                improvement="Review the concept and try more questions on this topic."
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_feedback: {str(e)}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")

def generate_fallback_questions(request: QuestionRequest) -> List[Question]:
    """Generate fallback questions when AI generation fails"""
    logger.info(f"Generating fallback questions for topic: {request.topic}")
    
    fallback_questions = {
        "mathematics": [
            {
                "id": "1",
                "question": "If a train travels at 60 km/h for 2 hours and then at 80 km/h for 3 hours, what is the average speed for the entire journey?",
                "options": ["68 km/h", "70 km/h", "72 km/h", "75 km/h"],
                "correct_answer": 2,
                "explanation": "Total distance = (60 × 2) + (80 × 3) = 120 + 240 = 360 km. Total time = 2 + 3 = 5 hours. Average speed = 360/5 = 72 km/h.",
                "shortcut": "Use weighted average: (60×2 + 80×3)/(2+3) = 72 km/h",
                "difficulty": "medium"
            },
            {
                "id": "2",
                "question": "A shopkeeper offers a discount of 20% on a shirt marked at Rs. 500. What is the selling price?",
                "options": ["Rs. 400", "Rs. 450", "Rs. 480", "Rs. 500"],
                "correct_answer": 0,
                "explanation": "Discount = 20% of Rs. 500 = (20/100) × 500 = Rs. 100. Selling price = Marked price - Discount = 500 - 100 = Rs. 400.",
                "shortcut": "Selling price = 80% of marked price = 0.8 × 500 = Rs. 400",
                "difficulty": "easy"
            }
        ],
        "quantitative": [
            {
                "id": "1",
                "question": "If 15 workers can complete a work in 12 days, how many days will 20 workers take to complete the same work?",
                "options": ["8 days", "9 days", "10 days", "12 days"],
                "correct_answer": 1,
                "explanation": "Using the formula: (Workers × Days) = Constant. 15 × 12 = 20 × x. Therefore, x = (15 × 12) ÷ 20 = 9 days.",
                "shortcut": "More workers = fewer days. 15/20 = 3/4, so days = 12 × 3/4 = 9",
                "difficulty": "medium"
            },
            {
                "id": "2",
                "question": "A shopkeeper offers a discount of 20% on a shirt marked at Rs. 500. What is the selling price?",
                "options": ["Rs. 400", "Rs. 450", "Rs. 480", "Rs. 500"],
                "correct_answer": 0,
                "explanation": "Discount = 20% of Rs. 500 = (20/100) × 500 = Rs. 100. Selling price = Marked price - Discount = 500 - 100 = Rs. 400.",
                "shortcut": "Selling price = 80% of marked price = 0.8 × 500 = Rs. 400",
                "difficulty": "easy"
            },
            {
                "id": "3",
                "question": "A train travels 360 km in 4 hours. What is its speed in meters per second?",
                "options": ["20 m/s", "25 m/s", "30 m/s", "35 m/s"],
                "correct_answer": 1,
                "explanation": "Speed = Distance/Time = 360 km/4 hours = 90 km/h. Convert to m/s: 90 × (1000/3600) = 25 m/s.",
                "shortcut": "90 km/h = 90 × (5/18) = 25 m/s",
                "difficulty": "medium"
            },
            {
                "id": "4",
                "question": "If a shopkeeper sells an item for ₹600 at a profit of 20%, what was the cost price of the item?",
                "options": ["₹480", "₹500", "₹520", "₹550"],
                "correct_answer": 1,
                "explanation": "Selling price = Cost price + Profit. 600 = CP + (20% of CP). 600 = CP + 0.2CP = 1.2CP. CP = 600/1.2 = ₹500.",
                "shortcut": "CP = SP/(1 + profit%) = 600/1.2 = ₹500",
                "difficulty": "medium"
            },
            {
                "id": "5",
                "question": "A and B can together complete a piece of work in 6 days. A alone can complete the same work in 10 days. In how many days can B alone complete the work?",
                "options": ["12 days", "15 days", "18 days", "20 days"],
                "correct_answer": 1,
                "explanation": "A's 1 day work = 1/10. A+B's 1 day work = 1/6. B's 1 day work = 1/6 - 1/10 = (5-3)/30 = 2/30 = 1/15. So B alone takes 15 days.",
                "shortcut": "B's time = (A's time × Together's time)/(A's time - Together's time) = (10×6)/(10-6) = 60/4 = 15 days",
                "difficulty": "hard"
            }
        ],
        "reasoning": [
            {
                "id": "1",
                "question": "In a class of 40 students, 25 students like Mathematics and 20 students like Science. If 15 students like both subjects, how many students like neither?",
                "options": ["5", "10", "15", "20"],
                "correct_answer": 1,
                "explanation": "Using set theory: n(M∪S) = n(M) + n(S) - n(M∩S) = 25 + 20 - 15 = 30. Students who like neither = Total - n(M∪S) = 40 - 30 = 10.",
                "shortcut": "Use formula: Neither = Total - (A + B - Both) = 40 - (25 + 20 - 15) = 10",
                "difficulty": "medium"
            },
            {
                "id": "2",
                "question": "If A + B means A is the brother of B, A × B means A is the sister of B, and A - B means A is the father of B, then what does P + Q × R - S mean?",
                "options": ["P is brother of Q who is sister of R who is father of S", "P is brother of Q who is sister of R who is son of S", "P is brother of Q who is sister of R who is father of S", "P is brother of Q who is sister of R who is father of S"],
                "correct_answer": 0,
                "explanation": "P + Q × R - S means P is brother of Q, Q is sister of R, and R is father of S. So P is uncle of S.",
                "shortcut": "Read from left to right: P + Q × R - S",
                "difficulty": "hard"
            }
        ],
        "logical": [
            {
                "id": "1",
                "question": "In a certain code language, 'PEN' is written as 'QFO' and 'BOOK' is written as 'CPPL'. How is 'PAPER' written in that code?",
                "options": ["QBQFS", "QBQFR", "QBQES", "QBQER"],
                "correct_answer": 0,
                "explanation": "Each letter is moved one step forward: P→Q, E→F, N→O. So PAPER becomes QBQFS.",
                "shortcut": "Each letter + 1 position in alphabet",
                "difficulty": "medium"
            }
        ],
        "english": [
            {
                "id": "1",
                "question": "Choose the correct synonym for 'Ubiquitous':",
                "options": ["Rare", "Common", "Everywhere", "Nowhere"],
                "correct_answer": 2,
                "explanation": "Ubiquitous means present, appearing, or found everywhere. The correct synonym is 'Everywhere'.",
                "shortcut": "Think of 'ubiquitous' as 'you can find it anywhere'",
                "difficulty": "medium"
            }
        ],
        "verbal": [
            {
                "id": "1",
                "question": "Complete the analogy: Doctor is to Hospital as Teacher is to:",
                "options": ["School", "Classroom", "Education", "Student"],
                "correct_answer": 0,
                "explanation": "A doctor works in a hospital, similarly a teacher works in a school. The relationship is 'professional works in workplace'.",
                "shortcut": "Think: Where does a teacher work?",
                "difficulty": "easy"
            }
        ],
        "data-interpretation": [
            {
                "id": "1",
                "question": "If a pie chart shows 25% for sector A, 35% for sector B, and 40% for sector C, what is the angle of sector B?",
                "options": ["90°", "126°", "144°", "180°"],
                "correct_answer": 1,
                "explanation": "In a pie chart, 100% = 360°. So 35% = (35/100) × 360° = 126°.",
                "shortcut": "35% of 360° = 0.35 × 360 = 126°",
                "difficulty": "medium"
            }
        ],
        "general-awareness": [
            {
                "id": "1",
                "question": "Which of the following is NOT a fundamental right in the Indian Constitution?",
                "options": ["Right to Equality", "Right to Property", "Right to Freedom", "Right against Exploitation"],
                "correct_answer": 1,
                "explanation": "Right to Property was removed from fundamental rights by the 44th Constitutional Amendment Act, 1978. It is now a legal right under Article 300A.",
                "shortcut": "Right to Property was removed in 1978",
                "difficulty": "hard"
            }
        ],
        "computer-knowledge": [
            {
                "id": "1",
                "question": "What does CPU stand for in computer terminology?",
                "options": ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"],
                "correct_answer": 0,
                "explanation": "CPU stands for Central Processing Unit. It is the main processor of a computer that performs most of the processing of instructions.",
                "shortcut": "CPU is the 'brain' of the computer",
                "difficulty": "easy"
            }
        ]
    }
    
    # Get questions for the requested topic, fallback to mathematics if topic not found
    topic_questions = fallback_questions.get(request.topic, fallback_questions["mathematics"])
    
    # Limit to requested count
    if len(topic_questions) > request.count:
        topic_questions = topic_questions[:request.count]
    
    questions = []
    for i, q_data in enumerate(topic_questions):
        question = Question(
            id=str(i + 1),
            question=q_data["question"],
            options=q_data["options"],
            correct_answer=q_data["correct_answer"],
            explanation=q_data["explanation"],
            shortcut=q_data["shortcut"],
            difficulty=q_data["difficulty"]
        )
        questions.append(question)
    
    logger.info(f"Generated {len(questions)} fallback questions for topic: {request.topic}")
    return questions

@app.get("/api/exam-types")
async def get_exam_types():
    """Get available exam types"""
    logger.info("Received request for exam types")
    return {
        "exam_types": list(EXAM_PROMPTS.keys())
    }

@app.get("/api/topics/{exam_type}")
async def get_topics(exam_type: str):
    """Get available topics for a specific exam type"""
    logger.info(f"Received request for topics for exam type: {exam_type}")
    
    if exam_type not in EXAM_PROMPTS:
        logger.error(f"Invalid exam type requested: {exam_type}")
        raise HTTPException(status_code=400, detail="Invalid exam type")
    
    # Define topics for each exam type
    exam_topics = {
        "upsc": ["mathematics", "reasoning", "english", "general-awareness"],
        "mpsc": ["mathematics", "reasoning", "english", "marathi"],
        "college-placements": ["quantitative", "logical", "verbal", "data-interpretation"],
        "ibps": ["quantitative", "reasoning", "english", "computer-knowledge"],
        "ssc": ["mathematics", "reasoning", "english", "general-knowledge"],
        "cat": ["quantitative", "verbal", "data-interpretation", "logical"]
    }
    
    topics = exam_topics.get(exam_type, [])
    logger.info(f"Returning {len(topics)} topics for exam type {exam_type}")
    
    return {
        "exam_type": exam_type,
        "topics": topics
    }

@app.post("/api/session", response_model=SessionResponse)
async def create_practice_session(request: SessionRequest):
    """Create a new practice session with 10 questions and 2-minute timer"""
    logger.info(f"Creating practice session: exam_type={request.exam_type}, topic={request.topic}")
    
    try:
        # Clean up expired sessions first
        cleaned_count = cleanup_expired_sessions()
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} expired sessions")
        
        # Generate 10 questions
        question_request = QuestionRequest(
            exam_type=request.exam_type,
            topic=request.topic,
            difficulty=request.difficulty,
            count=10
        )
        
        questions = await generate_questions(question_request)
        
        # Create session
        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "exam_type": request.exam_type,
            "topic": request.topic,
            "questions": questions,
            "start_time": datetime.now(),
            "time_limit": 120,  # 2 minutes
            "answers": {},
            "completed": False
        }
        
        active_sessions[session_id] = session_data
        logger.info(f"Created session {session_id} with {len(questions)} questions")
        
        return SessionResponse(
            session_id=session_id,
            questions=questions,
            time_limit=120
        )
        
    except Exception as e:
        logger.error(f"Error creating practice session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@app.post("/api/session/{session_id}/answer")
async def submit_answer(session_id: str, answer: AnswerSubmission):
    """Submit an answer for a question in the session"""
    logger.info(f"Submitting answer for session {session_id}, question {answer.question_id}")
    
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # Check if session is still active
    elapsed_time = (datetime.now() - session["start_time"]).total_seconds()
    if elapsed_time > session["time_limit"]:
        raise HTTPException(status_code=400, detail="Session time limit exceeded")
    
    # Store the answer
    session["answers"][answer.question_id] = {
        "selected_answer": answer.selected_answer,
        "time_taken": answer.time_taken,
        "timestamp": datetime.now()
    }
    
    logger.info(f"Answer stored for question {answer.question_id}")
    return {"status": "success", "message": "Answer submitted"}

@app.post("/api/session/{session_id}/complete", response_model=SessionResult)
async def complete_session(session_id: str):
    """Complete the session and get results with feedback on wrong answers"""
    logger.info(f"Completing session {session_id}")
    
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # Calculate results
    total_questions = len(session["questions"])
    correct_answers = 0
    wrong_answers = []
    
    for question in session["questions"]:
        question_id = question.id
        if question_id in session["answers"]:
            user_answer = session["answers"][question_id]["selected_answer"]
            if user_answer == question.correct_answer:
                correct_answers += 1
            else:
                # Store wrong answer details for feedback
                wrong_answers.append(WrongAnswer(
                    question_id=question_id,
                    question=question.question,
                    user_answer=question.options[user_answer],
                    correct_answer=question.options[question.correct_answer],
                    options=question.options,
                    explanation=question.explanation,
                    shortcut=question.shortcut
                ))
    
    score_percentage = (correct_answers / total_questions) * 100
    total_time = (datetime.now() - session["start_time"]).total_seconds()
    
    # Mark session as completed
    session["completed"] = True
    
    result = SessionResult(
        session_id=session_id,
        total_questions=total_questions,
        correct_answers=correct_answers,
        score_percentage=round(score_percentage, 2),
        time_taken=int(total_time),
        wrong_answers=wrong_answers
    )
    
    logger.info(f"Session {session_id} completed. Score: {correct_answers}/{total_questions} ({score_percentage}%)")
    
    return result

@app.get("/api/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Get current status of a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    elapsed_time = (datetime.now() - session["start_time"]).total_seconds()
    time_remaining = max(0, session["time_limit"] - elapsed_time)
    
    return {
        "session_id": session_id,
        "questions_answered": len(session["answers"]),
        "total_questions": len(session["questions"]),
        "time_remaining": int(time_remaining),
        "completed": session["completed"]
    }

@app.post("/api/sessions/cleanup")
async def cleanup_all_sessions():
    """Manually cleanup all expired sessions"""
    try:
        cleaned_count = cleanup_expired_sessions()
        return {
            "status": "success",
            "cleaned_sessions": cleaned_count,
            "active_sessions": len(active_sessions)
        }
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@app.get("/api/sessions/status")
async def get_all_sessions_status():
    """Get status of all active sessions"""
    try:
        cleanup_expired_sessions()  # Clean up before reporting
        
        sessions_info = []
        for session_id, session_data in active_sessions.items():
            elapsed_time = (datetime.now() - session_data["start_time"]).total_seconds()
            time_remaining = max(0, session_data["time_limit"] - elapsed_time)
            
            sessions_info.append({
                "session_id": session_id,
                "exam_type": session_data["exam_type"],
                "topic": session_data["topic"],
                "questions_answered": len(session_data["answers"]),
                "total_questions": len(session_data["questions"]),
                "time_remaining": int(time_remaining),
                "completed": session_data["completed"],
                "elapsed_time": int(elapsed_time)
            })
        
        return {
            "total_sessions": len(sessions_info),
            "active_sessions": len([s for s in sessions_info if not s["completed"]]),
            "completed_sessions": len([s for s in sessions_info if s["completed"]]),
            "sessions": sessions_info
        }
    except Exception as e:
        logger.error(f"Error getting sessions status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sessions status: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Aptitude Prep API server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
