'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { FACILITY_TYPES, KINDS, LANGUAGES, STATES } from '@/lib/constants'
import { Field, Notice, btn, cx, input } from '@/components/ui'
import { submitReport } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' w-full !py-4 !text-base'}>
      {pending ? 'Sending…' : 'Send — it’s free'}
    </button>
  )
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-7">
      <legend className="sr-only">{title}</legend>
      <p className="flex items-center gap-3 font-display text-xl font-semibold text-ink-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 font-sans text-xs font-bold text-white">{n}</span>
        {title}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </fieldset>
  )
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

export default function ReportForm() {
  const [state, action] = useFormState(submitReport, undefined)
  const [kind, setKind] = useState('detention')
  const [self, setSelf] = useState(false)
  const [remanded, setRemanded] = useState(false)
  const custody = kind === 'detention'

  return (
    <form action={action} className="space-y-5">
      <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0" aria-hidden />

      <Section n={1} title="What is happening?">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {Object.entries(KINDS).map(([k, v]) => (
            <label key={k} className={cx('cursor-pointer rounded-2xl border p-4 transition', kind === k ? 'border-ink-900 bg-ink-50 ring-2 ring-ink-900' : 'border-ink-100 hover:border-ink-300')}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              <span className="block font-semibold text-ink-900">{v.label}</span>
              <span className="mt-0.5 block text-[13px] text-ink-400">{v.help}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section n={2} title={custody ? 'Who is detained?' : 'Who needs help?'}>
        <label className="flex items-center gap-3 rounded-xl bg-parchment px-4 py-3 text-sm text-ink-700">
          <input type="checkbox" checked={self} onChange={(e) => setSelf(e.target.checked)} className="h-4 w-4 accent-ink-900" />
          {custody ? 'I am the person detained (e.g. using a borrowed phone)' : 'This is about me'}
        </label>
        <Field label="Full name" required>
          <input name="person_name" required minLength={3} className={input} placeholder="As the police or court would write it" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age" hint="Tell us if under 18 — children go first.">
            <input name="person_age" type="number" min={1} max={120} inputMode="numeric" className={input} />
          </Field>
          <Field label="Sex">
            <select name="person_sex" className={input} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
        </div>
        {custody && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Where are they held?">
                <select name="facility_type" className={input} defaultValue="police_station">
                  {Object.entries(FACILITY_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Name of the station or centre">
                <input name="facility" className={input} placeholder="e.g. Area F Police Division, Ikeja" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of arrest" hint="Best guess is fine.">
                <input name="arrested_on" type="date" max={today()} className={input} />
              </Field>
              <Field label="What are they accused of?">
                <input name="allegation" className={input} placeholder="If you know" />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-ink-700">
              <input type="checkbox" checked={remanded} onChange={(e) => setRemanded(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              They have been taken to court / remanded
            </label>
            {remanded && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date remanded">
                  <input name="remanded_on" type="date" max={today()} className={input} />
                </Field>
                <Field label="Which court">
                  <input name="court_name" className={input} placeholder="e.g. Magistrate Court, Owerri" />
                </Field>
                <Field label="Next court date">
                  <input name="next_hearing_on" type="date" className={input} />
                </Field>
              </div>
            )}
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State" required>
            <select name="state" required className={input} defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Local government area / town">
            <input name="lga" className={input} />
          </Field>
        </div>
      </Section>

      <Section n={3} title="What happened?">
        <Field label="In your own words" required hint="Any language is fine. Say what happened, who is involved, and what you need.">
          <textarea name="story" required minLength={30} rows={6} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Do they already have a lawyer?">
            <select name="has_lawyer" className={input} defaultValue="no">
              <option value="no">No</option>
              <option value="yes">Yes, but they need more help</option>
            </select>
          </Field>
          <Field label="Can the family pay a lawyer?">
            <select name="can_pay" className={input} defaultValue="no">
              <option value="no">No</option>
              <option value="yes">Some, but not full fees</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section n={4} title="How do we reach you?">
        {!self && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input name="reporter_name" className={input} />
            </Field>
            <Field label="Your relationship to them">
              <select name="relationship" className={input} defaultValue="family">
                <option value="family">Family</option>
                <option value="friend">Friend / neighbour</option>
                <option value="colleague">Employer / colleague</option>
                <option value="community">Community or religious leader</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
        )}
        {self && <input type="hidden" name="relationship" value="self" />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number (WhatsApp if possible)" required hint="The volunteer will call or WhatsApp this number.">
            <input name="reporter_phone" type="tel" required inputMode="tel" className={input} placeholder="0803 123 4567" />
          </Field>
          <Field label="Language you prefer">
            <select name="language" className={input} defaultValue="English">
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Email (optional)">
          <input name="reporter_email" type="email" className={input} />
        </Field>
      </Section>

      <div className="space-y-4 rounded-3xl bg-ink-950 p-5 text-white sm:p-7">
        <label className="flex gap-3 text-sm leading-relaxed text-ink-100">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 shrink-0 accent-brass-400" />
          <span>
            The information is true to the best of my knowledge, and I agree that CaseWin Legal Aid and the verified volunteer who takes this case may use it to
            give legal help. It is never published. False reports are removed.
          </span>
        </label>
        {state?.error && <Notice tone="bad">{state.error}</Notice>}
        <Submit />
      </div>
    </form>
  )
}
