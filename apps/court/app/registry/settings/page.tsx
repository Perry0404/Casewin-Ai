import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES } from '@/lib/constants'
import { Card, CardTitle, Field, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { removeSampleData, saveDivision, saveFees, saveJudge, setJudgeActive } from '../actions'

export const metadata: Metadata = { title: 'Court settings' }

export default async function SettingsPage({ searchParams }: { searchParams: { sample?: string } }) {
  const admin = await requireStaff('settings.manage')
  const db = createAdminClient()
  const [{ data: divisions }, { data: judges }, { count: samples }] = await Promise.all([
    db.from('divisions').select('id, name, code, next_suit_seq, suit_seq_year').eq('court_id', admin.court_id).order('name'),
    db.from('judges').select('id, name, courtroom, division_id, specialisations, is_active').eq('court_id', admin.court_id).order('is_active', { ascending: false }).order('name'),
    db.from('cases').select('id', { count: 'exact', head: true }).eq('court_id', admin.court_id).eq('is_sample', true),
  ])
  const fees = admin.court.fee_schedule

  return (
    <>
      <PageHeader eyebrow="Court administration" title="Court settings" sub={admin.court.name} />
      {searchParams.sample === 'removed' && (
        <div className="mb-6">
          <Notice tone="good">Sample data removed. Analytics now reflect real records only.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle sub="Each judge’s bench, courtroom and usual case types">Judges</CardTitle>
          <ul className="divide-y divide-ink-100">
            {(judges ?? []).map((j) => (
              <li key={j.id} className={`py-3 ${j.is_active ? '' : 'opacity-50'}`}>
                <details>
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span>
                      <span className="font-medium text-ink-900">{j.name}</span>
                      <span className="block text-xs text-ink-400">
                        {[j.courtroom, divisions?.find((d) => d.id === j.division_id)?.name, j.specialisations?.length ? `${j.specialisations.length} specialisations` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="text-xs text-ink-400">Edit</span>
                  </summary>
                  <JudgeForm judge={j} divisions={divisions ?? []} />
                  <form action={setJudgeActive} className="mt-2">
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="active" value={String(!j.is_active)} />
                    <button className={btn.ghost}>{j.is_active ? 'Mark inactive (retired / transferred)' : 'Reactivate'}</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
          <details className="mt-4 rounded-xl border border-dashed border-ink-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink-800">+ Add a judge</summary>
            <JudgeForm divisions={divisions ?? []} />
          </details>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle sub="Prefix and next number in each division’s suit-number sequence">Judicial divisions</CardTitle>
            <ul className="divide-y divide-ink-100 text-sm">
              {(divisions ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <span className="text-ink-800">{d.name}</span>
                  <Mono className="text-ink-500">
                    {d.code}/{d.next_suit_seq}/{d.suit_seq_year}
                  </Mono>
                </li>
              ))}
            </ul>
            <form action={saveDivision} className="mt-4 grid grid-cols-[1fr_6rem_auto] gap-2">
              <input name="name" placeholder="Division name" className={input + ' text-sm'} required />
              <input name="code" placeholder="Code" maxLength={8} className={input + ' font-mono text-sm uppercase'} required />
              <button className={btn.secondary}>Add</button>
            </form>
          </Card>

          <Card>
            <CardTitle sub="Used by clerks when assessing filing fees">Fee schedule</CardTitle>
            <form action={saveFees} className="space-y-2">
              {[...fees, { code: '', label: '', amount: 0 }, { code: '', label: '', amount: 0 }].map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_7rem] gap-2">
                  <input type="hidden" name="fee_code" value={f.code} />
                  <input name="fee_label" defaultValue={f.label} placeholder={i >= fees.length ? 'New fee item' : ''} className={input + ' !py-2 text-sm'} />
                  <input name="fee_amount" type="number" min={0} defaultValue={f.amount || ''} placeholder="₦" className={input + ' !py-2 text-right text-sm tabular-nums'} />
                </div>
              ))}
              <p className="text-xs text-ink-400">Clear a label to remove an item.</p>
              <button className={btn.primary}>Save fee schedule</button>
            </form>
          </Card>

          {samples ? (
            <Card>
              <CardTitle sub={`${samples.toLocaleString()} sample cases are loaded for demonstration`}>Sample data</CardTitle>
              <form action={removeSampleData}>
                <button className={btn.danger}>Remove all sample data</button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  )
}

function JudgeForm({
  judge,
  divisions,
}: {
  judge?: { id: string; name: string; courtroom: string | null; division_id: string | null; specialisations: string[] | null }
  divisions: { id: string; name: string }[]
}) {
  return (
    <form action={saveJudge} className="mt-4 space-y-3">
      {judge && <input type="hidden" name="id" value={judge.id} />}
      <Field label="Name and title">
        <input name="name" defaultValue={judge?.name} placeholder="Hon. Justice A. B. Okafor" className={input + ' text-sm'} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courtroom">
          <input name="courtroom" defaultValue={judge?.courtroom ?? ''} placeholder="Court 3" className={input + ' text-sm'} />
        </Field>
        <Field label="Division">
          <select name="division_id" defaultValue={judge?.division_id ?? ''} className={input + ' text-sm'}>
            <option value="">—</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-700">Usually takes</legend>
        <div className="flex flex-wrap gap-2">
          {CASE_TYPES.map((t) => (
            <label key={t.value} className="cursor-pointer rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 has-[:checked]:border-ink-900 has-[:checked]:bg-ink-900 has-[:checked]:text-white">
              <input type="checkbox" name="specialisations" value={t.value} defaultChecked={judge?.specialisations?.includes(t.value)} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button className={btn.primary}>{judge ? 'Save' : 'Add judge'}</button>
    </form>
  )
}
