"""
Embedding Service for PrepVista
Handles text embedding generation using Google Gemini API
"""

import logging
import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, api_key: Optional[str] = None, model: str = "models/text-embedding-004"):
        """
        Initialize embedding service
        
        Args:
            api_key: Google API key (if None, will use environment variable)
            model: Embedding model to use
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.model = model
        
        if not self.api_key:
            raise ValueError("Google API key not provided")
        
        # Configure Google Generative AI
        genai.configure(api_key=self.api_key)
        
        # Model dimensions for Google embedding models
        self.model_dimensions = {
            "models/text-embedding-004": 768,
            "models/text-embedding-001": 768,
            "models/embedding-001": 768
        }
        
        self.dimension = self.model_dimensions.get(model, 768)
        logger.info(f"Initialized EmbeddingService with Google model {model} (dimensions: {self.dimension})")
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text using Google Gemini
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector or None if failed
        """
        try:
            logger.debug(f"Generating embedding for text: {text[:100]}...")
            
            # Use Google's embedding model
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            
            embedding = result['embedding']
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    async def generate_embeddings_batch(self, texts: List[str], batch_size: int = 100) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts in batches using Google Gemini
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process in each batch
            
        Returns:
            List of embedding vectors (None for failed embeddings)
        """
        try:
            logger.info(f"Generating embeddings for {len(texts)} texts in batches of {batch_size}")
            
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                logger.debug(f"Processing batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
                
                try:
                    # Google's API doesn't support batch embedding, so we process one by one
                    batch_embeddings = []
                    for text in batch_texts:
                        try:
                            result = genai.embed_content(
                                model=self.model,
                                content=text,
                                task_type="retrieval_document"
                            )
                            batch_embeddings.append(result['embedding'])
                        except Exception as e:
                            logger.warning(f"Failed to generate embedding for text in batch: {e}")
                            batch_embeddings.append(None)
                    
                    all_embeddings.extend(batch_embeddings)
                    
                except Exception as e:
                    logger.error(f"Failed to generate embeddings for batch {i//batch_size + 1}: {e}")
                    # Add None for each text in the failed batch
                    all_embeddings.extend([None] * len(batch_texts))
            
            logger.info(f"Generated {len([e for e in all_embeddings if e is not None])} successful embeddings out of {len(texts)}")
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings batch: {e}")
            return [None] * len(texts)
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score (-1 to 1)
        """
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            return 0.0
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current embedding model
        
        Returns:
            Model information dictionary
        """
        return {
            'model': self.model,
            'dimensions': self.dimension,
            'api_key_configured': bool(self.api_key)
        }
    
    async def test_embedding(self) -> bool:
        """
        Test if the embedding service is working
        
        Returns:
            True if test successful, False otherwise
        """
        try:
            test_text = "This is a test text for embedding generation."
            embedding = await self.generate_embedding(test_text)
            
            if embedding and len(embedding) == self.dimension:
                logger.info("Embedding service test successful")
                return True
            else:
                logger.error(f"Embedding test failed: got {len(embedding) if embedding else 0} dimensions, expected {self.dimension}")
                return False
                
        except Exception as e:
            logger.error(f"Embedding service test failed: {e}")
            return False
