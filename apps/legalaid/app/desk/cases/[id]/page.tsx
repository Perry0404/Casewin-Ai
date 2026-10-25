import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { canWork, needsSupervisor, requireMember } from '@/lib/auth'
import { eligibility } from '@/lib/eligibility'
import { createAdminClient } from '@/lib/supabase/server'
import { ACTIONS, DOC_KINDS, FACILITY_TYPES, KINDS, LAWYER_ONLY_ACTIONS, OPENLEGAL_URL, OUTCOMES, SAFE_CONTACT, STATUS, VULNERABLE } from '@/lib/constants'
import { SEVERITY, assess, rule } from '@/lib/triage'
import { initials, whatsapp, intlPhone } from '@/lib/cases'
import { date, dateTime } from '@/lib/format'
import { Badge, Card, CardTitle, Field, Mono, Notice, btn, cx, input } from '@/components/ui'
import { assignTo, claimCase, logAction, markSpam, recordOutcome, releaseCase, updateFacts } from '../../actions'
import { linkCourtCase, openDocument, superviseCase, uploadDocument } from '../../case-actions'

export const metadata: Metadata = { title: 'Case file', robots: { index: false } }

const ERR: Record<string, string> = {
  capacity: 'You are at your case limit. Resolve or release a case first, or raise your capacity.',
  taken: 'Someone else took this case a moment ago.',
  'verify-first': 'Confirm the facts (how you verified them) before recording an outcome.',
  note: 'Write the note.',
  reason: 'Give a reason.',
  assign: 'You can only assign to approved members of your organisation.',
  conflict: 'Confirm that you have no conflict of interest before taking the case.',
  supervise: 'Law students and paralegals need a supervising lawyer on the case before court steps, drafts or an outcome.',
  file: 'Choose a file to upload.',
  'too-big': 'That file is over 10 MB. Take a smaller photo or split the PDF.',
  'file-type': 'Only PDF and photos (JPG, PNG, WEBP, HEIC) can be added.',
  upload: 'The upload did not go through. Try again.',
  'no-court-case': 'No case with that suit number is on CaseWin Court. Check the number, or keep recording dates by hand.',
  'many-court-cases': 'More than one court has a case with that number. Ask an administrator to link it.',
}
const VERIFY = ['Spoke with the person directly', 'Visited the facility and saw them', 'Saw the charge sheet / remand warrant', 'Confirmed with the police or court registry', 'Spoke with family and confirmed details']

export default async function CasePage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string; claimed?: string } }) {
  const m = await requireMember()
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('*').eq('id', params.id).maybeSingle()
  if (!c) notFound()
  const works = canWork(m, c)
  const inMyStates = m.isAdmin || (m.states_covered.length ? m.states_covered : [m.state]).includes(c.state)
  const open = !['resolved', 'closed', 'spam'].includes(c.status)
  const { data: holder } = c.assigned_to ? await db.from('la_members').select('role').eq('user_id', c.assigned_to).maybeSingle() : { data: null }
  // A lawyer in the state may open a student's or paralegal's case to supervise it.
  const canSupervise =
    m.role === 'lawyer' && open && inMyStates && !c.supervisor_id && !!c.assigned_to && c.assigned_to !== m.user_id && (holder?.role === 'law_student' || holder?.role === 'paralegal')
  if (!works && !canSupervise && !(c.status === 'new' && inMyStates)) notFound()
  const a = assess(c)
  const blocked = works && needsSupervisor(holder ?? { role: 'lawyer' }, c)
  const elig = eligibility(c)
  const [{ data: events }, { data: assignee }, { data: team }] = await Promise.all([
    works ? db.from('la_case_events').select('*').eq('case_id', c.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    c.assigned_to ? db.from('la_members').select('full_name, phone').eq('user_id', c.assigned_to).maybeSingle() : Promise.resolve({ data: null }),
    m.isAdmin || m.role === 'coordinator'
      ? (m.isAdmin ? db.from('la_members').select('user_id, full_name, state').eq('status', 'approved').order('full_name').limit(500) : db.from('la_members').select('user_id, full_name, state').eq('status', 'approved').eq('org_id', m.org_id ?? '00000000-0000-0000-0000-000000000000'))
      : Promise.resolve({ data: [] }),
  ])
  const [{ data: docs }, { data: courtCase }, { data: hearings }, { data: supervisor }] = await Promise.all([
    works ? db.from('la_documents').select('id, kind, name, size, created_at').eq('case_id', c.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    works && c.court_case_id
      ? db.from('cases').select('suit_number, title, status, next_hearing_at, court:courts(name)').eq('id', c.court_case_id).maybeSingle()
      : Promise.resolve({ data: null }),
    works && c.court_case_id
      ? db.from('hearings').select('scheduled_for, purpose, outcome, adjournment_reason').eq('case_id', c.court_case_id).order('scheduled_for', { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),
    c.supervisor_id ? db.from('la_members').select('full_name, enrolment_number').eq('user_id', c.supervisor_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const callOk = c.safe_contact === 'yes'
  const textOk = c.safe_contact === 'yes' || c.safe_contact === 'text_only'
  const hello = `Hello${c.reporter_name ? ' ' + c.reporter_name.split(' ')[0] : ''}, this is ${m.full_name}, a volunteer ${m.role === 'lawyer' ? 'lawyer' : 'with CaseWin Legal Aid'}. I have taken your request ${c.ref} about ${c.person_name}. This help is free — nobody should ask you for money. When can we talk?`
  const wa = textOk ? whatsapp(c.reporter_phone, hello) : null

  return (
    <>
      {searchParams.error && ERR[searchParams.error] && <div className="mb-6"><Notice tone="bad">{ERR[searchParams.error]}</Notice></div>}
      {searchParams.claimed && <div className="mb-6"><Notice tone="good">The case is yours. Contact the family now — the 48-hour clock has started.</Notice></div>}
      {searchParams.saved && <div className="mb-6"><Notice tone="good">Saved to the file.</Notice></div>}
      {works && c.safe_contact !== 'yes' && (
        <div className="mb-6 border-l-4 border-seal-500 bg-seal-50 px-5 py-4">
          <p className="text-[15px] font-semibold text-seal-600">Safety: {SAFE_CONTACT[c.safe_contact]?.short}</p>
          {c.safe_contact_note && <p className="mt-1 text-[15px] text-ink-900">{c.safe_contact_note}</p>}
          <p className="mt-1 text-[13px] text-ink-600">Someone who harms the reporter may see their phone. Follow these instructions exactly. Automatic texts to this number are switched off.</p>
        </div>
      )}
      {blocked && (
        <div className="mb-6">
          <Notice tone="warn">
            This case is held by a {holder?.role === 'paralegal' ? 'paralegal' : 'law student'} and has no supervising lawyer yet. Contact, visits and notes are fine; court steps,
            drafts and the outcome wait for a lawyer to supervise.
          </Notice>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
            {KINDS[c.kind]?.short} · <Mono>{c.ref}</Mono>
          </p>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-ink-900">
            {works ? c.person_name : initials(c.person_name)}
            {c.person_age != null && <span className="text-ink-400">, {c.person_age}</span>}
          </h1>
          <p className="mt-1.5 text-ink-500">
            {c.facility ? `${c.facility} · ` : ''}
            {c.facility_type ? FACILITY_TYPES[c.facility_type] + ' · ' : ''}
            {c.lga ? `${c.lga}, ` : ''}
            {c.state}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={SEVERITY[a.severity].tone}>{SEVERITY[a.severity].label}</Badge>
          <Badge tone={STATUS[c.status]?.tone}>{STATUS[c.status]?.label}</Badge>
          <Badge tone={c.verified_at ? 'good' : 'neutral'}>{c.verified_at ? 'Facts verified' : 'Not yet verified'}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {c.kind === 'detention' && (
            <Card>
              <CardTitle sub="Computed from the dates on file. Update them as you learn more.">Custody clock</CardTitle>
              <div className="grid grid-cols-3 gap-4">
                <Clock label="Days since arrest" v={a.daysHeld} />
                <Clock label="Days on remand" v={a.remandDays} />
                <Clock label="Days since last hearing" v={a.daysSinceHearing} />
              </div>
              {a.flags.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {a.flags.map((f) => {
                    const r = rule(f.rule)
                    return (
                      <li key={f.text} className={cx('rounded-xl px-4 py-3 text-sm ring-1 ring-inset', f.severity === 'critical' ? 'bg-seal-50 ring-seal-500/20' : f.severity === 'urgent' ? 'bg-amberline-50 ring-amberline-500/25' : 'bg-ink-50 ring-ink-500/15')}>
                        <p className="font-semibold text-ink-900">{f.text}</p>
                        <p className="mt-0.5 text-ink-600">
                          {r.text}{' '}
                          {r.q ? (
                            <a href={`${OPENLEGAL_URL}/search?q=${encodeURIComponent(r.q)}`} target="_blank" rel="noreferrer" className="font-mono text-xs underline">
                              {r.ref}
                            </a>
                          ) : (
                            <span className="font-mono text-xs">{r.ref}</span>
                          )}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )}

          <Card>
            <CardTitle sub={`Reported ${dateTime(c.created_at)} via ${c.channel}`}>What happened</CardTitle>
            <dl className="mb-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Fact k="Allegation" v={c.allegation} />
              <Fact k="Arrested" v={c.arrested_on && date(c.arrested_on)} />
              <Fact k="Remanded" v={c.remanded_on && date(c.remanded_on)} />
              <Fact k="Court" v={c.court_name} />
              <Fact k="Charge / suit no." v={c.charge_number} />
              <Fact k="Next court date" v={c.next_hearing_on && date(c.next_hearing_on)} />
              <Fact k="Already has a lawyer" v={c.has_lawyer ? 'Yes' : 'No'} />
              <Fact k="Can pay something" v={c.can_pay ? 'Some' : 'No'} />
            </dl>
            <p className="whitespace-pre-wrap rounded-xl bg-parchment p-4 text-[15px] leading-relaxed text-ink-800">{c.story}</p>
          </Card>

          {works && (
            <Card>
              <CardTitle sub="Everything you do goes on the file. Tick ‘tell the family’ to show them a plain-language update.">Record what you did</CardTitle>
              <form action={logAction} className="space-y-4">
                <input type="hidden" name="id" value={c.id} />
                <Field label="Action">
                  <select name="kind" className={input} defaultValue="contacted_family">
                    {Object.entries(ACTIONS).map(([k, v]) => (
                      <option key={k} value={k} disabled={blocked && LAWYER_ONLY_ACTIONS.includes(k)}>
                        {v.label}
                        {blocked && LAWYER_ONLY_ACTIONS.includes(k) ? ' — needs supervising lawyer' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Notes (private to the file)">
                  <textarea name="note" rows={3} className={input} />
                </Field>
                <Field label="Update for the family (optional)" hint="They see this when they track the case. Plain words, no legal jargon.">
                  <input name="public_text" className={input} placeholder="e.g. I visited him today. A bail application will be filed on Monday." />
                </Field>
                {!c.verified_at && (
                  <Field label="Have you confirmed the facts are real?" hint="Unverified cases are not counted in public figures.">
                    <select name="verify_method" className={input} defaultValue="">
                      <option value="">Not yet</option>
                      {VERIFY.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <button className={btn.primary}>Save to the file</button>
              </form>
            </Card>
          )}

          {works && (
            <Card>
              <CardTitle>Timeline</CardTitle>
              <ol className="space-y-4 border-l-2 border-ink-100 pl-5">
                {(events ?? []).map((e) => (
                  <li key={e.id} className="relative">
                    <span className={cx('absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white', e.public ? 'bg-brass-400' : 'bg-ink-300')} />
                    <p className="text-sm text-ink-800">{e.body}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {e.actor_label ?? 'System'} · {dateTime(e.created_at)}
                      {e.public && ' · seen by family'}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!works && canSupervise ? (
            <Card className="ring-1 ring-ink-950">
              <CardTitle sub={`Held by ${assignee?.full_name ?? 'a volunteer'}. As supervising lawyer you are responsible for court steps, drafts and the outcome, and you can see the full file.`}>
                Supervise this case
              </CardTitle>
              <form action={superviseCase} className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex gap-3 text-[14px] text-ink-800">
                  <input type="checkbox" name="no_conflict" required className="mt-1 h-4 w-4 shrink-0 accent-ink-950" />
                  <span>I have no conflict of interest: I don’t act for, and am not related to, anyone on the other side of this matter.</span>
                </label>
                <button className={btn.primary + ' w-full !py-3'}>I’ll supervise it</button>
              </form>
            </Card>
          ) : !works ? (
            <Card className="ring-1 ring-ink-950">
              <CardTitle sub="Contact details and the full name unlock when you take it. The 48-hour clock starts then.">Take this case</CardTitle>
              <form action={claimCase} className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex gap-3 text-[14px] text-ink-800">
                  <input type="checkbox" name="no_conflict" required className="mt-1 h-4 w-4 shrink-0 accent-ink-950" />
                  <span>I have no conflict of interest: I don’t act for, and am not related to, the police officer, complainant or anyone on the other side.</span>
                </label>
                {(m.role === 'law_student' || m.role === 'paralegal') && (
                  <p className="text-[13px] text-ink-500">As a {m.role === 'paralegal' ? 'paralegal' : 'law student'} you can contact, visit and record; a lawyer must supervise before court steps.</p>
                )}
                <button className={btn.primary + ' w-full !py-3'}>I’ll take it</button>
              </form>
            </Card>
          ) : (
            <Card>
              <CardTitle sub={c.reporter_relationship ? `Reporter: ${c.reporter_relationship}` : undefined}>Contact</CardTitle>
              <p className="font-medium text-ink-900">{c.reporter_name ?? (c.reporter_relationship === 'self' ? c.person_name : 'Reporter')}</p>
              <p className="font-mono text-sm text-ink-500">{c.reporter_phone ?? 'No phone'}</p>
              {c.language && <p className="mt-1 text-sm text-ink-400">Prefers {c.language}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className={btn.primary}>
                    WhatsApp
                  </a>
                )}
                {callOk && intlPhone(c.reporter_phone) && (
                  <a href={`tel:+${intlPhone(c.reporter_phone)}`} className={btn.secondary}>
                    Call
                  </a>
                )}
                {!textOk && <p className="text-[13px] font-medium text-seal-600">Do not use this number — see the safety note.</p>}
              </div>
              {c.person_phone && <p className="mt-4 text-sm text-ink-500">Person’s own phone: <span className="font-mono">{c.person_phone}</span></p>}
              {c.first_action_due && !c.first_action_at && (
                <p className={cx('mt-4 text-sm font-semibold', new Date(c.first_action_due) < new Date() ? 'text-seal-600' : 'text-amberline-600')}>
                  First action due {dateTime(c.first_action_due)}
                </p>
              )}
              {assignee && c.assigned_to !== m.user_id && <p className="mt-4 text-sm text-ink-500">Assigned to {assignee.full_name}</p>}
              {supervisor && (
                <p className="mt-1 text-sm text-ink-500">
                  Supervising lawyer: {supervisor.full_name}
                  {supervisor.enrolment_number ? ` (${supervisor.enrolment_number})` : ''}
                </p>
              )}
            </Card>
          )}

          {works && !blocked && c.kind === 'detention' && (
            <Card>
              <CardTitle sub="Pre-filled from this file. Review every line before you sign or file.">Drafts</CardTitle>
              <div className="flex flex-col gap-2">
                <Link href={`/desk/cases/${c.id}/draft/bail`} className={btn.secondary}>
                  Bail application
                </Link>
                <Link href={`/desk/cases/${c.id}/draft/frep`} className={btn.secondary}>
                  Fundamental rights (release) application
                </Link>
                <Link href={`/desk/cases/${c.id}/draft/letter`} className={btn.secondary}>
                  Letter to the police / prosecution
                </Link>
              </div>
            </Card>
          )}

          {works && (
            <Card>
              <CardTitle sub="A guide only. Someone in custody is helped first; questions after.">Means and circumstances</CardTitle>
              <p className={cx('text-[15px] font-semibold', elig.likely ? 'text-verdict-600' : 'text-ink-900')}>{elig.likely ? 'Likely to qualify for free legal help' : 'Check whether they qualify'}</p>
              <dl className="mt-3 space-y-1.5 text-[14px]">
                <Fact k="Monthly income" v={elig.income} />
                <Fact k="Circumstances" v={(c.vulnerable ?? []).map((v: string) => VULNERABLE[v]).filter(Boolean).join(', ') || null} />
                {elig.reasons.length > 0 && <Fact k="Why" v={elig.reasons.join('; ')} />}
              </dl>
              {elig.note && <p className="mt-3 text-[13px] text-ink-600">{elig.note}</p>}
            </Card>
          )}

          {works && (
            <section id="documents">
              <Card>
                <CardTitle sub="Private. Opened only through links that expire in 5 minutes; every opening is recorded.">Documents</CardTitle>
                {(docs ?? []).length > 0 && (
                  <ul className="mb-4 divide-y divide-ink-200 border-y border-ink-200">
                    {(docs ?? []).map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0 text-[14px]">
                          <span className="block truncate font-medium text-ink-950">{d.name}</span>
                          <span className="text-[12px] text-ink-500">
                            {DOC_KINDS[d.kind]} · {(d.size / 1024).toFixed(0)} KB · {date(d.created_at)}
                          </span>
                        </span>
                        <form action={openDocument}>
                          <input type="hidden" name="doc" value={d.id} />
                          <button className={btn.ghost}>Open</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={uploadDocument} className="space-y-3">
                  <input type="hidden" name="id" value={c.id} />
                  <select name="kind" defaultValue="charge_sheet" className={input}>
                    {Object.entries(DOC_KINDS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    name="file"
                    required
                    accept="application/pdf,image/*"
                    className="block w-full text-[14px] file:mr-3 file:rounded-md file:border file:border-ink-300 file:bg-white file:px-3 file:py-2 file:text-[14px] file:font-medium"
                  />
                  <button className={btn.secondary}>Add document</button>
                </form>
              </Card>
            </section>
          )}

          {works && (
            <section id="court">
              <Card>
                <CardTitle sub="If the case is before a court on CaseWin Court, hearings come straight from the registry.">Court</CardTitle>
                {courtCase ? (
                  <>
                    <p className="font-mono text-[13px] text-ink-600">{courtCase.suit_number}</p>
                    <p className="font-medium text-ink-950">{courtCase.title}</p>
                    <p className="text-[13px] text-ink-500">
                      {(courtCase.court as unknown as { name: string } | null)?.name} · {courtCase.status.replace(/_/g, ' ')}
                      {courtCase.next_hearing_at && <> · next sitting {dateTime(courtCase.next_hearing_at)}</>}
                    </p>
                    {(hearings ?? []).length > 0 && (
                      <ul className="mt-3 divide-y divide-ink-200 border-y border-ink-200 text-[13px]">
                        {(hearings ?? []).map((h, i) => (
                          <li key={i} className="flex justify-between gap-3 py-2">
                            <span className="text-ink-900">
                              {dateTime(h.scheduled_for)} · {h.purpose}
                            </span>
                            <span className="text-ink-500">{h.outcome ? h.outcome.replace(/_/g, ' ') + (h.adjournment_reason ? ` — ${h.adjournment_reason}` : '') : 'listed'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <form action={linkCourtCase} className="flex gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="suit_number" required placeholder="e.g. HOW/142/2026" className={input + ' font-mono'} />
                    <button className={btn.secondary}>Link</button>
                  </form>
                )}
              </Card>
            </section>
          )}

          {works && (
            <Card>
              <CardTitle>Update the facts</CardTitle>
              <form action={updateFacts} className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <Field label="Facility">
                  <input name="facility" defaultValue={c.facility ?? ''} className={input} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Arrested">
                    <input type="date" name="arrested_on" defaultValue={c.arrested_on ?? ''} className={input} />
                  </Field>
                  <Field label="Remanded">
                    <input type="date" name="remanded_on" defaultValue={c.remanded_on ?? ''} className={input} />
                  </Field>
                  <Field label="Last hearing">
                    <input type="date" name="last_hearing_on" defaultValue={c.last_hearing_on ?? ''} className={input} />
                  </Field>
                  <Field label="Next hearing">
                    <input type="date" name="next_hearing_on" defaultValue={c.next_hearing_on ?? ''} className={input} />
                  </Field>
                </div>
                <Field label="Court">
                  <input name="court_name" defaultValue={c.court_name ?? ''} className={input} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Charge / suit no.">
                    <input name="charge_number" defaultValue={c.charge_number ?? ''} className={input} />
                  </Field>
                  <Field label="Allegation">
                    <input name="allegation" defaultValue={c.allegation ?? ''} className={input} />
                  </Field>
                </div>
                <button className={btn.secondary}>Save facts</button>
              </form>
            </Card>
          )}

          {works && !blocked && c.status !== 'resolved' && (
            <Card>
              <CardTitle sub="Released, settled, referred… This is what the public impact figures count.">Record the outcome</CardTitle>
              <form action={recordOutcome} className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <select name="outcome" required className={input} defaultValue="">
                  <option value="" disabled>
                    Outcome…
                  </option>
                  {Object.entries(OUTCOMES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <input type="date" name="outcome_on" className={input} />
                {!c.verified_at && (
                  <select name="verify_method" required className={input} defaultValue="">
                    <option value="" disabled>
                      How did you confirm the facts?
                    </option>
                    {VERIFY.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                )}
                <textarea name="note" rows={2} placeholder="Short note (e.g. bail granted on self-recognisance by Magistrate X)" className={input} />
                <button className={btn.primary}>Record outcome</button>
              </form>
            </Card>
          )}

          {(m.isAdmin || m.role === 'coordinator') && (team ?? []).length > 0 && c.status !== 'resolved' && (
            <Card>
              <CardTitle>Assign</CardTitle>
              <form action={assignTo} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <select name="member" className={input} defaultValue="">
                  <option value="" disabled>
                    Choose a volunteer…
                  </option>
                  {(team ?? []).map((t) => (
                    <option key={t.user_id} value={t.user_id}>
                      {t.full_name} ({t.state})
                    </option>
                  ))}
                </select>
                <button className={btn.secondary}>Assign</button>
              </form>
            </Card>
          )}

          {works && c.assigned_to && c.status !== 'resolved' && (
            <details className="rounded-2xl border border-ink-100 bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold text-ink-700">Release or report this case</summary>
              <form action={releaseCase} className="mt-4 space-y-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="reason" placeholder="Why (e.g. conflict of interest, can’t travel)" className={input} />
                <button className={btn.secondary}>Release back to the board</button>
              </form>
              <form action={markSpam} className="mt-4 space-y-2 border-t border-ink-100 pt-4">
                <input type="hidden" name="id" value={c.id} />
                <input name="reason" required placeholder="Why you believe it is not genuine" className={input} />
                <button className={btn.danger}>Not a genuine request</button>
              </form>
            </details>
          )}
        </div>
      </div>
    </>
  )
}

function Clock({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="rounded-xl bg-parchment p-4">
      <p className="font-display text-3xl font-semibold tabular-nums text-ink-900">{v ?? '—'}</p>
      <p className="mt-1 text-xs text-ink-500">{label}</p>
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string | null | false | undefined }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{k}</dt>
      <dd className="text-ink-800">{v || '—'}</dd>
    </div>
  )
}
