from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import json
import logging
import traceback
import time
import asyncio
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
import yaml
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Global configuration
AI_TIMEOUT = 30.0  # 30 seconds timeout for AI calls
AI_ENABLED = True  # Can be disabled via environment variable

# Session storage removed - focusing on question generation only

# AI Model (will be initialized lazily)
ai_model = None
ai_initialized = False

# Prompts loaded from YAML file
prompts = None

def load_prompts():
    """Load prompts from prompt.yml file"""
    global prompts
    try:
        prompt_file = Path(__file__).parent / "prompt.yml"
        with open(prompt_file, 'r', encoding='utf-8') as file:
            prompts = yaml.safe_load(file)
        logger.info("Prompts loaded successfully from prompt.yml")
    except Exception as e:
        logger.error(f"Failed to load prompts from prompt.yml: {e}")
        prompts = None

def get_prompt(prompt_key: str, **kwargs) -> str:
    """Get a formatted prompt from the loaded prompts"""
    if not prompts:
        raise Exception("Prompts not loaded")
    
    if prompt_key not in prompts:
        raise Exception(f"Prompt key '{prompt_key}' not found")
    
    template = prompts[prompt_key]["template"]
    return template.format(**kwargs)

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
    difficulty: str
    count: int

# New models for AI Agents
class AIQuestionRequest(BaseModel):
    agent_id: str
    subject: str
    question_types: List[str]
    question_count: int
    difficulty: str
    document_content: str

class AIQuestion(BaseModel):
    id: str
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    expected_answer: Optional[str] = None
    key_points: Optional[List[str]] = None
    evaluation_criteria: Optional[List[str]] = None
    central_concept: Optional[str] = None
    expected_branches: Optional[List[str]] = None
    difficulty: str

# Session-related classes removed

# Feedback classes removed - focusing on question generation only

# Fallback questions removed - AI only

# Default questions for any topic
DEFAULT_QUESTIONS = [
    {
        "id": "1",
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correct_answer": 1,
        "explanation": "Basic arithmetic: 2 + 2 = 4",
        "shortcut": "Count on your fingers: 2, then 2 more = 4",
        "difficulty": "easy"
    }
]

async def initialize_ai_model():
    """Initialize AI model with timeout protection"""
    global ai_model, ai_initialized
    
    logger.info("Starting AI model initialization...")
    

    
    try:
        import google.generativeai as genai
        logger.info("Successfully imported google.generativeai")
        
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
        if not GOOGLE_API_KEY:
            logger.warning("No GOOGLE_API_KEY found, running in fallback mode")
            ai_model = None
            ai_initialized = True
            return
        
        logger.info(f"Found GOOGLE_API_KEY: {GOOGLE_API_KEY[:10]}...")
        
        # Configure Gemini AI
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info("Configured Gemini AI with API key")
        
        # Use Gemini 1.5 Flash (latest stable)
        model_name = 'gemini-1.5-flash'
        logger.info(f"Initializing {model_name}...")
        
        # Test initialization with timeout
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            future = executor.submit(lambda: genai.GenerativeModel(model_name))
            ai_model = await loop.run_in_executor(None, lambda: future.result(timeout=5.0))
        
        logger.info(f"AI model object created: {ai_model}")
        
        # Quick test with timeout
        with ThreadPoolExecutor() as executor:
            future = executor.submit(lambda: ai_model.generate_content("Hello"))
            test_response = await loop.run_in_executor(None, lambda: future.result(timeout=5.0))
            
        logger.info(f"Test response: {test_response}")
        logger.info(f"Test response text: {test_response.text if test_response.text else 'None'}")
            
        if test_response.text:
            logger.info(f"AI model {model_name} initialized successfully")
            ai_initialized = True
        else:
            logger.warning("AI model test failed, falling back to fallback mode")
            ai_model = None
            ai_initialized = True
            
    except Exception as e:
        logger.error(f"AI initialization failed: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        ai_model = None
        ai_initialized = True

async def generate_ai_questions(request: QuestionRequest) -> List[Question]:
    """Generate questions using AI with robust timeout handling and retries"""
    if not ai_model or not ai_initialized:
        logger.error("AI model not available or not initialized")
        return []
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} to generate questions")
            
            prompt = get_prompt(
                "basic_question_generation",
                count=request.count,
                difficulty=request.difficulty,
                topic=request.topic,
                exam_type=request.exam_type
            )
            
            logger.info(f"Sending prompt to AI: {prompt[:200]}...")
            
            # Execute AI call with timeout
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                future = executor.submit(lambda: ai_model.generate_content(prompt))
                response = await loop.run_in_executor(None, lambda: future.result(timeout=AI_TIMEOUT))
            
            logger.info(f"AI response received: {response.text[:200] if response.text else 'No text'}...")
            
            if not response.text:
                logger.error("AI response has no text content")
                continue  # Try again
            
            # Parse response
            try:
                # Clean response
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
                logger.info(f"Cleaned response text: {text[:200]}...")
                
                data = json.loads(text)
                if not isinstance(data, list):
                    logger.error(f"AI response is not a list, got: {type(data)}")
                    continue  # Try again
                
                logger.info(f"Parsed {len(data)} questions from AI response")
                
                questions = []
                for i, q_data in enumerate(data[:request.count]):
                    try:
                        question = Question(
                            id=str(i + 1),
                            question=q_data.get("question", f"Question {i+1}"),
                            options=q_data.get("options", ["A", "B", "C", "D"]),
                            correct_answer=q_data.get("correct_answer", 0),
                            explanation=q_data.get("explanation", "Explanation not available"),
                            shortcut=q_data.get("shortcut", "Shortcut not available"),
                            difficulty=q_data.get("difficulty", request.difficulty)
                        )
                        questions.append(question)
                        logger.info(f"Successfully parsed question {i+1}")
                    except Exception as e:
                        logger.warning(f"Failed to parse question {i+1}: {e}")
                        continue
                
                logger.info(f"Successfully created {len(questions)} Question objects")
                return questions
                            
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.error(f"Raw response text: {response.text}")
                continue  # Try again
                
        except Exception as e:
            logger.error(f"AI question generation attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:  # Not the last attempt
                logger.info(f"Retrying in 2 seconds...")
                await asyncio.sleep(2)
                continue
            else:
                # Last attempt failed, log and raise
                logger.error(f"All {max_retries} attempts failed")
                logger.error(f"Exception type: {type(e)}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                
                # Check for specific error types and provide better error messages
                error_msg = str(e).lower()
                if "quota" in error_msg or "429" in error_msg or "resourceexhausted" in error_msg:
                    logger.error("AI quota exceeded - user needs to wait or upgrade plan")
                    raise Exception("AI service quota exceeded. Please try again later or contact support.")
                elif "timeout" in error_msg or "timeouterror" in error_msg:
                    logger.error("AI request timed out")
                    raise Exception("AI request timed out. Please try again.")
                elif "api_key" in error_msg or "unauthorized" in error_msg:
                    logger.error("AI API key issue")
                    raise Exception("AI service configuration error. Please contact support.")
                else:
                    logger.error("Unknown AI error")
                    raise Exception("AI service temporarily unavailable. Please try again later.")
    
    # If we get here, all attempts failed
    logger.error("All retry attempts failed")
    raise Exception("AI service temporarily unavailable. Please try again later.")

async def generate_ai_agent_questions(request: AIQuestionRequest) -> List[AIQuestion]:
    """Generate questions for AI agents based on document content"""
    if not ai_model or not ai_initialized:
        logger.error("AI model not available or not initialized")
        raise Exception("AI model not available")
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} to generate AI agent questions")
            
            # Create a comprehensive prompt for different question types
            question_type_instructions = []
            for q_type in request.question_types:
                if q_type.upper() in prompts.get("question_type_instructions", {}):
                    question_type_instructions.append(prompts["question_type_instructions"][q_type.upper()])
                else:
                    question_type_instructions.append(f"{q_type} questions")
            
            prompt = get_prompt(
                "ai_agent_question_generation",
                subject=request.subject,
                document_content=request.document_content[:2000],
                question_count=request.question_count,
                difficulty=request.difficulty,
                question_types=', '.join(question_type_instructions)
            )
            
            logger.info(f"Sending AI agent prompt to AI: {prompt[:200]}...")
            
            # Execute AI call with timeout
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                future = executor.submit(lambda: ai_model.generate_content(prompt))
                response = await loop.run_in_executor(None, lambda: future.result(timeout=AI_TIMEOUT))
            
            logger.info(f"AI response received: {response.text[:200] if response.text else 'No text'}...")
            
            if not response.text:
                logger.error("AI response has no text content")
                continue  # Try again
            
            # Parse response
            try:
                # Clean response
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
                logger.info(f"Cleaned response text: {text[:200]}...")
                
                data = json.loads(text)
                if not isinstance(data, list):
                    logger.error(f"AI response is not a list, got: {type(data)}")
                    continue  # Try again
                
                logger.info(f"Parsed {len(data)} questions from AI response")
                
                questions = []
                for i, q_data in enumerate(data[:request.question_count]):
                    try:
                        question = AIQuestion(
                            id=str(i + 1),
                            type=q_data.get("type", "mcq").lower(),
                            question=q_data.get("question", f"Question {i+1}"),
                            options=q_data.get("options", []),
                            correct_answer=q_data.get("correct_answer", ""),
                            explanation=q_data.get("explanation", ""),
                            expected_answer=q_data.get("expected_answer", ""),
                            key_points=q_data.get("key_points", []),
                            evaluation_criteria=q_data.get("evaluation_criteria", []),
                            central_concept=q_data.get("central_concept", ""),
                            expected_branches=q_data.get("expected_branches", []),
                            difficulty=q_data.get("difficulty", request.difficulty)
                        )
                        questions.append(question)
                        logger.info(f"Successfully parsed AI agent question {i+1}")
                    except Exception as e:
                        logger.warning(f"Failed to parse AI agent question {i+1}: {e}")
                        continue
                
                logger.info(f"Successfully created {len(questions)} AIQuestion objects")
                return questions
                            
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.error(f"Raw response text: {response.text}")
                continue  # Try again
                
        except Exception as e:
            logger.error(f"AI agent question generation attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:  # Not the last attempt
                logger.info(f"Retrying in 2 seconds...")
                await asyncio.sleep(2)
                continue
            else:
                # Last attempt failed, log and raise
                logger.error(f"All {max_retries} attempts failed")
                logger.error(f"Exception type: {type(e)}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise e
    
    # If we get here, all attempts failed
    logger.error("All retry attempts failed")
    raise Exception("AI service temporarily unavailable. Please try again later.")

# Fallback function removed


async def generate_questions(request: QuestionRequest) -> List[Question]:
    """Generate questions using AI only - no fallback"""
    try:
        logger.info(f"generate_questions called with: exam_type={request.exam_type}, topic={request.topic}, count={request.count}, difficulty={request.difficulty}")
        logger.info(f"AI model status: ai_model={ai_model is not None}, ai_initialized={ai_initialized}")
        
        # Only use AI if available
        if ai_model and ai_initialized:
            logger.info("Attempting AI question generation...")
            try:
                ai_questions = await generate_ai_questions(request)
                logger.info(f"generate_ai_questions returned {len(ai_questions)} questions")
                
                if ai_questions:
                    logger.info(f"AI generated {len(ai_questions)} questions successfully")
                    return ai_questions
                else:
                    logger.error("AI failed to generate questions - returned empty list")
                    raise Exception("AI failed to generate questions")
            except Exception as ai_error:
                # Re-raise AI-specific errors with their detailed messages
                logger.error(f"AI generation failed with specific error: {str(ai_error)}")
                raise ai_error
        else:
            logger.error(f"AI model not available: ai_model={ai_model is not None}, ai_initialized={ai_initialized}")
            raise Exception("AI model not available")
        
    except Exception as e:
        logger.error(f"Question generation failed: {str(e)}")
        raise e  # Re-raise the exception to be handled by the endpoint

# Session cleanup function removed

# Initialize FastAPI app
app = FastAPI(
    title="PrepVista API",
    description="AI-powered exam preparation platform",
    version="2.0.0"
)

# CORS middleware
# Get CORS origins from environment variable, fallback to localhost
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

# Add ngrok URLs if they exist in environment
ngrok_url = os.getenv("NGROK_URL")
if ngrok_url:
    cors_origins.append(ngrok_url)
    # Also add the callback URL for authentication
    cors_origins.append(f"{ngrok_url}/api/auth/callback/google")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize AI model and load prompts on startup"""
    load_prompts()
    await initialize_ai_model()

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check AI model status"""
    return {
        "ai_model_exists": ai_model is not None,
        "ai_initialized": ai_initialized,
        "google_api_key_exists": bool(os.getenv("GOOGLE_API_KEY")),
        "google_api_key_preview": os.getenv("GOOGLE_API_KEY", "NOT_FOUND")[:10] + "..." if os.getenv("GOOGLE_API_KEY") else "NOT_FOUND",
        "ai_timeout": AI_TIMEOUT,
        "ai_enabled": AI_ENABLED,
        "prompts_loaded": prompts is not None,
        "available_prompts": list(prompts.keys()) if prompts else [],
        "timestamp": time.time()
    }

@app.get("/")
async def root():
    return {"message": "PrepVista API - AI-powered exam preparation"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "ai_service": "available" if ai_model else "not_available",
        "mode": "ai_enabled" if ai_model else "ai_disabled",
        "version": "2.0.0"
    }

@app.get("/api/exam-types")
async def get_exam_types():
    """Get available exam types"""
    return {
        "exam_types": ["upsc", "mpsc", "college-placements", "ibps", "ssc", "cat"]
    }

@app.get("/api/topics/{exam_type}")
async def get_topics(exam_type: str):
    """Get available topics for exam type"""
    topics_map = {
        "upsc": ["mathematics", "reasoning", "english", "general-awareness"],
        "mpsc": ["mathematics", "reasoning", "english", "marathi"],
        "college-placements": ["quantitative", "logical", "verbal", "data-interpretation"],
        "ibps": ["quantitative", "reasoning", "english", "computer-knowledge"],
        "ssc": ["mathematics", "reasoning", "english", "general-knowledge"],
        "cat": ["quantitative", "verbal", "data-interpretation", "logical"]
    }
    
    topics = topics_map.get(exam_type, [])
    return {
        "exam_type": exam_type,
        "topics": topics
    }

@app.post("/api/questions", response_model=List[Question])
async def generate_questions_endpoint(request: QuestionRequest):
    """Generate questions endpoint"""
    logger.info(f"Generating {request.count} questions for {request.exam_type}/{request.topic}")
    questions = await generate_questions(request)
    return questions

@app.post("/api/ai-agents/questions", response_model=List[AIQuestion])
async def generate_ai_agent_questions_endpoint(request: AIQuestionRequest):
    """Generate questions for AI agents based on document content"""
    logger.info(f"Generating {request.question_count} questions for AI agent {request.agent_id}")
    questions = await generate_ai_agent_questions(request)
    return questions

# Session creation removed - focusing on question generation only

# Session answer submission removed

# Session completion removed

# Session status removed

@app.get("/model-info")
async def get_model_info():
    """Get AI model information"""
    return {
        "status": "ai_available" if ai_model else "ai_unavailable",
        "model": "gemini-1.5-flash" if ai_model else "none",
        "mode": "ai_enabled" if ai_model else "ai_disabled",
        "initialized": ai_initialized
    }

@app.get("/test-prompt")
async def test_prompt():
    """Test endpoint to verify prompt formatting"""
    try:
        if not prompts:
            return {"error": "Prompts not loaded"}
        
        # Test basic question generation prompt
        test_prompt = get_prompt(
            "basic_question_generation",
            count=2,
            difficulty="easy",
            topic="mathematics",
            exam_type="upsc"
        )
        
        return {
            "success": True,
            "test_prompt_preview": test_prompt[:200] + "..." if len(test_prompt) > 200 else test_prompt,
            "prompt_length": len(test_prompt)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
