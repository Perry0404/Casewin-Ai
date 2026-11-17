import type { Metadata } from 'next'
import { createHash } from 'crypto'
import { redirect } from 'next/navigation'
import { PublicShell } from '@/components/site'
import { Field, Notice, btn, input } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/server'
import { acceptInvite } from './actions'

export const metadata: Metadata = { title: 'Admin invitation', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  email: 'That is not the email address this invitation was made for.',
  short: 'Choose a password of at least 10 characters.',
  match: 'The two passwords don’t match.',
  exists: 'This email already has a CaseWin account. Ask an admin to add you from the Admins page instead.',
}

export default async function Invite({ params, searchParams }: { params: { token: string }; searchParams: { error?: string } }) {
  const { data: inv } = await createAdminClient()
    .from('admin_invites')
    .select('full_name')
    .eq('token_hash', createHash('sha256').update(params.token ?? '').digest('hex'))
    .is('used_at', null)
    .maybeSingle()
  if (!inv) redirect('/login?error=invite')

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[13px] text-ink-500">Invitation</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">Join the CaseWin Justice admin</h1>
        <p className="mt-3 text-[15px] text-ink-600">
          You have been invited to administer CaseWin Court, OpenLegal Nigeria and CaseWin Legal Aid. Confirm the email address this invitation was sent for, and choose a
          password. This link works once.
        </p>
        <form action={acceptInvite} className="mt-8 space-y-4">
          {searchParams.error && ERRORS[searchParams.error] && <Notice tone="bad">{ERRORS[searchParams.error]}</Notice>}
          <input type="hidden" name="token" value={params.token} />
          <Field label="Your email address">
            <input name="email" type="email" required autoComplete="email" className={input} />
          </Field>
          <Field label="Your name">
            <input name="full_name" defaultValue={inv.full_name ?? ''} required className={input} />
          </Field>
          <Field label="Choose a password" hint="At least 10 characters.">
            <input name="password" type="password" required minLength={10} autoComplete="new-password" className={input} />
          </Field>
          <Field label="Type it again">
            <input name="password2" type="password" required minLength={10} autoComplete="new-password" className={input} />
          </Field>
          <button className={btn.primary + ' w-full !py-3'}>Set up and open the admin</button>
        </form>
      </div>
    </PublicShell>
  )
}
