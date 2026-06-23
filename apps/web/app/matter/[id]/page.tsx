'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Settlement {
  settlementProbability?: number
  recommendedSettlement?: { low: number; mid: number; high: number }
  expectedTimeline?: { settle: string; litigate: string }
  litigationRisk?: string
  recommendation?: string
}
interface EvidenceItem { name: string; hash: string; type: string; addedAt: string }
interface Matter {
  id: string
  title: string
  counterparty?: string
  claim_amount?: number
  stage: string
  narrative?: string
  facts?: Record<string, unknown>
  evidence?: EvidenceItem[]
  settlement?: Settlement | null
  invoice_id?: string
  payment_link?: string
  resolution?: string
}

const STAGES = ['intake', 'analysis', 'settlement', 'agreement', 'closed']
const STAGE_TITLE: Record<string, string> = {
  intake: 'Intake', analysis: 'Analysis', settlement: 'Settlement', agreement: 'Agreement & payment', closed: 'Closed', filed: 'Filed in court',
}

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
const ngn = (n?: number) => (typeof n === 'number' ? `₦${n.toLocaleString()}` : '—')

export default function MatterWorkspace() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/matters/${id}`)
    if (res.status === 401) { router.push(`/auth/login?redirect=/matter/${id}`); return }
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setMatter(data.matter)
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/matters/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) setMatter(data.matter)
    return data
  }

  async function addEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy('evidence')
    try {
      const hash = await sha256(file)
      await fetch('/api/court/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash, fileName: file.name }) })
      await patch({ addEvidence: { name: file.name, hash, type: file.type || 'file' } })
    } finally { setBusy(''); e.target.value = '' }
  }

  async function runSettlement() {
    if (!matter) return
    setBusy('settlement')
    try {
      const ev = matter.evidence?.length || 0
      const res = await fetch('/api/dispute/settlement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matter: matter.title,
          claimAmount: matter.claim_amount,
          facts: `${matter.narrative || ''}\n\nStructured facts: ${JSON.stringify(matter.facts || {})}`,
          evidenceStrength: ev >= 2 ? 'strong' : ev === 1 ? 'moderate' : 'weak',
          party: 'claimant',
        }),
      })
      const data = await res.json()
      if (data.success) await patch({ settlement: data.analysis })
      else alert(data.error || 'Settlement estimate unavailable')
    } finally { setBusy('') }
  }

  async function generateAgreement() {
    if (!matter) return
    setBusy('agreement')
    try {
      const amount = matter.settlement?.recommendedSettlement?.mid || matter.claim_amount || 0
      const res = await fetch('/api/agent-commerce/draft-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: matter.counterparty || 'Counterparty',
          matter: matter.title,
          services: [{ description: `Settlement of dispute: ${matter.title}`, amount }],
          notes: 'Settlement agreement generated via CaseWin dispute resolution.',
        }),
      })
      const data = await res.json()
      if (data.success) await patch({ invoiceId: data.invoice.id, paymentLink: data.invoice.payment_link })
      else alert(data.error || 'Could not generate the agreement/invoice')
    } finally { setBusy('') }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading matter…</div>
  if (!matter) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      <div className="text-center"><p>Matter not found.</p><Link href="/matter" className="text-emerald-400 hover:underline text-sm">← Your matters</Link></div>
    </div>
  )

  const stageIdx = matter.stage === 'filed' ? STAGES.indexOf('agreement') : STAGES.indexOf(matter.stage)
  const s = matter.settlement

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/30 border-b border-emerald-900/40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/matter" className="text-emerald-400 text-sm hover:underline">← Your matters</Link>
          <h1 className="text-2xl font-bold mt-2">{matter.title}</h1>
          <p className="text-gray-400 text-sm">{matter.counterparty ? `vs ${matter.counterparty}` : ''} {matter.claim_amount ? `· ${ngn(matter.claim_amount)}` : ''}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          {STAGES.map((st, i) => (
            <div key={st} className="flex-1 flex items-center">
              <div className={`flex flex-col items-center ${i <= stageIdx ? 'text-emerald-400' : 'text-gray-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${i <= stageIdx ? 'bg-emerald-600/20 border-emerald-500' : 'border-gray-700'}`}>{i + 1}</div>
                <span className="text-[10px] mt-1 whitespace-nowrap">{STAGE_TITLE[st]}</span>
              </div>
              {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < stageIdx ? 'bg-emerald-600' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>
        {matter.stage === 'filed' && <p className="text-orange-400 text-xs text-center mt-2">This matter was escalated to court filing.</p>}
        {matter.stage === 'closed' && <p className="text-green-400 text-xs text-center mt-2">✓ Matter settled and closed.</p>}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Case narrative */}
        <section className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="font-bold mb-2">📋 The case</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{matter.narrative}</p>
          {matter.facts && Object.keys(matter.facts).length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
              {Object.entries(matter.facts).filter(([, v]) => v && typeof v !== 'object').map(([k, v]) => (
                <div key={k} className="bg-gray-800 rounded px-3 py-2"><span className="text-gray-500 capitalize">{k}: </span>{String(v)}</div>
              ))}
            </div>
          )}
        </section>

        {/* Evidence */}
        <section className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="font-bold mb-2">🔒 Evidence</h2>
          <p className="text-gray-500 text-xs mb-3">Files are hashed in your browser; only a tamper-proof hash + timestamp is stored.</p>
          <input type="file" onChange={addEvidence} disabled={busy === 'evidence'}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white hover:file:bg-emerald-600" />
          {busy === 'evidence' && <p className="text-gray-400 text-xs mt-2">Hashing & recording…</p>}
          <div className="mt-3 space-y-2">
            {(matter.evidence || []).map((ev, i) => (
              <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-200">📎 {ev.name}</p>
                <p className="text-gray-600 break-all">{ev.hash}</p>
              </div>
            ))}
            {(!matter.evidence || matter.evidence.length === 0) && <p className="text-gray-600 text-xs">No evidence attached yet.</p>}
          </div>
        </section>

        {/* Settlement */}
        <section className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">📊 Settlement estimate</h2>
            <button onClick={runSettlement} disabled={busy === 'settlement'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg font-semibold">
              {busy === 'settlement' ? 'Estimating…' : s ? 'Re-run' : 'Run estimate'}
            </button>
          </div>
          {s ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-2xl font-bold text-emerald-400">{s.settlementProbability}%</p><p className="text-[10px] text-gray-500">settle likelihood</p></div>
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-lg font-bold">{ngn(s.recommendedSettlement?.mid)}</p><p className="text-[10px] text-gray-500">target settlement</p></div>
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-lg font-bold capitalize">{s.litigationRisk}</p><p className="text-[10px] text-gray-500">litigation risk</p></div>
              </div>
              {s.recommendation && <p className="text-sm text-gray-300 bg-emerald-950/40 border border-emerald-900/40 rounded-lg p-3">{s.recommendation}</p>}
              {s.expectedTimeline && <p className="text-xs text-gray-500">Settle in {s.expectedTimeline.settle} vs litigate {s.expectedTimeline.litigate}</p>}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Run an estimate to see the settlement zone, timeline and litigation risk for this matter.</p>
          )}
        </section>

        {/* Agreement & payment (transactions layer) */}
        <section className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="font-bold mb-2">🧾 Agreement & payment</h2>
          {matter.payment_link ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Settlement agreement and invoice generated. Share the payment link with {matter.counterparty || 'the counterparty'}:</p>
              <div className="flex gap-2">
                <input readOnly value={matter.payment_link} className="flex-1 bg-gray-800 text-emerald-400 text-xs px-3 py-2 rounded-lg font-mono border border-gray-700 truncate" />
                <button onClick={() => { navigator.clipboard.writeText(matter.payment_link!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg">{copied ? '✓' : 'Copy'}</button>
              </div>
              {matter.stage !== 'closed' && (
                <button onClick={() => patch({ resolution: 'settled' })} className="w-full bg-green-700 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm">
                  Mark settled & close matter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">Once both sides agree, generate the settlement agreement, invoice and payment link in one step.</p>
              <button onClick={generateAgreement} disabled={busy === 'agreement'}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-semibold">
                {busy === 'agreement' ? 'Generating…' : 'Generate agreement & invoice'}
              </button>
            </div>
          )}
        </section>

        {/* Escalate */}
        {matter.stage !== 'closed' && matter.stage !== 'filed' && (
          <section className="bg-gray-900/60 rounded-xl p-5 border border-orange-900/30">
            <h2 className="font-bold mb-1 text-orange-300">Settlement failed?</h2>
            <p className="text-gray-500 text-sm mb-3">Escalate to court. The structured case file and evidence carry straight into filing — nothing is re-done.</p>
            <div className="flex gap-2">
              <button onClick={() => patch({ resolution: 'filed' })} className="bg-orange-700 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg font-semibold">Escalate to court filing</button>
              <Link href="/tools/filing" className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg font-semibold">Open E-Filing →</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
