'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo, cx } from './ui'

const ICONS: Record<string, string> = {
  overview: 'M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-3.5v-5h-5v5H4a1 1 0 0 1-1-1v-6.5Z',
  filings: 'M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4M7 11h6M7 14h4',
  cases: 'M3 6h14v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Zm4 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  causelist: 'M4 4h12v13H4zM4 8h12M8 2v4m4-4v4M7 11h2m2 0h2m-6 3h2',
  judgments: 'M10 3 3 6.5h14L10 3ZM5 8v6m3.3-6v6m3.4-6v6M15 8v6M3 16.5h14',
  analytics: 'M4 16V9m4 7V5m4 11v-5m4 5V7',
  staff: 'M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 8a5 5 0 0 1 10 0m2-8a2.5 2.5 0 1 0 0-5m1.5 13a4 4 0 0 0-3-3.9',
  guide: 'M4 4.5h5a2 2 0 0 1 2 2V17a1.5 1.5 0 0 0-1.5-1.5H4v-11Zm12 0h-5a2 2 0 0 0-2 2V17a1.5 1.5 0 0 1 1.5-1.5H16v-11Z',
  settings: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm6.4-2.5a6.4 6.4 0 0 0-.1-1.1l1.6-1.3-1.6-2.7-1.9.7a6 6 0 0 0-1.9-1.1L12.2 2.5H8.8l-.3 2a6 6 0 0 0-1.9 1.1l-1.9-.7-1.6 2.7 1.6 1.3a6.4 6.4 0 0 0 0 2.2l-1.6 1.3 1.6 2.7 1.9-.7a6 6 0 0 0 1.9 1.1l.3 2h3.4l.3-2a6 6 0 0 0 1.9-1.1l1.9.7 1.6-2.7-1.6-1.3c.1-.4.1-.7.1-1.1Z',
}

export default function RegistryNav({ court, name, role, queue, admin }: { court: string; name: string; role: string; queue: number; admin: boolean }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const items = [
    ['overview', 'Overview', '/registry'],
    ['filings', 'Filings', '/registry/filings'],
    ['cases', 'Cases', '/registry/cases'],
    ['causelist', 'Cause list', '/registry/cause-list'],
    ['judgments', 'Judgments', '/registry/judgments'],
    ['analytics', 'Judicial analytics', '/registry/analytics'],
    ['guide', 'Registry guide', '/registry/guide'],
    ...(admin
      ? [
          ['staff', 'Staff & logins', '/registry/staff'],
          ['settings', 'Court settings', '/registry/settings'],
        ]
      : []),
  ]

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <div className="no-print flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(!open)} className="rounded-md border border-ink-300 px-3 py-1.5 text-[13px] font-medium text-ink-900" aria-expanded={open}>
          Menu
        </button>
      </div>
      <aside className={cx('no-print flex-col border-r border-ink-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen', open ? 'flex' : 'hidden')}>
        <div className="hidden px-5 pb-1 pt-6 lg:block">
          <Logo />
        </div>
        <div className="mx-5 mt-5 border-y border-ink-200 py-3">
          <p className="text-[12px] text-ink-500">Registry</p>
          <p className="truncate text-[14px] font-semibold text-ink-950">{court}</p>
        </div>
        <nav className="mt-3 flex-1 space-y-px overflow-y-auto px-3">
          {items.map(([key, label, href]) => {
            const active = href === '/registry' ? path === href : path.startsWith(href)
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={cx(
                  'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[14px] transition-colors',
                  active ? 'bg-ink-100 font-medium text-ink-950' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-950',
                )}
              >
                {active && <span className="absolute -left-3 top-1.5 bottom-1.5 w-0.5 bg-brass-500" aria-hidden />}
                <svg viewBox="0 0 20 20" className={cx('h-[17px] w-[17px] shrink-0', active ? 'text-ink-950' : 'text-ink-400 group-hover:text-ink-700')} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={ICONS[key]} />
                </svg>
                <span className="flex-1">{label}</span>
                {key === 'filings' && queue > 0 && <span className="rounded-sm bg-brass-500 px-1.5 py-px text-[11px] font-semibold text-white tabular-nums">{queue}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-ink-200 p-3">
          <Link href="/registry/account" className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-ink-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-[12px] font-semibold text-white">
              {name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-ink-950">{name}</span>
              <span className="block truncate text-[12px] text-ink-500">{role}</span>
            </span>
          </Link>
          <button onClick={signOut} className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-[13px] text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-950">
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
