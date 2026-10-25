import type { Metadata } from 'next'
import { ROLE_LABELS, requireStaff } from '@/lib/auth'
import { Card, Field, Notice, PageHeader, btn, input } from '@/components/ui'
import { changeOwnPassword } from '../actions'

export const metadata: Metadata = { title: 'Your account' }

export default async function AccountPage({ searchParams }: { searchParams: { first?: string; error?: string } }) {
  const staff = await requireStaff()
  return (
    <>
      <PageHeader eyebrow={ROLE_LABELS[staff.role]} title={staff.full_name} sub={`${staff.email} · ${staff.court.name}`} />
      <Card className="max-w-lg">
        {(searchParams.first || staff.must_change_password) && (
          <div className="mb-5">
            <Notice tone="warn">Welcome. Before you continue, replace the temporary password you were given with one only you know.</Notice>
          </div>
        )}
        {searchParams.error && (
          <div className="mb-5">
            <Notice tone="bad">{searchParams.error === 'password' ? 'Use at least 10 characters, and type the same password twice.' : 'Could not update the password. Try again.'}</Notice>
          </div>
        )}
        <form action={changeOwnPassword} className="space-y-4">
          <Field label="New password" hint="At least 10 characters. A short sentence is easy to remember and hard to guess.">
            <input name="password" type="password" minLength={10} autoComplete="new-password" required className={input} />
          </Field>
          <Field label="Type it again">
            <input name="confirm" type="password" minLength={10} autoComplete="new-password" required className={input} />
          </Field>
          <button className={btn.primary}>Set password</button>
        </form>
      </Card>
    </>
  )
}
