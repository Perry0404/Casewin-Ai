import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Tone } from '@/lib/constants'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** CaseWin family mark: a solid block with the product's accent tab. */
export function Mark({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-6 w-6 shrink-0', className)} aria-hidden>
      <rect width="24" height="24" className={dark ? 'fill-white' : 'fill-ink-950'} />
      <rect x="5" y="5" width="3" height="14" className={dark ? 'fill-ink-950' : 'fill-white'} />
      <rect x="11" y="13" width="8" height="6" className="fill-brass-400" />
    </svg>
  )
}

export function Logo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Mark dark={dark} />
      <span className={cx('text-[16px] font-semibold leading-none tracking-[-0.01em]', dark ? 'text-white' : 'text-ink-950')}>
        CaseWin <span className={dark ? 'font-normal text-ink-300' : 'font-normal text-ink-500'}>Court</span>
      </span>
    </span>
  )
}

const TONES: Record<Tone, string> = {
  good: 'bg-verdict-50 text-verdict-700',
  warn: 'bg-amberline-50 text-amberline-600',
  bad: 'bg-seal-50 text-seal-600',
  info: 'bg-ink-100 text-ink-700',
  neutral: 'bg-ink-50 text-ink-500',
}
const DOTS: Record<Tone, string> = {
  good: 'bg-verdict-500',
  warn: 'bg-amberline-500',
  bad: 'bg-seal-500',
  info: 'bg-ink-500',
  neutral: 'bg-ink-300',
}

/** Status label — always dot + text, never colour alone. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[12px] font-medium leading-tight', TONES[tone])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', DOTS[tone])} aria-hidden />
      {children}
    </span>
  )
}

export function SampleTag() {
  return (
    <span title="Demonstration data — remove under Settings" className="rounded-sm border border-dashed border-ink-300 px-1 text-[11px] font-medium text-ink-400">
      sample
    </span>
  )
}

export function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx('rounded-md border border-ink-200 bg-white', pad && 'p-5 sm:p-6', className)}>{children}</div>
}

export function CardTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink-950">{children}</h2>
        {sub && <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[13px] text-ink-500">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink-950 sm:text-[30px]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink-300 px-6 py-10 text-center">
      <p className="font-medium text-ink-800">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-[13px] text-ink-500">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className="border-l-2 border-ink-200 py-1 pl-4">
      <p className="text-[13px] text-ink-500">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums">{value}</p>
      {hint && (
        <p className={cx('mt-1.5 text-[13px]', tone === 'bad' ? 'text-seal-600' : tone === 'good' ? 'text-verdict-600' : tone === 'warn' ? 'text-amberline-600' : 'text-ink-500')}>{hint}</p>
      )}
    </div>
  )
}

const base = 'inline-flex items-center justify-center gap-2 rounded-md text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'
export const btn = {
  primary: `${base} bg-ink-950 px-4 py-2.5 text-white hover:bg-ink-800`,
  brass: `${base} bg-brass-500 px-4 py-2.5 text-white hover:bg-brass-600`,
  secondary: `${base} border border-ink-300 bg-white px-4 py-2.5 text-ink-900 hover:border-ink-400 hover:bg-ink-50`,
  danger: `${base} border border-seal-500/40 bg-white px-4 py-2.5 text-seal-600 hover:bg-seal-50`,
  ghost: `${base} px-2.5 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-950`,
}

export const input =
  'block w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-[15px] text-ink-950 placeholder:text-ink-400 transition-colors focus:border-ink-950 focus:outline-none focus:ring-2 focus:ring-brass-500/20'

export function Field({ label, hint, children, required }: { label: string; hint?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink-900">
        {label}
        {required && <span className="ml-0.5 text-seal-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] text-ink-500">{hint}</span>}
    </label>
  )
}

export function Notice({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const bar: Record<Tone, string> = { good: 'border-verdict-500', warn: 'border-amberline-500', bad: 'border-seal-500', info: 'border-ink-900', neutral: 'border-ink-300' }
  return <div className={cx('border-l-4 bg-ink-50 px-4 py-3 text-[14px] text-ink-800', bar[tone])}>{children}</div>
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="prose-link">
      {children}
    </Link>
  )
}

export function Mono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[13px]', className)}>{children}</span>
}
