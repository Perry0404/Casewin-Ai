import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '@/components/site'
import { Notice, btn } from '@/components/ui'
import { getFiler, getUser } from '@/lib/auth'
import { listCourts } from '@/lib/data'
import { isConfigured } from '@/lib/supabase/server'
import FilingForm from './FilingForm'

export const metadata: Metadata = { title: 'File a case' }
export const dynamic = 'force-dynamic'

export default async function FilePage() {
  const configured = isConfigured()
  const [courts, user, filer] = configured ? await Promise.all([listCourts(), getUser(), getFiler()]) : [[], null, null]

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">E-filing</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">File a new case</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-500">
          Submit your originating process to the registry. You get a tracking code at once; the registry assesses fees and issues your suit
          number. <Link href="/e-filing" className="font-medium text-ink-800 underline decoration-brass-300 underline-offset-4">How e-filing works</Link>
        </p>
        <div className="mt-10">
          {courts.length === 0 ? (
            <Notice tone="warn">No court is accepting e-filings yet. Please check back soon.</Notice>
          ) : !filer ? (
            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-lift sm:p-12">
              <h2 className="font-display text-2xl font-semibold text-ink-900">{user ? 'Your account isn’t approved for e-filing yet' : 'E-filing needs a verified account'}</h2>
              <p className="mt-3 max-w-xl text-ink-500">
                So the registry always knows who filed what, every filer — counsel, a party in person or a government agency — registers once and is
                verified before their first filing. It usually takes one working day.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className={btn.primary}>
                  {user ? 'Check my registration' : 'Register to e-file'}
                </Link>
                {!user && (
                  <Link href="/login?next=/file" className={btn.secondary}>
                    I’m already approved — sign in
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <FilingForm
              courts={courts}
              filer={{
                full_name: filer.full_name,
                email: filer.email,
                phone: filer.phone,
                filer_type: filer.filer_type,
                bar_number: filer.bar_number,
                law_firm: filer.law_firm,
              }}
            />
          )}
        </div>
      </div>
    </PublicShell>
  )
}
