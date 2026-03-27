'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    {
      id: 'draft',
      title: 'Document Drafting',
      icon: '📝',
      description: 'Generate contracts, letters, and pleadings',
      color: 'from-blue-500 to-cyan-500',
      endpoint: '/api/draft'
    },
    {
      id: 'predict',
      title: 'Case Prediction',
      icon: '🔮',
      description: 'Predict outcomes based on Nigerian case law',
      color: 'from-green-500 to-emerald-500',
      endpoint: '/api/predict'
    },
    {
      id: 'research',
      title: 'Legal Research',
      icon: '🔍',
      description: 'Search 10,000+ Nigerian judgments',
      color: 'from-green-500 to-emerald-500',
      endpoint: '/api/research'
    },
    {
      id: 'analyze',
      title: 'Contract Analysis',
      icon: '📄',
      description: 'Identify risks and unfair terms',
      color: 'from-orange-500 to-red-500',
      endpoint: '/api/analyze-contract'
    },
    {
      id: 'summarize',
      title: 'Judgment Summarization',
      icon: '📋',
      description: 'Summarize lengthy court judgments',
      color: 'from-blue-500 to-green-500',
      endpoint: '/api/summarize'
    },
    {
      id: 'translate',
      title: 'Translation',
      icon: '🌍',
      description: 'Translate to Yoruba, Igbo, Hausa',
      color: 'from-teal-500 to-green-500',
      endpoint: '/api/translate'
    },
    {
      id: 'arguments',
      title: 'Argument Generation',
      icon: '⚖️',
      description: 'Generate persuasive legal arguments',
      color: 'from-yellow-500 to-orange-500',
      endpoint: '/api/generate-arguments'
    },
    {
      id: 'compliance',
      title: 'Compliance Check',
      icon: '✅',
      description: 'Check against Nigerian regulations',
      color: 'from-emerald-500 to-green-500',
      endpoint: '/api/compliance-check'
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header with Navigation */}
      <header className="relative bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-4xl">⚖️</div>
              <div>
                <h1 className="text-3xl font-bold text-white">CaseWin-NG</h1>
                <p className="text-sm text-green-300">AI-Powered Legal Platform</p>
              </div>
            </Link>
            <MobileNav currentPath="/" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-2 rounded-full text-sm font-bold animate-pulse">
              ✨ POWERED BY GROK AI
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-green-400">
              8 AI-Powered Legal Tools
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your legal practice with cutting-edge AI. Research cases, draft documents, predict outcomes, and more - all powered by 10,000+ Nigerian case law database.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/predictions" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-green-500/50 hover:scale-105 transition-transform">
              Start Predicting →
            </Link>
            <Link href="/marketplace" className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-full font-semibold border border-white/20 hover:bg-white/20 transition-colors">
              Hire a Lawyer
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105"
              onClick={() => setActiveFeature(feature.id)}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {feature.description}
                </p>
                <button className="w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 bg-white/10 text-white hover:bg-white/20">
                  Try Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prediction Market Promo */}
      <section className="relative container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-green-600/20 backdrop-blur-xl rounded-3xl border border-white/20 p-12 hover:border-green-500/50 transition-all">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-4 py-2 rounded-full text-sm font-bold">
                  🔥 NEW FEATURE
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Prediction Markets
              </h2>
              <p className="text-gray-300 mb-6 text-lg">
                Predict sports, crypto, entertainment, politics & legal outcomes. Trade on your knowledge and earn real money.
              </p>
              <div className="flex gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-green-400">₦2.2M</div>
                  <div className="text-sm text-gray-400">Trading Volume</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400">1,247</div>
                  <div className="text-sm text-gray-400">Active Traders</div>
                </div>
              </div>
              <Link
                href="/predictions"
                className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105"
              >
                Start Trading →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-green-400 text-2xl font-bold mb-2">73%</div>
                <div className="text-white font-semibold text-sm mb-1">Supreme Court Electoral Reform</div>
                <div className="text-gray-400 text-xs">5 days left</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-red-400 text-2xl font-bold mb-2">45%</div>
                <div className="text-white font-semibold text-sm mb-1">Land Use Act Amendment</div>
                <div className="text-gray-400 text-xs">180 days left</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-blue-400 text-2xl font-bold mb-2">82%</div>
                <div className="text-white font-semibold text-sm mb-1">CBN Crypto Regulations</div>
                <div className="text-gray-400 text-xs">80 days left</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-yellow-400 text-2xl font-bold mb-2">67%</div>
                <div className="text-white font-semibold text-sm mb-1">EFCC Appeal Case</div>
                <div className="text-gray-400 text-xs">115 days left</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-green-400 mb-2">10,000+</div>
            <div className="text-gray-400">Nigerian Cases</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-blue-400 mb-2">8</div>
            <div className="text-gray-400">AI Tools</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-green-400 mb-2">1,500+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-emerald-400 mb-2">99.2%</div>
            <div className="text-gray-400">Accuracy Rate</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/30 backdrop-blur-xl border-t border-white/10 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="text-3xl">⚖️</div>
              <h3 className="text-2xl font-bold text-white">CaseWin-NG</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Built with 🇳🇬 for Nigerian law students and professionals
            </p>
            
            {/* Featured on Orynth Badge */}
            <div className="flex justify-center mb-6">
              <a href="https://orynth.dev/projects/casewinai" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://orynth.dev/api/badge/casewinai?theme=light&style=default" 
                  alt="Featured on Orynth" 
                  width="260" 
                  height="80"
                  className="hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
            
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>Powered by Grok AI</span>
              <span>•</span>
              <span>Qdrant Vector Search</span>
              <span>•</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
