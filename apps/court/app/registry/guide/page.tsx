import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff, ROLE_LABELS, can } from '@/lib/auth'
import { Card, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Registry guide' }

const TASKS = [
  {
    t: 'Work the filing queue',
    href: '/registry/filings',
    perm: 'filings.review' as const,
    steps: [
      'Open the oldest filing first — urgent matters are pinned to the top.',
      'Read the reliefs and open each document. Check the automatic routing and its reasons; change the case type if it is wrong.',
      'Missing a signature, stamp or document? Raise a query — the filer answers in their portal and the filing comes back to the queue.',
      'Papers in order? Assess fees: quantities are pre-filled from the process, defendants and documents. Adjust, then send the assessment.',
    ],
  },
  {
    t: 'Confirm payment and open the case',
    href: '/registry/filings',
    perm: 'filings.decide' as const,
    steps: [
      'When the filer enters a receipt or RRR number the filing shows “Payment received”. Confirm it against the bank or Remita record.',
      'Choose the division (it sets the suit-number sequence) and the judge. The suggested judge sits in the division, takes this case type and has room on their docket.',
      'Optionally list the first mention on a day with room on the judge’s list. Then issue the suit number — the filer sees it immediately.',
    ],
  },
  {
    t: 'Keep the cause list true',
    href: '/registry/cause-list',
    perm: 'hearings.record' as const,
    steps: [
      'Each morning, print or open today’s cause list.',
      'After each sitting, open the case and record the outcome. If adjourned, pick the reason and list the next date in the same step.',
      'These outcomes drive the analytics — adjournment causes and effective hearing rate are only as good as what is recorded here.',
    ],
  },
  {
    t: 'Upload and publish judgments',
    href: '/registry/judgments',
    perm: 'judgments.upload' as const,
    steps: [
      'From the case file choose “Upload judgment”, paste the delivered text and add the holding and keywords.',
      'A registrar runs the redaction check: names of children, victims of sexual offences and sealed material must be removed.',
      'Publishing makes it free on OpenLegal Nigeria. It can be withdrawn at any time.',
    ],
  },
]

export default async function RegistryGuide() {
  const staff = await requireStaff()
  return (
    <>
      <PageHeader eyebrow={`${ROLE_LABELS[staff.role]} · ${staff.court.short_name ?? staff.court.name}`} title="Registry guide" sub="What you can do here, and the order to do it in." />
      <div className="grid gap-5 lg:grid-cols-2">
        {TASKS.map((task) => {
          const allowed = can(staff, task.perm)
          return (
            <Card key={task.t} className={allowed ? '' : 'opacity-60'}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink-900">{task.t}</h2>
                {allowed ? (
                  <Link href={task.href} className="shrink-0 text-sm font-semibold text-ink-800 underline decoration-brass-300 underline-offset-4">
                    Open →
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-ink-400">Not part of your role</span>
                )}
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-600 marker:text-brass-500">
                {task.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </Card>
          )
        })}
      </div>
    </>
  )
}
