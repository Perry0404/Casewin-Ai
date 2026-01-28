'use client'

import { useState } from 'react'
import Link from 'next/link'

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
      {/* Header with Navigation */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-4xl font-bold">⚖️ CaseWin-NG</h1>
              <p className="text-green-200 mt-2">AI-Powered Legal Platform for Nigerian Lawyers</p>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="text-white hover:text-accent transition-colors font-semibold">
                AI Tools
              </Link>
              <Link href="/marketplace" className="text-white hover:text-accent transition-colors font-semibold">
                Hire Lawyers
              </Link>
            </nav>
          </div>
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

      {/* Marketplace Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl p-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                👥 Need a Lawyer? Hire from Our Marketplace
              </h2>
              <p className="text-indigo-100 mb-6 text-lg">
                Browse 6+ verified Nigerian lawyers across Corporate, Criminal, Family, Real Estate, IP, and Labour Law. 
                Filter by location, specialty, and hourly rate. Secure payments via Paystack and Solana escrow protection.
              </p>
              <div className="flex gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">6+</div>
                  <div className="text-sm text-indigo-200">Verified Lawyers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">4.8★</div>
                  <div className="text-sm text-indigo-200">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">₦15-30K</div>
                  <div className="text-sm text-indigo-200">Per Hour</div>
                </div>
              </div>
              <Link
                href="/marketplace"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold hover:shadow-lg transition-shadow inline-block text-lg"
              >
                Browse Lawyers →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🏢</div>
                <div className="font-semibold">Corporate Law</div>
                <div className="text-sm text-indigo-200">M&A, Compliance</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="font-semibold">Criminal Law</div>
                <div className="text-sm text-indigo-200">Defense, Litigation</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🏠</div>
                <div className="font-semibold">Real Estate</div>
                <div className="text-sm text-indigo-200">Property, Titles</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">💼</div>
                <div className="font-semibold">Labour Law</div>
                <div className="text-sm text-indigo-200">Employment</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-primary mb-12">
          Complete Legal Solution in One Platform
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-primary mb-3">1. Use AI Tools</h3>
            <p className="text-gray-600">
              Draft documents, predict outcomes, research cases, analyze contracts with our 8 AI-powered tools
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">👨‍⚖️</div>
            <h3 className="text-xl font-bold text-primary mb-3">2. Hire a Lawyer</h3>
            <p className="text-gray-600">
              Need expert help? Browse verified lawyers, compare rates, check reviews, and book consultations
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-primary mb-3">3. Secure Payment</h3>
            <p className="text-gray-600">
              Pay via Paystack (NGN) with Solana escrow protection for disputed cases
            </p>
          </div>
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
