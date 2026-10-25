import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_SELECT, type CaseRow } from '@/lib/cases'
import { STATUS } from '@/lib/constants'
import CaseList from '@/components/CaseList'
import { Card, Empty, PageHeader, btn, input } from '@/components/ui'

export const metadata: Metadata = { title: 'All cases' }

export default async function AllCases({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  let q = createAdminClient().from('la_cases').select(CASE_SELECT).order('created_at', { ascending: false }).limit(500)
  if (searchParams.status && STATUS[searchParams.status]) q = q.eq('status', searchParams.status)
  const term = (searchParams.q ?? '').trim()
  if (term) q = /^LA-/i.test(term) ? q.eq('ref', term.toUpperCase()) : q.ilike('person_name', `%${term.replace(/[%_]/g, '')}%`)
  const { data } = await q
  return (
    <>
      <PageHeader eyebrow="Admin" title="All cases" sub="Every request, every state. Open a file to assign it, verify it, or mark it as not genuine." />
      <form className="mb-5 flex flex-wrap gap-3">
        <input name="q" defaultValue={term} placeholder="Name or LA- reference" className={input + ' !w-64'} />
        <select name="status" defaultValue={searchParams.status ?? ''} className={input + ' !w-auto'}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button className={btn.secondary}>Filter</button>
      </form>
      <Card pad={false}>{(data ?? []).length ? <CaseList cases={data as CaseRow[]} /> : <div className="p-6"><Empty title="No cases match" /></div>}</Card>
    </>
  )
}
