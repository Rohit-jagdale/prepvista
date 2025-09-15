from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
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
import shutil
import uuid

# Import RAG services
from pdf_processor import PDFProcessor
from embedding_service import EmbeddingService
from vector_storage import VectorStorageService
from rag_service import RAGService

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

# RAG Services (will be initialized lazily)
pdf_processor = None
embedding_service = None
vector_storage = None
rag_service = None
rag_initialized = False

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

async def initialize_rag_services():
    """Initialize RAG services"""
    global pdf_processor, embedding_service, vector_storage, rag_service, rag_initialized
    
    try:
        logger.info("Initializing RAG services...")
        
        # Initialize PDF processor
        pdf_processor = PDFProcessor(chunk_size=1000, chunk_overlap=200)
        logger.info("PDF processor initialized")
        
        # Initialize embedding service
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            logger.warning("No GOOGLE_API_KEY found, RAG services will be limited")
            rag_initialized = False
            return
        
        embedding_service = EmbeddingService(api_key=google_api_key)
        logger.info("Embedding service initialized")
        
        # Initialize vector storage
        vector_storage = VectorStorageService()
        
        # Ensure pgvector extension and tables exist
        await vector_storage.ensure_pgvector_extension()
        await vector_storage.create_vector_tables()
        logger.info("Vector storage service initialized")
        
        # Initialize RAG service
        rag_service = RAGService(embedding_service, vector_storage, ai_model)
        logger.info("RAG service initialized")
        
        # Test embedding service
        embedding_test = await embedding_service.test_embedding()
        if embedding_test:
            logger.info("RAG services initialized successfully")
            rag_initialized = True
        else:
            logger.error("RAG services initialization failed - embedding test failed")
            rag_initialized = False
            
    except Exception as e:
        logger.error(f"Failed to initialize RAG services: {e}")
        rag_initialized = False

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

# RAG-related models
class PDFUploadRequest(BaseModel):
    agent_id: str
    file_name: str
    file_size: int

class PDFUploadResponse(BaseModel):
    success: bool
    document_id: Optional[str] = None
    message: str
    chunks_created: Optional[int] = None
    processing_time: Optional[float] = None
    chunks: Optional[List[dict]] = None

class RAGQueryRequest(BaseModel):
    query: str
    agent_id: str
    document_id: Optional[str] = None
    max_context_chunks: int = 5
    include_sources: bool = True

class RAGQueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    context_used: bool
    context_chunks_count: int
    similarity_scores: Optional[List[float]] = None

class DocumentSearchRequest(BaseModel):
    query: str
    agent_id: str
    document_id: Optional[str] = None
    max_results: int = 10

class DocumentSearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total_results: int
    query: str

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
            test_response = await loop.run_in_executor(None, lambda: future.result(timeout=30.0))
            
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
    """Generate questions for AI agents based on document content with RAG context"""
    if not ai_model or not ai_initialized:
        logger.error("AI model not available or not initialized")
        raise Exception("AI model not available")
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} to generate AI agent questions")
            
            # Try to get RAG context if available
            rag_context = ""
            if rag_initialized and rag_service:
                try:
                    # Use the document content as a query to get relevant context
                    rag_response = await rag_service.generate_contextual_response(
                        query=f"Generate questions about {request.subject}",
                        agent_id=request.agent_id,
                        max_context_chunks=3,
                        include_sources=False
                    )
                    
                    if rag_response.get('context_used', False):
                        rag_context = f"\n\nRELEVANT CONTEXT FROM UPLOADED DOCUMENTS:\n{rag_response.get('context_text', '')}"
                        logger.info(f"Using RAG context for question generation: {len(rag_context)} characters")
                    else:
                        logger.info("No relevant RAG context found, using provided document content")
                        
                except Exception as e:
                    logger.warning(f"Failed to get RAG context: {e}, using provided document content")
            
            # Create a comprehensive prompt for different question types
            question_type_instructions = []
            for q_type in request.question_types:
                if q_type.upper() in prompts.get("question_type_instructions", {}):
                    question_type_instructions.append(prompts["question_type_instructions"][q_type.upper()])
                else:
                    question_type_instructions.append(f"{q_type} questions")
            
            # Combine document content with RAG context
            full_document_content = request.document_content[:2000] + rag_context
            
            prompt = get_prompt(
                "ai_agent_question_generation",
                subject=request.subject,
                document_content=full_document_content,
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
    """Initialize AI model, RAG services, and load prompts on startup"""
    load_prompts()
    await initialize_ai_model()
    await initialize_rag_services()

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check AI model and RAG status"""
    return {
        "ai_model_exists": ai_model is not None,
        "ai_initialized": ai_initialized,
        "google_api_key_exists": bool(os.getenv("GOOGLE_API_KEY")),
        "google_api_key_preview": os.getenv("GOOGLE_API_KEY", "NOT_FOUND")[:10] + "..." if os.getenv("GOOGLE_API_KEY") else "NOT_FOUND",
        "ai_timeout": AI_TIMEOUT,
        "ai_enabled": AI_ENABLED,
        "prompts_loaded": prompts is not None,
        "available_prompts": list(prompts.keys()) if prompts else [],
        "rag_initialized": rag_initialized,
        "pdf_processor_exists": pdf_processor is not None,
        "embedding_service_exists": embedding_service is not None,
        "vector_storage_exists": vector_storage is not None,
        "rag_service_exists": rag_service is not None,
        "google_api_key_exists": bool(os.getenv("GOOGLE_API_KEY")),
        "google_api_key_preview": os.getenv("GOOGLE_API_KEY", "NOT_FOUND")[:10] + "..." if os.getenv("GOOGLE_API_KEY") else "NOT_FOUND",
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

@app.post("/api/ai-agents/questions/rag", response_model=List[AIQuestion])
async def generate_rag_enhanced_questions(request: AIQuestionRequest):
    """Generate questions for AI agents using RAG context from uploaded documents"""
    if not rag_initialized:
        raise HTTPException(status_code=503, detail="RAG services not initialized")
    
    logger.info(f"Generating {request.question_count} RAG-enhanced questions for AI agent {request.agent_id}")
    
    try:
        # Get RAG context for the subject
        rag_response = await rag_service.generate_contextual_response(
            query=f"Generate comprehensive questions about {request.subject} for {request.difficulty} level",
            agent_id=request.agent_id,
            max_context_chunks=5,
            include_sources=False
        )
        
        if not rag_response.get('context_used', False):
            # Fallback to regular question generation if no RAG context
            logger.warning("No RAG context available, falling back to regular question generation")
            questions = await generate_ai_agent_questions(request)
            return questions
        
        # Create enhanced request with RAG context
        enhanced_request = AIQuestionRequest(
            agent_id=request.agent_id,
            subject=request.subject,
            question_types=request.question_types,
            question_count=request.question_count,
            difficulty=request.difficulty,
            document_content=rag_response.get('context_text', request.document_content)
        )
        
        # Generate questions with RAG context
        questions = await generate_ai_agent_questions(enhanced_request)
        
        # Add RAG metadata to questions
        for question in questions:
            if hasattr(question, 'metadata'):
                question.metadata = {
                    'rag_enhanced': True,
                    'context_chunks_used': rag_response.get('context_chunks_count', 0),
                    'similarity_scores': rag_response.get('similarity_scores', [])
                }
        
        logger.info(f"Generated {len(questions)} RAG-enhanced questions")
        return questions
        
    except Exception as e:
        logger.error(f"RAG-enhanced question generation failed: {e}")
        # Fallback to regular question generation
        questions = await generate_ai_agent_questions(request)
        return questions

# RAG Endpoints
@app.post("/api/rag/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    agent_id: str = Form(...),
    document_id: Optional[str] = Form(None)
):
    """Upload and process a PDF file for RAG"""
    if not rag_initialized:
        raise HTTPException(status_code=503, detail="RAG services not initialized")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        start_time = time.time()
        
        # Create uploads directory if it doesn't exist
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        unique_filename = f"{file_id}{file_extension}"
        file_path = uploads_dir / unique_filename
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Processing PDF: {file.filename} for agent {agent_id}")
        
        # Process PDF
        processing_result = pdf_processor.process_pdf(
            pdf_path=str(file_path),
            agent_id=agent_id,
            document_id=document_id or file_id
        )
        
        if not processing_result['success']:
            # Clean up uploaded file
            file_path.unlink(missing_ok=True)
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {processing_result['error']}")
        
        # Generate embeddings for chunks
        chunks = processing_result['chunks']
        embeddings_data = []
        
        # Store document chunks in database first
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        try:
            with psycopg2.connect(os.getenv("DATABASE_URL")) as conn:
                # Note: We only process the PDF and generate embeddings here
                # The Document and DocumentChunk records will be created by the frontend
                logger.info(f"Processed {len(chunks)} chunks from PDF, ready for frontend to create records")
        
        except Exception as e:
            logger.error(f"Failed to store document chunks: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to store document chunks: {str(e)}")
        
        # Note: Embeddings will be generated and stored by the frontend after chunks are created
        stored_count = 0
        
        processing_time = time.time() - start_time
        
        # Clean up uploaded file
        file_path.unlink(missing_ok=True)
        
        return PDFUploadResponse(
            success=True,
            document_id=document_id or file_id,
            message=f"PDF processed successfully. Created {len(chunks)} chunks and stored {stored_count} embeddings.",
            chunks_created=len(chunks),
            processing_time=processing_time,
            chunks=chunks
        )
        
    except Exception as e:
        logger.error(f"PDF upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF upload failed: {str(e)}")

@app.post("/api/rag/generate-embedding")
async def generate_embedding(request: dict):
    """Generate embedding for a single text"""
    try:
        text = request.get('text')
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        embedding = await embedding_service.generate_embedding(text)
        if not embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
        return {
            "success": True,
            "embedding": embedding,
            "model": "text-embedding-004"
        }
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/api/rag/store-embeddings")
async def store_embeddings(request: dict):
    """Store multiple embeddings in vector database"""
    try:
        embeddings = request.get('embeddings', [])
        if not embeddings:
            raise HTTPException(status_code=400, detail="Embeddings are required")
        
        logger.info(f"Received {len(embeddings)} embeddings to store")
        if embeddings:
            logger.info(f"Sample embedding data: {embeddings[0]}")
        
        stored_count = await vector_storage.store_embeddings_batch(embeddings)
        
        return {
            "success": True,
            "stored_count": stored_count,
            "total_count": len(embeddings)
        }
    except Exception as e:
        logger.error(f"Embedding storage failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding storage failed: {str(e)}")

@app.post("/api/rag/query", response_model=RAGQueryResponse)
async def rag_query(request: RAGQueryRequest):
    """Query the RAG system for contextual responses"""
    if not rag_initialized:
        raise HTTPException(status_code=503, detail="RAG services not initialized")
    
    try:
        logger.info(f"RAG query for agent {request.agent_id}: {request.query[:100]}...")
        
        # Generate contextual response
        response = await rag_service.generate_contextual_response(
            query=request.query,
            agent_id=request.agent_id,
            document_id=request.document_id,
            max_context_chunks=request.max_context_chunks,
            include_sources=request.include_sources
        )
        
        # Extract similarity scores from sources
        similarity_scores = [source.get('similarity_score', 0.0) for source in response.get('sources', [])]
        
        return RAGQueryResponse(
            answer=response['answer'],
            sources=response.get('sources', []),
            context_used=response.get('context_used', False),
            context_chunks_count=response.get('context_chunks_count', 0),
            similarity_scores=similarity_scores
        )
        
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@app.post("/api/rag/search", response_model=DocumentSearchResponse)
async def search_documents(request: DocumentSearchRequest):
    """Search through uploaded documents"""
    if not rag_initialized:
        raise HTTPException(status_code=503, detail="RAG services not initialized")
    
    try:
        logger.info(f"Document search for agent {request.agent_id}: {request.query[:100]}...")
        
        # Search documents
        results = await rag_service.search_documents(
            query=request.query,
            agent_id=request.agent_id,
            document_id=request.document_id,
            max_results=request.max_results
        )
        
        return DocumentSearchResponse(
            results=results,
            total_results=len(results),
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"Document search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document search failed: {str(e)}")

@app.get("/api/rag/stats/{agent_id}")
async def get_rag_stats(agent_id: str):
    """Get RAG statistics for an agent"""
    if not rag_initialized:
        raise HTTPException(status_code=503, detail="RAG services not initialized")
    
    try:
        # Get document summary
        summary = await rag_service.get_document_summary(agent_id)
        
        return {
            "agent_id": agent_id,
            "rag_initialized": rag_initialized,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Failed to get RAG stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get RAG stats: {str(e)}")

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
