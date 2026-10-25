'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { KINDS, STATUS } from '@/lib/constants'
import { date, dateTime } from '@/lib/format'
import { Badge, Field, Mono, Notice, btn, input } from '@/components/ui'
import { track } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' w-full !py-3'}>
      {pending ? 'Checking…' : 'Show my case'}
    </button>
  )
}

export default function TrackForm() {
  const [r, action] = useFormState(track, undefined)
  const found = r && !('error' in r) ? r : null

  return (
    <div className="space-y-6">
      <form action={action} className="grid gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-7">
        <Field label="Reference">
          <input name="ref" required placeholder="LA-7KQ-M2X" autoCapitalize="characters" className={input + ' font-mono uppercase'} />
        </Field>
        <Field label="PIN">
          <input name="pin" required inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="6 digits" className={input + ' font-mono'} />
        </Field>
        <Submit />
      </form>
      {r && 'error' in r && <Notice tone="bad">{r.error}</Notice>}
      {found && (
        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Mono className="!text-lg font-semibold text-ink-900">{found.ref}</Mono>
            <Badge tone={STATUS[found.status]?.tone ?? 'neutral'}>{STATUS[found.status]?.label ?? found.status}</Badge>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold text-ink-900">{found.statusText}</p>
          <p className="mt-1 text-sm text-ink-400">
            {KINDS[found.kind]?.short} · {found.state} · received {date(found.created_at)}
            {found.volunteerFirstName && <> · volunteer: {found.volunteerFirstName}</>}
            {found.next_hearing_on && <> · next court date {date(found.next_hearing_on)}</>}
          </p>
          <ol className="mt-8 space-y-5 border-l-2 border-ink-100 pl-6">
            {found.events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brass-400" />
                <p className="text-sm text-ink-800">{e.body}</p>
                <p className="mt-0.5 text-xs text-ink-400">{dateTime(e.created_at)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
