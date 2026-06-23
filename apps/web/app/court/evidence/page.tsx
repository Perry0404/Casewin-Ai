'use client'

import { useState } from 'react'
import Link from 'next/link'

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function EvidencePage() {
  const [tab, setTab] = useState<'register' | 'verify'>('register')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [receipt, setReceipt] = useState<{ hash: string; timestamp: string; fileName: string | null; persisted?: boolean } | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ found: boolean; registeredAt?: string; hash?: string } | null>(null)

  async function onRegister(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('Hashing file locally…'); setReceipt(null)
    try {
      const hash = await sha256(file)
      setMsg('Recording proof…')
      const res = await fetch('/api/court/evidence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, fileName: file.name }),
      })
      const data = await res.json()
      if (data.success) { setReceipt({ ...data.receipt, persisted: data.persisted }); setMsg('') }
      else setMsg(data.error || 'Failed to register')
    } catch { setMsg('Could not hash/register the file.') }
    finally { setBusy(false); e.target.value = '' }
  }

  async function onVerify(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('Hashing file locally…'); setVerifyResult(null)
    try {
      const hash = await sha256(file)
      const res = await fetch(`/api/court/evidence?hash=${hash}`)
      const data = await res.json()
      if (data.success) { setVerifyResult({ found: data.found, registeredAt: data.record?.registeredAt, hash }); setMsg('') }
      else setMsg(data.error || 'Failed to verify')
    } catch { setMsg('Could not hash/verify the file.') }
    finally { setBusy(false); e.target.value = '' }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/30 border-b border-orange-900/40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/tools#court" className="text-orange-300 text-sm hover:underline">← Court infrastructure</Link>
          <h1 className="text-2xl font-bold mt-2">🔒 Evidence Verification</h1>
          <p className="text-gray-400 text-sm">We don’t store evidence on a server — we store <span className="text-white">proof</span>. Your file is hashed in your browser; only the hash is recorded with a timestamp.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {(['register', 'verify'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {t === 'register' ? 'Register evidence' : 'Verify evidence'}
            </button>
          ))}
        </div>

        {tab === 'register' ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <p className="text-gray-400 text-sm mb-4">Select a file to create a tamper-proof timestamp. The file never leaves your device.</p>
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input type="file" onChange={onRegister} disabled={busy}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-500" />
            </label>
            {msg && <p className="text-gray-400 text-sm mt-3">{msg}</p>}
            {receipt && (
              <div className="mt-5 bg-orange-950/30 rounded-lg p-4 border border-orange-900/40 space-y-2">
                <p className="text-orange-300 text-xs font-semibold">PROOF RECORDED</p>
                <p className="text-xs text-gray-400 break-all"><span className="text-gray-500">SHA-256:</span> {receipt.hash}</p>
                <p className="text-xs text-gray-400"><span className="text-gray-500">File:</span> {receipt.fileName}</p>
                <p className="text-xs text-gray-400"><span className="text-gray-500">Timestamp:</span> {new Date(receipt.timestamp).toLocaleString()}</p>
                {receipt.persisted === false && <p className="text-yellow-400 text-xs">Note: proof returned but not persisted (verification store not configured).</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <p className="text-gray-400 text-sm mb-4">Select a file to check whether it was registered before — and that it hasn’t been altered since.</p>
            <input type="file" onChange={onVerify} disabled={busy}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-500" />
            {msg && <p className="text-gray-400 text-sm mt-3">{msg}</p>}
            {verifyResult && (
              <div className={`mt-5 rounded-lg p-4 border ${verifyResult.found ? 'bg-green-950/30 border-green-900/40' : 'bg-gray-800 border-gray-700'}`}>
                {verifyResult.found ? (
                  <>
                    <p className="text-green-400 text-sm font-semibold">✓ Verified — unaltered</p>
                    <p className="text-xs text-gray-400 mt-1">Registered: {verifyResult.registeredAt ? new Date(verifyResult.registeredAt).toLocaleString() : '—'}</p>
                  </>
                ) : (
                  <p className="text-gray-300 text-sm">No record found for this exact file. It was never registered, or it has been modified since.</p>
                )}
                <p className="text-[11px] text-gray-500 break-all mt-2">SHA-256: {verifyResult.hash}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
