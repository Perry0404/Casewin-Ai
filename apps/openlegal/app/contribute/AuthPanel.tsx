'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [msg, setMsg] = useState<{ tone: 'bad' | 'good'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    if (mode === 'signin') {
      const { error } = await supabase().auth.signInWithPassword({ email, password })
      if (error) setMsg({ tone: 'bad', text: 'That email and password don’t match.' })
      else return location.reload()
    } else {
      const { data, error } = await supabase().auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/contribute` } })
      if (error) setMsg({ tone: 'bad', text: error.message })
      else if (data.session) return location.reload()
      else setMsg({ tone: 'good', text: 'Check your email to confirm your account, then sign in here.' })
    }
    setBusy(false)
  }

  return (
    <div className="rounded-3xl border border-ink-line bg-paper p-6 shadow-card sm:p-8">
      <div className="flex rounded-xl bg-white p-1 ring-1 ring-ink-line">
        {(['signup', 'signin'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-ink text-white' : 'text-ink-3 hover:text-ink'}`}>
            {m === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>
      <p className="mt-5 text-sm text-ink-3">Already use CaseWin? Sign in with the same email and password.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5" />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5" />
        {msg && <p className={`rounded-xl px-4 py-3 text-sm ${msg.tone === 'bad' ? 'bg-red-50 text-red-700' : 'bg-naija-50 text-naija-700'}`}>{msg.text}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-naija-500 px-5 py-3 font-semibold text-white transition hover:bg-naija-600 disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
