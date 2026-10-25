import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:py-20">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] text-ink-950">Sign in</h1>
          <p className="mt-2 text-[15px] text-ink-600">Volunteers, coordinators and administrators. Asking for help doesn’t need an account.</p>
          <LoginForm next={searchParams.next} />
          <p className="mt-8 border-t border-ink-200 pt-5 text-[14px] text-ink-600">
            Need help, not an account?{' '}
            <Link href="/help" className="prose-link">
              Report a case instead
            </Link>
          </p>
        </div>
        <aside className="hidden self-start border-l border-ink-200 pl-12 text-[14px] leading-relaxed text-ink-600 lg:block">
          <h2 className="text-[15px] font-semibold text-ink-950">After you sign in</h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="font-medium text-ink-900">Volunteers</dt>
              <dd>Your desk: the case board for your states, your open files, visits and your pro bono record.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Organisation coordinators</dt>
              <dd>Your team and every case it holds.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Administrators</dt>
              <dd>The caseload, and verification in the Justice admin.</dd>
            </div>
          </dl>
          <p className="mt-6 text-[13px] text-ink-500">Every action is recorded against your name.</p>
        </aside>
      </main>
    </div>
  )
}
