'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Field, Notice, btn, cx, input } from '@/components/ui'

// Step 1 of registering: an account (email + password). Existing CaseWin users
// can sign in with the same details.
export default function AccountPanel() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [msg, setMsg] = useState<{ tone: 'bad' | 'good'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    const supabase = createClient()
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return void (window.location.href = '/go?next=' + encodeURIComponent(location.pathname))
      setMsg({ tone: 'bad', text: 'That email and password don’t match.' })
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.href } })
      if (error) setMsg({ tone: 'bad', text: error.message })
      else if (data.session) return void location.reload()
      else setMsg({ tone: 'good', text: 'Check your email to confirm your address, then come back here and sign in to finish.' })
    }
    setBusy(false)
  }

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
      <p className="text-[13px] text-ink-500">Step 1 of 2</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">Your account</h2>
      <div className="mt-5 flex rounded-xl bg-parchment p-1">
        {(['signup', 'signin'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cx('flex-1 rounded-lg py-2 text-sm font-semibold transition', mode === m ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-800')}>
            {m === 'signup' ? 'Create account' : 'I have an account'}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={input} />
        </Field>
        <Field label="Password" hint={mode === 'signup' ? 'At least 10 characters.' : 'CaseWin users: use the same password.'}>
          <input name="password" type="password" required minLength={mode === 'signup' ? 10 : 6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className={input} />
        </Field>
        <button disabled={busy} className={btn.primary + ' w-full !py-3'}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account & continue' : 'Sign in & continue'}
        </button>
      </form>
    </div>
  )
}
