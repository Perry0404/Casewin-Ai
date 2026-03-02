const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'apps', 'web', 'app');

function writeFile(relPath, content) {
  const fullPath = path.join(base, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Written: ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// ============ API ROUTE: /api/deadlines ============
writeFile('api/deadlines/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { caseType, jurisdiction, filingDate, description } = await req.json()

    const response = await callLLM([
      { role: 'system', content: \`You are an expert Nigerian legal deadline calculator. You know all statutory limitation periods, filing deadlines, and court timelines under Nigerian law including:
- Limitation Law of Lagos State / various states
- Limitation Act (Federal)
- Court of Appeal Rules 2021
- Supreme Court Rules
- Federal High Court (Civil Procedure) Rules
- Sheriffs and Civil Process Act
- Administration of Criminal Justice Act 2015
- Companies Winding Up Rules

Return your response as a JSON object with this structure:
{
  "deadlines": [
    {
      "title": "Deadline name",
      "date": "YYYY-MM-DD",
      "daysRemaining": number,
      "category": "Filing|Limitation|Service|Response|Hearing",
      "authority": "Legal authority reference",
      "critical": true/false,
      "notes": "Additional context"
    }
  ],
  "limitationPeriod": "X years from date of accrual",
  "keyDates": "Summary of important dates",
  "warnings": ["Any time-sensitive warnings"]
}\` },
      { role: 'user', content: \`Calculate all applicable deadlines for:
Case Type: \${caseType}
Jurisdiction: \${jurisdiction || 'Lagos State'}
Filing/Incident Date: \${filingDate || 'Not specified'}
Case Details: \${description || 'General inquiry'}

Return the JSON object with all deadlines calculated from the filing/incident date.\` }
    ], 0.3)

    let parsed
    try {
      const jsonMatch = response.match(/\\{[\\s\\S]*\\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response,
      calculatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
`);

// ============ API ROUTE: /api/filing ============
writeFile('api/filing/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { court, documentType, caseType, details } = await req.json()

    const response = await callLLM([
      { role: 'system', content: \`You are a Nigerian court filing expert with deep knowledge of:
- Federal High Court (Civil Procedure) Rules 2019
- Lagos State High Court (Civil Procedure) Rules 2019
- Court of Appeal Rules 2021
- Supreme Court Rules 2014
- National Industrial Court Rules
- Magistrate Court Rules
- Administration of Criminal Justice Act/Law

You know exact formatting requirements, required documents, filing fees, number of copies, font sizes, margin requirements, page numbering, and cover page formats for each court.

Return your response as a JSON object:
{
  "court": "Court name",
  "documentType": "Document type",
  "checklist": [
    { "item": "Required item", "required": true, "copies": number, "notes": "Details" }
  ],
  "formattingRules": {
    "paperSize": "A4",
    "margins": "Top/Bottom/Left/Right measurements",
    "fontSize": "12pt or 14pt",
    "lineSpacing": "Double/1.5",
    "font": "Times New Roman",
    "pagination": "Bottom center",
    "binding": "Requirement"
  },
  "filingFees": [
    { "item": "Fee description", "amount": "NGN amount", "notes": "" }
  ],
  "coverPage": "Description of cover page format",
  "timeline": "Expected processing timeline",
  "tips": ["Practical tips for filing"]
}\` },
      { role: 'user', content: \`Prepare filing requirements for:
Court: \${court}
Document Type: \${documentType}
Case Type: \${caseType || 'Civil'}
Additional Details: \${details || 'Standard filing'}

Return the JSON object with complete filing preparation guide.\` }
    ], 0.3)

    let parsed
    try {
      const jsonMatch = response.match(/\\{[\\s\\S]*\\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response,
      generatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
`);

// ============ API ROUTE: /api/citations ============
writeFile('api/citations/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { mode, caseName, year, court, volume, page, reporter, text } = await req.json()

    const prompt = mode === 'format'
      ? \`Format this Nigerian legal citation properly:
Case Name: \${caseName}
Year: \${year}
Court: \${court}
Volume: \${volume || 'N/A'}
Page: \${page || 'N/A'}
Reporter: \${reporter || 'Auto-detect'}

Provide the citation in all applicable Nigerian formats:
1. NWLR format: [Year] Volume NWLR (Pt. X) Page
2. LPELR format: (Year) LPELR-XXXXX(Court)
3. SC/CA format: (Year) X SC/CA Page
4. FWLR format: [Year] Volume FWLR (Pt. X) Page
5. All Nigeria Law Reports: [Year] All NLR Page

Return JSON: { "citations": [{ "format": "name", "citation": "formatted citation", "isPrimary": bool }], "caseInfo": { "caseName": "", "year": "", "court": "", "summary": "brief note" } }\`
      : \`Extract and properly format all legal citations from this text:

\${text}

For each citation found:
1. Identify the case name
2. Format it in proper Nigerian citation style (NWLR, LPELR, SC, etc.)
3. Note which court decided it

Return JSON: { "citations": [{ "original": "as found in text", "formatted": "proper citation", "caseName": "", "court": "", "year": "" }], "totalFound": number }\`

    const response = await callLLM([
      { role: 'system', content: \`You are an expert in Nigerian legal citations. You know all Nigerian law report series: NWLR (Nigerian Weekly Law Reports), LPELR (Law Pavilion Electronic Law Reports), FWLR (Federation Weekly Law Reports), All NLR, SC (Supreme Court Reports), NSCC (Nigerian Supreme Court Cases), WRN (Weekly Reports of Nigeria). You format citations precisely according to Nigerian legal writing standards.\` },
      { role: 'user', content: prompt }
    ], 0.2)

    let parsed
    try {
      const jsonMatch = response.match(/\\{[\\s\\S]*\\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response,
      formattedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
`);

// ============ TOOL PAGE: /tools/deadlines ============
writeFile('tools/deadlines/page.tsx', `'use client'

import { useState } from 'react'
import Link from 'next/link'

const caseTypes = [
  { id: 'contract', name: 'Contract Dispute', icon: '📋' },
  { id: 'tort', name: 'Tort/Negligence', icon: '⚠️' },
  { id: 'land', name: 'Land/Property', icon: '🏠' },
  { id: 'criminal', name: 'Criminal Matter', icon: '⚖️' },
  { id: 'family', name: 'Family/Matrimonial', icon: '👨‍👩‍👧' },
  { id: 'employment', name: 'Employment/Labour', icon: '👔' },
  { id: 'tax', name: 'Tax Dispute', icon: '💰' },
  { id: 'company', name: 'Company/Corporate', icon: '🏢' },
  { id: 'fundamental-rights', name: 'Fundamental Rights', icon: '🏛️' },
  { id: 'election', name: 'Election Petition', icon: '🗳️' },
  { id: 'maritime', name: 'Maritime/Admiralty', icon: '🚢' },
  { id: 'appeal', name: 'Appeal', icon: '📜' },
]

const jurisdictions = [
  'Lagos State', 'FCT Abuja', 'Rivers State', 'Kano State', 'Oyo State',
  'Federal High Court', 'Court of Appeal', 'Supreme Court',
  'National Industrial Court', 'Other State'
]

interface Deadline {
  title: string
  date?: string
  daysRemaining?: number
  category: string
  authority: string
  critical: boolean
  notes: string
}

export default function DeadlinesPage() {
  const [caseType, setCaseType] = useState('')
  const [jurisdiction, setJurisdiction] = useState('Lagos State')
  const [filingDate, setFilingDate] = useState('')
  const [description, setDescription] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{ deadlines?: Deadline[]; limitationPeriod?: string; warnings?: string[]; fullAnalysis?: string } | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = async () => {
    if (!caseType) { setError('Please select a case type'); return }
    setIsCalculating(true)
    setError('')
    try {
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, jurisdiction, filingDate, description }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || 'Failed to calculate deadlines')
      }
    } catch { setError('Network error') }
    finally { setIsCalculating(false) }
  }

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Filing': 'bg-blue-100 text-blue-800',
      'Limitation': 'bg-red-100 text-red-800',
      'Service': 'bg-yellow-100 text-yellow-800',
      'Response': 'bg-green-100 text-green-800',
      'Hearing': 'bg-purple-100 text-purple-800',
    }
    return colors[cat] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deadline & Court Date Calculator</h1>
              <p className="text-gray-600">AI calculates all statutory deadlines and limitation periods for your case</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Case Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {caseTypes.map(ct => (
                    <button key={ct.id} onClick={() => setCaseType(ct.id)}
                      className={\`p-2 text-xs rounded-lg border-2 text-left transition-all \${caseType === ct.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}\`}>
                      <span className="block text-base mb-0.5">{ct.icon}</span>
                      {ct.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                  {jurisdictions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing / Incident Date</label>
                <input type="date" value={filingDate} onChange={e => setFilingDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the legal matter..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <button onClick={handleCalculate} disabled={isCalculating}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {isCalculating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Calculating...
                  </span>
                ) : '📅 Calculate Deadlines'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isCalculating && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculate Your Deadlines</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Select your case type and jurisdiction. Our AI will calculate all applicable statutory deadlines, limitation periods, and filing timelines under Nigerian law.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-semibold text-red-800 mb-2">⚠️ Warnings</h3>
                    <ul className="space-y-1">{result.warnings.map((w, i) => <li key={i} className="text-sm text-red-700">• {w}</li>)}</ul>
                  </div>
                )}

                {result.limitationPeriod && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-800 mb-1">⏰ Limitation Period</h3>
                    <p className="text-sm text-amber-700">{result.limitationPeriod}</p>
                  </div>
                )}

                {result.deadlines && result.deadlines.length > 0 ? (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Calculated Deadlines ({result.deadlines.length})</h3>
                    </div>
                    <div className="divide-y">
                      {result.deadlines.map((d, i) => (
                        <div key={i} className={\`p-4 \${d.critical ? 'bg-red-50/50' : ''}\`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {d.critical && <span className="text-red-500 text-xs font-bold">🔴 CRITICAL</span>}
                                <h4 className="font-semibold text-gray-900">{d.title}</h4>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">Authority: {d.authority}</p>
                              {d.notes && <p className="text-sm text-gray-600">{d.notes}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-medium \${categoryColor(d.category)}\`}>{d.category}</span>
                              {d.date && <p className="text-sm font-mono text-gray-900 mt-1">{d.date}</p>}
                              {d.daysRemaining !== undefined && (
                                <p className={\`text-xs font-medium \${d.daysRemaining < 30 ? 'text-red-600' : 'text-gray-500'}\`}>{d.daysRemaining} days</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : result.fullAnalysis ? (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Analysis</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{result.fullAnalysis}</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
`);

// ============ TOOL PAGE: /tools/billing ============
writeFile('tools/billing/page.tsx', `'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface TimeEntry {
  id: string
  client: string
  matter: string
  description: string
  hours: number
  rate: number
  date: string
  status: 'unbilled' | 'billed' | 'paid'
}

const STORAGE_KEY = 'casewin_time_entries'

export default function BillingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [client, setClient] = useState('')
  const [matter, setMatter] = useState('')
  const [description, setDescription] = useState('')
  const [rate, setRate] = useState(50000)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [manualHours, setManualHours] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceClient, setInvoiceClient] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [tab, setTab] = useState<'track' | 'entries' | 'invoice'>('track')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (entries.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return \`\${h.toString().padStart(2,'0')}:\${m.toString().padStart(2,'0')}:\${sec.toString().padStart(2,'0')}\`
  }

  const saveEntry = (hours: number) => {
    if (!client || !description) return
    const entry: TimeEntry = {
      id: Date.now().toString(36),
      client, matter, description, hours: Math.round(hours * 100) / 100,
      rate, date: new Date().toISOString().split('T')[0], status: 'unbilled'
    }
    setEntries(prev => [entry, ...prev])
    setDescription('')
    setTimerSeconds(0)
    setTimerRunning(false)
    setManualHours('')
  }

  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const toggleStatus = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'unbilled' ? 'billed' : e.status === 'billed' ? 'paid' : 'unbilled' } : e))
  }

  const totalUnbilled = entries.filter(e => e.status === 'unbilled').reduce((sum, e) => sum + e.hours * e.rate, 0)
  const totalBilled = entries.filter(e => e.status === 'billed').reduce((sum, e) => sum + e.hours * e.rate, 0)
  const totalPaid = entries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.hours * e.rate, 0)
  const uniqueClients = [...new Set(entries.map(e => e.client))].filter(Boolean)

  const generateInvoice = async () => {
    const clientEntries = entries.filter(e => e.client === invoiceClient && e.status === 'unbilled')
    if (clientEntries.length === 0) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'Legal Services Invoice',
          parties: invoiceClient,
          details: \`Generate a professional Nigerian law firm invoice for client: \${invoiceClient}

Time entries:
\${clientEntries.map(e => \`- \${e.date}: \${e.description} (\${e.matter || 'General'}) - \${e.hours}hrs @ ₦\${e.rate.toLocaleString()}/hr = ₦\${(e.hours * e.rate).toLocaleString()}\`).join('\\n')}

Total: ₦\${clientEntries.reduce((s, e) => s + e.hours * e.rate, 0).toLocaleString()}

Include: Invoice number, date, payment terms (14 days), bank details placeholder, VAT note, and professional formatting.\`
        })
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedInvoice(data.document)
        clientEntries.forEach(e => toggleStatus(e.id))
      }
    } catch { /* handled silently */ }
    finally { setIsGenerating(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><span className="text-xl">💰</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Time & Billing</h1>
              <p className="text-gray-600 text-sm">Track billable hours and generate AI invoices</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500 mb-1">Unbilled</p><p className="text-xl font-bold text-amber-600">₦{totalUnbilled.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500 mb-1">Billed</p><p className="text-xl font-bold text-blue-600">₦{totalBilled.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500 mb-1">Paid</p><p className="text-xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border p-1 w-fit">
          {(['track', 'entries', 'invoice'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${tab === t ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'}\`}>
              {t === 'track' ? '⏱️ Track Time' : t === 'entries' ? '📋 Entries' : '📄 Invoice'}
            </button>
          ))}
        </div>

        {tab === 'track' && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="text-center py-6">
              <p className="text-5xl font-mono font-bold text-gray-900 mb-4">{formatTimer(timerSeconds)}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setTimerRunning(!timerRunning)}
                  className={\`px-6 py-3 rounded-xl font-semibold text-white transition-colors \${timerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}\`}>
                  {timerRunning ? '⏸ Pause' : '▶ Start Timer'}
                </button>
                {timerSeconds > 0 && !timerRunning && (
                  <button onClick={() => saveEntry(timerSeconds / 3600)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                    💾 Save ({(timerSeconds / 3600).toFixed(2)}h)
                  </button>
                )}
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name"
                  className="w-full px-3 py-2 border rounded-lg text-sm" list="clients-list" />
                <datalist id="clients-list">{uniqueClients.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matter / Case</label>
                <input value={matter} onChange={e => setMatter(e.target.value)} placeholder="Case reference"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Work performed"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₦)</label>
                <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manual Hours</label>
                <div className="flex gap-2">
                  <input type="number" step="0.25" value={manualHours} onChange={e => setManualHours(e.target.value)} placeholder="0.00"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={() => manualHours && saveEntry(Number(manualHours))} disabled={!manualHours || !client || !description}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-40">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'entries' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            {entries.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <span className="text-4xl block mb-2">📋</span>No time entries yet. Start tracking!
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Hours</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{e.date}</td>
                      <td className="px-4 py-3 font-medium">{e.client}</td>
                      <td className="px-4 py-3 text-gray-600">{e.description}{e.matter && <span className="text-gray-400 ml-1">({e.matter})</span>}</td>
                      <td className="px-4 py-3 text-right font-mono">{e.hours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">₦{(e.hours * e.rate).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleStatus(e.id)}
                          className={\`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer \${e.status === 'unbilled' ? 'bg-amber-100 text-amber-700' : e.status === 'billed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}\`}>
                          {e.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteEntry(e.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'invoice' && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Generate AI Invoice</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
              <select value={invoiceClient} onChange={e => setInvoiceClient(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Choose client...</option>
                {uniqueClients.map(c => {
                  const unbilled = entries.filter(e => e.client === c && e.status === 'unbilled')
                  return <option key={c} value={c}>{c} ({unbilled.length} unbilled entries)</option>
                })}
              </select>
            </div>
            {invoiceClient && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Unbilled entries for {invoiceClient}:</p>
                {entries.filter(e => e.client === invoiceClient && e.status === 'unbilled').map(e => (
                  <div key={e.id} className="flex justify-between text-gray-600">
                    <span>{e.date}: {e.description}</span>
                    <span className="font-mono">₦{(e.hours * e.rate).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₦{entries.filter(e => e.client === invoiceClient && e.status === 'unbilled').reduce((s, e) => s + e.hours * e.rate, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
            <button onClick={generateInvoice} disabled={!invoiceClient || isGenerating}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
              {isGenerating ? 'Generating Invoice...' : '📄 Generate AI Invoice'}
            </button>
            {generatedInvoice && (
              <div className="bg-white border rounded-xl p-6 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Generated Invoice</h3>
                  <button onClick={() => navigator.clipboard.writeText(generatedInvoice)} className="text-sm text-blue-600 hover:text-blue-700">Copy</button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">{generatedInvoice}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
`);

// ============ TOOL PAGE: /tools/cases ============
writeFile('tools/cases/page.tsx', `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Case {
  id: string
  suitNumber: string
  title: string
  court: string
  caseType: string
  status: 'active' | 'pending' | 'adjourned' | 'settled' | 'closed'
  client: string
  opposingParty: string
  opposingCounsel: string
  nextDate: string
  notes: string
  createdAt: string
}

const STORAGE_KEY = 'casewin_cases'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  adjourned: 'bg-blue-100 text-blue-800',
  settled: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ suitNumber: '', title: '', court: '', caseType: '', status: 'active' as Case['status'], client: '', opposingParty: '', opposingCounsel: '', nextDate: '', notes: '' })

  useEffect(() => { const s = localStorage.getItem(STORAGE_KEY); if (s) setCases(JSON.parse(s)) }, [])
  useEffect(() => { if (cases.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)) }, [cases])

  const saveCase = () => {
    if (!form.title || !form.client) return
    if (selectedCase) {
      setCases(prev => prev.map(c => c.id === selectedCase.id ? { ...c, ...form } : c))
    } else {
      setCases(prev => [{ id: Date.now().toString(36), ...form, createdAt: new Date().toISOString() }, ...prev])
    }
    setForm({ suitNumber: '', title: '', court: '', caseType: '', status: 'active', client: '', opposingParty: '', opposingCounsel: '', nextDate: '', notes: '' })
    setShowForm(false)
    setSelectedCase(null)
  }

  const editCase = (c: Case) => { setForm(c); setSelectedCase(c); setShowForm(true) }
  const deleteCase = (id: string) => { setCases(prev => prev.filter(c => c.id !== id)); if (selectedCase?.id === id) setSelectedCase(null) }

  const filtered = cases.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.client.toLowerCase().includes(search.toLowerCase()) && !c.suitNumber.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const courts = ['Federal High Court', 'State High Court Lagos', 'State High Court FCT', 'Court of Appeal', 'Supreme Court', 'National Industrial Court', 'Magistrate Court']

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><span className="text-xl">📁</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Case Manager</h1>
              <p className="text-gray-600 text-sm">Track and manage all your active cases</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setSelectedCase(null); setForm({ suitNumber: '', title: '', court: '', caseType: '', status: 'active', client: '', opposingParty: '', opposingCounsel: '', nextDate: '', notes: '' }) }}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 text-sm">
            + New Case
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(['all', 'active', 'pending', 'adjourned', 'closed'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={\`bg-white rounded-xl border p-3 text-center transition-all \${filter === s ? 'ring-2 ring-amber-500 border-amber-400' : ''}\`}>
              <p className="text-lg font-bold text-gray-900">{s === 'all' ? cases.length : cases.filter(c => c.status === s).length}</p>
              <p className="text-xs text-gray-500 capitalize">{s === 'all' ? 'Total' : s}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, client, or suit number..."
            className="w-full px-4 py-2 border rounded-xl text-sm bg-white" />
        </div>

        {/* Case Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">{selectedCase ? 'Edit Case' : 'New Case'}</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Case Title *</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Suit Number</label>
                    <input value={form.suitNumber} onChange={e => setForm({...form, suitNumber: e.target.value})} placeholder="FHC/L/CS/123/2026" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Court</label>
                    <select value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Select court</option>
                      {courts.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Case Type</label>
                    <input value={form.caseType} onChange={e => setForm({...form, caseType: e.target.value})} placeholder="Civil, Criminal..." className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
                    <input value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Case['status']})} className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="adjourned">Adjourned</option>
                      <option value="settled">Settled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Opposing Party</label>
                    <input value={form.opposingParty} onChange={e => setForm({...form, opposingParty: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Opposing Counsel</label>
                    <input value={form.opposingCounsel} onChange={e => setForm({...form, opposingCounsel: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Next Court Date</label>
                  <input type="date" value={form.nextDate} onChange={e => setForm({...form, nextDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowForm(false); setSelectedCase(null) }} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={saveCase} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700">
                  {selectedCase ? 'Update Case' : 'Create Case'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Case List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <span className="text-5xl block mb-3">📁</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{cases.length === 0 ? 'No cases yet' : 'No matching cases'}</h3>
            <p className="text-gray-500 text-sm">{cases.length === 0 ? 'Click "+ New Case" to start tracking your cases.' : 'Try adjusting your filters or search.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-xl border p-4 hover:border-amber-300 transition-colors cursor-pointer" onClick={() => editCase(c)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${statusColors[c.status]}\`}>{c.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {c.suitNumber && <span>📋 {c.suitNumber}</span>}
                      {c.court && <span>🏛️ {c.court}</span>}
                      <span>👤 {c.client}</span>
                      {c.opposingParty && <span>⚔️ vs {c.opposingParty}</span>}
                    </div>
                    {c.notes && <p className="text-sm text-gray-600 mt-1 line-clamp-1">{c.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    {c.nextDate && (
                      <div>
                        <p className="text-xs text-gray-500">Next Date</p>
                        <p className="text-sm font-mono font-semibold text-gray-900">{c.nextDate}</p>
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteCase(c.id) }} className="text-xs text-gray-400 hover:text-red-500 mt-1">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
`);

// ============ TOOL PAGE: /tools/filing ============
writeFile('tools/filing/page.tsx', `'use client'

import { useState } from 'react'
import Link from 'next/link'

const courts = [
  { id: 'fhc', name: 'Federal High Court', icon: '🏛️' },
  { id: 'shc-lagos', name: 'State High Court (Lagos)', icon: '⚖️' },
  { id: 'shc-fct', name: 'State High Court (FCT Abuja)', icon: '⚖️' },
  { id: 'ca', name: 'Court of Appeal', icon: '📜' },
  { id: 'sc', name: 'Supreme Court', icon: '🏅' },
  { id: 'nic', name: 'National Industrial Court', icon: '👔' },
  { id: 'magistrate', name: 'Magistrate Court', icon: '📋' },
]

const documentTypes = [
  'Originating Summons', 'Writ of Summons', 'Statement of Claim',
  'Statement of Defence', 'Motion on Notice', 'Motion Ex-Parte',
  'Brief of Argument', 'Written Address', 'Counter-Affidavit',
  'Notice of Appeal', 'Petition', 'Originating Motion',
]

export default function FilingPage() {
  const [court, setCourt] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [caseType, setCaseType] = useState('')
  const [details, setDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!court || !documentType) { setError('Please select court and document type'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/filing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court, documentType, caseType, details }),
      })
      const data = await res.json()
      if (data.success) setResult(data.result)
      else setError(data.error || 'Failed')
    } catch { setError('Network error') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center"><span className="text-xl">📝</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Court Filing Prep</h1>
              <p className="text-gray-600 text-sm">Get formatting rules, checklists, and fee schedules for Nigerian courts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Filing Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Court *</label>
                <div className="space-y-2">
                  {courts.map(c => (
                    <button key={c.id} onClick={() => setCourt(c.name)}
                      className={\`w-full p-3 text-left rounded-lg border-2 text-sm transition-all \${court === c.name ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 hover:border-gray-300'}\`}>
                      <span className="mr-2">{c.icon}</span>{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={documentType} onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Choose document...</option>
                  {documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <input value={caseType} onChange={e => setCaseType(e.target.value)} placeholder="Civil, Criminal..."
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <textarea rows={2} value={details} onChange={e => setDetails(e.target.value)} placeholder="Any specific requirements..."
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleGenerate} disabled={isLoading}
                className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50">
                {isLoading ? 'Generating...' : '📝 Generate Filing Guide'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isLoading && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📝</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Court Filing Preparation</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Select a court and document type. AI will generate the complete filing checklist, formatting rules, fee schedule, and cover page template.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.checklist && (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-cyan-50"><h3 className="font-semibold text-cyan-900">📋 Filing Checklist</h3></div>
                    <div className="p-4 space-y-2">
                      {result.checklist.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <span className={\`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5 \${item.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}\`}>
                            {item.required ? '!' : '○'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.item}</p>
                            {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                          </div>
                          {item.copies && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.copies} copies</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.formattingRules && (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">📐 Formatting Rules</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(result.formattingRules).map(([k, v]) => (
                        <div key={k} className="flex justify-between bg-gray-50 p-2 rounded">
                          <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium text-gray-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.filingFees && (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">💰 Filing Fees</h3>
                    <div className="space-y-2">
                      {result.filingFees.map((fee: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">{fee.item}</span>
                          <span className="font-semibold text-gray-900">{fee.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.tips && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h3>
                    <ul className="space-y-1">{result.tips.map((t: string, i: number) => <li key={i} className="text-sm text-yellow-700">• {t}</li>)}</ul>
                  </div>
                )}

                {result.fullAnalysis && !result.checklist && (
                  <div className="bg-white rounded-xl border p-6">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{result.fullAnalysis}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
`);

// ============ TOOL PAGE: /tools/citations ============
writeFile('tools/citations/page.tsx', `'use client'

import { useState } from 'react'
import Link from 'next/link'

const reporters = [
  { id: 'nwlr', name: 'NWLR', full: 'Nigerian Weekly Law Reports' },
  { id: 'lpelr', name: 'LPELR', full: 'Law Pavilion Electronic Reports' },
  { id: 'fwlr', name: 'FWLR', full: 'Federation Weekly Law Reports' },
  { id: 'sc', name: 'SC', full: 'Supreme Court Reports' },
  { id: 'nsc', name: 'NSCC', full: 'Nigerian Supreme Court Cases' },
  { id: 'allnlr', name: 'All NLR', full: 'All Nigeria Law Reports' },
  { id: 'wrn', name: 'WRN', full: 'Weekly Reports of Nigeria' },
]

const courtList = [
  'Supreme Court', 'Court of Appeal', 'Federal High Court',
  'State High Court', 'National Industrial Court', 'Customary Court of Appeal',
  'Sharia Court of Appeal'
]

export default function CitationsPage() {
  const [mode, setMode] = useState<'format' | 'extract'>('format')
  const [caseName, setCaseName] = useState('')
  const [year, setYear] = useState('')
  const [court, setCourt] = useState('')
  const [volume, setVolume] = useState('')
  const [page, setPage] = useState('')
  const [reporter, setReporter] = useState('')
  const [extractText, setExtractText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (mode === 'format' && !caseName) { setError('Enter a case name'); return }
    if (mode === 'extract' && !extractText.trim()) { setError('Paste text to extract citations from'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'format' ? { mode, caseName, year, court, volume, page, reporter } : { mode, text: extractText }),
      })
      const data = await res.json()
      if (data.success) setResult(data.result)
      else setError(data.error || 'Failed')
    } catch { setError('Network error') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><span className="text-xl">📚</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Legal Citation Generator</h1>
              <p className="text-gray-600 text-sm">Format Nigerian legal citations in NWLR, LPELR, SC, and more</p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border p-1 w-fit">
          <button onClick={() => { setMode('format'); setResult(null) }}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${mode === 'format' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}\`}>
            ✏️ Format Citation
          </button>
          <button onClick={() => { setMode('extract'); setResult(null) }}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${mode === 'extract' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}\`}>
            🔍 Extract Citations
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              {mode === 'format' ? (
                <>
                  <h2 className="font-semibold text-gray-900">Case Details</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Name *</label>
                    <input value={caseName} onChange={e => setCaseName(e.target.value)} placeholder="e.g., Abacha v. Fawehinmi"
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input value={year} onChange={e => setYear(e.target.value)} placeholder="2000"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                      <select value={court} onChange={e => setCourt(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Select...</option>
                        {courtList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                      <input value={volume} onChange={e => setVolume(e.target.value)} placeholder="6"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                      <input value={page} onChange={e => setPage(e.target.value)} placeholder="228"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reporter Series</label>
                    <div className="flex flex-wrap gap-2">
                      {reporters.map(r => (
                        <button key={r.id} onClick={() => setReporter(r.id)}
                          className={\`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all \${reporter === r.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}\`}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-gray-900">Extract Citations</h2>
                  <p className="text-sm text-gray-500">Paste any legal text and AI will find and format all citations.</p>
                  <textarea rows={12} value={extractText} onChange={e => setExtractText(e.target.value)}
                    placeholder="Paste legal text here... e.g., judgment, brief of argument, or any document containing case citations"
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleSubmit} disabled={isLoading}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                {isLoading ? 'Processing...' : mode === 'format' ? '📚 Format Citation' : '🔍 Extract & Format'}
              </button>
            </div>
          </div>

          <div>
            {!result && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📚</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nigerian Legal Citations</h3>
                <p className="text-gray-500 text-sm">Generate properly formatted citations in NWLR, LPELR, FWLR, SC, and other Nigerian law report formats.</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.citations && result.citations.map((c: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {c.format && <span className="text-xs text-indigo-600 font-semibold uppercase">{c.format}</span>}
                        {c.caseName && <p className="text-sm font-medium text-gray-900 mt-0.5">{c.caseName}</p>}
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 text-gray-800">{c.citation || c.formatted}</p>
                        {c.original && <p className="text-xs text-gray-400 mt-1">Original: {c.original}</p>}
                        {c.court && <p className="text-xs text-gray-500 mt-0.5">{c.court} {c.year && \`• \${c.year}\`}</p>}
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(c.citation || c.formatted)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex-shrink-0">Copy</button>
                    </div>
                  </div>
                ))}

                {result.caseInfo && (
                  <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
                    <h3 className="font-semibold text-indigo-900 mb-1">{result.caseInfo.caseName}</h3>
                    <p className="text-sm text-indigo-700">{result.caseInfo.court} • {result.caseInfo.year}</p>
                    {result.caseInfo.summary && <p className="text-sm text-indigo-600 mt-1">{result.caseInfo.summary}</p>}
                  </div>
                )}

                {result.totalFound !== undefined && (
                  <p className="text-sm text-gray-500 text-center">{result.totalFound} citation{result.totalFound !== 1 ? 's' : ''} found</p>
                )}

                {result.fullAnalysis && !result.citations && (
                  <div className="bg-white rounded-xl border p-6">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{result.fullAnalysis}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
`);

console.log('\\nAll 8 files created successfully!');
