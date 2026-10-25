'use client'

import { useEffect, useRef, useState } from 'react'
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

// Offline: every answer is kept on this phone as it is typed. A visit submitted without
// signal is queued here and sent automatically when the phone is back online.
const DRAFT = 'la.visit.draft'
const QUEUE = 'la.visit.queue'
const SENT = 'la.visit.sent'
type Entries = [string, string][]
type Created = { ref: string; pin: string; name: string }[]
const read = <T,>(k: string, d: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? '') as T
  } catch {
    return d
  }
}
const write = (k: string, v: unknown) => {
  try {
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, JSON.stringify(v))
  } catch {}
}
const entriesOf = (f: HTMLFormElement): Entries => [...new FormData(f).entries()].filter(([, v]) => typeof v === 'string') as Entries
const toFormData = (e: Entries) => {
  const fd = new FormData()
  for (const [k, v] of e) fd.append(k, v)
  return fd
}

export default function VisitForm({ defaultState }: { defaultState: string }) {
  const [res, action] = useFormState(recordVisit, undefined)
  const [rows, setRows] = useState(3)
  const form = useRef<HTMLFormElement>(null)
  const [online, setOnline] = useState(true)
  const [queued, setQueued] = useState(0)
  const [sent, setSent] = useState<Created>([])
  const [restored, setRestored] = useState<Entries | null>(null)

  // Restore a draft, show anything sent while away, and keep the page available offline.
  useEffect(() => {
    setOnline(navigator.onLine)
    setQueued(read<Entries[]>(QUEUE, []).length)
    setSent(read<Created>(SENT, []))
    const d = read<Entries | null>(DRAFT, null)
    if (d?.length) {
      setRows(Math.max(3, d.filter(([k]) => k === 'person_name').length))
      setRestored(d)
    }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const on = () => {
      setOnline(true)
      void flush()
    }
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    if (navigator.onLine) void flush()
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Put restored values back into the inputs once the rows exist.
  useEffect(() => {
    if (!restored || !form.current) return
    const seen = new Map<string, number>()
    for (const [k, v] of restored) {
      const i = seen.get(k) ?? 0
      seen.set(k, i + 1)
      const el = form.current.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${k}"]`)[i]
      if (!el) continue
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = true
      else el.value = v
    }
    setRestored(null)
  }, [restored, rows])

  async function flush() {
    const q = read<Entries[]>(QUEUE, [])
    if (!q.length) return
    const left: Entries[] = []
    const done: Created = read<Created>(SENT, [])
    for (const e of q) {
      try {
        const r = await recordVisit(undefined, toFormData(e))
        if (r?.created?.length) done.push(...r.created)
        if (r?.error) left.push(e)
      } catch {
        left.push(e)
      }
    }
    write(QUEUE, left.length ? left : null)
    write(SENT, done.length ? done : null)
    setQueued(left.length)
    setSent(done)
  }

  function saveDraft() {
    if (form.current) write(DRAFT, entriesOf(form.current))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) {
      write(DRAFT, null)
      return
    }
    e.preventDefault()
    const q = read<Entries[]>(QUEUE, [])
    q.push(entriesOf(e.currentTarget))
    write(QUEUE, q)
    write(DRAFT, null)
    setQueued(q.length)
    e.currentTarget.reset()
  }

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
    <form ref={form} action={action} onSubmit={onSubmit} onInput={saveDraft} onChange={saveDraft} className="space-y-5">
      <div className={online ? 'border-l-4 border-verdict-500 bg-verdict-50 px-4 py-2.5 text-[14px] text-ink-800' : 'border-l-4 border-amberline-500 bg-amberline-50 px-4 py-2.5 text-[14px] text-ink-800'}>
        {online ? 'Online. ' : 'No signal — keep going. '}
        Answers are saved on this phone as you type{online ? '.' : ', and visits you save now will be sent when you are back online.'}
        {queued > 0 && <b> {queued} visit{queued === 1 ? '' : 's'} waiting to send.</b>}
      </div>
      {sent.length > 0 && (
        <Card>
          <p className="font-semibold text-ink-950">Sent while you were away — give each family their reference and PIN</p>
          <ul className="mt-3 divide-y divide-ink-200 text-[14px]">
            {sent.map((r) => (
              <li key={r.ref} className="flex justify-between py-2">
                <span>{r.name}</span>
                <span>
                  <Mono className="font-semibold">{r.ref}</Mono> · PIN <Mono className="font-semibold">{r.pin}</Mono>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              write(SENT, null)
              setSent([])
            }}
            className={btn.secondary + ' mt-3'}
          >
            I have written these down
          </button>
        </Card>
      )}
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
