'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { ORG_KINDS, STATES } from '@/lib/constants'
import { Field, Notice, btn, input } from '@/components/ui'
import { submitOrganisation } from '../volunteer/actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' w-full !py-3'}>
      {pending ? 'Sending…' : 'Register the organisation'}
    </button>
  )
}

export default function OrgForm({ email }: { email: string }) {
  const [state, action] = useFormState(submitOrganisation, undefined)
  return (
    <form action={action} className="space-y-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-600">Step 2 of 2 · signed in as {email}</p>
      <h2 className="font-display text-2xl font-semibold text-ink-900">The organisation</h2>
      <Field label="Registered name" required>
        <input name="name" required className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" required>
          <select name="kind" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose…
            </option>
            {Object.entries(ORG_KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="State (main office)" required>
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
      <Field label="Office address">
        <input name="address" className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Office phone" required>
          <input name="phone" type="tel" required className={input} />
        </Field>
        <Field label="Office email">
          <input name="email" type="email" className={input} />
        </Field>
        <Field label="Website">
          <input name="website" className={input} />
        </Field>
        <Field label="CAC registration no." hint="For NGOs and firms.">
          <input name="cac_number" className={input} />
        </Field>
      </div>
      <Field label="What legal aid work do you do?">
        <textarea name="description" rows={3} className={input} />
      </Field>
      <Field label="Your full name" required hint="You become the coordinator: you can see and assign your organisation’s cases.">
        <input name="your_name" required className={input} />
      </Field>
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      <Submit />
    </form>
  )
}
