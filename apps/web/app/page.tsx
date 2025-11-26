'use client'

import { useState } from 'react'

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    {
      id: 'draft',
      title: '📝 Document Drafting',
      description: 'Generate contracts, letters, and pleadings',
      endpoint: '/api/draft'
    },
    {
      id: 'predict',
      title: '🔮 Case Prediction',
      description: 'Predict outcomes based on Nigerian case law',
      endpoint: '/api/predict'
    },
    {
      id: 'research',
      title: '🔍 Legal Research',
      description: 'Search 10,000+ Nigerian judgments',
      endpoint: '/api/research'
    },
    {
      id: 'analyze',
      title: '📄 Contract Analysis',
      description: 'Identify risks and unfair terms',
      endpoint: '/api/analyze-contract'
    },
    {
      id: 'summarize',
      title: '📋 Judgment Summarization',
      description: 'Summarize lengthy court judgments',
      endpoint: '/api/summarize'
    },
    {
      id: 'translate',
      title: '🌍 Translation',
      description: 'Translate to Yoruba, Igbo, Hausa',
      endpoint: '/api/translate'
    },
    {
      id: 'arguments',
      title: '⚖️ Argument Generation',
      description: 'Generate persuasive legal arguments',
      endpoint: '/api/generate-arguments'
    },
    {
      id: 'compliance',
      title: '✅ Compliance Check',
      description: 'Check against Nigerian regulations',
      endpoint: '/api/compliance-check'
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-primary text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">⚖️ CaseWin-NG</h1>
          <p className="text-green-200 mt-2">AI-Powered Legal Platform for Nigerian Lawyers</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">
            8 AI-Powered Legal Tools
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Powered by Llama 3.2, Qdrant Vector Search, and 10,000+ Nigerian case law database
          </p>
          <div className="mt-6">
            <span className="bg-accent text-primary px-4 py-2 rounded-full font-semibold">
              ₦2,500/month | Try Free for 7 Days
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setActiveFeature(feature.id)}
            >
              <h3 className="text-xl font-bold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
              <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors w-full">
                Try Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace Teaser */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">
            👥 Lawyer Marketplace
          </h2>
          <p className="text-gray-700 mb-6">
            Connect with verified Nigerian lawyers. Secure payments via Solana escrow.
          </p>
          <a
            href="/marketplace"
            className="bg-accent text-primary px-6 py-3 rounded-md font-semibold hover:bg-yellow-500 transition-colors inline-block"
          >
            Browse Lawyers
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">Built with 🇳🇬 by Nigerian developers</p>
          <p className="text-green-200 text-sm">
            Powered by Ollama (Llama 3.2) | Qdrant | Supabase | Solana
          </p>
        </div>
      </footer>
    </main>
  )
}
