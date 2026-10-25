import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Tone } from '@/lib/constants'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Logo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className={dark ? 'fill-brass-400' : 'fill-ink-900'} />
        <path
          d="M16 7v18M9.5 25h13M16 9.5l-7 2.3m7-2.3 7 2.3M9 11.8 6 18.5c0 1.7 1.3 2.6 3 2.6s3-.9 3-2.6l-3-6.7Zm14 0-3 6.7c0 1.7 1.3 2.6 3 2.6s3-.9 3-2.6l-3-6.7Z"
          strokeLinejoin="round"
          className={dark ? 'stroke-ink-950' : 'stroke-brass-300'}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="leading-none">
        <span className={cx('block font-display text-[17px] font-semibold tracking-tight', dark ? 'text-white' : 'text-ink-900')}>CaseWin Legal Aid</span>
        <span className={cx('mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em]', dark ? 'text-brass-300' : 'text-brass-600')}>
          Free lawyers, tracked
        </span>
      </span>
    </span>
  )
}

const TONES: Record<Tone, string> = {
  good: 'bg-verdict-50 text-verdict-700 ring-verdict-500/20',
  warn: 'bg-amberline-50 text-amberline-600 ring-amberline-500/25',
  bad: 'bg-seal-50 text-seal-600 ring-seal-500/20',
  info: 'bg-ink-50 text-ink-700 ring-ink-500/15',
  neutral: 'bg-stone-100 text-stone-600 ring-stone-400/20',
}
const DOTS: Record<Tone, string> = {
  good: 'bg-verdict-500',
  warn: 'bg-amberline-500',
  bad: 'bg-seal-500',
  info: 'bg-ink-500',
  neutral: 'bg-stone-400',
}

/** Status pill — always dot + text, never colour alone. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', DOTS[tone])} aria-hidden />
      {children}
    </span>
  )
}

export function SampleTag() {
  return (
    <span title="Demonstration data — remove under Settings" className="rounded border border-dashed border-ink-300 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-ink-400">
      Sample
    </span>
  )
}

export function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx('rounded-2xl border border-ink-100 bg-white shadow-card', pad && 'p-5 sm:p-6', className)}>{children}</div>
}

export function CardTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink-900">{children}</h2>
        {sub && <p className="mt-0.5 text-sm text-ink-400">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink-900 sm:text-[32px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-500">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ title, children, icon = '§' }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-parchment/60 px-6 py-14 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white font-display text-xl text-brass-600 shadow-card">{icon}</div>
      <p className="font-medium text-ink-800">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-400">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <Card className="relative overflow-hidden">
      <p className="text-[13px] font-medium text-ink-500">{label}</p>
      <p className="mt-2 font-display text-[34px] font-semibold leading-none tracking-tight text-ink-900">{value}</p>
      {hint && (
        <p className={cx('mt-2 text-[13px]', tone === 'bad' ? 'text-seal-600' : tone === 'good' ? 'text-verdict-600' : tone === 'warn' ? 'text-amberline-600' : 'text-ink-400')}>
          {hint}
        </p>
      )}
    </Card>
  )
}

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400 disabled:cursor-not-allowed disabled:opacity-50',
  brass:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-brass-400 px-5 py-3 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-brass-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50 disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-seal-500/30 bg-white px-4 py-2.5 text-sm font-semibold text-seal-600 transition hover:bg-seal-50 disabled:opacity-50',
  ghost: 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900',
}

export const input =
  'block w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 shadow-sm placeholder:text-ink-300 transition focus:border-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-100'

export function Field({ label, hint, children, required }: { label: string; hint?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-seal-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  )
}

export function Notice({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return <div className={cx('rounded-xl px-4 py-3 text-sm ring-1 ring-inset', TONES[tone])}>{children}</div>
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-ink-800 underline decoration-brass-300 decoration-2 underline-offset-4 transition hover:decoration-brass-500">
      {children}
    </Link>
  )
}

export function Mono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[13px] tracking-tight', className)}>{children}</span>
}
