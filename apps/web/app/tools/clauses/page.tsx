'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Clause {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  createdAt: string
}

const STORAGE_KEY = 'casewin_clauses'

const categories = ['General', 'Indemnity', 'Limitation of Liability', 'Force Majeure', 'Confidentiality', 'Non-Compete', 'Termination', 'Dispute Resolution', 'Governing Law', 'Payment Terms', 'Warranty', 'Intellectual Property', 'Data Protection', 'Employment', 'Tenancy']

const presetClauses: Omit<Clause, 'id' | 'createdAt'>[] = [
  { title: 'Nigerian Governing Law', category: 'Governing Law', content: 'This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the Federal High Court of Nigeria sitting in Lagos.', tags: ['Nigeria', 'Jurisdiction', 'Lagos'] },
  { title: 'Force Majeure (Nigerian)', category: 'Force Majeure', content: 'Neither party shall be liable for any failure or delay in performing their obligations under this Agreement where such failure or delay results from Force Majeure events including but not limited to: acts of God, war, terrorism, epidemic, pandemic, government sanctions, strikes, civil disturbance, fire, flood, or any event beyond the reasonable control of the affected party. The affected party shall notify the other party within fourteen (14) days of the occurrence of such event.', tags: ['Force Majeure', 'Liability', 'Notice'] },
  { title: 'Arbitration Clause (Lagos)', category: 'Dispute Resolution', content: 'Any dispute, controversy or claim arising out of or relating to this Agreement shall be referred to and finally resolved by arbitration under the Arbitration and Mediation Act 2023 of the Federal Republic of Nigeria. The arbitration shall be conducted by a sole arbitrator appointed by agreement of the parties or, failing agreement within fourteen (14) days, by the Lagos Court of Arbitration. The seat of arbitration shall be Lagos, Nigeria. The language of the arbitration shall be English.', tags: ['Arbitration', 'Lagos', 'AMA 2023'] },
  { title: 'NDPR Data Protection', category: 'Data Protection', content: 'The parties shall comply with the Nigeria Data Protection Regulation (NDPR) 2019, the Nigeria Data Protection Act 2023, and all applicable data protection laws. Each party shall implement appropriate technical and organizational measures to protect personal data processed under this Agreement. Neither party shall transfer personal data outside Nigeria without ensuring adequate data protection safeguards as required by the NDPA 2023.', tags: ['NDPR', 'NDPA', 'Privacy', 'Data'] },
  { title: 'Non-Compete (Nigerian)', category: 'Non-Compete', content: 'For a period of twelve (12) months following the termination of this Agreement, the Receiving Party shall not, directly or indirectly, engage in, own, manage, operate, or provide services to any business that competes with the Disclosing Party within Nigeria. The parties acknowledge that this restriction is reasonable in scope, duration, and geography having regard to the Restraint of Trade doctrine as applied in Nigerian courts per the decision in Nordenfelt v. Maxim Nordenfelt Guns & Ammunition Co [1894] AC 535 as received into Nigerian law.', tags: ['Non-Compete', 'Restraint of Trade', '12 months'] },
  { title: 'Payment Terms (Naira)', category: 'Payment Terms', content: 'All payments under this Agreement shall be made in Nigerian Naira (NGN) by bank transfer to the designated account of the receiving party. Payment shall be made within thirty (30) days of receipt of a valid invoice. Late payments shall attract interest at the rate of 2% per month or the Central Bank of Nigeria Monetary Policy Rate plus 3%, whichever is higher. All payments are exclusive of Value Added Tax (VAT) at the prevailing rate (currently 7.5%) which shall be payable in addition.', tags: ['Payment', 'Naira', 'VAT', 'Interest'] },
]

export default function ClausesPage() {
  const [clauses, setClauses] = useState<Clause[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editClause, setEditClause] = useState<Clause | null>(null)
  const [form, setForm] = useState({ title: '', category: 'General', content: '', tags: '' })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { setClauses(JSON.parse(saved)) }
    else {
      const initial = presetClauses.map((c, i) => ({ ...c, id: `preset-${i}`, createdAt: new Date().toISOString() }))
      setClauses(initial)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    }
  }, [])

  useEffect(() => { if (clauses.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(clauses)) }, [clauses])

  const saveClause = () => {
    if (!form.title || !form.content) return
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (editClause) {
      setClauses(prev => prev.map(c => c.id === editClause.id ? { ...c, title: form.title, category: form.category, content: form.content, tags } : c))
    } else {
      setClauses(prev => [{ id: Date.now().toString(36), title: form.title, category: form.category, content: form.content, tags, createdAt: new Date().toISOString() }, ...prev])
    }
    setForm({ title: '', category: 'General', content: '', tags: '' }); setShowForm(false); setEditClause(null)
  }

  const handleEdit = (c: Clause) => { setForm({ title: c.title, category: c.category, content: c.content, tags: c.tags.join(', ') }); setEditClause(c); setShowForm(true) }
  const handleDelete = (id: string) => setClauses(prev => prev.filter(c => c.id !== id))
  const handleCopy = (id: string, content: string) => { navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }

  const generateClause = async () => {
    if (!generatePrompt) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: 'Legal Clause', parties: 'Parties to Agreement', details: `Generate a Nigerian legal clause for: ${generatePrompt}. The clause must be legally sound under Nigerian law. Return ONLY the clause text, no explanations.` })
      })
      const data = await res.json()
      if (data.success && data.document) {
        setForm({ title: generatePrompt, category: 'General', content: data.document, tags: 'AI Generated' })
        setShowForm(true)
        setGeneratePrompt('')
      }
    } catch (_e) { /* handled */ }
    finally { setIsGenerating(false) }
  }

  const filtered = clauses.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.content.toLowerCase().includes(search.toLowerCase()) && !c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

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

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center"><span className="text-xl">📚</span></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clause Library</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Save, search, and reuse Nigerian legal clauses</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditClause(null); setForm({ title: '', category: 'General', content: '', tags: '' }) }}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 text-sm">
            + New Clause
          </button>
        </div>

        {/* AI Generate */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl p-4 sm:p-5 mb-6 text-white">
          <h3 className="font-semibold mb-2 text-sm">🤖 AI Clause Generator</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={generatePrompt} onChange={e => setGeneratePrompt(e.target.value)}
              placeholder="Describe the clause you need (e.g. 'Indemnity clause for IT service agreement')"
              className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg text-gray-900 text-sm placeholder-gray-400" />
            <button onClick={generateClause} disabled={isGenerating || !generatePrompt}
              className="px-4 sm:px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm disabled:opacity-50 flex-shrink-0">
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clauses..."
            className="flex-1 px-4 py-2 border rounded-xl text-sm bg-white" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm bg-white w-full sm:w-auto">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-lg font-bold mb-4">{editClause ? 'Edit Clause' : 'New Clause'}</h2>
              <div className="space-y-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Clause Text *</label>
                  <textarea rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. Nigeria, Indemnity, Commercial" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowForm(false); setEditClause(null) }} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={saveClause} className="flex-1 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700">{editClause ? 'Update' : 'Save Clause'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Clauses */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
            <span className="text-4xl sm:text-5xl block mb-3">📚</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No clauses found</h3>
            <p className="text-gray-500 text-sm">Add a clause or use AI to generate one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-xl border p-4 hover:border-sky-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                      <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{c.category}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{c.content}</p>
                    <div className="flex flex-wrap gap-1">{c.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleCopy(c.id, c.content)} className={`text-xs px-2 py-1 rounded-lg ${copiedId === c.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {copiedId === c.id ? '✓ Copied' : 'Copy'}
                    </button>
                    <button onClick={() => handleEdit(c)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs px-2 py-1 text-gray-400 hover:text-red-500">✕</button>
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
