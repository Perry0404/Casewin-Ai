import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import QuickExit from '@/components/QuickExit'
import { Notice, cx } from '@/components/ui'
import { FORM_LANGS, dict } from '@/lib/i18n'
import ReportForm from './ReportForm'

export const metadata: Metadata = { title: 'Get help' }

export default function HelpPage({ searchParams }: { searchParams: { kind?: string; lang?: string } }) {
  const t = dict(searchParams.lang)
  const lang = FORM_LANGS.some(([k]) => k === searchParams.lang) ? searchParams.lang! : 'en'
  const keep = searchParams.kind ? `&kind=${encodeURIComponent(searchParams.kind)}` : ''
  return (
    <PublicPage>
      <QuickExit label={t.quick_exit} />
      <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-[14px]" aria-label="Language">
        {FORM_LANGS.map(([k, name]) => (
          <Link key={k} href={`/help?lang=${k}${keep}`} className={cx(k === lang ? 'font-semibold text-ink-950' : 'text-ink-600 underline underline-offset-4 hover:text-ink-950')} aria-current={k === lang ? 'true' : undefined}>
            {name}
          </Link>
        ))}
      </nav>
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">{t.title}</h1>
      <p className="mt-3 max-w-xl text-[17px] text-ink-600">{t.intro}</p>
      {t.draft && (
        <div className="mt-6">
          <Notice tone="warn">{t.draft_note}</Notice>
        </div>
      )}
      <div className="mt-10">
        <ReportForm defaultKind={searchParams.kind} t={t} lang={lang} />
      </div>
    </PublicPage>
  )
}
