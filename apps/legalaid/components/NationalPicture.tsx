import type { National, StateRow } from '@/lib/national'

// Charts for the national picture. Series colours follow the validated pair used across
// CaseWin (#3B5B9A, #B47D1F); the map uses one hue in steps, and every value is also printed.

// Approximate geographic tile layout of the 36 states and the FCT: [column, row].
const TILES: Record<string, [number, number]> = {
  Sokoto: [1, 0], Katsina: [2, 0], Jigawa: [3, 0], Yobe: [4, 0], Borno: [5, 0],
  Kebbi: [0, 1], Zamfara: [1, 1], Kano: [2, 1], Bauchi: [3, 1], Gombe: [4, 1], Adamawa: [5, 1],
  Niger: [0, 2], Kaduna: [1, 2], FCT: [2, 2], Plateau: [3, 2], Taraba: [4, 2],
  Kwara: [0, 3], Kogi: [1, 3], Nasarawa: [2, 3], Benue: [3, 3],
  Oyo: [0, 4], Osun: [1, 4], Ekiti: [2, 4], Enugu: [3, 4], Ebonyi: [4, 4], 'Cross River': [5, 4],
  Ogun: [0, 5], Ondo: [1, 5], Edo: [2, 5], Anambra: [3, 5], Abia: [4, 5], 'Akwa Ibom': [5, 5],
  Lagos: [0, 6], Delta: [1, 6], Bayelsa: [2, 6], Imo: [3, 6], Rivers: [4, 6],
}
const SHORT: Record<string, string> = { 'Cross River': 'C. River', 'Akwa Ibom': 'A. Ibom', Nasarawa: 'Nasar.', Adamawa: 'Adam.', Zamfara: 'Zamf.', Anambra: 'Anam.', Bayelsa: 'Bayel.' }
const STEPS = ['#F1F4FA', '#D3DDEF', '#A9BCDF', '#7493C6', '#3B5B9A', '#22396A']

export function TileMap({ states, metric, label }: { states: StateRow[]; metric: keyof Omit<StateRow, 'state'>; label: string }) {
  const by = new Map(states.map((s) => [s.state, s[metric]]))
  const max = Math.max(1, ...states.map((s) => s[metric]))
  const shade = (v: number) => (v === 0 ? STEPS[0] : STEPS[Math.min(5, 1 + Math.floor((v / max) * 4.999))])
  return (
    <figure>
      <svg viewBox="0 0 600 490" className="w-full max-w-xl" role="img" aria-label={`${label} by state`}>
        {Object.entries(TILES).map(([s, [x, y]]) => {
          const v = by.get(s) ?? 0
          const dark = v > 0 && v / max > 0.55
          return (
            <g key={s} transform={`translate(${x * 98 + 6},${y * 68 + 6})`}>
              <title>{`${s}: ${v}`}</title>
              <rect width="92" height="62" fill={shade(v)} stroke="#fff" strokeWidth="2" />
              <text x="8" y="22" fontSize="13" fill={dark ? '#fff' : '#3A3A37'}>
                {SHORT[s] ?? s}
              </text>
              <text x="8" y="48" fontSize="20" fontWeight="600" fill={dark ? '#fff' : '#161615'}>
                {v}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex items-center gap-3 text-[12px] text-ink-500">
        <span>{label}</span>
        <span className="flex">
          {STEPS.map((c) => (
            <span key={c} className="h-2.5 w-5" style={{ background: c }} />
          ))}
        </span>
        <span>0 → {max}</span>
      </figcaption>
    </figure>
  )
}

export function Bars({ rows, color = '#3B5B9A' }: { rows: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3 text-[13px]">
          <span className="text-ink-700">{r.label}</span>
          <span className="h-3 bg-ink-100">
            <span className="block h-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
          <span className="text-right tabular-nums text-ink-950">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function Monthly({ m }: { m: National['monthly'] }) {
  const max = Math.max(1, ...m.received, ...m.resolved)
  const w = 560
  const h = 160
  const bw = w / m.months.length
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full" role="img" aria-label="Requests received and outcomes recorded, by month">
        {[0.5, 1].map((t) => (
          <line key={t} x1="0" x2={w} y1={h - h * t} y2={h - h * t} stroke="#ECECEA" />
        ))}
        {m.months.map((mo, i) => {
          const a = (m.received[i]! / max) * h
          const b = (m.resolved[i]! / max) * h
          return (
            <g key={mo} transform={`translate(${i * bw + bw * 0.15},0)`}>
              <title>{`${mo}: ${m.received[i]} received, ${m.resolved[i]} outcomes`}</title>
              <rect y={h - a} width={bw * 0.32} height={a} fill="#3B5B9A" />
              <rect x={bw * 0.36} y={h - b} width={bw * 0.32} height={b} fill="#B47D1F" />
              <text x={bw * 0.34} y={h + 16} textAnchor="middle" fontSize="11" fill="#6E6E69">
                {new Date(mo + '-01').toLocaleDateString('en-GB', { month: 'short' })}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-1 flex gap-4 text-[12px] text-ink-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5" style={{ background: '#3B5B9A' }} />
          Requests received
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5" style={{ background: '#B47D1F' }} />
          Outcomes recorded
        </span>
      </figcaption>
    </figure>
  )
}

export const INCIDENT_LABELS: Record<string, string> = {
  extortion: 'Extortion (money for bail or release)',
  torture: 'Torture or beating',
  unlawful_detention: 'Detention beyond the legal limit',
  detention_of_relative: 'Relative held in place of a suspect',
  sexual_violence: 'Sexual violence',
  death_in_custody: 'Death in custody',
  unlawful_seizure: 'Unlawful seizure of property',
  threats: 'Threats or intimidation',
  other: 'Other',
}
