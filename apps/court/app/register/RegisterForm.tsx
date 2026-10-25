'use client'

import { useState } from 'react'
import { Field, btn, cx, input } from '@/components/ui'

// Step 2: who you are. Submitted as a server action; a platform admin approves it.
export default function RegisterForm({ action, email, courts }: { action: (f: FormData) => void; email: string; courts: { id: string; name: string }[] }) {
  const [kind, setKind] = useState<'filer' | 'court_staff'>('filer')
  const [filerType, setFilerType] = useState('lawyer')

  return (
    <form action={action} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
      <p className="text-[13px] text-ink-500">Step 2 of 2</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">About you</h2>
      <p className="mt-1 text-sm text-ink-400">Signed in as {email}</p>
      <input type="hidden" name="kind" value={kind} />

      <div className="mt-5 grid grid-cols-2 gap-2">
        {(
          [
            ['filer', 'I want to e-file'],
            ['court_staff', 'I work at a court'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={cx('rounded-xl border px-4 py-3 text-sm font-semibold transition', kind === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50')}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input name="full_name" required className={input} autoComplete="name" />
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" className={input} autoComplete="tel" />
          </Field>
        </div>

        {kind === 'filer' ? (
          <>
            <Field label="I file as">
              <select name="filer_type" value={filerType} onChange={(e) => setFilerType(e.target.value)} className={input}>
                <option value="lawyer">Counsel (legal practitioner)</option>
                <option value="litigant">A party in person</option>
                <option value="agency">A government agency or ministry</option>
              </select>
            </Field>
            {filerType === 'lawyer' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Supreme Court enrolment no. (SCN)" required hint="We check this against the roll of legal practitioners.">
                  <input name="bar_number" required className={input + ' font-mono'} placeholder="SCN012345" />
                </Field>
                <Field label="Year of call">
                  <input name="year_of_call" inputMode="numeric" maxLength={4} className={input} />
                </Field>
              </div>
            )}
            <Field label={filerType === 'agency' ? 'Agency / ministry' : 'Law firm or chambers'}>
              <input name="law_firm" className={input} />
            </Field>
            <Field label="Address for service">
              <textarea name="address" className={input + ' min-h-[70px]'} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Court" required>
              <select name="court_id" required className={input} defaultValue="">
                <option value="" disabled>
                  Choose your court…
                </option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role you need">
                <select name="requested_role" className={input} defaultValue="clerk">
                  <option value="clerk">Registry clerk</option>
                  <option value="registrar">Registrar</option>
                  <option value="judge">Judge</option>
                  <option value="court_admin">Court administrator</option>
                </select>
              </Field>
              <Field label="Job title">
                <input name="position" className={input} placeholder="Senior Registrar II" />
              </Field>
              <Field label="Staff ID number">
                <input name="staff_number" className={input} />
              </Field>
              <Field label="Who can confirm you?" hint="e.g. the Chief Registrar">
                <input name="supervisor" className={input} />
              </Field>
            </div>
          </>
        )}
        <Field label="Anything else we should know?">
          <textarea name="note" className={input + ' min-h-[70px]'} />
        </Field>
        <button className={btn.primary + ' w-full !py-3'}>Submit for approval</button>
        <p className="text-center text-xs text-ink-400">Giving false details to a court registry may be an offence.</p>
      </div>
    </form>
  )
}
