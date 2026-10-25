'use client'

// Small, dependency-free SVG charts for the analytics dashboard.
// Specs: bars ≤24px thick with 4px rounded data-ends, 2px lines, hairline
// solid gridlines, hover tooltip on every mark, legend for ≥2 series.
// Series colours (validated for colour-vision deficiency on white):
//   series-1 #3B5B9A (navy) · series-2 #B47D1F (brass)

import { useEffect, useRef, useState, type ReactNode } from 'react'

export const SERIES = ['#3B5B9A', '#B47D1F'] as const
// Ordinal ramp for age buckets: light → dark, lightest still clears 2:1 on white.
export const ORDINAL = ['#86A3D4', '#5F80BD', '#3B5B9A', '#2B4475', '#1C2D52']

const GRID = '#E7E9EF'
const AXIS = '#C5CEDE'
const MUTED = '#6A7C9C'

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function niceMax(v: number) {
  if (v <= 0) return 4
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * p
}

function ticks(max: number) {
  return [0, max / 4, max / 2, (3 * max) / 4, max]
}

/** Path for a column with a 4px rounded top and square base. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h)
  if (h <= 0) return ''
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

function Tooltip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const left = Math.min(Math.max(x, 70), width - 70)
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink-950 px-3 py-2 text-xs text-white shadow-lift"
      style={{ left, top: y - 10 }}
    >
      {children}
    </div>
  )
}

export function ColumnChart({
  data,
  height = 220,
  unit = '',
  colors,
}: {
  data: { label: string; value: number; sub?: string }[]
  height?: number
  unit?: string
  colors?: string[]
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { t: 12, r: 8, b: 28, l: 36 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const band = iw / Math.max(data.length, 1)
  const bw = Math.min(24, band * 0.6)
  const y = (v: number) => pad.t + ih - (v / max) * ih

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={height} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join(', ')}>
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cxm = pad.l + band * i + band / 2
          const h = (d.value / max) * ih
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent" />
              <path
                d={columnPath(cxm - bw / 2, pad.t + ih - h, bw, h)}
                fill={colors?.[i] ?? SERIES[0]}
                opacity={hover === null || hover === i ? 1 : 0.45}
                style={{ transition: 'opacity .15s' }}
              />
              <text x={cxm} y={height - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <Tooltip x={pad.l + band * hover + band / 2} y={y(data[hover].value)} width={width}>
          <div className="font-semibold">
            {data[hover].value.toLocaleString()}
            {unit}
          </div>
          <div className="text-ink-300">{data[hover].sub ?? data[hover].label}</div>
        </Tooltip>
      )}
    </div>
  )
}

export function LineChart({
  labels,
  series,
  height = 260,
}: {
  labels: string[]
  series: { name: string; values: number[] }[]
  height?: number
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { t: 16, r: 84, b: 28, l: 36 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 1))
  const x = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / max) * ih
  const every = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 56)))

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const box = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const rel = (e.clientX - box.left) / box.width
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(rel * (labels.length - 1)))))
  }

  // End labels: nudge apart when the two series finish close together.
  const ends = series.map((s, i) => ({ i, y: y(s.values[s.values.length - 1] ?? 0) }))
  if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 14) {
    const mid = (ends[0].y + ends[1].y) / 2
    const [a, b] = ends[0].y <= ends[1].y ? [0, 1] : [1, 0]
    ends[a].y = mid - 7
    ends[b].y = mid + 7
  }

  return (
    <div ref={ref} className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-[13px] text-ink-600">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <span className="h-[3px] w-4 rounded-full" style={{ background: SERIES[i] }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg width={width} height={height} role="img" aria-label={series.map((s) => `${s.name}: ${s.values.join(', ')}`).join('; ')}>
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % every === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
              {l}
            </text>
          ) : null,
        )}
        {series.map((s, si) => (
          <g key={s.name}>
            <path
              d={`M${s.values.map((v, i) => `${x(i)},${y(v)}`).join('L')}L${x(s.values.length - 1)},${y(0)}L${x(0)},${y(0)}Z`}
              fill={SERIES[si]}
              opacity={0.07}
            />
            <polyline
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
              fill="none"
              stroke={SERIES[si]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1] ?? 0)} r={4} fill={SERIES[si]} stroke="#fff" strokeWidth={2} />
            <text x={x(s.values.length - 1) + 10} y={ends[si].y + 4} fontSize={12} fontWeight={600} fill="#26344F">
              {s.name.split(' ')[0]}
            </text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={AXIS} strokeWidth={1} />
            {series.map((s, si) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={SERIES[si]} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
        )}
        <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} y={Math.min(...series.map((s) => y(s.values[hover])))} width={width}>
          <div className="mb-1 font-semibold">{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: SERIES[si] }} />
              <span className="text-ink-300">{s.name}</span>
              <span className="ml-auto pl-3 font-semibold tabular-nums">{s.values[hover]}</span>
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  )
}

/** Horizontal bars with labels and values on the left; used for rankings. */
export function BarList({
  data,
  unit = '',
  highlightAbove,
  note,
}: {
  data: { label: string; value: number; sub?: string; href?: string }[]
  unit?: string
  highlightAbove?: number
  note?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      <ul className="space-y-2.5">
        {data.map((d) => {
          const over = highlightAbove !== undefined && d.value > highlightAbove
          return (
            <li key={d.label} className="group grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm" title={`${d.label}: ${d.value}${unit}${d.sub ? ` — ${d.sub}` : ''}`}>
              <span className="truncate text-ink-700">{d.label}</span>
              <span className="relative h-5">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] transition-opacity group-hover:opacity-80"
                  style={{ width: `${(d.value / max) * 100}%`, background: over ? SERIES[1] : SERIES[0], maxHeight: 20 }}
                />
                {highlightAbove !== undefined && (
                  <span className="absolute inset-y-[-3px] w-px bg-ink-300" style={{ left: `${(highlightAbove / max) * 100}%` }} aria-hidden />
                )}
              </span>
              <span className="text-right font-semibold tabular-nums text-ink-900">
                {d.value.toLocaleString()}
                {unit}
              </span>
            </li>
          )
        })}
      </ul>
      {note && <p className="mt-3 text-xs text-ink-400">{note}</p>}
    </div>
  )
}
