import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Staff sign in' }

const ERRORS: Record<string, string> = {
  'no-access': 'This account is not linked to an active court. Ask your court administrator.',
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_100%_0%,rgba(209,166,70,0.18),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <Link href="/" className="relative">
          <Logo dark />
        </Link>
        <blockquote className="relative max-w-md">
          <p className="font-display text-3xl font-medium leading-snug">“Justice delayed is justice denied.”</p>
          <p className="mt-4 text-sm text-ink-300">The registry is where delay begins — or ends.</p>
        </blockquote>
        <p className="relative text-xs text-ink-400">Authorised court staff only. All activity is recorded.</p>
      </div>
      <div className="flex items-center justify-center bg-parchment px-4 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-10 font-display text-3xl font-semibold tracking-tight text-ink-900 lg:mt-0">Staff sign in</h1>
          <p className="mt-2 text-ink-500">Use the email and password your court administrator gave you.</p>
          <LoginForm next={searchParams.next} initialError={searchParams.error ? ERRORS[searchParams.error] : undefined} />
        </div>
      </div>
    </div>
  )
}
