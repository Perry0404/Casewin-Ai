import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { computeAnalytics } from '@/lib/analytics'
import { ROLE_LABELS, type StaffRole } from '@/lib/auth'
import { relative } from '@/lib/format'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { Badge, Card, CardTitle, Field, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { addCourtAdmin, setCourtStatus } from '../../actions'

export const metadata = { title: 'Court' }

export default async function AdminCourt({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; error?: string } }) {
  const db = createAdminClient()
  const { data: court } = await db.from('courts').select('*, divisions(name, code)').eq('id', params.id).maybeSingle()
  if (!court) notFound()
  const [{ data: staff }, analytics] = await Promise.all([
    db.from('court_staff').select('id, full_name, email, role, is_active, last_login_at').eq('court_id', court.id).order('role'),
    computeAnalytics(db, court.id),
  ])
  const handover = searchParams.created ? cookies().get('handover')?.value : undefined
  const creds = handover ? (JSON.parse(handover) as { email: string; password: string }) : null

  return (
    <>
      <Link href="/admin" className="text-sm text-ink-400 hover:text-ink-700">
        ← All courts
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={`${court.state} State`}
          title={court.name}
          sub={
            <>
              Public cause list: <Mono>/cause-list/{court.slug}</Mono> · Divisions: {court.divisions.map((d: { code: string }) => d.code).join(', ') || 'none'}
            </>
          }
          actions={
            <form action={setCourtStatus} className="flex gap-2">
              <input type="hidden" name="court_id" value={court.id} />
              <Badge tone={court.status === 'active' ? 'good' : court.status === 'pilot' ? 'info' : 'bad'}>{court.status}</Badge>
              {court.status !== 'active' && (
                <button name="status" value="active" className={btn.secondary}>
                  Mark live
                </button>
              )}
              {court.status !== 'suspended' && (
                <button name="status" value="suspended" className={btn.danger}>
                  Suspend
                </button>
              )}
              {court.status === 'suspended' && (
                <button name="status" value="pilot" className={btn.secondary}>
                  Restore to pilot
                </button>
              )}
            </form>
          }
        />
      </div>

      {creds && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-brass-400 bg-brass-50 p-6">
          <p className="font-semibold text-ink-900">Court administrator login — share privately</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
            <dt className="text-ink-500">Sign in at</dt>
            <dd>
              <Mono>court.casewinai.com/login</Mono>
            </dd>
            <dt className="text-ink-500">Email</dt>
            <dd>
              <Mono>{creds.email}</Mono>
            </dd>
            <dt className="text-ink-500">Temporary password</dt>
            <dd>
              <Mono className="select-all rounded bg-white px-2 py-1 text-base font-semibold">{creds.password}</Mono>
            </dd>
          </dl>
          <p className="mt-3 text-xs text-ink-500">Shown once. They must change it at first sign-in.</p>
        </div>
      )}
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{searchParams.error === 'exists' ? 'An account with that email already exists.' : 'Could not create the login.'}</Notice>
        </div>
      )}

      <div className="mb-10 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Officers</CardTitle>
          <ul className="divide-y divide-ink-100 text-sm">
            {(staff ?? []).map((s) => (
              <li key={s.id} className={`flex items-center justify-between py-2.5 ${s.is_active ? '' : 'opacity-50'}`}>
                <span>
                  <span className="font-medium text-ink-900">{s.full_name}</span>
                  <span className="block text-xs text-ink-400">{s.email}</span>
                </span>
                <span className="text-right text-xs text-ink-500">
                  {ROLE_LABELS[s.role as StaffRole]}
                  <span className="block text-ink-400">{s.last_login_at ? `signed in ${relative(s.last_login_at)}` : 'never signed in'}</span>
                </span>
              </li>
            ))}
            {!staff?.length && <p className="py-3 text-ink-400">No officers yet.</p>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Add a court administrator</CardTitle>
          <form action={addCourtAdmin} className="space-y-3">
            <input type="hidden" name="court_id" value={court.id} />
            <Field label="Full name">
              <input name="full_name" required className={input} />
            </Field>
            <Field label="Official email">
              <input name="email" type="email" required className={input} />
            </Field>
            <button className={btn.primary + ' w-full'}>Create login</button>
          </form>
        </Card>
      </div>

      <h2 className="mb-4 font-display text-2xl font-semibold text-ink-900">Judicial analytics</h2>
      <AnalyticsDashboard a={analytics} />
    </>
  )
}
