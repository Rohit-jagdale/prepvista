'use client';

import { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  FileText, 
  X,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { buildAiUrl } from '@/config/api';
import MarkdownRenderer from './MarkdownRenderer';

interface AgentRAGQueryProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    page_number?: number;
    chunk_index: number;
    similarity_score: number;
    file_name: string;
  }>;
  context_used: boolean;
  context_chunks_count: number;
  similarity_scores: number[];
}

export default function AgentRAGQuery({ agentId, agentName, onClose }: AgentRAGQueryProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  const toggleSourceExpansion = (index: number) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSources(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(buildAiUrl('/api/rag/query'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          agent_id: agentId,
          max_context_chunks: 5,
          include_sources: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('RAG query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuery = () => {
    setQuery('');
    setResponse(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Ask {agentName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get contextual answers based on your uploaded documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Query Input */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ask a question about your study material
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What are the main characteristics of Big Data?"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Response Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-6">
                {/* Answer */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Answer
                      </h3>
                      <MarkdownRenderer 
                        content={response.answer} 
                        className="text-gray-700 dark:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Sources */}
                {response.sources && response.sources.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Sources ({response.context_chunks_count} chunks used)
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const allIndices = response.sources.map((_, index) => index);
                                setExpandedSources(new Set(allIndices));
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              Expand All
                            </button>
                            <span className="text-gray-400">|</span>
                            <button
                              onClick={() => setExpandedSources(new Set())}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              Collapse All
                            </button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {response.sources.map((source, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Source {index + 1}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {source.page_number && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                      Page {source.page_number}
                                    </span>
                                  )}
                                  <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-2 py-1 rounded">
                                    {Math.round(source.similarity_score * 100)}% match
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {expandedSources.has(index) ? (
                                  <MarkdownRenderer 
                                    content={source.content} 
                                    className="text-sm"
                                  />
                                ) : (
                                  <div className="line-clamp-3">
                                    <MarkdownRenderer 
                                      content={source.content} 
                                      className="text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  From: {source.file_name}
                                </p>
                                <button
                                  onClick={() => toggleSourceExpansion(index)}
                                  className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                  <span>
                                    {expandedSources.has(index) ? 'Show Less' : 'Show More'}
                                  </span>
                                  {expandedSources.has(index) ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Context Info */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Context Used: {response.context_used ? 'Yes' : 'No'}
                    </span>
                    {response.similarity_scores && (
                      <span className="text-sm text-green-700 dark:text-green-300">
                        • Similarity: {response.similarity_scores.map(s => Math.round(s * 100)).join(', ')}%
                      </span>
                    )}
                  </div>
                </div>

                {/* New Query Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleNewQuery}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Ask Another Question
                  </button>
                </div>
              </div>
            )}

            {!response && !error && !isLoading && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ask Your First Question
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get contextual answers based on your uploaded study material
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
