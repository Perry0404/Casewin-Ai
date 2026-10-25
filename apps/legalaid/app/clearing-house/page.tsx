import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import { ProviderTable, StateFilter } from '@/components/ClearingHouse'
import { clearingHouse } from '@/lib/clearing'

export const metadata: Metadata = {
  title: 'Clearing house',
  description: 'Every legal aid provider on CaseWin Legal Aid — organisations, law clinics and pro bono lawyers — and the cases they handled, by state and town.',
}
// Always live: a provider's work should show the moment it is recorded.
export const dynamic = 'force-dynamic'

export default async function ClearingHousePage({ searchParams }: { searchParams: { state?: string } }) {
  const { providers, waiting, totals } = await clearingHouse({ publicView: true })
  return (
    <PublicPage wide>
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">Clearing house</h1>
      <p className="mt-3 max-w-2xl text-[17px] text-ink-600">
        Every legal aid provider on the platform — Legal Aid Council offices, NGOs, university law clinics, NBA committees, chambers and pro bono lawyers — and the
        cases they handled, by state and town. Counted from the case record, never entered by hand.
      </p>
      <dl className="mt-10 grid grid-cols-2 border-t border-ink-950 sm:grid-cols-5">
        {(
          [
            ['Providers', providers.filter((p) => p.kind !== 'others').length],
            ['Cases taken', totals.taken],
            ['Being worked on', totals.active],
            ['With an outcome', totals.resolved],
            ['People released', totals.released],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="py-4 pr-4">
            <dt className="text-[13px] text-ink-500">{k}</dt>
            <dd className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums">{v.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[20px] font-semibold text-ink-950">Providers{searchParams.state ? ` working in ${searchParams.state}` : ''}</h2>
        <StateFilter state={searchParams.state} action="/clearing-house" />
      </div>
      <p className="mb-3 mt-1 text-[13px] text-ink-500">Open a provider to see every state and town they worked in. Individual volunteers appear by name only if they choose to.</p>
      <ProviderTable providers={providers} state={searchParams.state} />

      {waiting.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[20px] font-semibold text-ink-950">Where help is needed now</h2>
          <p className="mb-3 mt-1 text-[14px] text-ink-600">Requests no provider has taken yet, by state.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-950 pt-4 text-[15px]">
            {waiting.map(([s, n]) => (
              <li key={s}>
                <span className="font-semibold text-ink-950">{s}</span> <span className="tabular-nums text-ink-600">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px]">
            <Link href="/volunteer" className="prose-link">
              Volunteer
            </Link>{' '}
            or{' '}
            <Link href="/organisations" className="prose-link">
              register your organisation
            </Link>{' '}
            to take them.
          </p>
        </section>
      )}
    </PublicPage>
  )
}
