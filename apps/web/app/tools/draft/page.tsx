'use client'

import { useState } from 'react'
import Link from 'next/link'

const documentTypes = [
  { id: 'contract', name: 'Contract/Agreement', icon: '📜' },
  { id: 'letter', name: 'Legal Letter', icon: '✉️' },
  { id: 'pleading', name: 'Court Pleading', icon: '⚖️' },
  { id: 'affidavit', name: 'Affidavit', icon: '📋' },
  { id: 'mou', name: 'Memorandum of Understanding', icon: '🤝' },
  { id: 'power-of-attorney', name: 'Power of Attorney', icon: '🔏' },
  { id: 'will', name: 'Will/Testament', icon: '📝' },
  { id: 'tenancy', name: 'Tenancy Agreement', icon: '🏠' },
]

export default function DraftPage() {
  const [documentType, setDocumentType] = useState('')
  const [description, setDescription] = useState('')
  const [parties, setParties] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!documentType || !description) {
      setError('Please select a document type and provide a description')
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          description,
          parties,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedDocument(data.document)
      } else {
        setError(data.error || 'Failed to generate document')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument)
  }

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentType}-draft.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/tools" className="text-gray-300 hover:text-white transition">
                All Tools
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800/50 to-cyan-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-3xl">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Document Drafting</h1>
              <p className="text-gray-300">Generate contracts, letters, and legal documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Document Details</h2>
              
              {/* Document Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">Document Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setDocumentType(type.id)}
                      className={`p-3 rounded-lg border text-left transition ${
                        documentType === type.id
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl mr-2">{type.icon}</span>
                      <span className="text-sm">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parties */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Parties Involved
                </label>
                <input
                  type="text"
                  value={parties}
                  onChange={(e) => setParties(e.target.value)}
                  placeholder="e.g., John Doe (Landlord) and Jane Smith (Tenant)"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description & Requirements
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the document you need. Include key terms, conditions, and any specific clauses required..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate Document</span>
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <h3 className="font-semibold text-blue-400 mb-2">💡 Tips for Better Results</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Be specific about terms and conditions</li>
                <li>• Include relevant dates and amounts</li>
                <li>• Mention applicable Nigerian laws if known</li>
                <li>• Always review generated documents with a lawyer</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Generated Document</h2>
              {generatedDocument && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
                    title="Download"
                  >
                    💾
                  </button>
                </div>
              )}
            </div>

            {generatedDocument ? (
              <div className="bg-gray-900/50 rounded-lg p-4 h-[500px] overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                  {generatedDocument}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-900/50 rounded-lg p-4 h-[500px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">📄</span>
                  <p>Your generated document will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
