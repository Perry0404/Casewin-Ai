'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { COMPLAINT_KINDS, KINDS, STATUS } from '@/lib/constants'
import { date, dateTime } from '@/lib/format'
import { Badge, Field, Mono, Notice, btn, input } from '@/components/ui'
import { reportProblem, track } from './actions'

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' !py-3'}>
      {pending ? busy : label}
    </button>
  )
}

export default function TrackForm() {
  const [r, action] = useFormState(track, undefined)
  const [p, problem] = useFormState(reportProblem, undefined)
  const [ref, setRef] = useState('')
  const [pin, setPin] = useState('')
  const found = r && !('error' in r) ? r : null

  return (
    <div className="space-y-8">
      <form action={action} className="grid gap-4 border-t border-ink-950 pt-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Reference">
          <input name="ref" required value={ref} onChange={(e) => setRef(e.target.value)} placeholder="LA-7KQ-M2X" autoCapitalize="characters" className={input + ' font-mono uppercase'} />
        </Field>
        <Field label="PIN">
          <input name="pin" required value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="6 digits" className={input + ' font-mono'} />
        </Field>
        <Submit label="Show my case" busy="Checking…" />
      </form>
      {r && 'error' in r && <Notice tone="bad">{r.error}</Notice>}
      {found && (
        <>
          <section className="border border-ink-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Mono className="!text-[16px] font-semibold text-ink-950">{found.ref}</Mono>
              <Badge tone={STATUS[found.status]?.tone ?? 'neutral'}>{STATUS[found.status]?.label ?? found.status}</Badge>
            </div>
            <p className="mt-4 text-[22px] font-semibold leading-snug text-ink-950">{found.statusText}</p>
            <p className="mt-1 text-[14px] text-ink-500">
              {KINDS[found.kind]?.short} · {found.state} · received {date(found.created_at)}
              {found.volunteerFirstName && <> · volunteer: {found.volunteerFirstName}</>}
              {found.next_hearing_on && <> · next court date {date(found.next_hearing_on)}</>}
            </p>
            <ol className="mt-6 space-y-4 border-l border-ink-300 pl-5">
              {found.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[23.5px] top-2 h-2 w-2 bg-ink-950" />
                  <p className="text-[15px] text-ink-900">{e.body}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">{dateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t-4 border-brass-500 bg-parchment p-6">
            <h2 className="text-[18px] font-semibold text-ink-950">Is something wrong?</h2>
            <p className="mt-1 text-[14px] text-ink-600">
              This help is free. If anyone — including a volunteer — asks you for money, tell us here. Only CaseWin administrators see this; the volunteer does not.
            </p>
            {p?.ok ? (
              <div className="mt-4">
                <Notice tone="good">{p.ok}</Notice>
              </div>
            ) : (
              <form action={problem} className="mt-4 space-y-3">
                <input type="hidden" name="ref" value={ref} />
                <input type="hidden" name="pin" value={pin} />
                <select name="kind" required defaultValue="" className={input}>
                  <option value="" disabled>
                    What is the problem?
                  </option>
                  {Object.entries(COMPLAINT_KINDS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <textarea name="body" rows={3} placeholder="Tell us more (optional)" className={input} />
                {p?.error && <Notice tone="bad">{p.error}</Notice>}
                <Submit label="Send to CaseWin" busy="Sending…" />
              </form>
            )}
          </section>
        </>
      )}
    </div>
  )
}
