import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { date, relative } from '@/lib/format'
import { readLink } from '@/lib/handover'
import { Field, Notice, PageHeader, btn, input } from '@/components/ui'
import { addAdmin, cancelInvite, removeAdmin } from '../actions'

export const metadata: Metadata = { title: 'Admins' }

const ERRORS: Record<string, string> = { email: 'Enter a valid email address.', self: 'You can’t remove yourself. Ask another admin.' }

export default async function Admins({ searchParams }: { searchParams: { done?: string; error?: string } }) {
  const db = createAdminClient()
  const me = await getUser()
  const [{ data: admins }, { data: invites }] = await Promise.all([
    db.from('platform_admins').select('user_id, full_name, created_at').order('created_at'),
    db.from('admin_invites').select('id, email, full_name, created_at').is('used_at', null).order('created_at', { ascending: false }),
  ])
  const people = await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await db.auth.admin.getUserById(a.user_id)
      return { ...a, email: data.user?.email ?? '', lastSignIn: data.user?.last_sign_in_at ?? null }
    }),
  )
  const invited = searchParams.done === 'invited' ? readLink() : null

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Admins"
        sub="People who can open this Justice admin. Every admin sees and can do everything here, across Court, OpenLegal and Legal Aid."
      />
      {searchParams.done === 'added' && <div className="mb-6"><Notice tone="good">Added. They had a CaseWin account already, so they can open the admin the next time they sign in.</Notice></div>}
      {invited && (
        <div className="mb-6">
          <Notice tone="good">
            {invited.label} has no CaseWin account yet. Send them this invitation privately. It works once, only with that email address, and is shown only now:
            <span className="mt-2 block select-all break-all font-mono text-[13px] text-ink-950">{invited.link}</span>
          </Notice>
        </div>
      )}
      {searchParams.error && ERRORS[searchParams.error] && <div className="mb-6"><Notice tone="bad">{ERRORS[searchParams.error]}</Notice></div>}

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">
            Admins <span className="font-normal text-ink-500">· {people.length}</span>
          </h2>
          <ul className="divide-y divide-ink-200 border-b border-ink-200">
            {people.map((p) => (
              <li key={p.user_id} className="flex items-center justify-between gap-3 py-3 text-[14px]">
                <div>
                  <p className="font-medium text-ink-950">
                    {p.full_name ?? p.email}
                    {p.user_id === me?.id && <span className="font-normal text-ink-500"> · you</span>}
                  </p>
                  <p className="text-ink-500">
                    {p.email} · admin since {date(p.created_at)} · {p.lastSignIn ? `last signed in ${relative(p.lastSignIn)}` : 'never signed in'}
                  </p>
                </div>
                {p.user_id !== me?.id && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <button className={btn.ghost}>Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {(invites ?? []).length > 0 && (
            <>
              <h3 className="mt-8 text-[14px] font-semibold text-ink-950">Invited, not set up yet</h3>
              <ul className="divide-y divide-ink-200 border-b border-ink-200">
                {invites!.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-[14px]">
                    <p className="text-ink-700">
                      {i.full_name ? `${i.full_name} · ` : ''}
                      {i.email} <span className="text-ink-500">· invited {relative(i.created_at)}</span>
                    </p>
                    <form action={cancelInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className={btn.ghost}>Cancel</button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <h2 className="border-b border-ink-950 pb-2 text-[18px] font-semibold text-ink-950">Add an admin</h2>
          <form action={addAdmin} className="mt-4 space-y-4">
            <Field label="Email address">
              <input name="email" type="email" required className={input} />
            </Field>
            <Field label="Name" hint="Optional.">
              <input name="full_name" className={input} />
            </Field>
            <button className={btn.primary}>Make admin</button>
            <p className="text-[13px] text-ink-500">
              If they already have a CaseWin account, they become an admin straight away. If not, you get a one-time invitation link to send them.
            </p>
          </form>
        </section>
      </div>
    </>
  )
}
