"""
Vector Storage Service for PrepVista
Handles storing and retrieving embeddings using pgvector
"""

import logging
import os
from typing import List, Dict, Any, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class VectorStorageService:
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize vector storage service
        
        Args:
            database_url: PostgreSQL database URL
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        
        if not self.database_url:
            raise ValueError("Database URL not provided")
        
        logger.info("Initialized VectorStorageService")
    
    @contextmanager
    def get_connection(self):
        """Get database connection with proper cleanup"""
        conn = None
        try:
            conn = psycopg2.connect(self.database_url)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    async def ensure_pgvector_extension(self) -> bool:
        """
        Ensure pgvector extension is installed and enabled
        
        Returns:
            True if extension is available, False otherwise
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Check if pgvector extension exists
                    cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector';")
                    if cur.fetchone():
                        logger.info("pgvector extension is already installed")
                        return True
                    
                    # Try to create the extension
                    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                    conn.commit()
                    logger.info("pgvector extension installed successfully")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to ensure pgvector extension: {e}")
            return False
    
    async def create_vector_tables(self) -> bool:
        """
        Create vector storage tables if they don't exist
        
        Returns:
            True if tables created successfully, False otherwise
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Create vector_embeddings table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS "VectorEmbedding" (
                            id TEXT PRIMARY KEY,
                            chunk_id TEXT NOT NULL,
                            embedding vector(768),
                            model TEXT DEFAULT 'text-embedding-004',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    
                    # Create HNSW index for fast similarity search
                    cur.execute("""
                        CREATE INDEX IF NOT EXISTS vector_embeddings_embedding_idx 
                        ON "VectorEmbedding" USING hnsw (embedding vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64);
                    """)
                    
                    # Create index on chunkId for faster lookups
                    cur.execute("""
                        CREATE INDEX IF NOT EXISTS vector_embeddings_chunk_id_idx 
                        ON "VectorEmbedding" ("chunkId");
                    """)
                    
                    conn.commit()
                    logger.info("Vector storage tables created successfully")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to create vector tables: {e}")
            return False
    
    async def store_embedding(self, chunk_id: str, embedding: List[float], model: str = "text-embedding-3-small") -> bool:
        """
        Store a single embedding vector
        
        Args:
            chunk_id: ID of the document chunk
            embedding: Embedding vector
            model: Model used to generate the embedding
            
        Returns:
            True if stored successfully, False otherwise
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Convert embedding to PostgreSQL vector format
                    embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                    
                    cur.execute("""
                        INSERT INTO "VectorEmbedding" (id, "chunkId", embedding, model)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            embedding = EXCLUDED.embedding,
                            model = EXCLUDED.model
                    """, (
                        f"emb_{chunk_id}",
                        chunk_id,
                        embedding_str,
                        model
                    ))
                    
                    conn.commit()
                    logger.debug(f"Stored embedding for chunk {chunk_id}")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to store embedding for chunk {chunk_id}: {e}")
            return False
    
    async def store_embeddings_batch(self, embeddings_data: List[Dict[str, Any]]) -> int:
        """
        Store multiple embeddings in batch
        
        Args:
            embeddings_data: List of dictionaries with chunk_id, embedding, and model
            
        Returns:
            Number of successfully stored embeddings
        """
        try:
            stored_count = 0
            
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    for data in embeddings_data:
                        try:
                            # Debug: log the data structure
                            logger.debug(f"Processing embedding data: {data}")
                            
                            if 'chunk_id' not in data:
                                logger.error(f"Missing chunk_id in data: {data}")
                                continue
                                
                            chunk_id = data['chunk_id']
                            embedding = data['embedding']
                            model = data.get('model', 'text-embedding-3-small')
                            
                            if not embedding:
                                logger.warning(f"Skipping chunk {chunk_id} - no embedding")
                                continue
                            
                            # Convert embedding to PostgreSQL vector format
                            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                            
                            cur.execute("""
                                INSERT INTO "VectorEmbedding" (id, "chunkId", embedding, model)
                                VALUES (%s, %s, %s, %s)
                                ON CONFLICT (id) DO UPDATE SET
                                    embedding = EXCLUDED.embedding,
                                    model = EXCLUDED.model
                            """, (
                                f"emb_{chunk_id}",
                                chunk_id,
                                embedding_str,
                                model
                            ))
                            
                            stored_count += 1
                            
                        except Exception as e:
                            chunk_id = data.get('chunk_id', 'unknown') if isinstance(data, dict) else 'unknown'
                            logger.error(f"Failed to store embedding for chunk {chunk_id}: {e}")
                            continue
                    
                    conn.commit()
                    logger.info(f"Stored {stored_count} embeddings out of {len(embeddings_data)}")
                    return stored_count
                    
        except Exception as e:
            logger.error(f"Failed to store embeddings batch: {e}")
            return 0
    
    async def search_similar_embeddings(self, query_embedding: List[float], limit: int = 10, 
                                      agent_id: Optional[str] = None, 
                                      document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for similar embeddings using cosine similarity
        
        Args:
            query_embedding: Query embedding vector
            limit: Maximum number of results to return
            agent_id: Optional filter by agent ID
            document_id: Optional filter by document ID
            
        Returns:
            List of similar embeddings with metadata
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Convert query embedding to PostgreSQL vector format
                    query_embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
                    
                    # Build the query with optional filters
                    base_query = """
                        SELECT 
                            ve.id,
                            ve."chunkId" as chunk_id,
                            ve.embedding,
                            ve.model,
                            ve."createdAt" as created_at,
                            dc.content,
                            dc."pageNumber" as page_number,
                            dc."chunkIndex" as chunk_index,
                            dc.metadata,
                            d."agentId" as agent_id,
                            d.id as document_id,
                            d."fileName" as file_name,
                            d."originalName" as original_name,
                            1 - (ve.embedding <=> %s) as similarity_score
                        FROM "VectorEmbedding" ve
                        JOIN "DocumentChunk" dc ON ve."chunkId" = dc.id
                        JOIN "Document" d ON dc."documentId" = d.id
                        WHERE 1=1
                    """
                    
                    params = [query_embedding_str]
                    
                    if agent_id:
                        base_query += " AND d.\"agentId\" = %s"
                        params.append(agent_id)
                    
                    if document_id:
                        base_query += " AND d.id = %s"
                        params.append(document_id)
                    
                    base_query += """
                        ORDER BY ve.embedding <=> %s
                        LIMIT %s
                    """
                    params.extend([query_embedding_str, limit])
                    
                    cur.execute(base_query, params)
                    results = cur.fetchall()
                    
                    # Convert results to list of dictionaries
                    similar_embeddings = []
                    for row in results:
                        similar_embeddings.append({
                            'id': row['id'],
                            'chunk_id': row['chunk_id'],
                            'content': row['content'],
                            'page_number': row['page_number'],
                            'chunk_index': row['chunk_index'],
                            'metadata': row['metadata'],
                            'agent_id': row['agent_id'],
                            'document_id': row['document_id'],
                            'file_name': row['file_name'],
                            'original_name': row['original_name'],
                            'similarity_score': float(row['similarity_score']),
                            'model': row['model'],
                            'created_at': row['created_at']
                        })
                    
                    logger.info(f"Found {len(similar_embeddings)} similar embeddings")
                    return similar_embeddings
                    
        except Exception as e:
            logger.error(f"Failed to search similar embeddings: {e}")
            return []
    
    async def delete_embeddings_by_document(self, document_id: str) -> bool:
        """
        Delete all embeddings for a specific document
        
        Args:
            document_id: Document ID
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Delete embeddings for all chunks of this document
                    cur.execute("""
                        DELETE FROM "VectorEmbedding" 
                        WHERE "chunkId" IN (
                            SELECT id FROM "DocumentChunk" 
                            WHERE "documentId" = %s
                        )
                    """, (document_id,))
                    
                    deleted_count = cur.rowcount
                    conn.commit()
                    
                    logger.info(f"Deleted {deleted_count} embeddings for document {document_id}")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to delete embeddings for document {document_id}: {e}")
            return False
    
    async def get_embedding_stats(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get statistics about stored embeddings
        
        Args:
            agent_id: Optional filter by agent ID
            
        Returns:
            Statistics dictionary
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    base_query = """
                        SELECT 
                            COUNT(*) as total_embeddings,
                            COUNT(DISTINCT ve."chunkId") as unique_chunks,
                            COUNT(DISTINCT d."agentId") as unique_agents,
                            COUNT(DISTINCT d.id) as unique_documents,
                            AVG(array_length(ve.embedding, 1)) as avg_dimensions
                        FROM "VectorEmbedding" ve
                        JOIN "DocumentChunk" dc ON ve."chunkId" = dc.id
                        JOIN "Document" d ON dc."documentId" = d.id
                        WHERE 1=1
                    """
                    
                    params = []
                    if agent_id:
                        base_query += " AND d.\"agentId\" = %s"
                        params.append(agent_id)
                    
                    cur.execute(base_query, params)
                    stats = cur.fetchone()
                    
                    return {
                        'total_embeddings': stats['total_embeddings'],
                        'unique_chunks': stats['unique_chunks'],
                        'unique_agents': stats['unique_agents'],
                        'unique_documents': stats['unique_documents'],
                        'avg_dimensions': float(stats['avg_dimensions']) if stats['avg_dimensions'] else 0
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get embedding stats: {e}")
            return {}
