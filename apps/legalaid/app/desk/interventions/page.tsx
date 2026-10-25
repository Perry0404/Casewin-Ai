import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { visibleOpenCases } from '@/lib/caseload'
import { RULES, SEVERITY, rule } from '@/lib/triage'
import { initials } from '@/lib/cases'
import { KINDS, STATES } from '@/lib/constants'
import { Badge, Empty, Mono, PageHeader, btn, cx, input } from '@/components/ui'

export const metadata: Metadata = { title: 'Interventions' }

export default async function Interventions({ searchParams }: { searchParams: { rule?: string; state?: string } }) {
  const m = await requireMember()
  const all = await visibleOpenCases(m, { state: searchParams.state })
  const rows = all.filter((c) => (c.a.severity === 'critical' || c.a.severity === 'urgent') && (!searchParams.rule || c.a.flags.some((f) => f.rule === searchParams.rule)))
  const count = (r: string) => all.filter((c) => c.a.flags.some((f) => f.rule === r && f.severity !== 'watch')).length
  return (
    <>
      <PageHeader
        eyebrow="Interventions"
        title="Everyone past a legal threshold"
        sub="Open cases in your states with a critical or urgent flag — including those a volunteer already holds — most urgent first."
      />
      <div className="mb-6 flex flex-wrap gap-2 text-[13px]">
        <Link href="/desk/interventions" className={cx('rounded-md border px-3 py-1.5', !searchParams.rule ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-300')}>
          All
        </Link>
        {RULES.map((r) => (
          <Link key={r.id} href={`/desk/interventions?rule=${r.id}${searchParams.state ? `&state=${searchParams.state}` : ''}`} className={cx('rounded-md border px-3 py-1.5', searchParams.rule === r.id ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-300')}>
            {r.name} <span className="tabular-nums opacity-70">{count(r.id)}</span>
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {searchParams.rule && <input type="hidden" name="rule" value={searchParams.rule} />}
          <select name="state" defaultValue={searchParams.state ?? ''} className={input + ' !w-auto !py-1.5 !text-[13px]'}>
            <option value="">{m.isAdmin ? 'All states' : 'All my states'}</option>
            {(m.isAdmin ? STATES : m.states_covered.length ? m.states_covered : [m.state]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className={btn.secondary + ' !py-1.5'}>Show</button>
        </form>
      </div>
      {rows.length ? (
        <table className="w-full border-t border-ink-950 text-left text-[14px]">
          <thead>
            <tr className="border-b border-ink-200 text-[12px] text-ink-500">
              <th className="py-2 pr-3 font-medium">Urgency</th>
              <th className="py-2 pr-3 font-medium">Person</th>
              <th className="hidden py-2 pr-3 font-medium md:table-cell">Where</th>
              <th className="py-2 pr-3 font-medium">What is wrong</th>
              <th className="py-2 pr-3 text-right font-medium">Days held</th>
              <th className="py-2 font-medium">Who has it</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-ink-200 align-top">
                <td className="py-3 pr-3">
                  <Badge tone={SEVERITY[c.a.severity].tone}>{SEVERITY[c.a.severity].label}</Badge>
                </td>
                <td className="py-3 pr-3">
                  <Link href={`/desk/cases/${c.id}`} className="font-medium text-ink-950 hover:underline">
                    {c.works ? c.person_name : initials(c.person_name)}
                  </Link>
                  {c.person_age != null && <span className="text-ink-500">, {c.person_age}</span>}
                  <span className="block text-[12px] text-ink-500">
                    <Mono>{c.ref}</Mono> · {KINDS[c.kind]?.short}
                  </span>
                </td>
                <td className="hidden py-3 pr-3 text-ink-600 md:table-cell">
                  {c.facility ?? c.lga ?? '—'}
                  <span className="block text-[12px] text-ink-500">{c.state}</span>
                </td>
                <td className="py-3 pr-3">
                  {c.a.flags
                    .filter((f) => f.severity !== 'watch')
                    .map((f) => (
                      <span key={f.text} className={cx('block', f.severity === 'critical' ? 'text-seal-600' : 'text-amberline-600')} title={rule(f.rule).ref}>
                        {f.text}
                      </span>
                    ))}
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums text-ink-950">{c.a.daysHeld ?? '—'}</td>
                <td className="py-3">{c.holder ? <span className="text-ink-800">{c.holder}</span> : <span className="font-medium text-seal-600">Nobody yet</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty title="Nobody is past a threshold in these states" />
      )}
    </>
  )
}
