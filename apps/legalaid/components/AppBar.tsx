'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo, cx } from './ui'

/** Header for signed-in areas: logo, area name, tabs with counts, the user. */
export default function AppBar({ area, tabs, user, extra }: { area: string; tabs: [string, string, number?][]; user: string; extra?: ReactNode }) {
  const path = usePathname()
  const root = tabs[0]?.[0]
  return (
    <header className="no-print border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={root ?? '/'}>
            <Logo />
          </Link>
          <span className="hidden h-5 w-px bg-ink-200 sm:block" />
          <span className="hidden truncate text-[14px] text-ink-600 sm:block">{area}</span>
        </div>
        <div className="flex items-center gap-1 text-[13px]">
          {extra}
          <span className="hidden px-2 text-ink-500 md:inline">{user}</span>
          <button
            onClick={async () => {
              await createClient().auth.signOut()
              window.location.href = '/login'
            }}
            className="rounded-md px-2.5 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-950"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="mx-auto mt-2 flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
        {tabs.map(([href, label, count]) => {
          const active = href === root ? path === href : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                'relative whitespace-nowrap px-3 py-2.5 text-[14px] transition-colors',
                active ? 'font-medium text-ink-950 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-ink-950' : 'text-ink-600 hover:text-ink-950',
              )}
            >
              {label}
              {count ? <span className="ml-1.5 rounded-sm bg-brass-500 px-1.5 py-px text-[11px] font-semibold text-white tabular-nums">{count}</span> : null}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
