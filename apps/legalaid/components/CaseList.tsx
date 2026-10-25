import Link from 'next/link'
import { KINDS, STATUS } from '@/lib/constants'
import { SEVERITY, assess, rule } from '@/lib/triage'
import { initials, type CaseRow } from '@/lib/cases'
import { relative } from '@/lib/format'
import { Badge, Mono, cx } from './ui'

/** A ranked list of files. `masked` shows initials only, for cases the viewer hasn't taken. */
export default function CaseList({ cases, masked = false }: { cases: CaseRow[]; masked?: boolean }) {
  const rows = cases.map((c) => ({ c, a: assess(c) })).sort((x, y) => y.a.score - x.a.score)
  return (
    <ul className="divide-y divide-ink-100">
      {rows.map(({ c, a }) => {
        const overdue = c.first_action_due && !c.first_action_at && new Date(c.first_action_due) < new Date()
        return (
          <li key={c.id}>
            <Link href={`/desk/cases/${c.id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-parchment/60 sm:flex-row sm:items-center sm:px-6">
              <div className="w-24 shrink-0">
                <Badge tone={SEVERITY[a.severity].tone}>{SEVERITY[a.severity].label}</Badge>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">
                  {masked ? initials(c.person_name) : c.person_name}
                  {c.person_age != null && <span className="text-ink-400">, {c.person_age}</span>}
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    {KINDS[c.kind]?.short} · {c.facility ? `${c.facility}, ` : ''}
                    {c.state}
                  </span>
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                  {a.flags.slice(0, 3).map((f) => (
                    <span key={f.text} className={cx(f.severity === 'critical' ? 'text-seal-600' : f.severity === 'urgent' ? 'text-amberline-600' : 'text-ink-500')} title={rule(f.rule).ref}>
                      {f.text}
                    </span>
                  ))}
                  {overdue && <span className="font-semibold text-seal-600">First action overdue</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-right text-xs text-ink-400">
                {a.daysHeld != null && c.kind === 'detention' && (
                  <span>
                    <span className="block font-display text-xl font-semibold text-ink-900">{a.daysHeld}</span>days held
                  </span>
                )}
                <span className="w-28">
                  <Mono className="block text-ink-700">{c.ref}</Mono>
                  {c.verified_at ? <span className="text-verdict-600">verified</span> : <span>unverified</span>} · {relative(c.created_at)}
                  {!masked && <span className="block">{STATUS[c.status]?.label}</span>}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
