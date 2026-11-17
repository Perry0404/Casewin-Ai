import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/site'
import { Field, Notice, btn, input } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/panel'
import { claimAccount } from './actions'

export const metadata: Metadata = { title: 'Set up your account', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  email: 'That is not the email address this invitation was made for.',
  short: 'Choose a password of at least 10 characters.',
  match: 'The two passwords don’t match.',
  failed: 'Something went wrong. Please try again.',
}

export default async function Claim({ params, searchParams }: { params: { token: string }; searchParams: { error?: string } }) {
  if (!params.token || params.token.length < 20) redirect('/login?error=link')
  const { data: m } = await createAdminClient()
    .from('la_members')
    .select('role, status, org:la_organisations(name)')
    .eq('access_token_hash', hashToken(params.token))
    .maybeSingle()
  if (!m || m.status !== 'approved') redirect('/login?error=link')
  const org = (m.org as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[13px] text-ink-500">Invitation{org ? ` · ${org}` : ''}</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.015em] text-ink-950">Set up your account</h1>
        <p className="mt-2 text-[15px] text-ink-600">
          {m.role === 'coordinator' ? 'You have been made coordinator' : 'You have been added'}
          {org ? ` for ${org}` : ''} on CaseWin Legal Aid. Confirm the email address this invitation was sent for, and choose a password. This link works once.
        </p>
        <form action={claimAccount} className="mt-8 space-y-4">
          {searchParams.error && ERRORS[searchParams.error] && <Notice tone="bad">{ERRORS[searchParams.error]}</Notice>}
          <input type="hidden" name="token" value={params.token} />
          <Field label="Your email address">
            <input name="email" type="email" required autoComplete="email" className={input} />
          </Field>
          <Field label="Choose a password" hint="At least 10 characters.">
            <input name="password" type="password" required minLength={10} autoComplete="new-password" className={input} />
          </Field>
          <Field label="Type it again">
            <input name="password2" type="password" required minLength={10} autoComplete="new-password" className={input} />
          </Field>
          <button className={btn.primary + ' w-full !py-3'}>Set up and sign in</button>
        </form>
        <p className="mt-6 text-[13px] text-ink-500">Afterwards, sign in at legalaid.casewinai.com/login with this email and password.</p>
      </main>
    </div>
  )
}
