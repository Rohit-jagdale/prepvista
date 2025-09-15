# PrepVista RAG System Testing Guide

## 🚀 Quick Start

Your RAG system is running at: `http://localhost:8000`

## 📋 Testing Steps

### Step 1: Import Postman Collection

1. Open Postman
2. Click "Import" → "File" → Select `PrepVista_RAG_Postman_Collection.json`
3. The collection will be imported with all RAG endpoints

### Step 2: Test System Status

**Request:** `GET /debug`

- **URL:** `http://localhost:8000/debug`
- **Expected Response:** All services should show `true` for initialization status

### Step 3: Upload Test PDF

**Request:** `POST /api/rag/upload-pdf`

- **Method:** POST
- **URL:** `http://localhost:8000/api/rag/upload-pdf`
- **Body:** form-data
  - `file`: Upload `test_ml_document.pdf` (created in your project root)
  - `agent_id`: `test-agent-123`
  - `document_id`: `sample-doc-001` (optional)

**Expected Response:**

```json
{
  "success": true,
  "document_id": "sample-doc-001",
  "message": "PDF processed successfully. Created X chunks and stored X embeddings.",
  "chunks_created": 15,
  "processing_time": 2.5
}
```

### Step 4: Test RAG Queries

**Request:** `POST /api/rag/query`

- **Method:** POST
- **URL:** `http://localhost:8000/api/rag/query`
- **Body:** JSON

```json
{
  "query": "What are the main topics covered in this document?",
  "agent_id": "test-agent-123",
  "document_id": "sample-doc-001",
  "max_context_chunks": 5,
  "include_sources": true
}
```

**Expected Response:**

```json
{
  "answer": "Based on the uploaded materials, the document covers...",
  "sources": [
    {
      "content": "Chapter 1: Fundamentals of Machine Learning...",
      "file_name": "test_ml_document.pdf",
      "page_number": 1,
      "similarity_score": 0.89
    }
  ],
  "context_used": true,
  "context_chunks_count": 3,
  "similarity_scores": [0.89, 0.85, 0.82]
}
```

### Step 5: Test Document Search

**Request:** `POST /api/rag/search`

- **Method:** POST
- **URL:** `http://localhost:8000/api/rag/search`
- **Body:** JSON

```json
{
  "query": "neural networks",
  "agent_id": "test-agent-123",
  "max_results": 5
}
```

### Step 6: Test RAG-Enhanced Question Generation

**Request:** `POST /api/ai-agents/questions/rag`

- **Method:** POST
- **URL:** `http://localhost:8000/api/ai-agents/questions/rag`
- **Body:** JSON

```json
{
  "agent_id": "test-agent-123",
  "subject": "Machine Learning",
  "question_types": ["MCQ", "SHORT_ANSWER"],
  "question_count": 3,
  "difficulty": "medium",
  "document_content": "Sample content about machine learning"
}
```

### Step 7: Check Statistics

**Request:** `GET /api/rag/stats/{agent_id}`

- **URL:** `http://localhost:8000/api/rag/stats/test-agent-123`

## 🧪 Test Scenarios

### Scenario 1: Basic RAG Query

- **Query:** "Explain neural networks"
- **Expected:** Context-aware response with relevant content from the PDF

### Scenario 2: Specific Topic Search

- **Query:** "What is deep learning?"
- **Expected:** Detailed explanation based on Chapter 3 content

### Scenario 3: Algorithm Questions

- **Query:** "What machine learning algorithms are mentioned?"
- **Expected:** List of algorithms from Chapter 4

### Scenario 4: Evaluation Metrics

- **Query:** "How do you evaluate machine learning models?"
- **Expected:** Explanation of metrics from Chapter 5

## 🔍 Troubleshooting

### If PDF Upload Fails:

1. Check file size (should be reasonable)
2. Ensure PDF is not corrupted
3. Check server logs for errors

### If RAG Query Returns No Context:

1. Verify PDF was uploaded successfully
2. Check if `agent_id` matches
3. Try a more specific query

### If Embeddings Fail:

1. Check `GOOGLE_API_KEY` is set correctly
2. Verify API key has proper permissions
3. Check API quota limits

## 📊 Expected Performance

- **PDF Processing:** 1-5 seconds for small PDFs
- **Embedding Generation:** 0.5-2 seconds per chunk
- **RAG Query:** 1-3 seconds response time
- **Search:** Sub-second response time

## 🎯 Success Criteria

✅ PDF uploads successfully and creates chunks
✅ RAG queries return context-aware responses
✅ Document search finds relevant content
✅ Question generation uses RAG context
✅ All API endpoints return proper JSON responses

## 📝 Next Steps

1. **Test with your own PDFs:** Upload real educational content
2. **Frontend Integration:** Connect your PrepVista UI to these endpoints
3. **User Experience:** Add PDF upload interface
4. **Performance Testing:** Test with larger PDFs (100+ pages)
5. **Production Setup:** Deploy with proper error handling and monitoring

## 🆘 Support

If you encounter issues:

1. Check the server logs in your terminal
2. Verify all environment variables are set
3. Test individual components using the test script: `python3 test_rag_simple.py`
4. Check the debug endpoint: `GET /debug`
