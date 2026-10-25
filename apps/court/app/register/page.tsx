import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublicShell } from '@/components/site'
import { Notice } from '@/components/ui'
import { getFiler, getRegistration, getStaff, getUser, isPlatformAdmin } from '@/lib/auth'
import { listCourts } from '@/lib/data'
import { createAdminClient, isConfigured } from '@/lib/supabase/server'
import { dateTime } from '@/lib/format'
import AccountPanel from './AccountPanel'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = { title: 'Register' }
export const dynamic = 'force-dynamic'

const str = (f: FormData, k: string, n = 300) => String(f.get(k) ?? '').trim().slice(0, n)

async function submitRegistration(form: FormData) {
  'use server'
  const user = await getUser()
  if (!user) redirect('/register')
  const existing = await getRegistration(user.id)
  if (existing?.status === 'pending') redirect('/register')

  const kind = str(form, 'kind') === 'court_staff' ? 'court_staff' : 'filer'
  const fullName = str(form, 'full_name', 160)
  if (!fullName) redirect('/register?error=name')

  const row: Record<string, unknown> = {
    user_id: user.id,
    kind,
    full_name: fullName,
    email: user.email,
    phone: str(form, 'phone', 40) || null,
    note: str(form, 'note', 2000) || null,
  }
  if (kind === 'filer') {
    const filerType = ['lawyer', 'litigant', 'agency'].includes(str(form, 'filer_type')) ? str(form, 'filer_type') : 'lawyer'
    if (filerType === 'lawyer' && !str(form, 'bar_number')) redirect('/register?error=scn')
    Object.assign(row, {
      filer_type: filerType,
      bar_number: str(form, 'bar_number', 40) || null,
      year_of_call: Number(str(form, 'year_of_call', 4)) || null,
      law_firm: str(form, 'law_firm', 160) || null,
      address: str(form, 'address', 400) || null,
    })
  } else {
    const { data: court } = await createAdminClient().from('courts').select('id').eq('id', str(form, 'court_id')).maybeSingle()
    if (!court) redirect('/register?error=court')
    Object.assign(row, {
      court_id: court.id,
      requested_role: ['court_admin', 'registrar', 'clerk', 'judge'].includes(str(form, 'requested_role')) ? str(form, 'requested_role') : 'clerk',
      position: str(form, 'position', 120) || null,
      staff_number: str(form, 'staff_number', 60) || null,
      supervisor: str(form, 'supervisor', 160) || null,
    })
  }
  await createAdminClient().from('registrations').insert(row)
  redirect('/register?sent=1')
}

const ERRORS: Record<string, string> = {
  name: 'Enter your full name.',
  scn: 'Counsel must give their Supreme Court enrolment number (SCN).',
  court: 'Choose the court you work at.',
}

export default async function RegisterPage({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  const user = isConfigured() ? await getUser() : null
  if (user && ((await getStaff()) || (await getFiler()) || (await isPlatformAdmin(user.id)))) redirect('/go')
  const registration = user ? await getRegistration(user.id) : null
  const courts = isConfigured() ? await listCourts() : []

  return (
    <PublicShell>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="text-[13px] text-ink-500">Register</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">One account for the court.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Every account is checked before it is switched on, so the registry always knows who filed what — and only real court officers see the
            registry.
          </p>
          <div className="mt-10 space-y-4">
            <Kind title="Counsel, parties and agencies" body="E-file new cases, pay assessed fees, answer registry queries and follow every case you filed — all from your filer portal." />
            <Kind title="Court staff" body="Registrars, clerks, judges and court administrators of an onboarded court. You get the registry for your court, with the role it confirms." />
          </div>
          <p className="mt-8 text-sm text-ink-400">
            Approval usually takes one working day. Already approved?{' '}
            <Link href="/login" className="font-medium text-ink-800 underline decoration-brass-300 underline-offset-4">
              Sign in
            </Link>
            . New to e-filing?{' '}
            <Link href="/e-filing" className="font-medium text-ink-800 underline decoration-brass-300 underline-offset-4">
              How it works
            </Link>
            .
          </p>
        </div>

        <div>
          {searchParams.error && (
            <div className="mb-5">
              <Notice tone="bad">{ERRORS[searchParams.error] ?? 'Please check the form and try again.'}</Notice>
            </div>
          )}
          {!user && <AccountPanel />}
          {user && registration?.status === 'pending' && (
            <div className="rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-lift">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amberline-50 text-2xl text-amberline-600">⏳</div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900">{searchParams.sent ? 'Application received' : 'Waiting for approval'}</h2>
              <p className="mt-2 text-ink-500">
                {registration.full_name}, your application to register as {registration.kind === 'filer' ? 'an e-filer' : 'court staff'} was received on{' '}
                {dateTime(registration.created_at)}. We verify every account before switching it on.
              </p>
              <p className="mt-4 text-sm text-ink-400">Sign in again after approval to reach your {registration.kind === 'filer' ? 'filer portal' : 'registry'}.</p>
            </div>
          )}
          {user && registration?.status !== 'pending' && (
            <>
              {registration?.status === 'rejected' && (
                <div className="mb-5">
                  <Notice tone="warn">
                    Your last application was not approved{registration.reviewer_note ? `: ${registration.reviewer_note}` : '.'} You can apply again below.
                  </Notice>
                </div>
              )}
              <RegisterForm action={submitRegistration} email={user.email ?? ''} courts={courts.map((c) => ({ id: c.id, name: c.name }))} />
            </>
          )}
        </div>
      </div>
    </PublicShell>
  )
}

function Kind({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-500">{body}</p>
    </div>
  )
}
