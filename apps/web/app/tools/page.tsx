'use client'

import Link from 'next/link'

const tools = [
  {
    id: 'draft',
    title: 'Document Drafting',
    icon: '📝',
    description: 'Generate contracts, letters, pleadings, and other legal documents',
    color: 'from-blue-500 to-cyan-500',
    href: '/tools/draft',
    features: ['Contracts', 'Letters', 'Affidavits', 'Pleadings']
  },
  {
    id: 'predict',
    title: 'Case Prediction',
    icon: '🔮',
    description: 'Predict case outcomes based on Nigerian case law analysis',
    color: 'from-purple-500 to-pink-500',
    href: '/tools/predict',
    features: ['Win Probability', 'Similar Cases', 'Risk Analysis']
  },
  {
    id: 'research',
    title: 'Legal Research',
    icon: '🔍',
    description: 'Search through 10,000+ Nigerian court judgments',
    color: 'from-green-500 to-emerald-500',
    href: '/tools/research',
    features: ['Case Search', 'Statute Lookup', 'Legal Principles']
  },
  {
    id: 'analyze',
    title: 'Contract Analysis',
    icon: '📄',
    description: 'Identify risks, unfair terms, and compliance issues',
    color: 'from-orange-500 to-red-500',
    href: '/tools/analyze',
    features: ['Risk Assessment', 'Clause Review', 'Recommendations']
  },
  {
    id: 'summarize',
    title: 'Judgment Summarization',
    icon: '📋',
    description: 'Extract key points from lengthy court judgments',
    color: 'from-indigo-500 to-blue-500',
    href: '/tools/summarize',
    features: ['Facts', 'Issues', 'Ratio Decidendi']
  },
  {
    id: 'translate',
    title: 'Legal Translation',
    icon: '🌍',
    description: 'Translate documents to Yoruba, Igbo, Hausa',
    color: 'from-teal-500 to-green-500',
    href: '/tools/translate',
    features: ['Yoruba', 'Igbo', 'Hausa', 'Pidgin']
  },
  {
    id: 'arguments',
    title: 'Argument Generation',
    icon: '⚖️',
    description: 'Generate persuasive legal arguments with authorities',
    color: 'from-yellow-500 to-orange-500',
    href: '/tools/arguments',
    features: ['Main Arguments', 'Counter-Arguments', 'Authorities']
  },
  {
    id: 'compliance',
    title: 'Compliance Check',
    icon: '✅',
    description: 'Check documents against Nigerian regulations',
    color: 'from-pink-500 to-rose-500',
    href: '/tools/compliance',
    features: ['CAMA', 'NDPR', 'CBN', 'Tax Laws']
  },
  {
    id: 'deadlines',
    title: 'Deadline Calculator',
    icon: '📅',
    description: 'AI calculates statutory deadlines and limitation periods for Nigerian courts',
    color: 'from-violet-500 to-purple-500',
    href: '/tools/deadlines',
    features: ['Limitation Periods', 'Filing Dates', 'Court Rules']
  },
  {
    id: 'billing',
    title: 'Time & Billing',
    icon: '💰',
    description: 'Track billable hours, manage rates, and generate invoices with AI',
    color: 'from-emerald-500 to-teal-500',
    href: '/tools/billing',
    features: ['Timer', 'Invoicing', 'Rate Tracking']
  },
  {
    id: 'cases',
    title: 'Case Manager',
    icon: '📁',
    description: 'Track active cases with suit numbers, courts, parties, and dates',
    color: 'from-amber-500 to-yellow-500',
    href: '/tools/cases',
    features: ['Active Cases', 'Court Dates', 'Status Tracking']
  },
  {
    id: 'filing',
    title: 'Court Filing Prep',
    icon: '📝',
    description: 'Get filing checklists, formatting rules, and fees for Nigerian courts',
    color: 'from-cyan-500 to-sky-500',
    href: '/tools/filing',
    features: ['Checklists', 'Format Rules', 'Fee Schedules']
  },
  {
    id: 'citations',
    title: 'Citation Generator',
    icon: '📚',
    description: 'Format Nigerian legal citations in NWLR, LPELR, SC, and more',
    color: 'from-indigo-500 to-violet-500',
    href: '/tools/citations',
    features: ['NWLR', 'LPELR', 'Batch Format']
  },
  {
    id: 'chatbot',
    title: 'AI Legal Chatbot',
    icon: '🤖',
    description: 'Chat with AI about any Nigerian legal question — statutes, case law, and procedures',
    color: 'from-blue-500 to-indigo-500',
    href: '/tools/chatbot',
    features: ['Conversational', 'Nigerian Law', 'Real-time']
  },
  {
    id: 'fees',
    title: 'Legal Fee Estimator',
    icon: '💸',
    description: 'AI estimates legal fees by matter type, court, and complexity using NBA scales',
    color: 'from-rose-500 to-pink-500',
    href: '/tools/fees',
    features: ['Fee Breakdown', 'Court Fees', 'VAT']
  },
  {
    id: 'hearing-prep',
    title: 'Hearing Prep Assistant',
    icon: '🎯',
    description: 'AI generates examination questions, cross-exam strategies, and court prep',
    color: 'from-violet-500 to-fuchsia-500',
    href: '/tools/hearing-prep',
    features: ['Exam-in-Chief', 'Cross-Exam', 'Objections']
  },
  {
    id: 'clauses',
    title: 'Clause Library',
    icon: '📚',
    description: 'Save, search, and reuse Nigerian legal clauses with AI generation',
    color: 'from-sky-500 to-blue-500',
    href: '/tools/clauses',
    features: ['Save & Reuse', 'AI Generate', 'Nigerian Law']
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
              <span className="text-2xl">⚖️</span>
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
            🛠️ AI Legal Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful AI tools designed specifically for Nigerian legal practice
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${tool.color} p-6`}>
                <span className="text-5xl">{tool.icon}</span>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition">
                  {tool.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature) => (
                    <span
                      key={feature}
                      className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 pb-5">
                <div className="flex items-center text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Try Now</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-green-500/20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
            <p className="text-gray-400 mb-6">
              Not sure which tool is right for your legal matter? Our AI can guide you to the right solution.
            </p>
            <Link
              href="/"
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <span className="mr-2">🤖</span>
              Ask CaseWin AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
