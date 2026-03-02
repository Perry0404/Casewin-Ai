'use client'

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
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
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
          details: `Generate a professional Nigerian law firm invoice for client: ${invoiceClient}

Time entries:
${clientEntries.map(e => `- ${e.date}: ${e.description} (${e.matter || 'General'}) - ${e.hours}hrs @ ₦${e.rate.toLocaleString()}/hr = ₦${(e.hours * e.rate).toLocaleString()}`).join('\n')}

Total: ₦${clientEntries.reduce((s, e) => s + e.hours * e.rate, 0).toLocaleString()}

Include: Invoice number, date, payment terms (14 days), bank details placeholder, VAT note, and professional formatting.`
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
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
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors ${timerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
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
                          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${e.status === 'unbilled' ? 'bg-amber-100 text-amber-700' : e.status === 'billed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
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
