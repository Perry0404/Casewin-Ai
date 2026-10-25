'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { FACILITY_TYPES, STATES } from '@/lib/constants'
import { Card, Field, Mono, Notice, btn, input } from '@/components/ui'
import { recordVisit } from '../actions'

function Submit({ n }: { n: number }) {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' !py-3'}>
      {pending ? 'Saving…' : `Save ${n} ${n === 1 ? 'person' : 'people'}`}
    </button>
  )
}

const small = input + ' !py-2 !text-sm'

export default function VisitForm({ defaultState }: { defaultState: string }) {
  const [res, action] = useFormState(recordVisit, undefined)
  const [rows, setRows] = useState(3)

  if (res?.created?.length && !res.error)
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-ink-900">Saved {res.created.length} files</h2>
        <p className="mt-1 text-sm text-ink-500">Give each family their reference and PIN (write it on paper or send by WhatsApp). The PINs are not shown again.</p>
        <ul className="mt-5 divide-y divide-ink-100">
          {res.created.map((r) => (
            <li key={r.ref} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink-800">{r.name}</span>
              <span>
                <Mono className="font-semibold">{r.ref}</Mono> · PIN <Mono className="font-semibold">{r.pin}</Mono>
              </span>
            </li>
          ))}
        </ul>
        <a href="/desk" className={btn.primary + ' mt-6'}>
          Back to my desk
        </a>
      </Card>
    )

  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="State" required>
            <select name="state" required defaultValue={defaultState} className={input}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Facility type" required>
            <select name="facility_type" defaultValue="correctional_centre" className={input}>
              {Object.entries(FACILITY_TYPES)
                .filter(([k]) => k !== 'unknown')
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Facility name" required>
            <input name="facility" required className={input} placeholder="e.g. Owerri Custodial Centre" />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-ink-700">
          <input type="checkbox" name="take_all" defaultChecked className="h-4 w-4 accent-ink-900" />
          Assign all of these to me (untick to put them on the board for others)
        </label>
      </Card>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i}>
          <p className="mb-3 text-[13px] font-semibold text-ink-500">Person {i + 1}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="Full name">
                <input name="person_name" className={small} />
              </Field>
            </div>
            <Field label="Age">
              <input name="person_age" type="number" min={1} max={120} className={small} />
            </Field>
            <Field label="Sex">
              <select name="person_sex" className={small} defaultValue="">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Arrested">
              <input name="arrested_on" type="date" className={small} />
            </Field>
            <Field label="Remanded">
              <input name="remanded_on" type="date" className={small} />
            </Field>
            <Field label="Last court date">
              <input name="last_hearing_on" type="date" className={small} />
            </Field>
            <Field label="Court">
              <input name="court_name" className={small} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Allegation">
                <input name="allegation" className={small} />
              </Field>
            </div>
            <Field label="Family contact name">
              <input name="contact_name" className={small} />
            </Field>
            <Field label="Family phone">
              <input name="contact_phone" type="tel" className={small} />
            </Field>
            <div className="sm:col-span-4">
              <Field label="Notes">
                <input name="notes" className={small} placeholder="Health, how long without a court date, what they asked for…" />
              </Field>
            </div>
          </div>
        </Card>
      ))}
      {res?.error && <Notice tone="bad">{res.error}</Notice>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setRows((r) => r + 1)} className={btn.secondary}>
          + Add another person
        </button>
        <Submit n={rows} />
      </div>
    </form>
  )
}
