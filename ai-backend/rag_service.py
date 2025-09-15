"""
RAG (Retrieval-Augmented Generation) Service for PrepVista
Handles context retrieval and response generation for AI agents
"""

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional, Tuple
from embedding_service import EmbeddingService
from vector_storage import VectorStorageService

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, embedding_service: EmbeddingService, vector_storage: VectorStorageService, ai_model=None):
        """
        Initialize RAG service
        
        Args:
            embedding_service: Service for generating embeddings
            vector_storage: Service for storing and retrieving vectors
            ai_model: AI model for generating responses (optional)
        """
        self.embedding_service = embedding_service
        self.vector_storage = vector_storage
        self.ai_model = ai_model
        logger.info("Initialized RAGService")
    
    async def retrieve_relevant_context(self, query: str, agent_id: str, 
                                      document_id: Optional[str] = None,
                                      max_results: int = 5,
                                      similarity_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context for a query using semantic search
        
        Args:
            query: User query/question
            agent_id: AI Agent ID
            document_id: Optional specific document ID to search in
            max_results: Maximum number of results to return
            similarity_threshold: Minimum similarity score threshold
            
        Returns:
            List of relevant context chunks
        """
        try:
            logger.info(f"Retrieving context for query: {query[:100]}...")
            
            # Generate embedding for the query
            query_embedding = await self.embedding_service.generate_embedding(query)
            if not query_embedding:
                logger.error("Failed to generate query embedding")
                return []
            
            # Search for similar embeddings
            similar_embeddings = await self.vector_storage.search_similar_embeddings(
                query_embedding=query_embedding,
                limit=max_results * 2,  # Get more results to filter by threshold
                agent_id=agent_id,
                document_id=document_id
            )
            
            # Filter by similarity threshold and limit results
            relevant_context = [
                result for result in similar_embeddings 
                if result['similarity_score'] >= similarity_threshold
            ][:max_results]
            
            logger.info(f"Retrieved {len(relevant_context)} relevant context chunks")
            return relevant_context
            
        except Exception as e:
            logger.error(f"Failed to retrieve relevant context: {e}")
            return []
    
    async def generate_contextual_response(self, query: str, agent_id: str,
                                         document_id: Optional[str] = None,
                                         max_context_chunks: int = 5,
                                         include_sources: bool = True) -> Dict[str, Any]:
        """
        Generate a contextual response using RAG
        
        Args:
            query: User query/question
            agent_id: AI Agent ID
            document_id: Optional specific document ID to search in
            max_context_chunks: Maximum number of context chunks to use
            include_sources: Whether to include source information
            
        Returns:
            Response dictionary with answer and sources
        """
        try:
            logger.info(f"Generating contextual response for agent {agent_id}")
            
            # Retrieve relevant context
            context_chunks = await self.retrieve_relevant_context(
                query=query,
                agent_id=agent_id,
                document_id=document_id,
                max_results=max_context_chunks
            )
            
            if not context_chunks:
                return {
                    'answer': "I don't have enough relevant information in the uploaded documents to answer this question accurately. Please try rephrasing your question or upload more relevant documents.",
                    'sources': [],
                    'context_used': False
                }
            
            # Prepare context for the AI model
            context_text = self._prepare_context_text(context_chunks)
            
            # Create a prompt that includes the context
            rag_prompt = self._create_rag_prompt(query, context_text, agent_id)
            
            # Generate AI response if model is available
            if self.ai_model:
                try:
                    logger.info("Generating AI response with context...")
                    loop = asyncio.get_event_loop()
                    with ThreadPoolExecutor() as executor:
                        future = executor.submit(lambda: self.ai_model.generate_content(rag_prompt))
                        ai_response = await loop.run_in_executor(None, lambda: future.result(timeout=30.0))
                    
                    if ai_response and ai_response.text:
                        answer = ai_response.text
                        logger.info(f"Generated AI response: {len(answer)} characters")
                    else:
                        answer = "I couldn't generate a proper response. Here's the context I found:\n\n" + context_text
                        logger.warning("AI model returned empty response")
                except Exception as e:
                    logger.error(f"AI model generation failed: {e}")
                    answer = "I encountered an error while generating a response. Here's the context I found:\n\n" + context_text
            else:
                answer = "AI model not available. Here's the context I found:\n\n" + context_text
                logger.warning("No AI model available for response generation")
            
            return {
                'answer': answer,
                'sources': context_chunks if include_sources else [],
                'context_used': True,
                'context_chunks_count': len(context_chunks),
                'context_text': context_text
            }
            
        except Exception as e:
            logger.error(f"Failed to generate contextual response: {e}")
            return {
                'answer': "I encountered an error while processing your question. Please try again.",
                'sources': [],
                'context_used': False,
                'error': str(e)
            }
    
    def _prepare_context_text(self, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Prepare context text from retrieved chunks
        
        Args:
            context_chunks: List of context chunks
            
        Returns:
            Formatted context text
        """
        try:
            context_parts = []
            
            for i, chunk in enumerate(context_chunks, 1):
                source_info = f"[Source {i}: {chunk.get('file_name', 'Unknown')}"
                if chunk.get('page_number'):
                    source_info += f", Page {chunk['page_number']}"
                source_info += f", Similarity: {chunk['similarity_score']:.2f}]"
                
                context_parts.append(f"{source_info}\n{chunk['content']}\n")
            
            return "\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Failed to prepare context text: {e}")
            return ""
    
    def _create_rag_prompt(self, query: str, context_text: str, agent_id: str) -> str:
        """
        Create a RAG prompt for the AI model
        
        Args:
            query: User query
            context_text: Retrieved context text
            agent_id: AI Agent ID
            
        Returns:
            Formatted prompt for the AI model
        """
        prompt = f"""
You are an AI assistant specialized in helping with exam preparation. You have access to specific study materials and should provide accurate, helpful answers based on the provided context.

CONTEXT FROM STUDY MATERIALS:
{context_text}

USER QUESTION: {query}

INSTRUCTIONS:
1. Answer the question based primarily on the provided context from the study materials
2. If the context doesn't contain enough information to answer completely, say so and provide what information you can
3. Be specific and cite relevant details from the materials when possible
4. If the question is about concepts not covered in the materials, explain that the specific topic isn't covered in the uploaded documents
5. Provide clear, educational explanations that help with exam preparation
6. If applicable, suggest related topics or concepts that might be helpful
7. Format your response using Markdown for better readability (use headers, bullet points, bold text, etc.)

Please provide a comprehensive answer based on the study materials provided, formatted in Markdown.
"""
        return prompt
    
    async def search_documents(self, query: str, agent_id: str, 
                             document_id: Optional[str] = None,
                             max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search through documents for specific information
        
        Args:
            query: Search query
            agent_id: AI Agent ID
            document_id: Optional specific document ID
            max_results: Maximum number of results
            
        Returns:
            List of search results with relevance scores
        """
        try:
            logger.info(f"Searching documents for: {query[:100]}...")
            
            # Generate embedding for the search query
            query_embedding = await self.embedding_service.generate_embedding(query)
            if not query_embedding:
                logger.error("Failed to generate search query embedding")
                return []
            
            # Search for similar content
            search_results = await self.vector_storage.search_similar_embeddings(
                query_embedding=query_embedding,
                limit=max_results,
                agent_id=agent_id,
                document_id=document_id
            )
            
            # Format results for search display
            formatted_results = []
            for result in search_results:
                formatted_results.append({
                    'content': result['content'],
                    'file_name': result['file_name'],
                    'page_number': result['page_number'],
                    'relevance_score': result['similarity_score'],
                    'chunk_index': result['chunk_index'],
                    'metadata': result['metadata']
                })
            
            logger.info(f"Found {len(formatted_results)} search results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            return []
    
    async def get_document_summary(self, agent_id: str, document_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get a summary of available documents and their content
        
        Args:
            agent_id: AI Agent ID
            document_id: Optional specific document ID
            
        Returns:
            Document summary information
        """
        try:
            # Get embedding statistics
            stats = await self.vector_storage.get_embedding_stats(agent_id)
            
            # Get sample content from documents
            sample_query = "introduction overview summary main topics"
            sample_results = await self.search_documents(
                query=sample_query,
                agent_id=agent_id,
                document_id=document_id,
                max_results=5
            )
            
            return {
                'stats': stats,
                'sample_content': sample_results,
                'agent_id': agent_id,
                'document_id': document_id
            }
            
        except Exception as e:
            logger.error(f"Failed to get document summary: {e}")
            return {
                'stats': {},
                'sample_content': [],
                'agent_id': agent_id,
                'document_id': document_id,
                'error': str(e)
            }
