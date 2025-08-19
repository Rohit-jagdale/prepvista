# PrepVista Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend 500 Internal Server Errors

**Problem**: You see 500 Internal Server Error responses from the backend API calls.

**Symptoms**:

- Backend logs show 500 errors
- Frontend fails to load questions or feedback
- Console shows "Failed to generate AI feedback" errors

**Solutions**:

#### A. Missing Google API Key

```bash
# Check if .env file exists
ls -la backend/.env

# If it doesn't exist, create it
cd backend
cp env.example .env

# Edit the .env file and add your API key
nano .env  # or use your preferred editor
```

**Required content in backend/.env**:

```env
GOOGLE_API_KEY=your_actual_gemini_api_key_here
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### B. Invalid API Key

- Verify your API key is correct
- Check if the key has expired
- Ensure you have sufficient quota on Google AI Studio

#### C. Network Issues

- Check if the backend is running on port 8000
- Verify firewall settings
- Test with: `curl http://localhost:8000/`

### 2. Frontend Can't Connect to Backend

**Problem**: Frontend shows loading states indefinitely or fails to fetch data.

**Symptoms**:

- Infinite loading spinners
- Console shows network errors
- "Failed to load questions from API" errors

**Solutions**:

#### A. Check Backend Status

```bash
# Verify backend is running
curl http://localhost:8000/

# Expected response: {"message": "Aptitude Prep API - AI-powered exam preparation platform"}
```

#### B. Check Port Configuration

- Backend should run on port 8000
- Frontend should run on port 3000
- Verify in `config/api.ts` that `BACKEND_URL` is `http://localhost:8000`

#### C. CORS Issues

If you see CORS errors in the browser console:

- Backend CORS is configured for `http://localhost:3000`
- If using a different port, update `backend/main.py` CORS settings

### 3. Questions Not Loading

**Problem**: The practice interface shows no questions or fails to load them.

**Solutions**:

#### A. Check API Response

```bash
# Test question generation endpoint
curl -X POST http://localhost:8000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"exam_type": "upsc", "topic": "mathematics", "difficulty": "medium", "count": 5}'
```

#### B. Verify Exam Type and Topic

- Check that the exam type exists in `EXAM_PROMPTS`
- Verify the topic is valid for the exam type
- Use the `/api/exam-types` and `/api/topics/{exam_type}` endpoints

### 4. Feedback Generation Fails

**Problem**: AI feedback is not generated when answering questions.

**Solutions**:

#### A. Check Feedback Endpoint

```bash
# Test feedback endpoint
curl -X POST http://localhost:8000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"exam_type": "upsc", "topic": "mathematics", "question": "Test question", "user_answer": "A", "correct_answer": "B", "is_correct": false}'
```

#### B. Verify Request Format

- Ensure all required fields are present
- Check data types (boolean for `is_correct`)
- Verify JSON structure matches `FeedbackRequest` model

### 5. Performance Issues

**Problem**: Slow response times or timeouts.

**Solutions**:

#### A. API Response Time

- Google Gemini AI calls can take 2-5 seconds
- Consider implementing request caching
- Add loading states in the frontend

#### B. Network Latency

- Check your internet connection
- Verify Google AI Studio service status
- Consider using a CDN for static assets

### 6. Development Environment Issues

**Problem**: Can't start development servers or build the project.

**Solutions**:

#### A. Dependencies

```bash
# Frontend
pnpm install

# Backend
cd ai-backend
poetry install
```

#### B. Port Conflicts

```bash
# Check what's using port 8000
lsof -i :8000

# Check what's using port 3000
lsof -i :3000

# Kill processes if needed
kill -9 <PID>
```

#### C. Python Version

- Ensure Python 3.8+ is installed
- Check with: `poetry --version`

## Debug Mode

Enable debug logging in the backend by adding to `ai-backend/main.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Getting Help

1. Check the browser console for JavaScript errors
2. Review backend server logs for Python errors
3. Verify API endpoints with curl or Postman
4. Check network tab in browser dev tools

## Quick Health Check

Run this command to verify everything is working:

```bash
# Check backend
curl http://localhost:8000/

# Check frontend
curl http://localhost:3000/

# Check API endpoints
curl http://localhost:8000/api/exam-types
```
