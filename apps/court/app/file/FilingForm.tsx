'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { classifyFiling } from '@/lib/classify'
import { CASE_TYPES, PROCESS_TYPES, label } from '@/lib/constants'
import { Badge, Field, Notice, btn, cx, input } from '@/components/ui'
import type { Division } from '@/lib/data'

interface CourtOption {
  id: string
  name: string
  divisions: Division[]
}

interface Party {
  name: string
  address: string
}

interface Attached {
  file: File
  sha256: string | null
}

const STEPS = ['Court', 'Parties', 'Claim', 'Documents', 'Review']

async function sha256(file: File) {
  const buf = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function kb(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

export default function FilingForm({ courts }: { courts: CourtOption[] }) {
  const [step, setStep] = useState(0)
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '')
  const [divisionId, setDivisionId] = useState(courts[0]?.divisions[0]?.id ?? '')
  const [processType, setProcessType] = useState('writ')
  const [caseType, setCaseType] = useState('')
  const [claimants, setClaimants] = useState<Party[]>([{ name: '', address: '' }])
  const [defendants, setDefendants] = useState<Party[]>([{ name: '', address: '' }])
  const [reliefs, setReliefs] = useState('')
  const [summary, setSummary] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [docs, setDocs] = useState<Attached[]>([])
  const [filer, setFiler] = useState({ filer_type: 'lawyer', filer_name: '', filer_email: '', filer_phone: '', bar_number: '', law_firm: '' })
  const [website, setWebsite] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const court = courts.find((c) => c.id === courtId)
  const title = `${partyTitle(claimants)} v. ${partyTitle(defendants)}`
  const suggestion = useMemo(() => classifyFiling([title, reliefs, summary].join('\n'), processType), [title, reliefs, summary, processType])
  const effectiveType = caseType || suggestion.case_type

  function validate(s: number): string | null {
    if (s === 0 && !courtId) return 'Choose a court.'
    if (s === 1) {
      if (!claimants.some((p) => p.name.trim())) return 'Add at least one claimant or applicant.'
      if (!defendants.some((p) => p.name.trim())) return 'Add at least one defendant or respondent.'
    }
    if (s === 2 && reliefs.trim().length < 20) return 'Set out the reliefs claimed (at least a sentence).'
    if (s === 4) {
      if (!filer.filer_name.trim() || !filer.filer_email.trim()) return 'Enter your name and email.'
      if (filer.filer_type === 'lawyer' && !filer.bar_number.trim()) return 'Enter your Supreme Court enrolment number.'
      if (!agree) return 'Confirm the declaration to submit.'
    }
    return null
  }

  function next() {
    const v = validate(step)
    if (v) return setError(v)
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function addFiles(list: FileList | null) {
    if (!list) return
    const added = Array.from(list).slice(0, 10 - docs.length).map((file) => ({ file, sha256: null as string | null }))
    setDocs((d) => [...d, ...added])
    for (const a of added) {
      const h = await sha256(a.file)
      setDocs((d) => d.map((x) => (x.file === a.file ? { ...x, sha256: h } : x)))
    }
  }

  async function submit() {
    const v = validate(4)
    if (v) return setError(v)
    setError(null)
    try {
      let documents: { name: string; path: string; sha256: string | null }[] = []
      if (docs.length) {
        setBusy('Uploading documents…')
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ files: docs.map((d) => ({ name: d.file.name, size: d.file.size, type: d.file.type })) }),
        })
        const out = await res.json()
        if (!res.ok) throw new Error(out.error)
        const supabase = createClient()
        for (let i = 0; i < out.uploads.length; i++) {
          const u = out.uploads[i]
          const { error } = await supabase.storage.from('filings').uploadToSignedUrl(u.path, u.token, docs[i].file)
          if (error) throw new Error(`Upload of ${u.name} failed. Check your connection and try again.`)
        }
        documents = out.uploads.map((u: { name: string; path: string }, i: number) => ({ name: u.name, path: u.path, sha256: docs[i].sha256 }))
      }

      setBusy('Submitting to the registry…')
      const res = await fetch('/api/filings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          court_id: courtId,
          division_id: divisionId || null,
          process_type: processType,
          case_type: caseType || null,
          title,
          claimants: claimants.filter((p) => p.name.trim()),
          defendants: defendants.filter((p) => p.name.trim()),
          reliefs,
          summary,
          claim_amount: claimAmount.replace(/[^\d.]/g, ''),
          urgent,
          documents,
          website,
          ...filer,
        }),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error)
      setReference(out.reference)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  if (reference) {
    return (
      <div className="animate-rise rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-lift sm:p-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-verdict-50 text-verdict-600 ring-8 ring-verdict-50/50">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-6 font-display text-3xl font-semibold text-ink-900">Filed with the registry</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-500">Keep this tracking code. You will need it with your email to follow the filing.</p>
        <p className="mx-auto mt-6 inline-block rounded-2xl border border-dashed border-brass-400 bg-brass-50 px-8 py-4 font-mono text-3xl font-medium tracking-wider text-ink-900">
          {reference}
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm text-ink-400">
          Next, a registry clerk reviews the papers and assesses your filing fees. Your suit number is issued once payment is confirmed.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/track?ref=${reference}&email=${encodeURIComponent(filer.filer_email)}`} className={btn.primary}>
            Track this filing
          </Link>
          <button onClick={() => location.reload()} className={btn.secondary}>
            File another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="rounded-3xl border border-ink-100 bg-white shadow-card">
        <Stepper step={step} onJump={(i) => i < step && setStep(i)} />
        <div className="space-y-6 p-6 sm:p-8">
          {step === 0 && (
            <>
              <Field label="Court" required>
                <select
                  className={input}
                  value={courtId}
                  onChange={(e) => {
                    setCourtId(e.target.value)
                    setDivisionId(courts.find((c) => c.id === e.target.value)?.divisions[0]?.id ?? '')
                  }}
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              {court && court.divisions.length > 0 && (
                <Field label="Judicial division" required>
                  <select className={input} value={divisionId} onChange={(e) => setDivisionId(e.target.value)}>
                    {court.divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Originating process" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROCESS_TYPES.map((p) => (
                    <Choice key={p.value} active={processType === p.value} onClick={() => setProcessType(p.value)}>
                      {p.label}
                    </Choice>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <PartyList title="Claimants / applicants" parties={claimants} onChange={setClaimants} noun="claimant" />
              <PartyList title="Defendants / respondents" parties={defendants} onChange={setDefendants} noun="defendant" />
              <div className="rounded-xl bg-parchment px-4 py-3 text-sm">
                <span className="text-ink-400">Case title: </span>
                <span className="font-display font-semibold text-ink-900">{title}</span>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Reliefs claimed" required hint="List each relief as it appears in your process.">
                <textarea className={input + ' min-h-[140px]'} value={reliefs} onChange={(e) => setReliefs(e.target.value)} placeholder="1. A declaration that the claimant is entitled to the customary right of occupancy over the land known as…" />
              </Field>
              <Field label="Brief summary of facts" hint="Two or three sentences help the registry route your case correctly.">
                <textarea className={input + ' min-h-[110px]'} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Amount claimed (₦)" hint="Leave blank if there is no money claim.">
                  <input className={input} inputMode="decimal" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="0" />
                </Field>
                <Field label="Case type">
                  <select className={input} value={caseType} onChange={(e) => setCaseType(e.target.value)}>
                    <option value="">Suggested: {label(CASE_TYPES, suggestion.case_type)}</option>
                    {CASE_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-ink-900" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                <span className="text-sm">
                  <span className="font-medium text-ink-800">This filing is urgent</span>
                  <span className="block text-ink-400">For example, an ex parte motion, a threatened demolition, or a person in detention.</span>
                </span>
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-parchment/50 px-6 py-12 text-center transition hover:border-brass-400 hover:bg-brass-50/40">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-3 font-medium text-ink-800">Attach your process and supporting documents</span>
                <span className="mt-1 text-sm text-ink-400">PDF, Word or images · up to 10 files · 20 MB in total</span>
                <input type="file" multiple className="sr-only" accept=".pdf,.doc,.docx,image/png,image/jpeg" onChange={(e) => addFiles(e.target.files)} />
              </label>
              {docs.length > 0 && (
                <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
                  {docs.map((d) => (
                    <li key={d.file.name + d.file.size} className="flex items-center gap-4 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-[10px] font-bold uppercase text-ink-500">
                        {d.file.name.split('.').pop()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-800">{d.file.name}</span>
                        <span className="block font-mono text-[11px] text-ink-400">
                          {kb(d.file.size)} · {d.sha256 ? `SHA-256 ${d.sha256.slice(0, 12)}…` : 'fingerprinting…'}
                        </span>
                      </span>
                      <button className={btn.ghost} onClick={() => setDocs((x) => x.filter((y) => y !== d))}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-ink-400">
                Each file is fingerprinted in your browser and again by the registry. If a single byte changes later, the fingerprint no longer
                matches — proof the record was never altered.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="I am filing as">
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ['lawyer', 'Counsel'],
                    ['litigant', 'Party in person'],
                    ['agency', 'Government agency'],
                  ].map(([v, l]) => (
                    <Choice key={v} active={filer.filer_type === v} onClick={() => setFiler({ ...filer, filer_type: v })}>
                      {l}
                    </Choice>
                  ))}
                </div>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input className={input} value={filer.filer_name} onChange={(e) => setFiler({ ...filer, filer_name: e.target.value })} autoComplete="name" />
                </Field>
                <Field label="Email" required>
                  <input className={input} type="email" value={filer.filer_email} onChange={(e) => setFiler({ ...filer, filer_email: e.target.value })} autoComplete="email" />
                </Field>
                <Field label="Phone">
                  <input className={input} type="tel" value={filer.filer_phone} onChange={(e) => setFiler({ ...filer, filer_phone: e.target.value })} autoComplete="tel" />
                </Field>
                {filer.filer_type === 'lawyer' && (
                  <>
                    <Field label="Supreme Court enrolment no." required>
                      <input className={input} value={filer.bar_number} onChange={(e) => setFiler({ ...filer, bar_number: e.target.value })} placeholder="SCN012345" />
                    </Field>
                    <Field label="Law firm / chambers">
                      <input className={input} value={filer.law_firm} onChange={(e) => setFiler({ ...filer, law_firm: e.target.value })} />
                    </Field>
                  </>
                )}
              </div>
              <input tabIndex={-1} autoComplete="off" className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden />

              <div className="rounded-2xl bg-parchment p-5 text-sm">
                <h3 className="font-semibold text-ink-900">Summary</h3>
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[140px_1fr]">
                  <dt className="text-ink-400">Court</dt>
                  <dd className="text-ink-800">
                    {court?.name}
                    {divisionId && ` — ${court?.divisions.find((d) => d.id === divisionId)?.name}`}
                  </dd>
                  <dt className="text-ink-400">Case</dt>
                  <dd className="font-display font-semibold text-ink-900">{title}</dd>
                  <dt className="text-ink-400">Process</dt>
                  <dd className="text-ink-800">{label(PROCESS_TYPES, processType)}</dd>
                  <dt className="text-ink-400">Case type</dt>
                  <dd className="text-ink-800">{label(CASE_TYPES, effectiveType)}</dd>
                  <dt className="text-ink-400">Documents</dt>
                  <dd className="text-ink-800">{docs.length ? `${docs.length} attached` : 'None attached'}</dd>
                </dl>
              </div>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-ink-900" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="text-sm text-ink-600">
                  I confirm the information and documents are true and complete, and I understand the registry may query or reject a filing that
                  does not comply with the court’s rules.
                </span>
              </label>
            </>
          )}

          {error && <Notice tone="bad">{error}</Notice>}

          <div className="flex items-center justify-between border-t border-ink-100 pt-6">
            <button className={cx(btn.ghost, step === 0 && 'invisible')} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className={btn.primary} onClick={next}>
                Continue
              </button>
            ) : (
              <button className={btn.primary} onClick={submit} disabled={Boolean(busy) || docs.some((d) => !d.sha256)}>
                {busy ?? 'Submit to registry'}
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-600">Registry routing</p>
          <p className="mt-3 font-display text-xl font-semibold text-ink-900">{label(CASE_TYPES, effectiveType)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!caseType && <Badge tone="info">{suggestion.confidence}% match</Badge>}
            {(urgent || suggestion.urgent) && <Badge tone="warn">Urgent</Badge>}
          </div>
          {!caseType && suggestion.reasons.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-ink-500">
              {suggestion.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-brass-500">—</span> The filing {r}.
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-ink-400">Routing updates as you type. The registry confirms it when reviewing your filing.</p>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-6 text-sm text-ink-500 shadow-card">
          <p className="font-semibold text-ink-800">What happens next</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4">
            <li>The registry reviews your papers.</li>
            <li>Fees are assessed from the court’s schedule.</li>
            <li>You pay and enter your receipt number.</li>
            <li>Your suit number is issued.</li>
          </ol>
        </div>
      </aside>
    </div>
  )
}

function partyTitle(list: Party[]) {
  const named = list.filter((p) => p.name.trim())
  if (!named.length) return '…'
  const first = named[0].name.trim()
  const surname = first.split(/\s+/).length > 2 || /\b(ltd|limited|plc|bank|ministry|state|trustees|commission|police)\b/i.test(first) ? first : first.split(/\s+/).pop()
  return named.length > 1 ? `${surname} & ${named.length - 1 === 1 ? 'Anor.' : 'Ors.'}` : surname!
}

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex overflow-x-auto border-b border-ink-100 px-4 sm:px-6">
      {STEPS.map((s, i) => (
        <li key={s} className="flex-1">
          <button
            onClick={() => onJump(i)}
            className={cx(
              'flex w-full items-center gap-2 whitespace-nowrap border-b-2 px-2 py-4 text-sm font-medium transition',
              i === step ? 'border-ink-900 text-ink-900' : i < step ? 'border-transparent text-verdict-600' : 'border-transparent text-ink-300',
            )}
          >
            <span
              className={cx(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                i === step ? 'bg-ink-900 text-white' : i < step ? 'bg-verdict-50 text-verdict-600' : 'bg-ink-50 text-ink-400',
              )}
            >
              {i < step ? '✓' : i + 1}
            </span>
            {s}
          </button>
        </li>
      ))}
    </ol>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-xl border px-4 py-3 text-left text-sm font-medium transition',
        active ? 'border-ink-900 bg-ink-900 text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  )
}

function PartyList({ title, parties, onChange, noun }: { title: string; parties: Party[]; onChange: (p: Party[]) => void; noun: string }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink-800">{title}</legend>
      <div className="space-y-3">
        {parties.map((p, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border border-ink-100 p-3 sm:grid-cols-[1fr_1.2fr_auto]">
            <input
              className={input}
              placeholder={`Full name of ${noun} ${i + 1}`}
              value={p.name}
              onChange={(e) => onChange(parties.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className={input}
              placeholder="Address for service"
              value={p.address}
              onChange={(e) => onChange(parties.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))}
            />
            {parties.length > 1 && (
              <button type="button" className={btn.ghost} onClick={() => onChange(parties.filter((_, j) => j !== i))} aria-label={`Remove ${noun} ${i + 1}`}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className={cx(btn.ghost, 'mt-2')} onClick={() => onChange([...parties, { name: '', address: '' }])}>
        + Add another {noun}
      </button>
    </fieldset>
  )
}
