import type { Metadata } from 'next'
import { Shell } from '@/components/site'
import { COURT_URL } from '@/lib/constants'

export const metadata: Metadata = { title: 'About' }

export default function About() {
  return (
    <Shell query="">
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">About</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">Law belongs to the people it governs.</h1>
        <div className="prose-judgment mt-8 space-y-5">
          <p>
            Most Nigerian judgments are never published. Those that are often sit behind subscriptions, arrive years late, or exist only on paper in
            a registry. A citizen cannot read the decisions that bind them; a young lawyer outside Lagos cannot afford the reports; an AI tool
            cannot learn Nigerian law it has never seen.
          </p>
          <p>
            OpenLegal Nigeria changes where judgments come from. Courts using{' '}
            <a href={COURT_URL} className="text-naija-700 underline underline-offset-4">
              CaseWin Court
            </a>{' '}
            publish their own decisions directly from the case file, the moment a registrar has checked them. Nothing is scraped and nothing is
            retyped.
          </p>
          <h2 className="!mt-10 font-serif text-2xl font-semibold text-ink">Privacy and redaction</h2>
          <p>
            Before any judgment is published, a registrar must confirm that the names of children, victims of sexual offences and any sealed material
            have been removed. Family matters never show party names on public cause lists. Courts can withdraw a judgment at any time.
          </p>
          <h2 className="!mt-10 font-serif text-2xl font-semibold text-ink">Not legal advice</h2>
          <p>
            OpenLegal is an information service. Always confirm a judgment against the certified true copy from the court, and statutes against the
            official gazette.
          </p>
          <h2 className="!mt-10 font-serif text-2xl font-semibold text-ink">Sample data</h2>
          <p>
            While courts are onboarding, some judgments are clearly marked as demonstrations. They show how the service works, are not real decisions,
            and are excluded from the API and MCP server by default.
          </p>
        </div>
      </article>
    </Shell>
  )
}
