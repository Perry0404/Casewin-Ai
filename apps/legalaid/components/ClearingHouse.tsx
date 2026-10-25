import type { Provider } from '@/lib/clearing'
import { STATES } from '@/lib/constants'
import { Badge, cx } from './ui'

const hours = (h: number | null) => (h == null ? '—' : h < 1 ? '< 1 h' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} d`)
const KIND_TONE = { org: 'info', volunteer: 'neutral', others: 'neutral' } as const

/** One row per provider; open a row to see every state and town they worked in. */
export function ProviderTable({ providers, state }: { providers: Provider[]; state?: string }) {
  const rows = state ? providers.filter((p) => p.byState.some(([s]) => s === state) || p.state === state) : providers
  if (!rows.length) return <p className="border-t border-ink-950 py-6 text-[15px] text-ink-600">No providers{state ? ` in ${state}` : ''} yet.</p>
  return (
    <div className="border-t border-ink-950">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_repeat(5,minmax(0,0.7fr))_minmax(0,2fr)] gap-4 border-b border-ink-200 py-2 text-[12px] text-ink-500 lg:grid">
        <span>Provider</span>
        <span className="text-right">Cases</span>
        <span className="text-right">Active</span>
        <span className="text-right">Outcomes</span>
        <span className="text-right">Released</span>
        <span className="text-right">First action</span>
        <span>Where</span>
      </div>
      {rows.map((p) => (
        <details key={p.key} className="group border-b border-ink-200">
          <summary className="grid cursor-pointer list-none grid-cols-2 gap-x-4 gap-y-2 py-4 lg:grid-cols-[minmax(0,2.2fr)_repeat(5,minmax(0,0.7fr))_minmax(0,2fr)] lg:items-baseline [&::-webkit-details-marker]:hidden">
            <span className="col-span-2 lg:col-span-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-ink-950 group-open:underline">{p.name}</span>
                <Badge tone={KIND_TONE[p.kind]}>{p.kind === 'org' ? 'Organisation' : p.kind === 'volunteer' ? 'Volunteer' : 'Aggregated'}</Badge>
              </span>
              <span className="mt-0.5 block text-[13px] text-ink-500">
                {p.subtitle}
                {p.state && ` · ${p.state}`}
                {p.kind === 'org' && ` · ${p.members} member${p.members === 1 ? '' : 's'}`}
                {p.referredWaiting > 0 && <span className="font-medium text-amberline-600"> · {p.referredWaiting} referred, waiting</span>}
              </span>
            </span>
            <Num label="Cases" v={p.taken} strong />
            <Num label="Active" v={p.active} />
            <Num label="Outcomes" v={p.resolved} />
            <Num label="Released" v={p.released} good />
            <Num label="First action" v={hours(p.medianHours)} />
            <span className="col-span-2 text-[13px] text-ink-700 lg:col-span-1">
              {p.byState.length ? p.byState.slice(0, 4).map(([s, n]) => `${s} ${n}`).join(' · ') : <span className="text-ink-400">No cases yet</span>}
              {p.byState.length > 4 && <span className="text-ink-400"> · +{p.byState.length - 4}</span>}
            </span>
          </summary>
          {p.byTown.length > 0 && (
            <div className="grid gap-6 pb-5 sm:grid-cols-2">
              <Breakdown title="By state" rows={p.byState} />
              <Breakdown title="By town or facility" rows={p.byTown} />
            </div>
          )}
        </details>
      ))}
    </div>
  )
}

function Num({ label, v, strong = false, good = false }: { label: string; v: number | string; strong?: boolean; good?: boolean }) {
  return (
    <span className="flex items-baseline justify-between gap-2 lg:block lg:text-right">
      <span className="text-[12px] text-ink-500 lg:hidden">{label}</span>
      <span className={cx('tabular-nums', strong ? 'text-[17px] font-semibold text-ink-950' : 'text-[15px] text-ink-800', good && Number(v) > 0 && 'font-semibold text-verdict-600')}>{v}</span>
    </span>
  )
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(...rows.map(([, n]) => n))
  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-ink-500">{title}</p>
      <ul className="space-y-1.5">
        {rows.slice(0, 12).map(([k, n]) => (
          <li key={k} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-[13px]">
            <span className="truncate text-ink-800">{k}</span>
            <span className="h-2 bg-ink-100">
              <span className="block h-full bg-[#3B5B9A]" style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums text-ink-950">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StateFilter({ state, action }: { state?: string; action: string }) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <select name="state" defaultValue={state ?? ''} className="rounded-md border border-ink-300 bg-white px-3 py-2 text-[14px]">
        <option value="">All states</option>
        {STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <button className="rounded-md border border-ink-300 bg-white px-3 py-2 text-[14px] font-medium hover:bg-ink-50">Show</button>
    </form>
  )
}
