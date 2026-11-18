import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { LEGALAID_URL } from '@/lib/constants'
import { dateTime, relative } from '@/lib/format'
import { Empty, Notice, PageHeader, btn } from '@/components/ui'
import { readLink } from '@/lib/handover'
import { newCoordinatorLink } from '../actions'

export const metadata: Metadata = { title: 'Legal Aid panels' }

const EVENT: Record<string, string> = {
  assigned: 'Case taken',
  contacted_family: 'Family contacted',
  visited_facility: 'Visited in custody',
  bail_application: 'Bail application filed',
  fundamental_rights: 'Fundamental rights application filed',
  appeared_in_court: 'Appeared in court',
  wrote_to_police: 'Wrote to the police',
  outcome: 'Outcome recorded',
  released: 'Returned to the board',
  note: 'Note',
}

// Every organisation that runs a panel of lawyers through a coordinator (e.g. a Legal Aid
// Council state office): is the coordinator set up, and what has the panel done.
export default async function Panels({ searchParams }: { searchParams: { made?: string } }) {
  const db = createAdminClient()
  const made = searchParams.made ? readLink() : null
  const { data: coords } = await db.from('la_members').select('user_id, full_name, email, phone, org_id, access_token_hash, last_link_login_at').eq('role', 'coordinator').not('org_id', 'is', null)
  const orgIds = [...new Set((coords ?? []).map((c) => c.org_id as string))]
  const { data: orgs } = orgIds.length ? await db.from('la_organisations').select('id, name, state, kind, states_covered').in('id', orgIds).order('name') : { data: [] }
  const now = Date.now()

  const panels = await Promise.all(
    (orgs ?? []).map(async (o) => {
      const [{ data: lawyers }, { data: waiting }, { data: cases }, { data: posts }] = await Promise.all([
        db.from('la_members').select('user_id, full_name').eq('org_id', o.id).eq('role', 'lawyer').eq('status', 'approved'),
        db.from('la_cases').select('id').in('state', o.states_covered?.length ? o.states_covered : [o.state]).eq('status', 'new'),
        db.from('la_cases').select('id, ref, status, assigned_to, first_action_at, first_action_due').eq('assigned_org', o.id),
        db.from('la_panel_alerts').select('case_id, created_at').eq('org_id', o.id).order('created_at', { ascending: false }).limit(20),
      ])
      const ids = (cases ?? []).map((c) => c.id)
      const { data: events } = ids.length
        ? await db.from('la_case_events').select('case_id, kind, body, actor_label, created_at').in('case_id', ids).eq('public', false).order('created_at', { ascending: false }).limit(25)
        : { data: [] }
      const open = (cases ?? []).filter((c) => c.status === 'assigned' || c.status === 'in_progress')
      const ref = new Map((cases ?? []).map((c) => [c.id, c.ref]))
      const log = [
        ...(events ?? []).map((e) => ({ at: e.created_at, what: EVENT[e.kind] ?? e.kind.replace(/_/g, ' '), detail: e.body as string | null, who: e.actor_label as string | null, ref: ref.get(e.case_id) })),
        ...(posts ?? []).map((p) => ({ at: p.created_at, what: 'Posted to WhatsApp group', detail: null, who: null, ref: undefined as string | undefined })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 25)
      return {
        org: o,
        coordinators: (coords ?? []).filter((c) => c.org_id === o.id),
        lawyers: lawyers?.length ?? 0,
        waiting: waiting?.length ?? 0,
        open: open.length,
        overdue: open.filter((c) => !c.first_action_at && c.first_action_due && new Date(c.first_action_due).getTime() < now).length,
        done: (cases ?? []).filter((c) => c.status === 'resolved' || c.status === 'closed').length,
        log,
      }
    }),
  )

  return (
    <>
      <PageHeader
        eyebrow="CaseWin Legal Aid"
        title="Panels"
        sub="Organisations whose coordinator sends cases to their own lawyers on WhatsApp. Here you see whether each coordinator is set up and everything their panel has done."
      />
      {made && (
        <div className="mb-8">
          <Notice tone="good">
            New set-up link for {made.label}. Send it to them privately. It works once, only with their email address, and is shown only now:
            <span className="mt-2 block select-all break-all font-mono text-[13px] text-ink-950">{made.link}</span>
          </Notice>
        </div>
      )}
      {panels.length ? (
        <div className="space-y-14">
          {panels.map((p) => (
            <section key={p.org.id}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-950 pb-2">
                <h2 className="text-[20px] font-semibold text-ink-950">{p.org.name}</h2>
                <a href={`${LEGALAID_URL}/desk/panel?org=${p.org.id}`} className="text-[14px] text-brass-600 hover:underline">
                  Open their panel page ↗
                </a>
              </div>
              <dl className="grid grid-cols-2 gap-px border-b border-ink-200 bg-ink-200 sm:grid-cols-5">
                {(
                  [
                    ['Lawyers', p.lawyers],
                    [(p.org.states_covered?.length ?? 0) > 1 ? `Waiting in their ${p.org.states_covered.length} states` : `Waiting in ${p.org.state}`, p.waiting],
                    ['Open with the panel', p.open],
                    ['Not contacted in 48 h', p.overdue],
                    ['Finished', p.done],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="bg-white py-3 pr-3">
                    <dt className="text-[12px] text-ink-500">{k}</dt>
                    <dd className={`text-[22px] font-semibold tabular-nums ${k.startsWith('Not') && v > 0 ? 'text-[#9a3412]' : 'text-ink-950'}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_1.6fr]">
                <div>
                  <h3 className="text-[14px] font-semibold text-ink-950">Coordinator</h3>
                  {p.coordinators.map((c) => {
                    const setUp = !c.access_token_hash
                    return (
                      <div key={c.user_id} className="mt-2 text-[14px]">
                        <p className="font-medium text-ink-900">{c.full_name}</p>
                        <p className="text-ink-500">{c.email}</p>
                        <p className={setUp ? 'text-[#166534]' : 'text-[#9a3412]'}>
                          {setUp ? `Account set up${c.last_link_login_at ? ` ${relative(c.last_link_login_at)}` : ''}` : 'Has not set up the account yet'}
                        </p>
                        <form action={newCoordinatorLink} className="mt-2">
                          <input type="hidden" name="user_id" value={c.user_id} />
                          <button className={btn.ghost + ' !px-0'}>{setUp ? 'Reset: make a new set-up link' : 'Make a new set-up link'}</button>
                        </form>
                      </div>
                    )
                  })}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-ink-950">Recent activity</h3>
                  {p.log.length ? (
                    <ul className="mt-2 divide-y divide-ink-200 text-[14px]">
                      {p.log.map((l, i) => (
                        <li key={i} className="py-2">
                          <span className="text-ink-900">{l.what}</span>
                          {l.ref && <span className="text-ink-500"> · {l.ref}</span>}
                          <span className="float-right text-[12px] tabular-nums text-ink-500">{dateTime(l.at)}</span>
                          {l.detail && <span className="block text-[13px] text-ink-600">{l.detail}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[14px] text-ink-500">Nothing yet. Activity appears here when the coordinator posts or records a case.</p>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Empty title="No panels yet" />
      )}
    </>
  )
}
