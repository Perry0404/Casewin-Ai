import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { relative } from '@/lib/format'
import { Badge, Empty, Notice, PageHeader, cx } from '@/components/ui'

export const metadata: Metadata = { title: 'OpenLegal submissions' }

const TABS = ['pending', 'verified', 'rejected', 'duplicate'] as const
const FLAG_LABEL: Record<string, string> = {
  possible_law_report_copy: 'Maybe from a law report',
  no_suit_number: 'No suit number',
  no_date: 'No date',
  short_text: 'Short text',
}

export default async function Submissions({ searchParams }: { searchParams: { tab?: string; done?: string } }) {
  const tab = TABS.find((t) => t === searchParams.tab) ?? 'pending'
  const db = createAdminClient()
  const [{ data: rows }, ...counts] = await Promise.all([
    db
      .from('submissions')
      .select('id, title, court_name, suit_number, channel, flags, confirmations, created_at, contributor:contributors(display_name, institution)')
      .eq('status', tab)
      .order('created_at', { ascending: tab !== 'pending' ? false : true })
      .limit(100),
    ...TABS.map((t) => db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', t)),
  ])

  return (
    <>
      <PageHeader eyebrow="OpenLegal Nigeria" title="Contributor submissions" sub="Nothing goes public until it is verified here. Check each one against the court record before approving." />
      {searchParams.done && (
        <div className="mb-6">
          <Notice tone="good">Submission marked {searchParams.done}. Points have been updated.</Notice>
        </div>
      )}
      <nav className="mb-5 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {TABS.map((t, i) => (
          <Link key={t} href={`/admin/submissions?tab=${t}`} className={cx('rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition', tab === t ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50')}>
            {t} <span className={tab === t ? 'text-ink-300' : 'text-ink-400'}>{counts[i].count ?? 0}</span>
          </Link>
        ))}
      </nav>
      {rows?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <ul className="divide-y divide-ink-100">
            {rows.map((s) => {
              const who = s.contributor as unknown as { display_name: string; institution: string | null } | null
              return (
                <li key={s.id} className="relative flex flex-col gap-2 px-5 py-4 hover:bg-parchment/50 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/submissions/${s.id}`} className="font-display text-lg font-semibold text-ink-900 after:absolute after:inset-0">
                      {s.title}
                    </Link>
                    <p className="text-sm text-ink-400">
                      {s.court_name}
                      {s.suit_number && ` · ${s.suit_number}`} · from {who?.display_name ?? 'unknown'}
                      {who?.institution && ` (${who.institution})`} via {s.channel} · {relative(s.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.confirmations > 0 && <Badge tone="good">{s.confirmations} confirmation{s.confirmations === 1 ? '' : 's'}</Badge>}
                    {(s.flags as string[]).map((f) => (
                      <Badge key={f} tone={f === 'possible_law_report_copy' ? 'bad' : 'warn'}>
                        {FLAG_LABEL[f] ?? f}
                      </Badge>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <Empty title={tab === 'pending' ? 'Nothing waiting for review' : 'Nothing here'} icon="✓" />
      )}
    </>
  )
}
