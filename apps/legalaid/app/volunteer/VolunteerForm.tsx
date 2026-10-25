'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { LANGUAGES, PRACTICE_AREAS, ROLES, STATES } from '@/lib/constants'
import { Field, Notice, btn, cx, input } from '@/components/ui'
import { submitVolunteer } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' w-full !py-3'}>
      {pending ? 'Sending…' : 'Send for verification'}
    </button>
  )
}

export function Chips({ name, options, defaults = [] }: { name: string; options: readonly string[]; defaults?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input type="checkbox" name={name} value={o} defaultChecked={defaults.includes(o)} className="peer sr-only" />
          <span className="inline-block rounded-full border border-ink-200 px-3 py-1.5 text-[13px] text-ink-600 transition peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brass-400">
            {o}
          </span>
        </label>
      ))}
    </div>
  )
}

export default function VolunteerForm({ email, orgs }: { email: string; orgs: { id: string; name: string }[] }) {
  const [state, action] = useFormState(submitVolunteer, undefined)
  const [role, setRole] = useState('lawyer')

  return (
    <form action={action} className="space-y-5 rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-600">Step 2 of 2 · signed in as {email}</p>
      <h2 className="font-display text-2xl font-semibold text-ink-900">About you</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {(['lawyer', 'paralegal', 'law_student'] as const).map((r) => (
          <label key={r} className={cx('cursor-pointer rounded-xl border p-3 text-sm transition', role === r ? 'border-ink-900 ring-2 ring-ink-900' : 'border-ink-100 hover:border-ink-300')}>
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
            <span className="font-semibold text-ink-900">{ROLES[r]!.split(' (')[0]}</span>
          </label>
        ))}
      </div>
      <Field label="Full name" required hint={role === 'lawyer' ? 'Exactly as on the Roll of Legal Practitioners.' : undefined}>
        <input name="full_name" required className={input} />
      </Field>
      {role === 'lawyer' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Enrolment no." required hint="e.g. SCN012345">
            <input name="enrolment_number" required className={input + ' font-mono uppercase'} placeholder="SCN…" />
          </Field>
          <Field label="Year called">
            <input name="year_called" type="number" min={1960} max={2030} className={input} />
          </Field>
          <Field label="NBA branch">
            <input name="nba_branch" className={input} placeholder="e.g. Owerri" />
          </Field>
        </div>
      ) : (
        <Field label={role === 'law_student' ? 'Faculty of law / law school' : 'Organisation or chambers you work with'} required>
          <input name="institution" required className={input} />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (WhatsApp)" required>
          <input name="phone" type="tel" required className={input} />
        </Field>
        <Field label="State you are based in" required>
          <select name="state" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose…
            </option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="States you can take cases in" hint="Leave empty for just your own state.">
        <Chips name="states_covered" options={STATES} />
      </Field>
      <Field label="Languages you speak">
        <Chips name="languages" options={LANGUAGES} defaults={['English']} />
      </Field>
      <Field label="Areas you can help with">
        <Chips name="practice_areas" options={PRACTICE_AREAS} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cases you can carry at once">
          <select name="capacity" defaultValue="2" className={input}>
            {[1, 2, 3, 5, 8, 12, 20].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        {orgs.length > 0 && (
          <Field label="Organisation (optional)">
            <select name="org_id" defaultValue="" className={input}>
              <option value="">Independent</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <label className="flex gap-3 rounded-2xl bg-parchment p-4 text-sm leading-relaxed text-ink-700">
        <input type="checkbox" name="pledge" required className="mt-1 h-4 w-4 shrink-0 accent-ink-900" />
        <span>
          <b>Volunteer pledge.</b> I will not take money from anyone I am matched with. I will keep their details confidential, record what I do truthfully, act within 48
          hours of taking a case or release it, and{role !== 'lawyer' && ' work under the supervision of a lawyer and'} follow the Rules of Professional Conduct.
        </span>
      </label>
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      <Submit />
    </form>
  )
}
