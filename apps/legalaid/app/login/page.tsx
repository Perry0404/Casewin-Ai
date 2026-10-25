import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_100%_0%,rgba(209,166,70,0.18),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <Link href="/" className="relative">
          <Logo dark />
        </Link>
        <blockquote className="relative max-w-md">
          <p className="font-display text-3xl font-medium leading-snug">“Every person who is charged with a criminal offence shall be entitled to defend himself … by a legal practitioner of his own choice.”</p>
          <p className="mt-4 text-sm text-ink-300">Constitution of the Federal Republic of Nigeria, s.36(6)(c)</p>
        </blockquote>
        <p className="relative text-xs text-ink-400">Volunteers, coordinators and administrators. Every action on a file is recorded.</p>
      </div>
      <div className="flex items-center justify-center bg-parchment px-4 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-10 font-display text-3xl font-semibold tracking-tight text-ink-900 lg:mt-0">Sign in</h1>
          <p className="mt-2 text-ink-500">
            For volunteers and organisations. Need help instead?{' '}
            <a href="/help" className="font-medium text-ink-800 underline decoration-brass-300 underline-offset-4">
              Report a case
            </a>{' '}
            — no account needed.
          </p>
          <LoginForm next={searchParams.next} />
        </div>
      </div>
    </div>
  )
}
