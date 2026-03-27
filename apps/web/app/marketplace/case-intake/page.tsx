'use client'

import { useState } from 'react'
import Link from 'next/link'
import LawyerGuard from '@/components/LawyerGuard'

interface AIAnalysis {
  specializations: string[]
  complexity: string
  experienceLevel: string
  keyFactors: string[]
  priorityActions: string[]
  estimatedTimeline: string
  riskAssessment: string
  summary: string
}

interface DocTemplate {
  id: string
  name: string
}

export default function CaseIntakePage() {
  const [step, setStep] = useState(1)
  const [caseDescription, setCaseDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [docTemplates] = useState<DocTemplate[]>([
    { id: 'demand_letter', name: 'Legal Demand Letter' },
    { id: 'affidavit', name: 'Sworn Affidavit' },
    { id: 'nda', name: 'Non-Disclosure Agreement' },
    { id: 'employment', name: 'Employment Contract' },
    { id: 'tenancy', name: 'Tenancy Agreement' },
    { id: 'partnership', name: 'Partnership Agreement' },
    { id: 'power_of_attorney', name: 'Power of Attorney' },
    { id: 'memorandum', name: 'MOU' },
    { id: 'sale_agreement', name: 'Sale Agreement' },
    { id: 'service_agreement', name: 'Service Agreement' },
  ])
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null)
  const [generatingDoc, setGeneratingDoc] = useState(false)

  const analyzeCase = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseDescription, budget, urgency, location }),
      })
      const data = await res.json()
      if (data.success) {
        setAnalysis(data.analysis)
        setStep(2)
      }
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateDocument = async (templateId: string) => {
    setGeneratingDoc(true)
    setGeneratedDoc(null)
    try {
      const res = await fetch('/api/marketplace/auto-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: templateId,
          details: { caseDescription, location, parties: 'To be specified' },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedDoc(data.document.content)
        setStep(3)
      }
    } catch (err) {
      console.error('Document generation failed:', err)
    } finally {
      setGeneratingDoc(false)
    }
  }

  return (
    <LawyerGuard>
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            CaseWin <span className="text-green-500">AI</span>
          </Link>
          <nav className="flex gap-6">
            <Link href="/marketplace" className="text-gray-300 hover:text-white transition">Marketplace</Link>
            <Link href="/marketplace/case-intake" className="text-white font-semibold underline">AI Case Intake</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-4">
          {['Describe Case', 'AI Analysis', 'Documents'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? 'bg-green-600' : step === i + 1 ? 'bg-green-500 ring-4 ring-green-500/30' : 'bg-gray-700'
              }`}>
                {step > i + 1 ? '\u2713' : i + 1}
              </div>
              <span className={step === i + 1 ? 'text-white font-medium' : 'text-gray-500'}>{label}</span>
              {i < 2 && <div className={`w-16 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Case Description */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-2">Describe Your Legal Issue</h2>
            <p className="text-gray-400 mb-6">Our AI will analyze your case and match you with the right lawyer.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">What is your legal issue? *</label>
                <textarea
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                  placeholder="E.g. My landlord is refusing to return my security deposit after I moved out. The tenancy agreement says the deposit should be returned within 30 days..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Budget Range</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="">Select budget</option>
                    <option value="under-50k">Under NGN 50,000</option>
                    <option value="50k-200k">NGN 50,000 - 200,000</option>
                    <option value="200k-500k">NGN 200,000 - 500,000</option>
                    <option value="500k-1m">NGN 500,000 - 1,000,000</option>
                    <option value="above-1m">Above NGN 1,000,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="low">Low - No deadline</option>
                    <option value="normal">Normal - Within weeks</option>
                    <option value="high">High - Within days</option>
                    <option value="critical">Critical - Immediate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    placeholder="e.g. Lagos, Abuja"
                  />
                </div>
              </div>

              <button
                onClick={analyzeCase}
                disabled={!caseDescription || loading}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {loading ? 'Analyzing with AI...' : 'Analyze My Case'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {step === 2 && analysis && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">AI Case Analysis</h2>
              <p className="text-gray-300 mb-6">{analysis.summary}</p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Complexity</div>
                  <div className={`text-lg font-bold ${
                    analysis.complexity === 'simple' ? 'text-green-400' :
                    analysis.complexity === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{analysis.complexity?.toUpperCase()}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Recommended Experience</div>
                  <div className="text-lg font-bold text-blue-400">{analysis.experienceLevel?.toUpperCase()}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Est. Timeline</div>
                  <div className="text-lg font-bold text-green-400">{analysis.estimatedTimeline}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Recommended Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.specializations?.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">{s}</span>
                  ))}
                </div>
              </div>

              {analysis.priorityActions && analysis.priorityActions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Priority Actions</h3>
                  <ul className="space-y-2">
                    {analysis.priorityActions.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <span className="text-green-500 mt-1">&#x2192;</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.riskAssessment && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-300 text-sm">
                  <strong>Risk Assessment:</strong> {analysis.riskAssessment}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Link
                  href={`/marketplace?specialization=${encodeURIComponent(analysis.specializations?.[0] || '')}`}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-green-700 transition"
                >
                  Find Matching Lawyers
                </Link>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                >
                  Edit Case
                </button>
              </div>
            </div>

            {/* Document Generation */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-2">Auto-Generate Documents</h2>
              <p className="text-gray-400 mb-6">Generate draft legal documents tailored to your case. These are starting points - have a lawyer review before use.</p>

              <div className="grid md:grid-cols-2 gap-3">
                {docTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => generateDocument(template.id)}
                    disabled={generatingDoc}
                    className="text-left p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition border border-gray-600 hover:border-green-500/50 disabled:opacity-50"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-400 mt-1">Auto-generate with AI</div>
                  </button>
                ))}
              </div>

              {generatingDoc && (
                <div className="mt-4 text-center text-gray-400">
                  <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Generating document...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generated Document */}
        {step === 3 && generatedDoc && (
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Generated Document</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(generatedDoc); }}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300 max-h-[600px] overflow-y-auto">
              {generatedDoc}
            </div>

            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-300 text-sm">
              <strong>Disclaimer:</strong> This AI-generated document is for reference only. Please have it reviewed by a qualified Nigerian lawyer before use.
            </div>

            <Link
              href={`/marketplace?specialization=${encodeURIComponent(analysis?.specializations?.[0] || '')}`}
              className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Hire a Lawyer to Review
            </Link>
          </div>
        )}
      </main>
    </div>
    </LawyerGuard>
  )
}
