'use client'

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
  settled: 'bg-green-100 text-green-800',
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
              className={`bg-white rounded-xl border p-3 text-center transition-all ${filter === s ? 'ring-2 ring-amber-500 border-amber-400' : ''}`}>
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
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
