import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { visibleOpenCases } from '@/lib/caseload'
import { initials } from '@/lib/cases'
import { Empty, Mono, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Custody clock' }

// The scale runs to 120 days; longer detentions run off the end and are marked.
const SCALE = 120
const MARKS: [number, string][] = [
  [2, '48 h — court'],
  [14, '14 d — remand'],
  [28, '28 d — extension ends'],
  [90, '90 d'],
]

export default async function Custody() {
  const m = await requireMember()
  const rows = (await visibleOpenCases(m, { kind: 'detention' })).filter((c) => c.a.daysHeld != null).sort((a, b) => (b.a.daysHeld ?? 0) - (a.a.daysHeld ?? 0))
  return (
    <>
      <PageHeader
        eyebrow="Custody clock"
        title="How long each person has been held"
        sub="Every open detention in your states, longest first, against the limits in the Constitution (s.35) and ACJA 2015 (s.296). Remand time is shaded."
      />
      {rows.length ? (
        <div className="border-t border-ink-950">
          <div className="relative ml-[13.5rem] hidden h-8 lg:block">
            {MARKS.map(([d, l]) => (
              <span key={d} className="absolute top-2 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-500" style={{ left: `${(d / SCALE) * 100}%` }}>
                {l}
              </span>
            ))}
          </div>
          {rows.map((c) => {
            const held = c.a.daysHeld ?? 0
            const rem = c.a.remandDays
            const over = held > SCALE
            const colour = c.a.severity === 'critical' ? '#B42318' : c.a.severity === 'urgent' ? '#B54708' : '#3B5B9A'
            return (
              <div key={c.id} className="grid gap-2 border-b border-ink-200 py-3 lg:grid-cols-[13rem_1fr] lg:items-center">
                <div className="min-w-0">
                  <Link href={`/desk/cases/${c.id}`} className="font-medium text-ink-950 hover:underline">
                    {c.works ? c.person_name : initials(c.person_name)}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-500">
                    <Mono>{c.ref}</Mono> · {c.facility ?? c.state}
                  </span>
                </div>
                <div className="relative h-7 bg-ink-50">
                  {MARKS.map(([d]) => (
                    <span key={d} className="absolute inset-y-0 w-px bg-ink-300" style={{ left: `${(d / SCALE) * 100}%` }} />
                  ))}
                  <span className="absolute inset-y-1.5 left-0" style={{ width: `${Math.min(100, (held / SCALE) * 100)}%`, background: colour, opacity: 0.85 }} />
                  {rem != null && <span className="absolute inset-y-1.5 bg-white/40" style={{ left: `${Math.max(0, ((held - rem) / SCALE) * 100)}%`, width: `${Math.min(100, (rem / SCALE) * 100)}%` }} />}
                  <span className="absolute inset-y-0 right-2 flex items-center text-[13px] font-semibold tabular-nums text-ink-950">
                    {held} days{over ? ' →' : ''}
                    {rem != null && <span className="ml-1 font-normal text-ink-600">({rem} on remand)</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty title="No open detentions with an arrest date in your states" />
      )}
    </>
  )
}
