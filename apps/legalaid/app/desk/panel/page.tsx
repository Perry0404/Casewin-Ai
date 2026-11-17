import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { KINDS, ORG_KINDS } from '@/lib/constants'
import { relative } from '@/lib/format'
import { localPhone } from '@/lib/panel'
import { Badge, Notice, PageHeader, btn, cx } from '@/components/ui'
import { addPanelLawyers, removeFromPanel, sendCaseToPanel, sendSignInLink } from './actions'

export const metadata: Metadata = { title: 'Panel' }

export default async function Panel({ searchParams }: { searchParams: { org?: string; added?: string; dupes?: string; skipped?: string; error?: string } }) {
  const m = await requireMember()
  const db = createAdminClient()
  // Coordinators manage their own organisation's panel; platform admins pick one.
  let orgId = m.role === 'coordinator' && m.org_id && !m.isAdmin ? m.org_id : searchParams.org ?? m.org_id
  const { data: orgs } = m.isAdmin ? await db.from('la_organisations').select('id, name, state').eq('status', 'approved').order('name') : { data: null }
  if (!orgId && orgs?.length) orgId = orgs[0].id
  if (!orgId || !(m.isAdmin || (m.role === 'coordinator' && m.org_id === orgId))) redirect('/desk')

  const [{ data: org }, { data: lawyers }] = await Promise.all([
    db.from('la_organisations').select('id, name, kind, state').eq('id', orgId).maybeSingle(),
    db.from('la_members').select('user_id, full_name, phone, whatsapp, status, on_panel, access_sent_at, last_link_login_at').eq('org_id', orgId).eq('role', 'lawyer').order('full_name'),
  ])
  if (!org) redirect('/desk')
  const ids = (lawyers ?? []).map((l) => l.user_id)
  const [{ data: waiting }, { data: held }] = await Promise.all([
    db.from('la_cases').select('id, ref, kind, state, lga, facility, created_at').eq('status', 'new').eq('state', org.state).order('created_at').limit(50),
    ids.length
      ? db.from('la_cases').select('id, ref, kind, assigned_to, assigned_at, first_action_at, status').in('assigned_to', ids).in('status', ['assigned', 'in_progress']).order('assigned_at', { ascending: false })
      : Promise.resolve({ data: [] as { id: string; ref: string; kind: string; assigned_to: string; assigned_at: string; first_action_at: string | null; status: string }[] }),
  ])
  const caseIds = (waiting ?? []).map((c) => c.id)
  const { data: alerts } = caseIds.length ? await db.from('la_panel_alerts').select('case_id, created_at').eq('org_id', org.id).in('case_id', caseIds) : { data: [] }
  const lastSent = new Map<string, string>()
  for (const a of alerts ?? []) if (!lastSent.has(a.case_id) || lastSent.get(a.case_id)! < a.created_at) lastSent.set(a.case_id, a.created_at)
  const name = new Map((lawyers ?? []).map((l) => [l.user_id, l.full_name]))
  const holding = new Map<string, number>()
  for (const h of held ?? []) holding.set(h.assigned_to, (holding.get(h.assigned_to) ?? 0) + 1)
  const active = (lawyers ?? []).filter((l) => l.status === 'approved')
  const linked = active.filter((l) => l.last_link_login_at).length

  return (
    <>
      <PageHeader
        eyebrow={ORG_KINDS[org.kind] ?? 'Organisation'}
        title={`${org.name} panel`}
        sub={`${active.length} lawyers on the panel · ${linked} have signed in · cases in ${org.state} are sent to them on WhatsApp, and the first to accept takes the case.`}
      />
      {orgs && orgs.length > 1 && (
        <nav className="-mt-4 mb-8 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          <span className="text-ink-500">Organisation:</span>
          {orgs.map((o) => (
            <Link key={o.id} href={`/desk/panel?org=${o.id}`} className={cx(o.id === org.id ? 'font-semibold text-ink-950' : 'text-ink-600 underline-offset-2 hover:underline')}>
              {o.name}
            </Link>
          ))}
        </nav>
      )}
      {searchParams.added && (
        <div className="mb-6">
          <Notice tone="good">
            Added {searchParams.added} lawyer{searchParams.added === '1' ? '' : 's'}.
            {Number(searchParams.dupes) > 0 && ` ${searchParams.dupes} were already on CaseWin and were skipped.`}
            {Number(searchParams.skipped) > 0 && ` ${searchParams.skipped} line(s) had no phone number and were skipped.`} Next: send each one their sign-in link below.
          </Notice>
        </div>
      )}
      {searchParams.error === 'taken' && (
        <div className="mb-6">
          <Notice tone="info">That case has already been taken.</Notice>
        </div>
      )}

      <section className="mb-12">
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          1 · Cases waiting in {org.state} <span className="font-normal text-ink-500">· {waiting?.length ?? 0}</span>
        </h2>
        <p className="mt-2 text-[14px] text-ink-600">
          “Send to panel” opens WhatsApp with the alert written. Choose your panel broadcast list and send. The message has no names or family numbers.
        </p>
        {waiting?.length ? (
          <ul className="mt-2 divide-y divide-ink-200 border-b border-ink-200">
            {waiting.map((c) => {
              const sent = lastSent.get(c.id)
              return (
                <li key={c.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/desk/cases/${c.id}`} className="text-[16px] font-semibold text-ink-950 hover:underline">
                      {KINDS[c.kind]?.short ?? c.kind}
                      {c.facility && ` · ${c.facility}`}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {[c.lga, c.state].filter(Boolean).join(', ')} · ref {c.ref} · waiting {relative(c.created_at)}
                    </p>
                  </div>
                  {sent ? <Badge tone="good">Sent {relative(sent)}</Badge> : <Badge tone="warn">Not sent yet</Badge>}
                  <form action={sendCaseToPanel}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="case_id" value={c.id} />
                    <button className={btn.primary}>{sent ? 'Send again' : 'Send to panel on WhatsApp'}</button>
                  </form>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-4 text-sm text-ink-500">Nobody in {org.state} is waiting for a lawyer right now.</p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          2 · Panel lawyers <span className="font-normal text-ink-500">· {active.length}</span>
        </h2>
        <p className="mt-2 text-[14px] text-ink-600">
          Each lawyer signs in with a personal link, no password. “Send sign-in link” opens WhatsApp to that lawyer with a welcome message and their link. Sending again replaces the old link.
        </p>
        <table className="mt-2 w-full text-left text-[14px]">
          <thead className="border-b border-ink-300 text-[12px] text-ink-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Lawyer</th>
              <th className="hidden py-2 pr-4 font-medium sm:table-cell">Sign-in</th>
              <th className="hidden py-2 pr-4 font-medium md:table-cell">Open cases</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {(lawyers ?? []).map((l) => (
              <tr key={l.user_id} className={cx('align-middle', l.status !== 'approved' && 'opacity-50')}>
                <td className="py-3 pr-4">
                  <span className="font-medium text-ink-950">{l.full_name}</span>
                  <span className="block font-mono text-[12px] text-ink-500">{l.whatsapp ? localPhone(l.whatsapp) : l.phone}</span>
                </td>
                <td className="hidden py-3 pr-4 text-ink-600 sm:table-cell">
                  {l.status !== 'approved'
                    ? 'Removed'
                    : l.last_link_login_at
                      ? `Signed in ${relative(l.last_link_login_at)}`
                      : l.access_sent_at
                        ? `Link sent ${relative(l.access_sent_at)}`
                        : 'Link not sent'}
                </td>
                <td className="hidden py-3 pr-4 tabular-nums text-ink-600 md:table-cell">{holding.get(l.user_id) ?? 0}</td>
                <td className="py-3 text-right">
                  {l.status === 'approved' && (
                    <div className="flex justify-end gap-1">
                      <form action={sendSignInLink}>
                        <input type="hidden" name="org_id" value={org.id} />
                        <input type="hidden" name="user_id" value={l.user_id} />
                        <button className={l.access_sent_at ? btn.ghost : btn.secondary + ' !px-3 !py-1.5'}>{l.access_sent_at ? 'Resend link' : 'Send sign-in link'}</button>
                      </form>
                      <form action={removeFromPanel}>
                        <input type="hidden" name="org_id" value={org.id} />
                        <input type="hidden" name="user_id" value={l.user_id} />
                        <button className={btn.ghost} title="Take off the panel">
                          Remove
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-12">
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
          3 · Cases the panel holds <span className="font-normal text-ink-500">· {held?.length ?? 0}</span>
        </h2>
        {held?.length ? (
          <ul className="divide-y divide-ink-200 border-b border-ink-200">
            {held.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]">
                <Link href={`/desk/cases/${h.id}`} className="font-medium text-ink-950 hover:underline">
                  {KINDS[h.kind]?.short ?? h.kind} · ref {h.ref}
                </Link>
                <span className="text-ink-600">
                  {name.get(h.assigned_to)} · accepted {relative(h.assigned_at)} · {h.first_action_at ? 'acted' : <span className="text-[#9a3412]">no action yet</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-ink-500">No open cases held by panel lawyers.</p>
        )}
      </section>

      <section>
        <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">4 · Add lawyers</h2>
        <form action={addPanelLawyers} className="mt-3 max-w-2xl space-y-3">
          <input type="hidden" name="org_id" value={org.id} />
          <p className="text-[14px] text-ink-600">Paste one lawyer per line: name, then phone number. If there are two numbers, put the WhatsApp number first. You vouch for everyone you add.</p>
          <textarea name="roster" rows={8} required placeholder={'Ada Okafor Esq 08031234567\nChidi Eze 08021234567/07031234567'} className="w-full rounded-lg border border-ink-300 p-3 font-mono text-[13px]" />
          <button className={btn.primary}>Add to panel</button>
        </form>
      </section>
    </>
  )
}
