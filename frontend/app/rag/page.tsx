'use client'

import { useState } from 'react'
import { api } from '../../lib/api'

export default function RagPage() {
  const [agentId, setAgentId] = useState('test-agent-123')
  const [documentId, setDocumentId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [query, setQuery] = useState('What are neural networks?')
  const [answer, setAnswer] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await api.ragUploadPdf({ file, agentId, documentId: documentId || undefined })
      setUploadResult(res)
      if (res?.document_id && !documentId) setDocumentId(res.document_id)
    } catch (e: any) {
      setUploadResult({ error: e?.message || 'Upload failed' })
    } finally {
      setLoading(false)
    }
  }

  const onAsk = async () => {
    if (!query) return
    setLoading(true)
    try {
      const res = await api.ragQuery({
        query,
        agent_id: agentId,
        document_id: documentId || undefined,
        max_context_chunks: 5,
        include_sources: true,
      })
      setAnswer(res)
    } catch (e: any) {
      setAnswer({ error: e?.message || 'Query failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">RAG Playground</h1>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Agent ID</label>
              <input value={agentId} onChange={e=>setAgentId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Document ID (optional)</label>
              <input value={documentId} onChange={e=>setDocumentId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Upload PDF</label>
            <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} />
            <button onClick={onUpload} disabled={!file || loading} className="ml-2 px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">{loading? 'Uploading...' : 'Upload'}</button>
            {uploadResult && (
              <pre className="mt-3 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-48">{JSON.stringify(uploadResult, null, 2)}</pre>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Ask a question</label>
            <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
            <button onClick={onAsk} disabled={loading} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">{loading? 'Asking...' : 'Ask'}</button>
          </div>

          {answer && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Answer</h2>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-96">{JSON.stringify(answer, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


