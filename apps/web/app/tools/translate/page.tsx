'use client'

import { useState } from 'react'
import Link from 'next/link'

const languages = [
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'pcm', name: 'Nigerian Pidgin', flag: '🇳🇬' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
]

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('yo')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate')
      return
    }

    setIsTranslating(true)
    setError('')
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setTranslatedText(data.translation)
      } else {
        setError(data.error || 'Translation failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-teal-500/20">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800/50 to-green-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-3xl">
              🌍
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Legal Translation</h1>
              <p className="text-gray-300">Translate legal documents to Nigerian languages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Language Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20 mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">Translate to:</label>
          <div className="flex flex-wrap gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTargetLanguage(lang.code)}
                className={`px-4 py-2 rounded-lg border transition flex items-center space-x-2 ${
                  targetLanguage === lang.code
                    ? 'border-teal-500 bg-teal-500/20 text-white'
                    : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">English (Legal Text)</h2>
              <span className="text-sm text-gray-400">{sourceText.length} characters</span>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={15}
              placeholder="Enter English legal text to translate...&#10;&#10;For best results, use clear legal language and complete sentences."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="w-full mt-4 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
            >
              {isTranslating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <span>🌍</span>
                  <span>Translate to {languages.find(l => l.code === targetLanguage)?.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Translated Text */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {languages.find(l => l.code === targetLanguage)?.flag} {languages.find(l => l.code === targetLanguage)?.name}
              </h2>
              {translatedText && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-teal-400 hover:text-teal-300 transition"
                >
                  📋 Copy
                </button>
              )}
            </div>
            
            {translatedText ? (
              <div className="bg-gray-900/50 rounded-lg p-4 h-[380px] overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap">{translatedText}</p>
              </div>
            ) : (
              <div className="bg-gray-900/50 rounded-lg p-4 h-[380px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-5xl mb-4 block">🌍</span>
                  <p>Translation will appear here</p>
                </div>
              </div>
            )}

            {translatedText && (
              <div className="mt-4 flex space-x-3">
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                  📄 Download
                </button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                  🔊 Listen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-teal-900/20 border border-teal-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-teal-400 mb-3">🌍 Why Legal Translation Matters</h3>
          <p className="text-gray-400 mb-4">
            Nigeria has over 500 languages. Making legal documents accessible in local languages ensures justice for all citizens, regardless of their English proficiency.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="text-white font-medium mb-1">Yoruba</p>
              <p className="text-gray-400">45 million speakers in Southwest Nigeria</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="text-white font-medium mb-1">Igbo</p>
              <p className="text-gray-400">45 million speakers in Southeast Nigeria</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="text-white font-medium mb-1">Hausa</p>
              <p className="text-gray-400">80 million speakers in Northern Nigeria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
