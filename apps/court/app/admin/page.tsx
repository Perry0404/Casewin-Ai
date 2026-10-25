import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { LEGALAID_URL, OPENLEGAL_URL } from '@/lib/constants'
import { relative } from '@/lib/format'
import { Card, PageHeader, cx } from '@/components/ui'

export const metadata: Metadata = { title: 'Justice admin' }

// One inbox for everything waiting on a platform administrator, across the three products.
export default async function Inbox() {
  const db = createAdminClient()
  const now = new Date().toISOString()
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0)
  const [
    registrations,
    requests,
    courts,
    volunteers,
    orgs,
    waiting,
    overdue,
    unverified,
    released,
    complaints,
    submissions,
    statutes,
    { data: recentRegs },
    { data: recentVols },
    { data: recentSubs },
  ] = await Promise.all([
    count(db.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    count(db.from('court_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    count(db.from('courts').select('id', { count: 'exact', head: true })),
    count(db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'pending').neq('role', 'coordinator')),
    count(db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    count(db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    count(db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'assigned').is('first_action_at', null).lt('first_action_due', now)),
    count(db.from('la_cases').select('id', { count: 'exact', head: true }).is('verified_at', null).not('status', 'in', '(spam,closed)')),
    count(db.from('la_cases').select('id', { count: 'exact', head: true }).in('outcome', ['released_bail', 'released_unconditional', 'charges_struck_out', 'discharged', 'acquitted'])),
    count(db.from('la_complaints').select('id', { count: 'exact', head: true }).eq('status', 'open')),
    count(db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    count(db.from('laws').select('id', { count: 'exact', head: true }).eq('needs_review', true)),
    db.from('registrations').select('id, full_name, kind, created_at').eq('status', 'pending').order('created_at').limit(4),
    db.from('la_members').select('user_id, full_name, role, created_at').eq('status', 'pending').order('created_at').limit(4),
    db.from('submissions').select('id, title, created_at').eq('status', 'pending').order('created_at').limit(4),
  ])
  const total = registrations + requests + volunteers + orgs + overdue + submissions + complaints

  return (
    <>
      <PageHeader
        eyebrow="CaseWin justice infrastructure"
        title={total ? `${total} ${total === 1 ? 'thing needs' : 'things need'} you` : 'All clear'}
        sub="Everything waiting on a platform administrator across CaseWin Court, CaseWin Legal Aid and OpenLegal Nigeria. Oldest first in each list."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Product name="CaseWin Court" host="court.casewinai.com" accent="bg-brass-400">
          <Row label="E-filer & staff registrations" n={registrations} href="/admin/registrations" urgent />
          <Row label="Courts asking to join" n={requests} href="/admin/courts" urgent />
          <Row label="Courts on the network" n={courts} href="/admin/courts" />
          <Recent items={(recentRegs ?? []).map((r) => [r.full_name, r.kind === 'filer' ? 'e-filer' : 'court staff', r.created_at, '/admin/registrations'])} />
        </Product>
        <Product name="CaseWin Legal Aid" host="legalaid.casewinai.com" accent="bg-verdict-500">
          <Row label="Complaints from families" n={complaints} href={`${LEGALAID_URL}/admin/complaints`} urgent external />
          <Row label="Volunteers to verify" n={volunteers} href="/admin/legal-aid" urgent />
          <Row label="Organisations to verify" n={orgs} href="/admin/legal-aid" urgent />
          <Row label="Claims with no action in 48 h" n={overdue} href={`${LEGALAID_URL}/admin`} urgent external />
          <Row label="People waiting for a volunteer" n={waiting} href={`${LEGALAID_URL}/desk/board`} external />
          <Row label="Reports not yet verified" n={unverified} href={`${LEGALAID_URL}/admin/cases`} external />
          <Row label="People released so far" n={released} href={`${LEGALAID_URL}/impact`} external />
          <Recent items={(recentVols ?? []).map((v) => [v.full_name, v.role.replace('_', ' '), v.created_at, '/admin/legal-aid'])} />
        </Product>
        <Product name="OpenLegal Nigeria" host="openlegal.casewinai.com" accent="bg-[#3B5B9A]">
          <Row label="Contributed judgments to check" n={submissions} href="/admin/submissions" urgent />
          <Row label="Statutes held for review" n={statutes} href="/admin/laws" />
          <Row label="Open the public site" n={null} href={OPENLEGAL_URL} external />
          <Recent items={(recentSubs ?? []).map((s) => [s.title, 'submission', s.created_at, `/admin/submissions/${s.id}`])} />
        </Product>
      </div>
    </>
  )
}

function Product({ name, host, accent, children }: { name: string; host: string; accent: string; children: ReactNode }) {
  return (
    <Card pad={false} className="overflow-hidden">
      <div className={cx('h-1', accent)} />
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <p className="font-display text-xl font-semibold text-ink-900">{name}</p>
        <p className="font-mono text-xs text-ink-400">{host}</p>
      </div>
      <ul className="divide-y divide-ink-100 border-t border-ink-100">{children}</ul>
    </Card>
  )
}

function Row({ label, n, href, urgent = false, external = false }: { label: string; n: number | null; href: string; urgent?: boolean; external?: boolean }) {
  const hot = urgent && (n ?? 0) > 0
  const inner = (
    <>
      <span className="text-sm text-ink-700">
        {label}
        {external && <span className="ml-1 text-ink-300">↗</span>}
      </span>
      {n != null && (
        <span className={cx('min-w-[2rem] rounded-full px-2 py-0.5 text-center text-sm font-semibold tabular-nums', hot ? 'bg-brass-400 text-ink-950' : 'text-ink-400')}>{n.toLocaleString()}</span>
      )}
    </>
  )
  const cls = 'flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-parchment/60 sm:px-6'
  return <li>{external ? <a href={href} className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>}</li>
}

function Recent({ items }: { items: [string, string, string, string][] }) {
  if (!items.length) return null
  return (
    <li className="bg-parchment/40 px-5 py-3 sm:px-6">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Waiting longest</p>
      {items.map(([t, k, at, href]) => (
        <Link key={href + t} href={href} className="flex justify-between gap-3 py-1 text-[13px] hover:text-ink-900">
          <span className="truncate text-ink-700">
            {t} <span className="text-ink-400">· {k}</span>
          </span>
          <span className="shrink-0 text-ink-400">{relative(at)}</span>
        </Link>
      ))}
    </li>
  )
}
