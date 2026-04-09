'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SubscriptionGuard from '@/components/SubscriptionGuard'

interface Document {
  document_name: string
  document_type: string
  created_at: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

const DOCUMENT_CATEGORIES = [
  { id: 'contract-templates', label: 'Contract Templates', icon: '\u{1F4DD}', desc: 'Standard agreements, MOUs, NDAs' },
  { id: 'precedents', label: 'Case Precedents', icon: '\u{2696}\u{FE0F}', desc: 'Past case briefs, judgments, opinions' },
  { id: 'policies', label: 'Firm Policies', icon: '\u{1F4CB}', desc: 'Internal procedures, billing, onboarding' },
  { id: 'research', label: 'Legal Research', icon: '\u{1F4DA}', desc: 'Memos, legal opinions, analysis' },
  { id: 'client-docs', label: 'Client Documents', icon: '\u{1F465}', desc: 'Client correspondence, intake forms' },
  { id: 'compliance', label: 'Compliance & Regulatory', icon: '\u{2705}', desc: 'NBA rules, court rules, regulatory guides' },
  { id: 'general', label: 'General / Other', icon: '\u{1F4C4}', desc: 'Any other firm documents' },
]

const TRAINING_TIPS = [
  { title: 'Upload contract templates', desc: 'Your standard agreements so the AI knows your firm\'s preferred terms and clauses', category: 'contract-templates' },
  { title: 'Add past case briefs', desc: 'Historical case briefs and judgments so the AI can reference your firm\'s precedents', category: 'precedents' },
  { title: 'Include firm policies', desc: 'Onboarding procedures, billing rules, and internal policies for quick staff lookups', category: 'policies' },
  { title: 'Upload legal research memos', desc: 'Research memos and opinions so the AI builds your firm\'s institutional knowledge', category: 'research' },
  { title: 'Add regulatory guides', desc: 'NBA rules, court practice directions, and compliance documents', category: 'compliance' },
]

export default function KnowledgePage() {
  return (
    <SubscriptionGuard tool="knowledge">
      <KnowledgePageContent />
    </SubscriptionGuard>
  )
}

function KnowledgePageContent() {
  const [firmId, setFirmId] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'training'>('chat')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('casewin_firm_id')
    if (saved) {
      setFirmId(saved)
      loadDocuments(saved)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveFirmId = (id: string) => {
    setFirmId(id)
    localStorage.setItem('casewin_firm_id', id)
    if (id) loadDocuments(id)
  }

  const loadDocuments = async (fId: string) => {
    try {
      const res = await fetch(`/api/knowledge/upload?firmId=${fId}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch { /* ignore */ }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !firmId) return

    setIsUploading(true)
    setUploadStatus('Reading file...')

    try {
      const text = await file.text()

      if (!text.trim()) {
        setUploadStatus('File is empty or could not be read')
        return
      }

      setUploadStatus('Uploading to knowledge base...')

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmId,
          userId: localStorage.getItem('casewin_user_id') || '',
          documentName: file.name,
          documentText: text,
          documentType: selectedCategory,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setUploadStatus(`Uploaded "${file.name}" (${data.chunksStored} chunks)`)
        loadDocuments(firmId)
      } else {
        setUploadStatus(`Error: ${data.error}`)
      }
    } catch (err) {
      setUploadStatus('Upload failed — check your connection')
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleQuery = async () => {
    if (!query.trim() || !firmId) return

    const userMsg: Message = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsQuerying(true)

    try {
      const res = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId, query: query.trim() }),
      })

      const data = await res.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer || data.error || 'No response',
        sources: data.sources || [],
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error — please try again' }])
    } finally {
      setIsQuerying(false)
    }
  }

  if (!firmId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <span className="text-5xl block mb-3">{'\u{1F3E2}'}</span>
            <h1 className="text-2xl font-bold text-white mb-2">Firm Knowledge Agent</h1>
            <p className="text-gray-400">Enter your firm name to get started</p>
          </div>
          <input
            type="text"
            placeholder="e.g., Aluko & Oyebode"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '-')
                if (val) saveFirmId(val)
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement
              const val = input?.value.trim().toLowerCase().replace(/\s+/g, '-')
              if (val) saveFirmId(val)
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">{'\u2696\uFE0F'}</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">{'\u{1F3E2}'} {firmId}</span>
              <Link href="/tools" className="text-gray-300 hover:text-white transition">Tools</Link>
              <button
                onClick={() => { localStorage.removeItem('casewin_firm_id'); setFirmId('') }}
                className="text-gray-500 hover:text-white text-sm"
              >
                Switch Firm
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-teal-800/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl">
                {'\u{1F9E0}'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Firm Knowledge Agent</h1>
                <p className="text-gray-300 text-sm">Upload documents, ask anything about your firm&apos;s knowledge</p>
              </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'chat' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'upload' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Upload ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'training' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Training Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'training' ? (
          /* Training Guide Tab */
          <div className="space-y-6">
            {/* Training Status */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{'\u{1F9E0}'} Agent Training Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  documents.length >= 5 ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                  documents.length >= 1 ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-600/20 text-red-400 border border-red-500/30'
                }`}>
                  {documents.length >= 5 ? 'Well Trained' : documents.length >= 1 ? 'Basic Training' : 'Not Trained'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-full h-3 transition-all"
                  style={{ width: `${Math.min(100, (documents.length / 10) * 100)}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">{documents.length} documents uploaded &bull; Upload at least 10 for best results</p>
            </div>

            {/* How to Train Your Agent */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">{'\u{1F4D6}'} How to Train Your Firm&apos;s AI Agent</h3>
              <p className="text-gray-400 mb-6">Follow these steps to build a powerful, firm-specific knowledge base that your entire team can query.</p>

              <div className="space-y-4">
                {[
                  { step: 1, title: 'Gather Your Documents', desc: 'Collect contract templates, case briefs, research memos, internal policies, and compliance documents. Export them as .txt, .md, or .csv files.' },
                  { step: 2, title: 'Categorize Before Uploading', desc: 'Use the Upload tab to select a document category before each upload. This helps the AI understand the type and context of each document.' },
                  { step: 3, title: 'Upload in Batches', desc: 'Upload documents one at a time. Each file is chunked into searchable segments. Start with your most-used templates and policies.' },
                  { step: 4, title: 'Test with Queries', desc: 'Switch to the Chat tab and ask questions like "What are our standard payment terms?" or "Summarize our client onboarding process."' },
                  { step: 5, title: 'Iterate and Improve', desc: 'If the AI can\'t answer a question, upload more relevant documents. The more context you give, the smarter your agent becomes.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start space-x-4 bg-gray-700/20 rounded-lg p-4">
                    <div className="w-8 h-8 bg-purple-600/30 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Documents Checklist */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <h3 className="text-lg font-bold text-white mb-4">{'\u{2705}'} Training Checklist</h3>
              <p className="text-gray-400 text-sm mb-4">Upload these document types for a well-trained agent:</p>
              <div className="space-y-3">
                {TRAINING_TIPS.map((tip, i) => {
                  const hasType = documents.some(d => d.document_type === tip.category)
                  return (
                    <div key={i} className="flex items-start space-x-3">
                      <span className={`mt-0.5 text-lg ${hasType ? 'text-green-400' : 'text-gray-600'}`}>
                        {hasType ? '\u{2705}' : '\u{2B1C}'}
                      </span>
                      <div>
                        <p className={`font-medium text-sm ${hasType ? 'text-green-400' : 'text-white'}`}>{tip.title}</p>
                        <p className="text-gray-500 text-xs">{tip.desc}</p>
                      </div>
                      {!hasType && (
                        <button
                          onClick={() => { setSelectedCategory(tip.category); setActiveTab('upload') }}
                          className="ml-auto text-xs text-green-400 hover:text-green-300 shrink-0"
                        >
                          Upload now {'\u2192'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-bold text-white mb-4">{'\u{1F4A1}'} Best Practices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Remove sensitive client data', desc: 'Redact names and personal details before uploading client-related documents.' },
                  { title: 'Use clear file names', desc: 'Name files descriptively: "Standard-NDA-Template.txt" not "doc1.txt"' },
                  { title: 'Upload updated versions', desc: 'When policies change, upload the latest version. The AI uses all uploaded content.' },
                  { title: 'Train all practice areas', desc: 'Cover all your firm\'s practice areas for comprehensive knowledge coverage.' },
                ].map((tip, i) => (
                  <div key={i} className="bg-gray-700/20 rounded-lg p-4">
                    <h4 className="text-white font-semibold text-sm">{tip.title}</h4>
                    <p className="text-gray-400 text-xs mt-1">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'upload' ? (
          /* Upload Tab */
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">{'\u{1F4C1}'} Select Document Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DOCUMENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-left p-3 rounded-lg border transition ${
                      selectedCategory === cat.id
                        ? 'bg-green-600/20 border-green-500 text-white'
                        : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-xs font-medium mt-1">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-dashed border-green-500/30 text-center">
              <span className="text-5xl block mb-3">{'\u{1F4C4}'}</span>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Documents</h3>
              <p className="text-gray-400 text-sm mb-4">
                Upload .txt, .md, or plain text files. PDF text extraction happens client-side.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </button>
              {uploadStatus && (
                <p className="text-sm text-gray-400 mt-3">{uploadStatus}</p>
              )}
            </div>

            {/* Document List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                {'\u{1F4DA}'} Knowledge Base ({documents.length} documents)
              </h3>
              {documents.length === 0 ? (
                <p className="text-gray-400 text-sm">No documents uploaded yet. Upload files to build your firm&apos;s knowledge base.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-700/30 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <span>{'\u{1F4C4}'}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{doc.document_name}</p>
                          <p className="text-gray-500 text-xs">{doc.document_type} &bull; {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat Tab */
          <div className="flex flex-col h-[calc(100vh-280px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <span className="text-6xl block mb-4">{'\u{1F9E0}'}</span>
                  <h3 className="text-xl font-semibold text-white mb-2">Ask Your Knowledge Base</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Ask questions about your firm&apos;s uploaded documents. The AI will search your knowledge base and provide answers with citations.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['What are our standard contract terms?', 'Summarize our client onboarding policy', 'What precedents do we have on land disputes?'].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(suggestion); }}
                        className="bg-gray-700/30 text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-700/50 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-green-600/30 border border-green-500/30 text-white'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <p className="text-xs text-gray-500">Sources: {msg.sources.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isQuerying && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex space-x-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() } }}
                placeholder="Ask about your firm's documents..."
                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleQuery}
                disabled={isQuerying || !query.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 rounded-xl font-semibold transition"
              >
                {isQuerying ? '...' : 'Ask'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
