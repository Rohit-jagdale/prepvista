# RAG (Retrieval-Augmented Generation) System for PrepVista

This document explains the RAG system implementation for PrepVista, which enables AI agents to provide domain-specific responses based on uploaded PDF documents.

## Overview

The RAG system allows users to:

1. Upload PDF books/documents (1000+ pages)
2. Store document content in a vector database (pgvector)
3. Query the AI agent with context from the uploaded documents
4. Get domain-specific responses based on the book content

## Architecture

```
PDF Upload → Text Extraction → Chunking → Embedding Generation → Vector Storage (pgvector)
                                                                        ↓
User Query → Embedding Generation → Vector Search → Context Retrieval → AI Response
```

## Components

### 1. PDF Processing (`pdf_processor.py`)

- Extracts text from PDF files using `pdfplumber` and `PyPDF2`
- Cleans and normalizes extracted text
- Splits text into chunks (1000 tokens with 200 token overlap)
- Handles page information and metadata

### 2. Embedding Service (`embedding_service.py`)

- Generates embeddings using Google's `text-embedding-004` model
- Supports batch processing for efficiency
- Calculates similarity scores between embeddings
- Handles API rate limiting and error recovery

### 3. Vector Storage (`vector_storage.py`)

- Manages pgvector database operations
- Stores and retrieves embeddings with HNSW indexing
- Supports similarity search with cosine distance
- Handles batch operations and cleanup

### 4. RAG Service (`rag_service.py`)

- Orchestrates the complete RAG pipeline
- Retrieves relevant context for queries
- Generates contextual responses
- Provides document search functionality

## Database Schema

### New Tables

#### DocumentChunk

```sql
CREATE TABLE "DocumentChunk" (
    "id" TEXT PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "chunkIndex" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

#### VectorEmbedding

```sql
CREATE TABLE "VectorEmbedding" (
    "id" TEXT PRIMARY KEY,
    "chunkId" TEXT NOT NULL,
    "embedding" vector(768),
    "model" TEXT DEFAULT 'text-embedding-004',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

- HNSW index on embedding column for fast similarity search
- Regular indexes on chunk_id and document_id for efficient lookups

## API Endpoints

### 1. Upload PDF

```http
POST /api/rag/upload-pdf
Content-Type: multipart/form-data

Parameters:
- file: PDF file
- agent_id: AI Agent ID
- document_id: Optional document ID
```

**Response:**

```json
{
  "success": true,
  "document_id": "uuid",
  "message": "PDF processed successfully. Created 150 chunks and stored 150 embeddings.",
  "chunks_created": 150,
  "processing_time": 45.2
}
```

### 2. RAG Query

```http
POST /api/rag/query
Content-Type: application/json

{
  "query": "What is the main concept discussed in chapter 5?",
  "agent_id": "agent_uuid",
  "document_id": "optional_document_id",
  "max_context_chunks": 5,
  "include_sources": true
}
```

**Response:**

```json
{
  "answer": "Based on the uploaded materials, chapter 5 discusses...",
  "sources": [
    {
      "content": "Chapter 5 content...",
      "file_name": "textbook.pdf",
      "page_number": 45,
      "similarity_score": 0.89
    }
  ],
  "context_used": true,
  "context_chunks_count": 3,
  "similarity_scores": [0.89, 0.85, 0.82]
}
```

### 3. Document Search

```http
POST /api/rag/search
Content-Type: application/json

{
  "query": "machine learning algorithms",
  "agent_id": "agent_uuid",
  "max_results": 10
}
```

### 4. RAG Statistics

```http
GET /api/rag/stats/{agent_id}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd ai-backend
./setup-rag.sh
```

### 2. Environment Variables

Add to your `.env` file:

```env
GOOGLE_API_KEY=your_google_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/prepvista
```

### 3. Database Migration

```bash
cd frontend
npx prisma migrate deploy
cd ../ai-backend
```

### 4. Start the Backend

```bash
poetry run python main.py
```

## Usage Example

### 1. Upload a PDF

```python
import requests

# Upload PDF
with open("textbook.pdf", "rb") as f:
    files = {"file": f}
    data = {"agent_id": "your_agent_id"}
    response = requests.post("http://localhost:8000/api/rag/upload-pdf", files=files, data=data)
    result = response.json()
    print(f"Uploaded: {result['message']}")
```

### 2. Query with Context

```python
# Query with RAG
query_data = {
    "query": "Explain the concept of neural networks",
    "agent_id": "your_agent_id",
    "max_context_chunks": 5
}
response = requests.post("http://localhost:8000/api/rag/query", json=query_data)
result = response.json()
print(f"Answer: {result['answer']}")
print(f"Sources: {len(result['sources'])} chunks used")
```

## Configuration

### PDF Processing

- **Chunk Size**: 1000 tokens (configurable)
- **Chunk Overlap**: 200 tokens (configurable)
- **Supported Formats**: PDF only

### Embeddings

- **Model**: text-embedding-3-small (1536 dimensions)
- **Batch Size**: 100 (for batch processing)
- **Similarity Threshold**: 0.7 (configurable)

### Vector Storage

- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **M Parameter**: 16 (for HNSW)
- **EF Construction**: 64 (for HNSW)

## Performance Considerations

### PDF Processing

- Large PDFs (1000+ pages) may take 1-5 minutes to process
- Processing time depends on text complexity and chunk count
- Memory usage scales with PDF size

### Embedding Generation

- OpenAI API rate limits apply
- Batch processing reduces API calls
- Cost scales with document size

### Vector Search

- HNSW index provides fast similarity search
- Search time is O(log n) where n is number of vectors
- Memory usage scales with number of stored embeddings

## Troubleshooting

### Common Issues

1. **pgvector extension not found**

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **OpenAI API key not set**

   - Add `OPENAI_API_KEY` to your `.env` file

3. **PDF processing fails**

   - Check file format (PDF only)
   - Verify file is not corrupted
   - Check file size limits

4. **Low similarity scores**
   - Adjust similarity threshold
   - Check query relevance to document content
   - Consider re-chunking with different parameters

### Debug Endpoint

```http
GET /debug
```

Returns status of all services including RAG components.

## Future Enhancements

1. **Multi-format Support**: Support for DOCX, TXT, and other formats
2. **Advanced Chunking**: Semantic chunking based on content structure
3. **Hybrid Search**: Combine vector search with keyword search
4. **Caching**: Cache frequently accessed embeddings
5. **Compression**: Compress embeddings for storage efficiency
6. **Real-time Updates**: Support for document updates without full reprocessing

## Security Considerations

1. **File Upload Security**: Validate file types and scan for malware
2. **API Rate Limiting**: Implement rate limiting for upload endpoints
3. **Data Privacy**: Ensure uploaded documents are properly secured
4. **Access Control**: Implement proper authorization for document access

## Monitoring

Monitor the following metrics:

- PDF processing time
- Embedding generation success rate
- Vector search performance
- API response times
- Storage usage

Use the `/api/rag/stats/{agent_id}` endpoint to get usage statistics.
