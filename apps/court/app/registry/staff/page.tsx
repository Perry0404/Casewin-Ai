import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ROLE_LABELS, requireStaff, type StaffRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { relative } from '@/lib/format'
import { Badge, Card, CardTitle, Field, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { createStaff, resetStaffPassword, setStaffActive } from '../actions'

export const metadata: Metadata = { title: 'Staff & logins' }

const ROLE_HELP: Record<StaffRole, string> = {
  court_admin: 'Manages staff, judges, divisions and fees',
  registrar: 'Accepts filings, issues suit numbers, publishes judgments',
  clerk: 'Reviews filings, assesses fees, lists hearings',
  judge: 'Sees their docket, records hearing outcomes',
}

const ERRORS: Record<string, string> = {
  missing: 'Enter a name, email and role.',
  exists: 'An account with that email already exists.',
  create: 'Could not create the account. Try again.',
}

export default async function StaffPage({ searchParams }: { searchParams: { created?: string; reset?: string; error?: string } }) {
  const admin = await requireStaff('staff.manage')
  const db = createAdminClient()
  const [{ data: staff }, { data: judges }] = await Promise.all([
    db.from('court_staff').select('id, full_name, email, role, is_active, last_login_at, must_change_password').eq('court_id', admin.court_id).order('is_active', { ascending: false }).order('role').order('full_name'),
    db.from('judges').select('id, name').eq('court_id', admin.court_id).eq('is_active', true).order('name'),
  ])

  const handover = searchParams.created ? cookies().get('handover')?.value : undefined
  const creds = handover ? (JSON.parse(handover) as { email: string; password: string }) : null

  return (
    <>
      <PageHeader eyebrow="Court administration" title="Staff & logins" sub="Every officer has their own login, so every action in the registry is attributable." />

      {creds && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-brass-400 bg-brass-50 p-6">
          <p className="font-semibold text-ink-900">{searchParams.reset ? 'Password reset' : 'Account created'} — share these details privately</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
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
          <p className="mt-3 text-xs text-ink-500">This is shown once. They will be asked to choose a new password the first time they sign in.</p>
        </div>
      )}
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-parchment/60 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Officer</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Role</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Last sign-in</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(staff ?? []).map((s) => (
                <tr key={s.id} className={s.is_active ? '' : 'opacity-50'}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink-900">
                      {s.full_name}
                      {s.id === admin.id && <span className="ml-2 text-xs text-ink-400">(you)</span>}
                    </p>
                    <p className="text-xs text-ink-400">{s.email}</p>
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <span className="text-ink-700">{ROLE_LABELS[s.role as StaffRole]}</span>
                    {!s.is_active && (
                      <span className="ml-2">
                        <Badge tone="neutral">Deactivated</Badge>
                      </span>
                    )}
                    {s.is_active && s.must_change_password && (
                      <span className="ml-2">
                        <Badge tone="warn">Not yet signed in</Badge>
                      </span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-500 sm:table-cell">{s.last_login_at ? relative(s.last_login_at) : 'Never'}</td>
                  <td className="px-5 py-3.5">
                    {s.id !== admin.id && (
                      <div className="flex justify-end gap-1">
                        {s.is_active && (
                          <form action={resetStaffPassword}>
                            <input type="hidden" name="id" value={s.id} />
                            <button className={btn.ghost}>Reset password</button>
                          </form>
                        )}
                        <form action={setStaffActive}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="active" value={String(!s.is_active)} />
                          <button className={btn.ghost}>{s.is_active ? 'Deactivate' : 'Reactivate'}</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardTitle sub="A temporary password is generated for them">Add an officer</CardTitle>
          <form action={createStaff} className="space-y-4">
            <Field label="Full name" required>
              <input name="full_name" required className={input} />
            </Field>
            <Field label="Official email" required>
              <input name="email" type="email" required className={input} />
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink-700">Role</legend>
              <div className="space-y-2">
                {(Object.keys(ROLE_HELP) as StaffRole[]).map((r) => (
                  <label key={r} className="flex cursor-pointer gap-3 rounded-xl border border-ink-100 p-3 has-[:checked]:border-ink-900 has-[:checked]:bg-parchment">
                    <input type="radio" name="role" value={r} required defaultChecked={r === 'clerk'} className="mt-1 accent-ink-900" />
                    <span className="text-sm">
                      <span className="font-medium text-ink-900">{ROLE_LABELS[r]}</span>
                      <span className="block text-xs text-ink-400">{ROLE_HELP[r]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="If a judge — which bench?" hint="Links their login to their docket.">
              <select name="judge_id" className={input + ' text-sm'} defaultValue="">
                <option value="">—</option>
                {(judges ?? []).map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </Field>
            <button className={btn.primary + ' w-full'}>Create login</button>
          </form>
        </Card>
      </div>
    </>
  )
}
