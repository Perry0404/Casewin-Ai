'use client'

import { useState } from 'react'
import Link from 'next/link'

type DemoStep = 'intro' | 'intelligence-setup' | 'intelligence-result' | 'knowledge-setup' | 'knowledge-upload' | 'knowledge-chat' | 'pricing'

const MOCK_BRIEF_SECTIONS = [
  {
    type: 'legislation',
    icon: '\u{1F4DC}',
    title: 'CAMA Amendment Bill Passes Second Reading',
    summary: 'The Companies and Allied Matters Act amendment bill proposing mandatory ESG reporting for public companies passed second reading at the Senate. Firms with corporate clients should prepare compliance templates.',
    impact: 'high',
    actionItems: ['Review client portfolios for ESG exposure', 'Draft advisory memo for affected clients'],
  },
  {
    type: 'court_decision',
    icon: '\u{2696}\u{FE0F}',
    title: 'Supreme Court Rules on Electronic Evidence Admissibility',
    summary: 'In GTB v. Innoson, the Supreme Court expanded the interpretation of Section 84 of the Evidence Act on electronic records. Authentication requirements have been relaxed for certified bank statements.',
    impact: 'high',
    actionItems: ['Update litigation strategy for pending e-evidence cases'],
  },
  {
    type: 'regulatory',
    icon: '\u{1F3DB}\u{FE0F}',
    title: 'CBN Issues New Foreign Exchange Guidelines',
    summary: 'Central Bank of Nigeria released circular TED/FEM/FPC/GEN/01/015 on documentary credit for imports. New requirements effective from Q2 2026 for all authorized dealers.',
    impact: 'medium',
    actionItems: ['Brief banking & finance clients on new documentary requirements'],
  },
  {
    type: 'compliance',
    icon: '\u{2705}',
    title: 'FIRS Tax Filing Deadline Extended',
    summary: 'Federal Inland Revenue Service extends corporate income tax filing deadline for the 2025 assessment year to May 31, 2026. Penalty waivers available for late filers from the previous quarter.',
    impact: 'medium',
    actionItems: ['Notify clients of extended deadline', 'Review pending tax filings'],
  },
]

const MOCK_CHAT = [
  { role: 'user' as const, content: 'What are our standard terms for commercial lease agreements?' },
  {
    role: 'assistant' as const,
    content: `Based on your firm's uploaded documents, here are your standard commercial lease terms:

**Duration & Renewal:**
- Standard lease period: 3-5 years with option to renew
- Renewal notice: 6 months before expiry
- Rent review: Every 2 years tied to market rate assessment

**Payment Terms:**
- 2 years' rent paid upfront (Lagos standard)
- Service charge: 15% of annual rent, paid quarterly
- Security deposit: 6 months' rent, refundable

**Key Clauses:**
- Permitted use restriction (Clause 4.2)
- Landlord's right of re-entry for non-payment (Clause 8.1)
- Tenant improvement provisions (Clause 12)
- Force majeure clause aligned with COVID-era amendments

*Sources: Standard-Commercial-Lease-Template.txt, Lagos-Property-Guidelines.txt*`,
    sources: ['Standard-Commercial-Lease-Template.txt', 'Lagos-Property-Guidelines.txt'],
  },
  { role: 'user' as const, content: 'What precedents do we have on landlord-tenant disputes in Lagos?' },
  {
    role: 'assistant' as const,
    content: `From your firm's knowledge base, I found 3 relevant precedents:

**1. Adebayo v. Sterling Properties Ltd (2024)**
- High Court Lagos, Suit No: LD/1234/2024
- Issue: Wrongful eviction during valid lease
- Outcome: Damages of \u20A625M awarded to tenant
- Key takeaway: Landlord must follow Recovery of Premises Act procedures

**2. Greenfield Estates v. OmniCorp (2023)**
- Court of Appeal Lagos Division
- Issue: Validity of rent escalation clause
- Outcome: Court upheld 25% escalation cap as reasonable
- Key takeaway: Escalation clauses must be "commercially reasonable"

**3. MegaMall Ltd v. Fashion Hub (2023)**
- Issue: Service charge disputes in commercial property
- Outcome: Tribunal ordered detailed service charge breakdown

*Sources: Case-Briefs-2024.txt, Litigation-Precedents.txt*`,
    sources: ['Case-Briefs-2024.txt', 'Litigation-Precedents.txt'],
  },
]

export default function LawyerDemoPage() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Corporate & Commercial', 'Banking & Finance'])
  const [briefLoading, setBriefLoading] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const [chatIndex, setChatIndex] = useState(0)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploading, setUploading] = useState(false)

  const simulateGenerateBrief = () => {
    setBriefLoading(true)
    setTimeout(() => {
      setBriefLoading(false)
      setShowBrief(true)
      setCurrentStep('intelligence-result')
    }, 2500)
  }

  const simulateUpload = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setUploadDone(true)
    }, 1800)
  }

  const impactColors: Record<string, string> = {
    high: 'bg-red-600/20 text-red-400 border border-red-500/30',
    medium: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
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
              <span className="bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-sm font-semibold">
                Interactive Demo
              </span>
              <Link href="/for-lawyers" className="text-gray-300 hover:text-white transition text-sm">
                Full Guide
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition text-sm">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          {[
            { id: 'intro', label: 'Overview' },
            { id: 'intelligence-setup', label: 'Intelligence Brief' },
            { id: 'intelligence-result', label: 'Brief Results' },
            { id: 'knowledge-setup', label: 'Knowledge Agent' },
            { id: 'knowledge-upload', label: 'Train Agent' },
            { id: 'knowledge-chat', label: 'Chat with Agent' },
            { id: 'pricing', label: 'Get Started' },
          ].map((step, i, arr) => {
            const stepOrder = arr.map(s => s.id)
            const current = stepOrder.indexOf(currentStep)
            const thisIndex = i
            const isActive = currentStep === step.id
            const isDone = thisIndex < current

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id as DemoStep)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive ? 'bg-green-600/30 text-green-400 border border-green-500/30' :
                    isDone ? 'text-green-400/70' : 'text-gray-500'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    isActive ? 'bg-green-600 text-white border-green-500' :
                    isDone ? 'bg-green-600/30 text-green-400 border-green-500/50' : 'border-gray-600 text-gray-500'
                  }`}>
                    {isDone ? '\u2713' : i + 1}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                </button>
                {i < arr.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${isDone ? 'bg-green-500/50' : 'bg-gray-700'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        {currentStep === 'intro' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Premium Automation Tools for Lawyers</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                See how CaseWin AI&apos;s premium automation tools can save your firm hours every day.
                This interactive demo walks you through both tools — no account needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-3xl mb-4">
                  {'\u{1F4F0}'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Daily Intelligence Brief</h2>
                <p className="text-gray-400 mb-4">
                  AI-curated Nigerian legal updates personalized to your practice areas.
                  Legislation changes, court decisions, regulatory alerts — delivered daily.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Personalized to your practice areas</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Impact ratings (high/medium/low)</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Action items for each update</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Market insights & deadline tracking</span></li>
                </ul>
                <button
                  onClick={() => setCurrentStep('intelligence-setup')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition w-full"
                >
                  Try Intelligence Brief Demo {'\u2192'}
                </button>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-3xl mb-4">
                  {'\u{1F9E0}'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Firm Knowledge Agent</h2>
                <p className="text-gray-400 mb-4">
                  Upload your firm&apos;s documents and build a private AI that knows your templates,
                  precedents, and policies. Your firm&apos;s institutional memory — searchable by AI.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Upload contracts, briefs, policies</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Ask questions in natural language</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Answers cite your own documents</span></li>
                  <li className="flex items-center space-x-2"><span className="text-green-400">{'\u2713'}</span><span>Up to 10 team members per firm</span></li>
                </ul>
                <button
                  onClick={() => setCurrentStep('knowledge-setup')}
                  className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition w-full"
                >
                  Try Knowledge Agent Demo {'\u2192'}
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-500 text-sm">All other AI tools (Case Search, Document Drafting, Contract Analysis, etc.) are 100% free.</p>
            </div>
          </div>
        )}

        {currentStep === 'intelligence-setup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">{'\u{1F4F0}'}</span>
              <h2 className="text-3xl font-bold text-white mb-2">Daily Intelligence Brief</h2>
              <p className="text-gray-400">Step 1: Select your practice areas to personalize your daily brief</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Your Practice Areas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Corporate & Commercial', 'Litigation & Dispute Resolution', 'Real Estate & Property', 'Banking & Finance', 'Oil & Gas / Energy', 'Tax Law', 'Intellectual Property', 'Employment & Labour'].map(area => (
                  <button
                    key={area}
                    onClick={() => setSelectedAreas(prev =>
                      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                    )}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                      selectedAreas.includes(area)
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={simulateGenerateBrief}
              disabled={briefLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              {briefLoading ? (
                <span className="flex items-center justify-center space-x-3">
                  <span className="animate-spin">{'\\u{1F4F0}'}</span>
                  <span>Generating your brief...</span>
                </span>
              ) : 'Generate My Intelligence Brief'}
            </button>

            {briefLoading && (
              <div className="text-center">
                <p className="text-gray-400 text-sm">Scanning Nigerian legal landscape, court decisions, legislation...</p>
                <div className="mt-3 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'intelligence-result' && showBrief && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">Your Daily Intelligence Brief</h2>
              <p className="text-gray-400 text-sm">Here&apos;s what a real brief looks like — generated from live AI analysis</p>
            </div>

            {/* Headline */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-purple-500/30">
              <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">{'\u{1F4E2}'} Top Story</span>
              <h3 className="text-xl font-bold text-white mt-1">CAMA Amendment Bill Could Reshape Corporate Compliance Requirements for Nigerian Firms</h3>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {MOCK_BRIEF_SECTIONS.map((section, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{section.icon}</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase">{section.type.replace('_', ' ')}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${impactColors[section.impact]}`}>
                      {section.impact.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{section.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{section.summary}</p>
                  <div className="bg-gray-900/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-400 mb-1 uppercase">Action Required</p>
                    {section.actionItems.map((item, j) => (
                      <p key={j} className="text-sm text-gray-300 flex items-start space-x-2">
                        <span className="text-purple-400">{'\u2192'}</span><span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 text-center">
              <p className="text-gray-400 text-sm mb-3">This is generated fresh daily. In production, you&apos;ll get real-time Nigerian legal updates.</p>
              <button
                onClick={() => setCurrentStep('knowledge-setup')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Next: See Knowledge Agent {'\u2192'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'knowledge-setup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">{'\u{1F9E0}'}</span>
              <h2 className="text-3xl font-bold text-white mb-2">Firm Knowledge Agent</h2>
              <p className="text-gray-400">Your firm&apos;s private AI assistant — trained on your own documents</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-4">
                {[
                  { step: 1, icon: '\u{1F4C4}', title: 'Upload Your Documents', desc: 'Contract templates, case briefs, policies, research memos — any firm document in .txt, .md, or .csv format' },
                  { step: 2, icon: '\u{1F9E0}', title: 'AI Processes & Indexes', desc: 'Documents are chunked into searchable segments. The AI learns your firm\'s terminology, clauses, and precedents.' },
                  { step: 3, icon: '\u{1F4AC}', title: 'Chat with Your Knowledge Base', desc: 'Ask natural language questions. Get answers that cite your own documents. Share across your team.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Step {item.step}: {item.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('knowledge-upload')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              See Upload Demo {'\u2192'}
            </button>
          </div>
        )}

        {currentStep === 'knowledge-upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Training Your Agent</h2>
              <p className="text-gray-400">Upload documents to build your firm&apos;s knowledge base</p>
            </div>

            {/* Category Selection Demo */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">1. Select Document Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { icon: '\u{1F4DD}', label: 'Contract Templates', active: true },
                  { icon: '\u{2696}\u{FE0F}', label: 'Case Precedents', active: false },
                  { icon: '\u{1F4CB}', label: 'Firm Policies', active: false },
                  { icon: '\u{1F4DA}', label: 'Legal Research', active: false },
                ].map((cat, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-center ${
                    cat.active ? 'bg-green-600/20 border-green-500 text-white' : 'bg-gray-700/30 border-gray-600 text-gray-400'
                  }`}>
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-xs font-medium mt-1">{cat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Demo */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-dashed border-emerald-500/30 text-center">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">2. Upload Document</h3>
              {!uploadDone ? (
                <>
                  <span className="text-5xl block mb-3">{'\u{1F4C4}'}</span>
                  <p className="text-gray-400 text-sm mb-4">In the real tool, you&apos;d select a .txt, .md, or .csv file here</p>
                  <button
                    onClick={simulateUpload}
                    disabled={uploading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    {uploading ? 'Processing Standard-NDA-Template.txt...' : 'Simulate Upload: Standard-NDA-Template.txt'}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-5xl block mb-3">{'\u{2705}'}</span>
                  <p className="text-green-400 font-semibold mb-1">Upload Successful!</p>
                  <p className="text-gray-400 text-sm">Standard-NDA-Template.txt — 12 chunks stored in knowledge base</p>
                </>
              )}
            </div>

            {/* Training Status Demo */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Agent Training Status</h3>
                <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-semibold">
                  Basic Training
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-full h-3" style={{ width: uploadDone ? '30%' : '10%' }} />
              </div>
              <p className="text-gray-400 text-sm">{uploadDone ? '3' : '2'} documents &bull; Upload at least 10 for best results</p>
            </div>

            <button
              onClick={() => setCurrentStep('knowledge-chat')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              See Chat Demo {'\u2192'}
            </button>
          </div>
        )}

        {currentStep === 'knowledge-chat' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Chat with Your Knowledge Base</h2>
              <p className="text-gray-400">Ask questions — the AI answers using your firm&apos;s own documents</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-emerald-500/20 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-emerald-800/30 px-6 py-3 border-b border-emerald-500/20 flex items-center space-x-3">
                <span className="text-xl">{'\u{1F9E0}'}</span>
                <div>
                  <p className="text-white font-semibold text-sm">Knowledge Agent — Aluko & Oyebode</p>
                  <p className="text-gray-400 text-xs">5 documents in knowledge base</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {MOCK_CHAT.slice(0, chatIndex + 1).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-green-600/30 border border-green-500/30 text-white'
                        : 'bg-gray-700/30 border border-gray-600/50 text-gray-200'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      {'sources' in msg && msg.sources && (
                        <div className="mt-2 pt-2 border-t border-gray-600/30">
                          <p className="text-xs text-gray-500">Sources: {msg.sources.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Message Button */}
              <div className="px-6 py-4 border-t border-gray-700/50">
                {chatIndex < MOCK_CHAT.length - 1 ? (
                  <button
                    onClick={() => setChatIndex(prev => Math.min(prev + 1, MOCK_CHAT.length - 1))}
                    className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg text-sm font-medium transition"
                  >
                    {chatIndex % 2 === 0 ? 'Show AI Response \u2193' : 'Next Question \u2192'}
                  </button>
                ) : (
                  <p className="text-center text-gray-500 text-sm">End of demo conversation</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('pricing')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition text-lg"
            >
              Ready to Get Started? {'\u2192'}
            </button>
          </div>
        )}

        {currentStep === 'pricing' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Get Started Today</h2>
              <p className="text-gray-400">All basic AI tools are free. Premium automation starts at $20/month.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-bold text-white mb-1">Individual Lawyer</h3>
                <p className="text-3xl font-bold text-white mb-1">$20<span className="text-lg text-gray-400">/mo</span></p>
                <p className="text-gray-500 text-sm mb-4">{'\u20A6'}32,000/month</p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li>{'\u2713'} All Free AI Tools</li>
                  <li>{'\u2713'} Daily Intelligence Brief</li>
                  <li>{'\u2713'} Unlimited AI Queries</li>
                  <li>{'\u2713'} Priority Processing</li>
                </ul>
                <Link href="/pricing" className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition">
                  Subscribe Now
                </Link>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/30 ring-2 ring-emerald-500/20">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white">Law Firm</h3>
                  <span className="bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-2 py-1 rounded">BEST VALUE</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">$30<span className="text-lg text-gray-400">/mo</span></p>
                <p className="text-gray-500 text-sm mb-4">{'\u20A6'}48,000/month</p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li>{'\u2713'} Everything in Individual</li>
                  <li>{'\u2713'} Firm Knowledge Agent</li>
                  <li>{'\u2713'} Up to 10 User Seats</li>
                  <li>{'\u2713'} Firm-wide Analytics</li>
                </ul>
                <Link href="/pricing" className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition">
                  Subscribe Now
                </Link>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Link href="/for-lawyers" className="text-green-400 hover:text-green-300 text-sm font-medium">
                Read full guide: How Premium Automation Works {'\u2192'}
              </Link>
              <p className="text-gray-500 text-sm">
                Questions? Email us at support@casewinai.com
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
