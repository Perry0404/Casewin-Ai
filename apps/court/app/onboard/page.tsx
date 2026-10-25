import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PublicShell } from '@/components/site'
import { Field, Notice, btn, input } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Bring your court online' }

async function requestPilot(form: FormData) {
  'use server'
  const get = (k: string, n = 300) => String(form.get(k) ?? '').trim().slice(0, n)
  if (get('website')) redirect('/onboard?sent=1')
  if (!get('court_name') || !get('contact_name') || !get('contact_email') || !get('state')) redirect('/onboard?error=1')
  const { error } = await createAdminClient()
    .from('court_requests')
    .insert({
      court_name: get('court_name'),
      state: get('state', 60),
      contact_name: get('contact_name'),
      contact_role: get('contact_role') || null,
      contact_email: get('contact_email').toLowerCase(),
      contact_phone: get('contact_phone', 40) || null,
      message: get('message', 4000) || null,
    })
  redirect(error ? '/onboard?error=1' : '/onboard?sent=1')
}

const STEPS = [
  ['Week 1', 'We configure your divisions, judges, fee schedule and staff logins.'],
  ['Week 2', 'Registry training on site, and a parallel run alongside paper.'],
  ['Week 3', 'E-filing opens to the Bar. Cause lists go live.'],
  ['Ongoing', 'Monthly analytics review with the Chief Registrar.'],
]

export default function OnboardPage({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Pilot programme</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">Bring your court online.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            For Chief Judges, Chief Registrars and Directors of Court Administration. Tell us about your court and we will arrange a walkthrough.
          </p>
          <ol className="mt-10 space-y-6 border-l border-brass-300 pl-6">
            {STEPS.map(([k, v]) => (
              <li key={k} className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-brass-400 bg-parchment" />
                <p className="text-sm font-semibold text-ink-900">{k}</p>
                <p className="mt-0.5 text-ink-500">{v}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
          {searchParams.sent ? (
            <div className="py-10 text-center">
              <p className="font-display text-2xl font-semibold text-ink-900">Thank you.</p>
              <p className="mt-2 text-ink-500">We have your request and will be in touch within two working days.</p>
            </div>
          ) : (
            <form action={requestPilot} className="space-y-5">
              {searchParams.error && <Notice tone="bad">Please fill in the required fields and try again.</Notice>}
              <Field label="Court" required>
                <input name="court_name" className={input} placeholder="High Court of … State" required />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="State" required>
                  <input name="state" className={input} required />
                </Field>
                <Field label="Your role">
                  <input name="contact_role" className={input} placeholder="Chief Registrar" />
                </Field>
                <Field label="Your name" required>
                  <input name="contact_name" className={input} required />
                </Field>
                <Field label="Phone">
                  <input name="contact_phone" type="tel" className={input} />
                </Field>
              </div>
              <Field label="Official email" required>
                <input name="contact_email" type="email" className={input} required />
              </Field>
              <Field label="Anything we should know?">
                <textarea name="message" className={input + ' min-h-[100px]'} placeholder="Number of divisions, judges, current filing volumes…" />
              </Field>
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button className={btn.primary + ' w-full !py-3'}>Request a walkthrough</button>
            </form>
          )}
        </div>
      </div>
    </PublicShell>
  )
}
