import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_SELECT, type CaseRow } from '@/lib/cases'
import { ROLES } from '@/lib/constants'
import CaseList from '@/components/CaseList'
import { Badge, Card, CardTitle, Empty, PageHeader, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'Team' }

async function setMemberStatus(f: FormData) {
  'use server'
  const m = await requireMember()
  if (m.role !== 'coordinator' || !m.org_id) redirect('/desk')
  const status = String(f.get('status')) === 'approved' ? 'approved' : 'rejected'
  // A coordinator vouches only for members who chose their organisation. Lawyers still need an admin's roll check.
  const db = createAdminClient()
  const { data: target } = await db.from('la_members').select('role, org_id').eq('user_id', String(f.get('user_id'))).maybeSingle()
  if (!target || target.org_id !== m.org_id || (status === 'approved' && target.role === 'lawyer')) redirect('/desk/team')
  await db
    .from('la_members')
    .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null, reviewer_note: status === 'rejected' ? 'Not confirmed by the organisation' : null })
    .eq('user_id', String(f.get('user_id')))
  revalidatePath('/desk/team')
}

export default async function Team() {
  const m = await requireMember()
  if (m.role !== 'coordinator' || !m.org_id) redirect('/desk')
  const db = createAdminClient()
  const [{ data: members }, { data: cases }] = await Promise.all([
    db.from('la_members').select('user_id, full_name, role, state, status, phone').eq('org_id', m.org_id).order('status').order('full_name'),
    db.from('la_cases').select(CASE_SELECT).eq('assigned_org', m.org_id).in('status', ['assigned', 'in_progress']).limit(500),
  ])
  return (
    <>
      <PageHeader eyebrow={m.org?.name} title="Your team" sub="Members who chose your organisation, and every open case they hold." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle sub="Paralegals and students: confirm them here. Lawyers are verified against the roll by CaseWin.">Members</CardTitle>
          </div>
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {(members ?? []).map((p) => (
              <li key={p.user_id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <div>
                  <p className="font-medium text-ink-900">{p.full_name}</p>
                  <p className="text-xs text-ink-400">
                    {ROLES[p.role]?.split(' (')[0]} · {p.state} · {p.phone}
                  </p>
                </div>
                {p.status === 'pending' && p.role !== 'lawyer' ? (
                  <form action={setMemberStatus} className="flex gap-1">
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <button name="status" value="approved" className={btn.secondary + ' !px-3 !py-1.5'}>
                      Confirm
                    </button>
                    <button name="status" value="rejected" className={btn.ghost}>
                      Not ours
                    </button>
                  </form>
                ) : (
                  <Badge tone={p.status === 'approved' ? 'good' : p.status === 'pending' ? 'warn' : 'bad'}>{p.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Open cases</CardTitle>
          </div>
          {(cases ?? []).length ? <CaseList cases={cases as CaseRow[]} /> : <div className="p-6"><Empty title="No open cases" /></div>}
        </Card>
      </div>
    </>
  )
}
