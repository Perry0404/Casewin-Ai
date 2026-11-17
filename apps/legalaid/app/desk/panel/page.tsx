import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { KINDS, ORG_KINDS } from '@/lib/constants'
import { relative } from '@/lib/format'
import { localPhone } from '@/lib/panel'
import { Badge, Notice, PageHeader, btn, cx, input } from '@/components/ui'
import { addPanelLawyers, postToGroup, recordContacted, recordTaken, removeFromPanel, sendDetails } from './actions'

export const metadata: Metadata = { title: 'Panel' }

// The coordinator's whole job, top to bottom: post a case to the WhatsApp group, record who
// took it, send them the details, record when they have contacted the family.
export default async function Panel({ searchParams }: { searchParams: { org?: string; added?: string; dupes?: string; skipped?: string; error?: string; taken?: string } }) {
  const m = await requireMember()
  const db = createAdminClient()
  let orgId = m.role === 'coordinator' && m.org_id && !m.isAdmin ? m.org_id : searchParams.org ?? m.org_id
  const { data: orgs } = m.isAdmin ? await db.from('la_organisations').select('id, name').eq('status', 'approved').order('name') : { data: null }
  if (!orgId && orgs?.length) orgId = orgs[0].id
  if (!orgId || !(m.isAdmin || (m.role === 'coordinator' && m.org_id === orgId))) redirect('/desk')

  const [{ data: org }, { data: lawyers }] = await Promise.all([
    db.from('la_organisations').select('id, name, kind, state').eq('id', orgId).maybeSingle(),
    db.from('la_members').select('user_id, full_name, phone, whatsapp, status').eq('org_id', orgId).eq('role', 'lawyer').order('full_name'),
  ])
  if (!org) redirect('/desk')
  const active = (lawyers ?? []).filter((l) => l.status === 'approved')
  const ids = active.map((l) => l.user_id)
  const [{ data: waiting }, { data: held }] = await Promise.all([
    db.from('la_cases').select('id, ref, kind, state, lga, facility, created_at').eq('status', 'new').eq('state', org.state).order('created_at').limit(50),
    db.from('la_cases').select('id, ref, kind, facility, assigned_to, assigned_at, first_action_at, first_action_due').eq('assigned_org', org.id).in('status', ['assigned', 'in_progress']).order('assigned_at', { ascending: false }),
  ])
  const caseIds = (waiting ?? []).map((c) => c.id)
  const { data: alerts } = caseIds.length ? await db.from('la_panel_alerts').select('case_id, created_at').eq('org_id', org.id).in('case_id', caseIds) : { data: [] }
  const posted = new Map<string, string>()
  for (const a of alerts ?? []) if (!posted.has(a.case_id) || posted.get(a.case_id)! < a.created_at) posted.set(a.case_id, a.created_at)
  const name = new Map((lawyers ?? []).map((l) => [l.user_id, l.full_name]))
  const holding = new Map<string, number>()
  for (const h of held ?? []) if (h.assigned_to) holding.set(h.assigned_to, (holding.get(h.assigned_to) ?? 0) + 1)
  const now = Date.now()

  return (
    <>
      <PageHeader eyebrow={ORG_KINDS[org.kind] ?? 'Organisation'} title={`${org.name} panel`} sub={`${active.length} lawyers. Post a case to your WhatsApp group, then record who took it.`} />
      {orgs && orgs.length > 1 && (
        <nav className="-mt-4 mb-8 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          <span className="text-ink-500">Organisation:</span>
          {orgs.map((o) => (
            <Link key={o.id} href={`/desk/panel?org=${o.id}`} className={cx(o.id === org.id ? 'font-semibold text-ink-950' : 'text-ink-600 hover:underline')}>
              {o.name}
            </Link>
          ))}
        </nav>
      )}
      {searchParams.taken && <div className="mb-6"><Notice tone="good">Recorded. Now tap “Send details” below so the lawyer gets the person’s details and the family’s contact.</Notice></div>}
      {searchParams.error === 'taken' && <div className="mb-6"><Notice tone="info">That case has already been taken.</Notice></div>}
      {searchParams.added && (
        <div className="mb-6">
          <Notice tone="good">
            Added {searchParams.added}.{Number(searchParams.dupes) > 0 && ` ${searchParams.dupes} already on the panel.`}
            {Number(searchParams.skipped) > 0 && ` ${searchParams.skipped} line(s) had no phone number.`}
          </Notice>
        </div>
      )}

      <section className="mb-12">
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          Waiting for a lawyer <span className="font-normal text-ink-500">· {waiting?.length ?? 0}</span>
        </h2>
        {waiting?.length ? (
          <ul className="divide-y divide-ink-200 border-b border-ink-200">
            {waiting.map((c) => {
              const sent = posted.get(c.id)
              return (
                <li key={c.id} className="grid gap-3 py-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                  <div className="min-w-0">
                    <Link href={`/desk/cases/${c.id}`} className="text-[16px] font-semibold text-ink-950 hover:underline">
                      {KINDS[c.kind]?.short ?? c.kind}
                      {c.facility && ` · ${c.facility}`}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {[c.lga, c.state].filter(Boolean).join(', ')} · ref {c.ref} · waiting {relative(c.created_at)} · {sent ? `posted ${relative(sent)}` : 'not posted yet'}
                    </p>
                  </div>
                  <form action={postToGroup}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="case_id" value={c.id} />
                    <button className={sent ? btn.secondary : btn.primary}>{sent ? 'Post again' : '1. Post to WhatsApp group'}</button>
                  </form>
                  <form action={recordTaken} className="flex gap-2">
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="case_id" value={c.id} />
                    <select name="lawyer" required defaultValue="" className={input + ' !w-56'}>
                      <option value="" disabled>
                        Who took it?
                      </option>
                      {active.map((l) => (
                        <option key={l.user_id} value={l.user_id}>
                          {l.full_name}
                        </option>
                      ))}
                    </select>
                    <button className={btn.primary}>2. Record</button>
                  </form>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-4 text-sm text-ink-500">Nobody in {org.state} is waiting for a lawyer right now. New reports appear here.</p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          Taken by the panel <span className="font-normal text-ink-500">· {held?.length ?? 0} open</span>
        </h2>
        {held?.length ? (
          <ul className="divide-y divide-ink-200 border-b border-ink-200">
            {held.map((h) => {
              const late = !h.first_action_at && h.first_action_due && new Date(h.first_action_due).getTime() < now
              return (
                <li key={h.id} className={cx('grid gap-3 py-4 lg:grid-cols-[1fr_auto_auto] lg:items-center', h.id === searchParams.taken && 'bg-parchment/60')}>
                  <div>
                    <Link href={`/desk/cases/${h.id}`} className="font-semibold text-ink-950 hover:underline">
                      {h.assigned_to ? name.get(h.assigned_to) : '—'} · {KINDS[h.kind]?.short ?? h.kind}
                      {h.facility && ` · ${h.facility}`}
                    </Link>
                    <p className="text-sm text-ink-500">
                      ref {h.ref} · taken {relative(h.assigned_at)} ·{' '}
                      {h.first_action_at ? <span className="text-[#166534]">family contacted</span> : late ? <span className="font-medium text-[#9a3412]">48 hours passed, not contacted</span> : 'not contacted yet'}
                    </p>
                  </div>
                  <form action={sendDetails}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="case_id" value={h.id} />
                    <button className={btn.secondary}>3. Send details to lawyer</button>
                  </form>
                  {!h.first_action_at ? (
                    <form action={recordContacted}>
                      <input type="hidden" name="org_id" value={org.id} />
                      <input type="hidden" name="case_id" value={h.id} />
                      <button className={btn.secondary}>4. Lawyer has contacted them</button>
                    </form>
                  ) : (
                    <Link href={`/desk/cases/${h.id}`} className={btn.ghost}>
                      Record progress or outcome
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-4 text-sm text-ink-500">No open cases.</p>
        )}
      </section>

      <details className="mb-6">
        <summary className="cursor-pointer border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          Lawyers on the panel <span className="font-normal text-ink-500">· {active.length}</span>
        </summary>
        <table className="mt-2 w-full text-left text-[14px]">
          <tbody className="divide-y divide-ink-200">
            {(lawyers ?? []).map((l) => (
              <tr key={l.user_id} className={cx(l.status !== 'approved' && 'opacity-50')}>
                <td className="py-2.5 pr-4 font-medium text-ink-950">{l.full_name}</td>
                <td className="py-2.5 pr-4 font-mono text-[12px] text-ink-500">{l.whatsapp ? localPhone(l.whatsapp) : l.phone}</td>
                <td className="hidden py-2.5 pr-4 text-ink-600 sm:table-cell">{holding.get(l.user_id) ? `${holding.get(l.user_id)} open` : ''}</td>
                <td className="py-2.5 text-right">
                  {l.status === 'approved' ? (
                    <form action={removeFromPanel}>
                      <input type="hidden" name="org_id" value={org.id} />
                      <input type="hidden" name="user_id" value={l.user_id} />
                      <button className={btn.ghost}>Remove</button>
                    </form>
                  ) : (
                    <Badge tone="neutral">removed</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addPanelLawyers} className="mt-6 max-w-2xl space-y-3">
          <input type="hidden" name="org_id" value={org.id} />
          <p className="text-[14px] font-medium text-ink-900">Add lawyers</p>
          <p className="text-[13px] text-ink-600">Paste one per line: name, then phone number. WhatsApp number first if there are two.</p>
          <textarea name="roster" rows={5} required placeholder={'Ada Okafor Esq 08031234567'} className="w-full rounded-lg border border-ink-300 p-3 font-mono text-[13px]" />
          <button className={btn.secondary}>Add to panel</button>
        </form>
      </details>
    </>
  )
}
