"""
PDF Processing Service for PrepVista
Handles PDF text extraction and chunking for vector storage
"""

import logging
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import tiktoken
import pdfplumber
from PyPDF2 import PdfReader
import re

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize PDF processor
        
        Args:
            chunk_size: Maximum number of tokens per chunk
            chunk_overlap: Number of tokens to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
        
    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dictionary containing extracted text, metadata, and page info
        """
        try:
            logger.info(f"Extracting text from PDF: {pdf_path}")
            
            # Try pdfplumber first (better for complex layouts)
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    pages_text = []
                    total_pages = len(pdf.pages)
                    
                    for page_num, page in enumerate(pdf.pages, 1):
                        try:
                            text = page.extract_text()
                            if text and text.strip():
                                pages_text.append({
                                    'page_number': page_num,
                                    'text': text.strip(),
                                    'char_count': len(text)
                                })
                        except Exception as e:
                            logger.warning(f"Failed to extract text from page {page_num}: {e}")
                            continue
                    
                    full_text = '\n\n'.join([page['text'] for page in pages_text])
                    
                    return {
                        'success': True,
                        'full_text': full_text,
                        'pages': pages_text,
                        'total_pages': total_pages,
                        'total_chars': len(full_text),
                        'method': 'pdfplumber'
                    }
                    
            except Exception as e:
                logger.warning(f"pdfplumber failed, trying PyPDF2: {e}")
                
                # Fallback to PyPDF2
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PdfReader(file)
                    pages_text = []
                    total_pages = len(pdf_reader.pages)
                    
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        try:
                            text = page.extract_text()
                            if text and text.strip():
                                pages_text.append({
                                    'page_number': page_num,
                                    'text': text.strip(),
                                    'char_count': len(text)
                                })
                        except Exception as e:
                            logger.warning(f"Failed to extract text from page {page_num}: {e}")
                            continue
                    
                    full_text = '\n\n'.join([page['text'] for page in pages_text])
                    
                    return {
                        'success': True,
                        'full_text': full_text,
                        'pages': pages_text,
                        'total_pages': total_pages,
                        'total_chars': len(full_text),
                        'method': 'pypdf2'
                    }
                    
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {pdf_path}: {e}")
            return {
                'success': False,
                'error': str(e),
                'full_text': '',
                'pages': [],
                'total_pages': 0,
                'total_chars': 0
            }
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers and headers/footers (basic patterns)
        text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        # Clean up common PDF artifacts
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\'\/\@\#\$\%\&\*\+\=\<\>\|\\\~\`]', '', text)
        
        return text.strip()
    
    def split_text_into_chunks(self, text: str, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Split text into chunks for vector storage
        
        Args:
            text: Text to split
            metadata: Optional metadata to include with chunks
            
        Returns:
            List of chunk dictionaries
        """
        try:
            logger.info(f"Splitting text into chunks (chunk_size={self.chunk_size}, overlap={self.chunk_overlap})")
            
            # Clean the text first
            cleaned_text = self.clean_text(text)
            
            # Split into sentences first
            sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
            
            chunks = []
            current_chunk = ""
            current_tokens = 0
            chunk_index = 0
            
            for sentence in sentences:
                sentence_tokens = len(self.encoding.encode(sentence))
                
                # If adding this sentence would exceed chunk size, save current chunk
                if current_tokens + sentence_tokens > self.chunk_size and current_chunk:
                    chunks.append({
                        'content': current_chunk.strip(),
                        'chunk_index': chunk_index,
                        'token_count': current_tokens,
                        'metadata': metadata or {}
                    })
                    
                    # Start new chunk with overlap
                    overlap_text = self._get_overlap_text(current_chunk)
                    current_chunk = overlap_text + " " + sentence
                    current_tokens = len(self.encoding.encode(current_chunk))
                    chunk_index += 1
                else:
                    current_chunk += " " + sentence if current_chunk else sentence
                    current_tokens += sentence_tokens
            
            # Add the last chunk if it has content
            if current_chunk.strip():
                chunks.append({
                    'content': current_chunk.strip(),
                    'chunk_index': chunk_index,
                    'token_count': current_tokens,
                    'metadata': metadata or {}
                })
            
            logger.info(f"Created {len(chunks)} chunks from text")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to split text into chunks: {e}")
            return []
    
    def _get_overlap_text(self, text: str) -> str:
        """
        Get overlap text from the end of current chunk
        
        Args:
            text: Current chunk text
            
        Returns:
            Overlap text
        """
        words = text.split()
        if len(words) <= self.chunk_overlap // 4:  # Rough word to token ratio
            return text
        
        # Take last portion of text for overlap
        overlap_words = words[-(self.chunk_overlap // 4):]
        return " ".join(overlap_words)
    
    def process_pdf(self, pdf_path: str, agent_id: str, document_id: str) -> Dict[str, Any]:
        """
        Complete PDF processing pipeline
        
        Args:
            pdf_path: Path to PDF file
            agent_id: AI Agent ID
            document_id: Document ID
            
        Returns:
            Processing result with chunks and metadata
        """
        try:
            logger.info(f"Processing PDF: {pdf_path} for agent {agent_id}")
            
            # Extract text from PDF
            extraction_result = self.extract_text_from_pdf(pdf_path)
            
            if not extraction_result['success']:
                return {
                    'success': False,
                    'error': extraction_result['error'],
                    'chunks': []
                }
            
            # Create metadata for chunks
            metadata = {
                'agent_id': agent_id,
                'document_id': document_id,
                'file_name': os.path.basename(pdf_path),
                'total_pages': extraction_result['total_pages'],
                'total_chars': extraction_result['total_chars']
            }
            
            # Split into chunks
            chunks = self.split_text_into_chunks(extraction_result['full_text'], metadata)
            
            # Add page information to chunks
            for chunk in chunks:
                chunk['page_info'] = self._get_page_info_for_chunk(
                    chunk['content'], 
                    extraction_result['pages']
                )
            
            return {
                'success': True,
                'chunks': chunks,
                'metadata': {
                    'total_chunks': len(chunks),
                    'total_pages': extraction_result['total_pages'],
                    'total_chars': extraction_result['total_chars'],
                    'extraction_method': extraction_result['method']
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to process PDF {pdf_path}: {e}")
            return {
                'success': False,
                'error': str(e),
                'chunks': []
            }
    
    def _get_page_info_for_chunk(self, chunk_content: str, pages: List[Dict]) -> Dict[str, Any]:
        """
        Determine which pages a chunk likely came from
        
        Args:
            chunk_content: Content of the chunk
            pages: List of page dictionaries
            
        Returns:
            Page information for the chunk
        """
        try:
            # Simple heuristic: find pages that contain parts of the chunk
            chunk_words = set(chunk_content.lower().split())
            matching_pages = []
            
            for page in pages:
                page_words = set(page['text'].lower().split())
                # If more than 30% of chunk words are in this page, consider it a match
                overlap = len(chunk_words.intersection(page_words))
                if overlap > len(chunk_words) * 0.3:
                    matching_pages.append(page['page_number'])
            
            return {
                'likely_pages': matching_pages,
                'primary_page': matching_pages[0] if matching_pages else None
            }
            
        except Exception as e:
            logger.warning(f"Failed to determine page info for chunk: {e}")
            return {
                'likely_pages': [],
                'primary_page': None
            }
