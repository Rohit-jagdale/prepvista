from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(
    title="Aptitude Prep API",
    description="AI-powered aptitude exam preparation platform using Gemini AI",
    version="1.0.0"
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
class QuestionRequest(BaseModel):
    exam_type: str
    topic: str
    difficulty: str = "medium"
    count: int = 5

class FeedbackRequest(BaseModel):
    exam_type: str
    topic: str
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool

class Question(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    shortcut: str
    difficulty: str

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

@app.post("/api/questions", response_model=List[Question])
async def generate_questions(request: QuestionRequest):
    """Generate AI-powered questions for the specified exam type and topic"""
    try:
        exam_prompt = EXAM_PROMPTS.get(request.exam_type, "")
        topic_prompt = TOPIC_PROMPTS.get(request.topic, "")
        
        if not exam_prompt or not topic_prompt:
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
        """
        
        # Generate response using Gemini AI
        response = model.generate_content(prompt)
        
        # Parse the response
        try:
            questions_data = json.loads(response.text)
            questions = []
            
            for i, q_data in enumerate(questions_data):
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
            
            return questions
            
        except json.JSONDecodeError:
            # Fallback: generate structured questions manually
            return generate_fallback_questions(request)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/api/feedback", response_model=Feedback)
async def generate_feedback(request: FeedbackRequest):
    """Generate AI-powered feedback for user answers"""
    try:
        # Create the prompt for Gemini AI
        prompt = f"""
        You are an expert aptitude tutor for {request.exam_type} examination.
        
        Question: {request.question}
        User's Answer: {request.user_answer}
        Correct Answer: {request.correct_answer}
        Is Correct: {request.is_correct}
        Topic: {request.topic}
        
        Provide detailed feedback including:
        1. A clear explanation of why the answer is correct or incorrect
        2. A shortcut trick or time-saving method to solve this type of question
        3. An improvement tip for the student
        
        Format the response as JSON:
        {{
            "is_correct": {request.is_correct},
            "explanation": "detailed_explanation",
            "shortcut": "shortcut_trick",
            "improvement": "improvement_tip"
        }}
        
        Make the feedback encouraging and educational, helping the student understand the concept better.
        """
        
        # Generate response using Gemini AI
        response = model.generate_content(prompt)
        
        # Parse the response
        try:
            feedback_data = json.loads(response.text)
            feedback = Feedback(
                is_correct=request.is_correct,
                explanation=feedback_data.get("explanation", "Explanation not available"),
                shortcut=feedback_data.get("shortcut", "Shortcut not available"),
                improvement=feedback_data.get("improvement", "Keep practicing!")
            )
            return feedback
            
        except json.JSONDecodeError:
            # Fallback feedback
            return Feedback(
                is_correct=request.is_correct,
                explanation=f"The correct answer is {request.correct_answer}. {'Your answer is correct!' if request.is_correct else 'Your answer is incorrect.'}",
                shortcut="Practice similar questions to improve your speed and accuracy.",
                improvement="Review the concept and try more questions on this topic."
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")

def generate_fallback_questions(request: QuestionRequest) -> List[Question]:
    """Generate fallback questions when AI generation fails"""
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
            }
        ]
    }
    
    topic_questions = fallback_questions.get(request.topic, fallback_questions["mathematics"])
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
    
    return questions

@app.get("/api/exam-types")
async def get_exam_types():
    """Get available exam types"""
    return {
        "exam_types": list(EXAM_PROMPTS.keys())
    }

@app.get("/api/topics/{exam_type}")
async def get_topics(exam_type: str):
    """Get available topics for a specific exam type"""
    if exam_type not in EXAM_PROMPTS:
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
    
    return {
        "exam_type": exam_type,
        "topics": exam_topics.get(exam_type, [])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
