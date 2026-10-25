import Link from 'next/link'
import type { ReactNode } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { LEGALAID_URL, OPENLEGAL_URL } from '@/lib/constants'
import { cx } from '@/components/ui'

// "At a glance": the numbers a platform administrator needs from each product, with a
// link into the module behind every figure. Counts only — no personal data here.

const lagosDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

export default async function Glance() {
  const db = createAdminClient()
  const n = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0)
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const today = lagosDay()
  const tomorrow = lagosDay(1)
  const OPEN = ['new', 'assigned', 'in_progress']
  const RELEASE = ['released_bail', 'released_unconditional', 'charges_struck_out', 'discharged', 'acquitted']
  const [
    courtsLive,
    courtsPilot,
    staff,
    filers,
    filed30,
    awaiting,
    activeCases,
    hearingsToday,
    judgmentsReal,
    judgmentsSample,
    laOpen,
    laNoCourtOrder,
    laRemandOver,
    laNoLawyer,
    laChildren,
    laReleased,
    laOutcomes,
    laOrgs,
    laVolunteers,
    laIncidents,
    laComplaints,
    laDiverted,
    laWaitingSupervisor,
    olLaws,
    olHeld,
    olSections,
    olContributors,
    olPending,
    olVerified,
    olKeys,
    { data: recentProviders },
  ] = await Promise.all([
    n(db.from('courts').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    n(db.from('courts').select('id', { count: 'exact', head: true }).eq('status', 'pilot')),
    n(db.from('court_staff').select('id', { count: 'exact', head: true }).eq('is_active', true)),
    n(db.from('filer_accounts').select('user_id', { count: 'exact', head: true }).eq('is_active', true)),
    n(db.from('filings').select('id', { count: 'exact', head: true }).gte('created_at', since30)),
    n(db.from('filings').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review', 'paid'])),
    n(db.from('cases').select('id', { count: 'exact', head: true }).in('status', ['pending_assignment', 'active', 'adjourned', 'reserved']).eq('is_sample', false)),
    n(db.from('hearings').select('id', { count: 'exact', head: true }).gte('scheduled_for', `${today}T00:00:00+01:00`).lt('scheduled_for', `${tomorrow}T00:00:00+01:00`)),
    n(db.from('judgments').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('is_sample', false)),
    n(db.from('judgments').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('is_sample', true)),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('status', OPEN)),
    // Held two days or more with no court order (Constitution s.35), and remand beyond both 14-day periods (ACJA s.296).
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('status', OPEN).eq('kind', 'detention').is('remanded_on', null).lte('arrested_on', lagosDay(-2))),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('status', OPEN).eq('kind', 'detention').lte('remanded_on', lagosDay(-28))),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('status', OPEN).eq('kind', 'detention').lt('person_age', 18)),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('outcome', RELEASE)),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).not('outcome', 'is', null)),
    n(db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'approved')),
    n(db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'approved').neq('role', 'coordinator')),
    n(db.from('la_incidents').select('id', { count: 'exact', head: true })),
    n(db.from('la_complaints').select('id', { count: 'exact', head: true }).in('status', ['open', 'investigating'])),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('diversion_status', ['referred', 'in_progress', 'completed'])),
    n(db.from('la_cases').select('id', { count: 'exact', head: true }).in('status', ['assigned', 'in_progress']).is('supervisor_id', null).not('assigned_to', 'is', null)),
    n(db.from('laws').select('id', { count: 'exact', head: true }).eq('is_published', true)),
    n(db.from('laws').select('id', { count: 'exact', head: true }).eq('needs_review', true)),
    n(db.from('law_sections').select('id', { count: 'exact', head: true })),
    n(db.from('contributors').select('id', { count: 'exact', head: true })),
    n(db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'verified')),
    n(db.from('api_keys').select('id', { count: 'exact', head: true })),
    db.from('la_cases').select('assigned_org, la_organisations!la_cases_assigned_org_fkey(name)').not('assigned_org', 'is', null).limit(5000),
  ])
  // Top organisations by cases taken (the full table is the Clearing House).
  const tally = new Map<string, number>()
  for (const r of recentProviders ?? []) {
    const name = (r.la_organisations as unknown as { name: string } | null)?.name
    if (name) tally.set(name, (tally.get(name) ?? 0) + 1)
  }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const pastLimit = laNoCourtOrder + laRemandOver

  return (
    <div className="mt-12 space-y-10">
      <Section title="CaseWin Court" links={[['Courts', '/admin/courts'], ['Registrations', '/admin/registrations'], ['My registry', '/registry']]}>
        <Fig label="Courts live / in pilot" v={`${courtsLive} / ${courtsPilot}`} href="/admin/courts" />
        <Fig label="Court staff with logins" v={staff} />
        <Fig label="Approved e-filers" v={filers} href="/admin/registrations" />
        <Fig label="E-filings, last 30 days" v={filed30} />
        <Fig label="Filings waiting on a registry" v={awaiting} warn={awaiting > 0} />
        <Fig label="Active cases" v={activeCases} />
        <Fig label="Hearings today" v={hearingsToday} />
        <Fig label="Judgments published" v={judgmentsReal} hint={judgmentsSample ? `+${judgmentsSample} sample` : undefined} />
      </Section>

      <Section
        title="CaseWin Legal Aid"
        links={[
          ['Command', `${LEGALAID_URL}/desk/command`],
          ['Clearing house', `${LEGALAID_URL}/desk/clearing-house`],
          ['Interventions', `${LEGALAID_URL}/desk/interventions`],
          ['Custody clock', `${LEGALAID_URL}/desk/custody`],
          ['Rights register', `${LEGALAID_URL}/desk/incidents`],
          ['All cases', `${LEGALAID_URL}/admin/cases`],
          ['Complaints', `${LEGALAID_URL}/admin/complaints`],
          ['Alerts', `${LEGALAID_URL}/admin/alerts`],
          ['Verification', '/admin/legal-aid'],
        ]}
      >
        <Fig label="Open cases" v={laOpen} href={`${LEGALAID_URL}/admin/cases`} />
        <Fig label="Held past a legal limit" v={pastLimit} bad={pastLimit > 0} href={`${LEGALAID_URL}/desk/interventions`} hint={pastLimit ? `${laNoCourtOrder} no court order · ${laRemandOver} remand > 28 d` : undefined} />
        <Fig label="Waiting for a volunteer" v={laNoLawyer} warn={laNoLawyer > 0} href={`${LEGALAID_URL}/desk/board`} />
        <Fig label="Children in custody" v={laChildren} bad={laChildren > 0} href={`${LEGALAID_URL}/desk/interventions?rule=R5`} />
        <Fig label="Students without a supervisor" v={laWaitingSupervisor} warn={laWaitingSupervisor > 0} />
        <Fig label="People released / outcomes" v={`${laReleased} / ${laOutcomes}`} good />
        <Fig label="Diverted to mediation" v={laDiverted} />
        <Fig label="Providers" v={`${laOrgs} orgs · ${laVolunteers} vols`} href={`${LEGALAID_URL}/desk/clearing-house`} />
        <Fig label="Rights violations recorded" v={laIncidents} href={`${LEGALAID_URL}/desk/incidents`} />
        <Fig label="Open complaints" v={laComplaints} bad={laComplaints > 0} href={`${LEGALAID_URL}/admin/complaints`} />
        {top.length > 0 && (
          <div className="col-span-2 border-t border-ink-200 pt-3 sm:col-span-4">
            <p className="text-[12px] text-ink-500">Most cases handled (organisations)</p>
            <p className="mt-1 text-[14px] text-ink-900">{top.map(([name, v]) => `${name} ${v}`).join(' · ')}</p>
          </div>
        )}
      </Section>

      <Section
        title="OpenLegal Nigeria"
        links={[
          ['Judgments to check', '/admin/submissions'],
          ['Statutes held', '/admin/laws'],
          ['Leaderboard', `${OPENLEGAL_URL}/leaderboard`],
          ['Public site', OPENLEGAL_URL],
        ]}
      >
        <Fig label="Judgments published" v={judgmentsReal} hint={judgmentsSample ? `+${judgmentsSample} sample` : undefined} />
        <Fig label="Statutes published" v={olLaws} />
        <Fig label="Sections of law searchable" v={olSections.toLocaleString()} />
        <Fig label="Statutes held for review" v={olHeld} warn={olHeld > 0} href="/admin/laws" />
        <Fig label="Contributors" v={olContributors} href={`${OPENLEGAL_URL}/leaderboard`} />
        <Fig label="Submissions to check" v={olPending} warn={olPending > 0} href="/admin/submissions" />
        <Fig label="Contributions verified" v={olVerified} />
        <Fig label="API keys issued" v={olKeys} />
      </Section>
    </div>
  )
}

function Section({ title, links, children }: { title: string; links: [string, string][]; children: ReactNode }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink-950 pb-2">
        <h2 className="text-[18px] font-semibold text-ink-950">{title} at a glance</h2>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="text-brass-600 underline-offset-4 hover:underline">
              {l}
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">{children}</div>
    </section>
  )
}

function Fig({ label, v, href, hint, warn, bad, good }: { label: string; v: ReactNode; href?: string; hint?: string; warn?: boolean; bad?: boolean; good?: boolean }) {
  const value = <span className={cx('text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums', bad ? 'text-seal-600' : warn ? 'text-amberline-600' : good ? 'text-verdict-600' : 'text-ink-950')}>{v}</span>
  return (
    <div>
      <p className="text-[12px] text-ink-500">{label}</p>
      <p className="mt-1">{href ? (href.startsWith('/') ? <Link href={href} className="hover:underline">{value}</Link> : <a href={href} className="hover:underline">{value}</a>) : value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-500">{hint}</p>}
    </div>
  )
}
