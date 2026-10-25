import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Shell, Tag } from '@/components/site'
import { adminDb } from '@/lib/admin-db'
import { POINTS, myContributions } from '@/lib/contrib'
import { currentContributor } from '@/lib/session'
import { longDate } from '@/lib/constants'
import AuthPanel from './AuthPanel'
import KeyPanel from './KeyPanel'
import SignOut from './SignOut'

export const metadata: Metadata = { title: 'Contribute', description: 'Help put Nigerian law online. Contribute judgments from your AI assistant or the web, and earn contribution points.' }
export const dynamic = 'force-dynamic'

async function createProfile(form: FormData) {
  'use server'
  const { user, contributor } = await currentContributor()
  if (!user || contributor) redirect('/contribute')
  const name = String(form.get('display_name') ?? '').trim().slice(0, 80)
  const role = String(form.get('role') ?? 'student')
  if (!name) redirect('/contribute?error=name')
  await adminDb()
    .from('contributors')
    .insert({
      user_id: user.id,
      display_name: name,
      institution: String(form.get('institution') ?? '').trim().slice(0, 120) || null,
      role: ['student', 'lawyer', 'litigant', 'researcher', 'other'].includes(role) ? role : 'other',
    })
  redirect('/contribute')
}

const STATUS = {
  pending: { label: 'Waiting for review', tone: 'neutral' as const },
  verified: { label: 'Verified & published', tone: 'green' as const },
  rejected: { label: 'Not accepted', tone: 'sample' as const },
  duplicate: { label: 'Duplicate', tone: 'sample' as const },
}

export default async function ContributePage() {
  const { user, contributor } = await currentContributor()

  return (
    <Shell query="">
      <section className="border-b border-ink-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Contributor network</p>
            <h1 className="mt-3 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-ink">Help put Nigerian law online.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              Got a judgment from a case you worked on, a court you visited, or your research? Send it to OpenLegal — straight from your AI
              assistant or from this page. Reviewers verify it, it goes live free for everyone, and you earn contribution points.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['Connect', 'Get your personal key and add OpenLegal to Claude, ChatGPT or any MCP client.'],
                ['Contribute', 'Tell your AI “upload this judgment to OpenLegal”. It checks for duplicates first.'],
                ['Earn', `${POINTS.verified} points when your case is verified as new. Duplicates earn nothing.`],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-2xl border border-ink-line bg-paper p-5">
                  <span className="font-mono text-xs text-naija-600">0{i + 1}</span>
                  <p className="mt-1 font-serif text-lg font-semibold text-ink">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-ink-3">
              Only the court’s own judgment text — never a law report’s headnotes or summaries. Points are contribution points; they have no cash
              value today. <Link href="/leaderboard" className="font-medium text-naija-700 underline underline-offset-4">See the leaderboard →</Link>
            </p>
          </div>

          <div className="lg:pt-6">
            {!user && <AuthPanel />}
            {user && !contributor && (
              <form action={createProfile} className="rounded-3xl border border-ink-line bg-paper p-6 shadow-card sm:p-8">
                <p className="font-serif text-2xl font-semibold text-ink">Set up your contributor profile</p>
                <p className="mt-1 text-sm text-ink-3">Your name and institution appear on the leaderboard. Your email never does.</p>
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink-2">Display name</span>
                    <input name="display_name" required className="w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink-2">Law school, firm or chambers</span>
                    <input name="institution" placeholder="e.g. Imo State University Faculty of Law" className="w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink-2">I am a</span>
                    <select name="role" className="w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5">
                      <option value="student">Law student</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="litigant">Party to a case</option>
                      <option value="researcher">Researcher / journalist</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <button className="w-full rounded-xl bg-naija-500 px-5 py-3 font-semibold text-white transition hover:bg-naija-600">Join the network</button>
                </div>
              </form>
            )}
            {contributor && <Dashboard contributorId={contributor.id} />}
          </div>
        </div>
      </section>
      {contributor && <Submissions />}
    </Shell>
  )
}

async function Dashboard({ contributorId }: { contributorId: string }) {
  const { contributor } = await currentContributor()
  if (!contributor || contributor.id !== contributorId) return null
  const mine = await myContributions(contributor)
  const verified = mine.submissions.filter((s) => s.status === 'verified').length
  const pending = mine.submissions.filter((s) => s.status === 'pending').length
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-naija-900 p-6 text-white shadow-lift sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-naija-100/80">Welcome, {contributor.display_name}</p>
            <p className="mt-3 font-serif text-6xl font-medium">{mine.points.toLocaleString()}</p>
            <p className="text-sm text-naija-100/80">contribution points{mine.rank ? ` · #${mine.rank} on the leaderboard` : ''}</p>
          </div>
          <SignOut />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
          <div>
            <dt className="text-naija-100/70">Verified</dt>
            <dd className="font-serif text-2xl">{verified}</dd>
          </div>
          <div>
            <dt className="text-naija-100/70">Waiting for review</dt>
            <dd className="font-serif text-2xl">{pending}</dd>
          </div>
        </dl>
      </div>
      <KeyPanel prefix={contributor.api_key_prefix} />
      <Link href="/contribute/new" className="block rounded-2xl border border-ink-line bg-white p-5 text-center font-semibold text-ink shadow-card transition hover:border-naija-400 hover:text-naija-700">
        No AI assistant? Upload a judgment on the web →
      </Link>
    </div>
  )
}

async function Submissions() {
  const { contributor } = await currentContributor()
  if (!contributor) return null
  const { submissions } = await myContributions(contributor)
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h2 className="font-serif text-3xl font-medium text-ink">Your submissions</h2>
      {submissions.length ? (
        <ul className="mt-6 divide-y divide-ink-line overflow-hidden rounded-2xl border border-ink-line bg-white shadow-card">
          {submissions.map((s) => {
            const st = STATUS[s.status as keyof typeof STATUS]
            return (
              <li key={s.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg font-semibold text-ink">{s.title}</p>
                  <p className="text-sm text-ink-3">
                    {s.court_name} · sent {longDate(s.created_at)}
                    {s.confirmations > 0 && ` · confirmed by ${s.confirmations} other contributor${s.confirmations === 1 ? '' : 's'}`}
                  </p>
                  {s.reviewer_note && <p className="mt-1 text-sm text-ink-2">Reviewer: {s.reviewer_note}</p>}
                </div>
                <Tag tone={st.tone}>{st.label}</Tag>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-line p-10 text-center text-ink-3">Nothing yet. Your first verified judgment earns {POINTS.verified} points.</p>
      )}
    </section>
  )
}
