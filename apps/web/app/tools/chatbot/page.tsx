'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'Hello! I\'m CaseWin AI, your Nigerian legal assistant. I can help with questions about Nigerian law, statutes, case law, court procedures, and legal practice. What would you like to know?', timestamp: new Date().toISOString() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, timestamp: data.timestamp }])
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }])
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Network error. Please check your connection.', timestamp: new Date().toISOString() }])
    } finally { setIsLoading(false); inputRef.current?.focus() }
  }

  const suggestions = [
    'What is the limitation period for contract disputes in Lagos?',
    'Explain the procedure for filing a fundamental rights application',
    'What are the grounds for divorce under Nigerian law?',
    'How do I register a company under CAMA 2020?',
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <span className="text-lg font-bold text-gray-900 hidden sm:inline">CaseWin AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600 bg-green-50 text-green-700 px-2 sm:px-3 py-1 rounded-full">🤖 AI Legal Chatbot</span>
            <Link href="/tools" className="text-xs sm:text-sm text-gray-500 hover:text-gray-900">All Tools</Link>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                {msg.role === 'assistant' && <p className="text-xs font-semibold text-green-600 mb-1">⚖️ CaseWin AI</p>}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-green-600 mb-1">⚖️ CaseWin AI</p>
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {messages.length <= 1 && (
            <div className="mt-4 sm:mt-8">
              <p className="text-xs sm:text-sm text-gray-500 mb-3">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="text-left text-xs sm:text-sm p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white flex-shrink-0">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              rows={1} placeholder="Ask a Nigerian legal question..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ maxHeight: '120px', minHeight: '44px' }} />
            <button onClick={sendMessage} disabled={!input.trim() || isLoading}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors text-sm flex-shrink-0">
              Send
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">CaseWin AI provides legal information, not legal advice. Consult a lawyer for specific matters.</p>
        </div>
      </div>
    </div>
  )
}
