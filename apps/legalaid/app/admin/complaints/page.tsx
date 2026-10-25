import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { COMPLAINT_KINDS, COURT_URL } from '@/lib/constants'
import { dateTime } from '@/lib/format'
import { Badge, Empty, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { deleteCaseData, removeVolunteer, resolveComplaint } from './actions'

export const metadata: Metadata = { title: 'Complaints' }

const TONE = { open: 'bad', investigating: 'warn', resolved: 'good', dismissed: 'neutral' } as const

export default async function Complaints({ searchParams }: { searchParams: { error?: string; deleted?: string; all?: string } }) {
  const db = createAdminClient()
  let q = db.from('la_complaints').select('*, case:la_cases(id, ref, state, kind, assigned_to)').order('created_at', { ascending: false }).limit(200)
  if (!searchParams.all) q = q.in('status', ['open', 'investigating'])
  const { data } = await q
  const ids = [...new Set((data ?? []).map((k) => k.against).filter(Boolean))] as string[]
  const { data: people } = ids.length ? await db.from('la_members').select('user_id, full_name, phone, enrolment_number').in('user_id', ids) : { data: [] }
  const who = new Map((people ?? []).map((p) => [p.user_id, p]))

  return (
    <>
      <PageHeader
        eyebrow="Legal Aid"
        title="Complaints from families"
        sub="Sent from the tracking page. The volunteer concerned never sees these. Money demands come first."
        actions={
          <Link href={searchParams.all ? '/admin/complaints' : '/admin/complaints?all=1'} className={btn.secondary}>
            {searchParams.all ? 'Open only' : 'Show all'}
          </Link>
        }
      />
      {searchParams.error === 'note' && <div className="mb-6"><Notice tone="bad">Write what was done before closing a complaint.</Notice></div>}
      {searchParams.error === 'confirm' && <div className="mb-6"><Notice tone="bad">Type the case reference exactly to confirm deletion.</Notice></div>}
      {searchParams.deleted && <div className="mb-6"><Notice tone="good">The case and its documents were deleted.</Notice></div>}
      {(data ?? []).length ? (
        <ul className="border-t border-ink-950">
          {(data ?? [])
            .sort((a, b) => Number(b.kind === 'asked_for_money') - Number(a.kind === 'asked_for_money'))
            .map((k) => {
              const c = k.case as unknown as { id: string; ref: string; state: string; assigned_to: string | null } | null
              const v = k.against ? who.get(k.against) : null
              return (
                <li key={k.id} className="grid gap-4 border-b border-ink-200 py-5 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[k.status as keyof typeof TONE]}>{k.status}</Badge>
                      <span className="font-semibold text-ink-950">{COMPLAINT_KINDS[k.kind]}</span>
                    </div>
                    {k.body && <p className="mt-2 whitespace-pre-wrap text-[15px] text-ink-800">{k.body}</p>}
                    <p className="mt-2 text-[13px] text-ink-500">
                      {c && (
                        <Link href={`/desk/cases/${c.id}`} className="underline">
                          <Mono>{c.ref}</Mono>
                        </Link>
                      )}{' '}
                      · {c?.state} · {dateTime(k.created_at)}
                    </p>
                    {v && (
                      <p className="mt-1 text-[13px] text-ink-600">
                        About: {v.full_name}
                        {v.enrolment_number && ` (${v.enrolment_number})`} · {v.phone} ·{' '}
                        <a href={`${COURT_URL}/admin/legal-aid`} className="underline">
                          suspend in Justice admin
                        </a>
                      </p>
                    )}
                    {k.resolution && <p className="mt-2 text-[13px] text-ink-600">Resolution: {k.resolution}</p>}
                  </div>
                  {['open', 'investigating'].includes(k.status) && (
                    <div className="space-y-3">
                      <form action={resolveComplaint} className="space-y-2">
                        <input type="hidden" name="id" value={k.id} />
                        <input name="resolution" placeholder="What was done (needed to close)" className={input + ' !py-2 !text-[14px]'} />
                        <div className="flex flex-wrap gap-2">
                          {k.status === 'open' && (
                            <button name="status" value="investigating" className={btn.secondary + ' !py-1.5'}>
                              Investigating
                            </button>
                          )}
                          <button name="status" value="resolved" className={btn.primary + ' !py-1.5'}>
                            Resolved
                          </button>
                          <button name="status" value="dismissed" className={btn.ghost}>
                            Dismiss
                          </button>
                        </div>
                      </form>
                      {k.against && c?.assigned_to === k.against && (
                        <form action={removeVolunteer}>
                          <input type="hidden" name="id" value={k.id} />
                          <button className={btn.danger + ' !py-1.5'}>Take the case off this volunteer</button>
                        </form>
                      )}
                      {k.kind === 'delete_my_data' && c && (
                        <form action={deleteCaseData} className="flex gap-2">
                          <input type="hidden" name="id" value={k.id} />
                          <input name="confirm_ref" placeholder={`Type ${c.ref}`} className={input + ' !py-1.5 !text-[14px] font-mono'} />
                          <button className={btn.danger + ' !py-1.5'}>Delete case data</button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
        </ul>
      ) : (
        <Empty title="No open complaints" />
      )}
    </>
  )
}
