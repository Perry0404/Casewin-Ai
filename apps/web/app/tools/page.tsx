'use client'

import Link from 'next/link'

const tools = [
  {
    id: 'draft',
    title: 'Document Drafting',
    icon: '??',
    description: 'Generate contracts, letters, pleadings, and other legal documents',
    color: 'from-blue-500 to-cyan-500',
    href: '/tools/draft',
    features: ['Contracts', 'Letters', 'Affidavits', 'Pleadings'],
  },
  {
    id: 'predict',
    title: 'Case Prediction',
    icon: '??',
    description: 'Predict case outcomes based on Nigerian case law analysis',
    color: 'from-green-500 to-emerald-500',
    href: '/tools/predict',
    features: ['Win Probability', 'Similar Cases', 'Risk Analysis'],
  },
  {
    id: 'research',
    title: 'Legal Research',
    icon: '??',
    description: 'Search through 10,000+ Nigerian court judgments',
    color: 'from-green-500 to-emerald-500',
    href: '/tools/research',
    features: ['Case Search', 'Statute Lookup', 'Legal Principles'],
  },
  {
    id: 'analyze',
    title: 'Contract Analysis',
    icon: '??',
    description: 'Identify risks, unfair terms, and compliance issues',
    color: 'from-orange-500 to-red-500',
    href: '/tools/analyze',
    features: ['Risk Assessment', 'Clause Review', 'Recommendations'],
  },
  {
    id: 'summarize',
    title: 'Judgment Summarization',
    icon: '??',
    description: 'Extract key points from lengthy court judgments',
    color: 'from-green-500 to-blue-500',
    href: '/tools/summarize',
    features: ['Facts', 'Issues', 'Ratio Decidendi'],
  },
  {
    id: 'translate',
    title: 'Legal Translation',
    icon: '??',
    description: 'Translate documents to Yoruba, Igbo, Hausa',
    color: 'from-teal-500 to-green-500',
    href: '/tools/translate',
    features: ['Yoruba', 'Igbo', 'Hausa', 'Pidgin'],
  },
  {
    id: 'arguments',
    title: 'Argument Generation',
    icon: '??',
    description: 'Generate persuasive legal arguments with authorities',
    color: 'from-yellow-500 to-orange-500',
    href: '/tools/arguments',
    features: ['Main Arguments', 'Counter-Arguments', 'Authorities'],
  },
  {
    id: 'compliance',
    title: 'Compliance Check',
    icon: '?',
    description: 'Check documents against Nigerian regulations',
    color: 'from-emerald-500 to-rose-500',
    href: '/tools/compliance',
    features: ['CAMA', 'NDPR', 'CBN', 'Tax Laws'],
  },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">??</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-4 text-sm">
              <Link href="/predictions" className="text-gray-300 hover:text-white transition">
                Predictions
              </Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition">
                Marketplace
              </Link>
              <Link href="/auth/login" className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-800/50 to-emerald-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ??? AI Legal Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful AI tools designed specifically for Nigerian legal practice
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              <div className={`bg-gradient-to-r ${tool.color} p-6`}>
                <span className="text-5xl">{tool.icon}</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition">
                  {tool.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature) => (
                    <span key={feature} className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="flex items-center text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Try Now</span>
                  <span className="ml-1">?</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Lawyer Tools CTA */}
        <div className="mt-16 bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-green-500/20 max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-3">??</div>
          <h2 className="text-2xl font-bold text-white mb-3">Lawyer & Firm Tools</h2>
          <p className="text-gray-400 mb-6">
            Verified lawyers get access to 11 professional tools — Time & Billing, Case Manager, Hearing Prep, AI Chatbot, Daily Intelligence Brief, and more.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <span className="mr-2">??</span>
            View Lawyer Tools on Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}
