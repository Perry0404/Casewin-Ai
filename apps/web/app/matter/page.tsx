'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Matter {
  id: string
  title: string
  counterparty?: string
  claim_amount?: number
  stage: string
  updated_at: string
}

const STAGE_LABEL: Record<string, string> = {
  intake: 'Intake', analysis: 'Analysed', settlement: 'Settlement', agreement: 'Agreement', closed: 'Closed', filed: 'Filed',
}
const STAGE_COLOR: Record<string, string> = {
  intake: 'bg-gray-700 text-gray-300', analysis: 'bg-blue-900 text-blue-300', settlement: 'bg-emerald-900 text-emerald-300',
  agreement: 'bg-yellow-900 text-yellow-300', closed: 'bg-green-900 text-green-300', filed: 'bg-orange-900 text-orange-300',
}

export default function MatterListPage() {
  const router = useRouter()
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', counterparty: '', claimAmount: '', description: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/matters')
      if (res.status === 401) { router.push('/auth/login?redirect=/matter'); return }
      const data = await res.json()
      setMatters(data.matters || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  async function create() {
    if (!form.title.trim() || !form.description.trim()) { setError('Add a title and describe the dispute.'); return }
    setError(''); setCreating(true)
    try {
      const res = await fetch('/api/matters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, claimAmount: form.claimAmount ? Number(form.claimAmount) : undefined }),
      })
      if (res.status === 401) { router.push('/auth/login?redirect=/matter'); return }
      const data = await res.json()
      if (data.success) router.push(`/matter/${data.matter.id}`)
      else setError(data.error || 'Failed to open matter')
    } catch { setError('Network error.') } finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/30 border-b border-emerald-900/40">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase">Justice pipeline</p>
            <h1 className="text-2xl font-bold mt-1">Your Matters</h1>
            <p className="text-gray-400 text-sm">One dispute, carried from intake to a just outcome.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">+ Open a matter</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />)}</div>
        ) : matters.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-10 text-center border border-dashed border-gray-700">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-gray-400">No matters yet. Open one and let CaseWin move it toward resolution.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-emerald-400 hover:underline text-sm">Open your first matter →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {matters.map((m) => (
              <Link key={m.id} href={`/matter/${m.id}`} className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-5 border border-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    {m.counterparty && <p className="text-gray-400 text-sm">vs {m.counterparty}</p>}
                    {m.claim_amount ? <p className="text-emerald-400 text-sm font-bold mt-1">₦{Number(m.claim_amount).toLocaleString()}</p> : null}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLOR[m.stage] || 'bg-gray-700'}`}>{STAGE_LABEL[m.stage] || m.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">🤝 Open a dispute</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="What is the dispute about? *"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.counterparty} onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))} placeholder="Against whom?"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                <input type="number" value={form.claimAmount} onChange={(e) => setForm((f) => ({ ...f, claimAmount: e.target.value }))} placeholder="Amount (₦)"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={5}
                placeholder="Tell the story in plain language — what happened, what is owed or contested, and any evidence you have. *"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={create} disabled={creating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm">
                {creating ? '🤖 Building your case…' : 'Open matter & analyse'}
              </button>
              <p className="text-gray-600 text-xs">Anyone with a dispute can open a matter — business, individual, or lawyer.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
