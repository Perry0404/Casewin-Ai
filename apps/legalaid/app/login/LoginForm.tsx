'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Field, Notice, btn, input } from '@/components/ui'

export default function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [error, setError] = useState(initialError ?? null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    })
    if (error) {
      setBusy(false)
      return setError('That email and password don’t match. Check them and try again.')
    }
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : ''
    // Full navigation so the server sees the new session cookie.
    window.location.href = `/go${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {error && <Notice tone="bad">{error}</Notice>}
      <Field label="Email">
        <input name="email" type="email" autoComplete="username" className={input} required />
      </Field>
      <Field label="Password" hint="Same account as CaseWin, CaseWin Court and OpenLegal.">
        <input name="password" type="password" autoComplete="current-password" className={input} required />
      </Field>
      <button className={btn.primary + ' w-full !py-3'} disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
