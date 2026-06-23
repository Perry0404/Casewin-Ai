'use client'

import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { PREDICTIONS_ENABLED } from '@/lib/features'
import { JUSTICE_STACK } from '@/lib/justice-stack'

export default function Home() {
  const features = [
    {
      id: 'draft',
      title: 'Document Drafting',
      icon: '📝',
      description: 'Generate contracts, letters, and pleadings',
      color: 'from-blue-500 to-cyan-500',
      href: '/tools/draft'
    },
    {
      id: 'predict',
      title: 'Case Prediction',
      icon: '🔮',
      description: 'Predict outcomes based on Nigerian case law',
      color: 'from-purple-500 to-pink-500',
      href: '/tools/predict'
    },
    {
      id: 'research',
      title: 'Legal Research',
      icon: '🔍',
      description: 'Search 30,000+ Nigerian judgments',
      color: 'from-green-500 to-emerald-500',
      href: '/tools/research'
    },
    {
      id: 'analyze',
      title: 'Contract Analysis',
      icon: '📄',
      description: 'Identify risks and unfair terms',
      color: 'from-orange-500 to-red-500',
      href: '/tools/analyze'
    },
    {
      id: 'summarize',
      title: 'Judgment Summarization',
      icon: '📋',
      description: 'Summarize lengthy court judgments',
      color: 'from-indigo-500 to-blue-500',
      href: '/tools/summarize'
    },
    {
      id: 'translate',
      title: 'Translation',
      icon: '🌍',
      description: 'Translate to Yoruba, Igbo, Hausa',
      color: 'from-teal-500 to-green-500',
      href: '/tools/translate'
    },
    {
      id: 'arguments',
      title: 'Argument Generation',
      icon: '⚖️',
      description: 'Generate persuasive legal arguments',
      color: 'from-yellow-500 to-orange-500',
      href: '/tools/arguments'
    },
    {
      id: 'compliance',
      title: 'Compliance Check',
      icon: '✅',
      description: 'Check against Nigerian regulations',
      color: 'from-pink-500 to-rose-500',
      href: '/tools/compliance'
    },
    {
      id: 'intelligence',
      title: 'Daily Intelligence',
      icon: '📰',
      description: 'Personalized legal news & regulatory alerts',
      color: 'from-indigo-500 to-purple-500',
      href: '/tools/intelligence'
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
                <h1 className="text-3xl font-bold text-white">CaseWin AI</h1>
                <p className="text-sm text-green-300">Nigerian Legal AI Platform</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/tools" className="text-white hover:text-green-300 transition-colors font-semibold">
                AI Tools
              </Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors font-semibold">
                Hire Lawyers
              </Link>
              {PREDICTIONS_ENABLED && (
                <Link href="/predictions" className="text-gray-300 hover:text-white transition-colors font-semibold">
                  Predictions
                </Link>
              )}
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors font-semibold">
                Pricing
              </Link>
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                Get Started Free
              </Link>
            </nav>
            <div className="md:hidden">
              <MobileNav currentPath="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-2 rounded-full text-sm font-bold">
              🌍 AFRICA&apos;S AI JUSTICE INFRASTRUCTURE
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              From dispute to just outcome
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            CaseWin isn&apos;t just AI for lawyers — it&apos;s the infrastructure that reduces the distance between a dispute and a just outcome. Knowledge, lawyer tools, dispute resolution, and court infrastructure, in one stack.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/auth/signup" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-green-500/50 hover:scale-105 transition">
              🎉 Start Free Trial
            </Link>
            <Link href="/tools" className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition">
              Explore Tools →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={feature.href}
              className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105"
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
                <span className="inline-block w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 bg-white/10 text-white group-hover:bg-white/20 text-center">
                  Try Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The Justice Infrastructure Stack */}
      <section className="relative container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-green-400 font-semibold tracking-widest text-sm uppercase mb-2">The justice infrastructure stack</p>
          <h2 className="text-4xl font-bold text-white">Four layers. One mission.</h2>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Each layer reduces the distance between a dispute and a just outcome.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {JUSTICE_STACK.map((layer) => (
            <Link key={layer.id} href={`/tools#${layer.id}`}
              className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center text-white font-bold`}>
                  {layer.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{layer.title}</h3>
                  <p className="text-gray-500 text-xs">{layer.tagline}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">{layer.description}</p>
              <div className="flex flex-wrap gap-2">
                {layer.tools.slice(0, 4).map((t) => (
                  <span key={t.name} className="bg-white/10 text-gray-300 px-2 py-1 rounded-full text-xs">{t.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Prediction Market Promo */}
      {PREDICTIONS_ENABLED && (
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
                Legal Prediction Markets
              </h2>
              <p className="text-gray-300 mb-6 text-lg">
                Predict outcomes of major Nigerian legal cases and legislative changes. Trade on your legal knowledge and earn real Naira rewards.
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
      )}

      {/* Marketplace Promo */}
      <section className="relative container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-rose-600/20 backdrop-blur-xl rounded-3xl border border-white/20 p-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              🏛️ Legal Marketplace
            </h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              Connect with verified Nigerian lawyers for consultations, case reviews, and legal representation. Pay securely in Naira via bank transfer.
            </p>
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">500+</div>
                <div className="text-sm text-gray-400">Verified Lawyers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">4.8★</div>
                <div className="text-sm text-gray-400">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-400">₦15K</div>
                <div className="text-sm text-gray-400">Avg. Consultation</div>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              Find a Lawyer →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-green-400 mb-2">30,000+</div>
            <div className="text-gray-400">Nigerian Cases</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-blue-400 mb-2">8</div>
            <div className="text-gray-400">AI Tools</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-purple-400 mb-2">1,500+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-pink-400 mb-2">99.2%</div>
            <div className="text-gray-400">Accuracy Rate</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/30 backdrop-blur-xl border-t border-white/10 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-3xl">⚖️</div>
                <h3 className="text-2xl font-bold text-white">CaseWin AI</h3>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered legal platform built for Nigerian lawyers and law students.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">AI Tools</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/tools/draft" className="hover:text-white transition">Document Drafting</Link></li>
                <li><Link href="/tools/predict" className="hover:text-white transition">Case Prediction</Link></li>
                <li><Link href="/tools/research" className="hover:text-white transition">Legal Research</Link></li>
                <li><Link href="/tools/analyze" className="hover:text-white transition">Contract Analysis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/marketplace" className="hover:text-white transition">Lawyer Marketplace</Link></li>
                {PREDICTIONS_ENABLED && (
                  <li><Link href="/predictions" className="hover:text-white transition">Prediction Markets</Link></li>
                )}
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              © 2024 CaseWin AI. Built with 🇳🇬 for Nigerian legal professionals.
            </p>
            <div className="flex justify-center my-6">
              <a href="https://orynth.dev/projects/casewinai" target="_blank" rel="noopener noreferrer">
                <img src="https://orynth.dev/api/badge/casewinai?theme=light&style=default" alt="Featured on Orynth" width={260} height={80} className="hover:opacity-90 transition-opacity" />
              </a>
            </div>
            <div className="flex justify-center gap-8 text-sm text-gray-500 mt-4">
              <span>Payments by ZendFi</span>
              <span>•</span>
              <span>Database by Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
