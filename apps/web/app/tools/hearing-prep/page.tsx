'use client'

import { useState } from 'react'
import Link from 'next/link'

const caseTypes = ['Civil Litigation', 'Criminal Trial', 'Election Petition', 'Fundamental Rights', 'Land Dispute', 'Commercial Dispute', 'Labour/Employment', 'Family/Divorce', 'Tax Appeal', 'Arbitration']
const roles = ['Counsel for Plaintiff/Claimant', 'Counsel for Defendant/Respondent', 'Counsel for Prosecution', 'Counsel for Accused', 'Amicus Curiae']

export default function HearingPrepPage() {
  const [caseType, setCaseType] = useState('')
  const [role, setRole] = useState('')
  const [witnessName, setWitnessName] = useState('')
  const [caseDetails, setCaseDetails] = useState('')
  const [objectives, setObjectives] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('preparation')

  const handleGenerate = async () => {
    if (!caseType || !caseDetails) { setError('Case type and details are required'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/hearing-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, role, witnessName, caseDetails, objectives }),
      })
      const data = await res.json()
      if (data.success) { setResult(data.result); setActiveSection('preparation') }
      else setError(data.error || 'Failed')
    } catch (_e) { setError('Network error') }
    finally { setIsLoading(false) }
  }

  const sections = [
    { id: 'preparation', label: '📋 Prep', key: 'preparation' },
    { id: 'examination', label: '🔎 Exam-in-Chief', key: 'examinationInChief' },
    { id: 'cross', label: '⚔️ Cross-Exam', key: 'crossExamination' },
    { id: 'objections', label: '🛑 Objections', key: 'objectionsToWatch' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⚖️</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center"><span className="text-xl">🎯</span></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hearing Prep Assistant</h1>
            <p className="text-gray-600 text-xs sm:text-sm">AI generates examination questions, objections, and court appearance prep</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Case Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type *</label>
                <select value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select...</option>
                  {caseTypes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select...</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witness Name</label>
                <input value={witnessName} onChange={e => setWitnessName(e.target.value)} placeholder="Name of witness to examine" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Details *</label>
                <textarea rows={4} value={caseDetails} onChange={e => setCaseDetails(e.target.value)} placeholder="Facts of the case, issues in dispute, evidence available..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
                <textarea rows={2} value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="What do you want to achieve?" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleGenerate} disabled={isLoading}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 text-sm sm:text-base">
                {isLoading ? 'Preparing...' : '🎯 Prepare for Hearing'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isLoading && (
              <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
                <span className="text-4xl sm:text-5xl mb-4 block">🎯</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Court Hearing Preparation</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Enter your case details and AI will generate examination questions, cross-examination strategies, potential objections, and court etiquette guidance.</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div className="flex gap-1 overflow-x-auto bg-white rounded-xl border p-1">
                  {sections.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeSection === s.id ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {activeSection === 'preparation' && result.preparation && (
                  <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
                    {result.preparation.courtEtiquette && (
                      <div><h4 className="font-semibold text-gray-900 mb-2 text-sm">Court Etiquette</h4>
                        <ul className="space-y-1">{result.preparation.courtEtiquette.map((t: string, i: number) => <li key={i} className="text-xs sm:text-sm text-gray-700 flex gap-2"><span className="text-green-500 flex-shrink-0">✓</span>{t}</li>)}</ul>
                      </div>
                    )}
                    {result.preparation.documentsToCarry && (
                      <div><h4 className="font-semibold text-gray-900 mb-2 text-sm">Documents to Carry</h4>
                        <ul className="space-y-1">{result.preparation.documentsToCarry.map((d: string, i: number) => <li key={i} className="text-xs sm:text-sm text-gray-700 flex gap-2"><span>📄</span>{d}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'examination' && result.examinationInChief && (
                  <div className="space-y-3">
                    {result.examinationInChief.map((q: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">{q.question}</p>
                            {q.purpose && <p className="text-xs text-blue-600 mb-1">Purpose: {q.purpose}</p>}
                            {q.expectedAnswer && <p className="text-xs text-gray-500">Expected: {q.expectedAnswer}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'cross' && result.crossExamination && (
                  <div className="space-y-3">
                    {result.crossExamination.map((q: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border p-4 border-l-4 border-l-red-400">
                        <p className="text-sm font-medium text-gray-900 mb-1">{q.question}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {q.technique && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{q.technique}</span>}
                          {q.objective && <span className="text-xs text-gray-500">{q.objective}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'objections' && result.objectionsToWatch && (
                  <div className="space-y-3">
                    {result.objectionsToWatch.map((o: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{o.type}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{o.when}</p>
                        {o.authority && <p className="text-xs text-gray-500 font-mono">{o.authority}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {result.fullAnalysis && !result.preparation && (
                  <div className="bg-white rounded-xl border p-4 sm:p-6"><pre className="whitespace-pre-wrap text-sm text-gray-700">{result.fullAnalysis}</pre></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
