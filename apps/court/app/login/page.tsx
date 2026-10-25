import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/site'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

const ERRORS: Record<string, string> = {
  'no-access': 'This account is not linked to an active court. Ask your court administrator.',
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:py-20">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] text-ink-950">Sign in</h1>
          <p className="mt-2 text-[15px] text-ink-600">Court staff, approved e-filers and administrators.</p>
          <LoginForm next={searchParams.next} initialError={searchParams.error ? ERRORS[searchParams.error] : undefined} />
          <p className="mt-8 border-t border-ink-200 pt-5 text-[14px] text-ink-600">
            No account yet?{' '}
            <Link href="/register" className="prose-link">
              Register to file or to work in a registry
            </Link>
          </p>
        </div>
        <aside className="hidden self-start border-l border-ink-200 pl-12 text-[14px] leading-relaxed text-ink-600 lg:block">
          <h2 className="text-[15px] font-semibold text-ink-950">After you sign in</h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="font-medium text-ink-900">Lawyers and litigants</dt>
              <dd>Your filer portal: every filing, its fees, suit number and hearing dates.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Clerks, registrars and judges</dt>
              <dd>Your court’s registry, showing what your role allows.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">Platform administrators</dt>
              <dd>The Justice admin for Court, Legal Aid and OpenLegal.</dd>
            </div>
          </dl>
          <p className="mt-6 text-[13px] text-ink-500">Every action is recorded against your name.</p>
        </aside>
      </main>
    </div>
  )
}
