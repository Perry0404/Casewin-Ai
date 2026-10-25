import type { Metadata } from 'next'
import { Card, CardTitle, Field, Notice, PageHeader, btn, input } from '@/components/ui'
import { createCourt } from '../../actions'

export const metadata: Metadata = { title: 'Onboard a court' }

const ERRORS: Record<string, string> = {
  missing: 'Enter the court’s name and state.',
  slug: 'A court with that web address already exists. Choose another slug.',
  create: 'Could not create the court. Try again.',
}

export default function NewCourt({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <PageHeader eyebrow="Platform admin" title="Onboard a court" sub="Creates the court, its divisions and its first court administrator. They then add the rest of their staff themselves." />
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</Notice>
        </div>
      )}
      <form action={createCourt} className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>The court</CardTitle>
          <div className="space-y-4">
            <Field label="Full name" required>
              <input name="name" required className={input} placeholder="High Court of Imo State" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Short name">
                <input name="short_name" className={input} placeholder="Imo High Court" />
              </Field>
              <Field label="State" required>
                <input name="state" required className={input} placeholder="Imo" />
              </Field>
              <Field label="Web address slug" hint="Used in public links. Leave blank to generate.">
                <input name="slug" className={input + ' font-mono text-sm'} placeholder="imo-high-court" />
              </Field>
              <Field label="Tier">
                <select name="tier" className={input}>
                  <option value="state_high_court">State High Court</option>
                  <option value="federal_high_court">Federal High Court</option>
                  <option value="national_industrial">National Industrial Court</option>
                  <option value="magistrate">Magistrate Court</option>
                  <option value="customary">Customary Court</option>
                  <option value="sharia">Sharia Court of Appeal</option>
                  <option value="appeal">Court of Appeal</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            <Field label="Address">
              <input name="address" className={input} />
            </Field>
            <Field label="Judicial divisions" hint="One per line: name | suit-number prefix. Confirm prefixes with the Chief Registrar.">
              <textarea name="divisions" className={input + ' min-h-[110px] font-mono text-sm'} placeholder={'Owerri Judicial Division | HOW\nOrlu Judicial Division | HOR'} />
            </Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle sub="Usually the Chief Registrar or Director of ICT">First court administrator</CardTitle>
            <div className="space-y-4">
              <Field label="Full name">
                <input name="admin_name" className={input} />
              </Field>
              <Field label="Official email">
                <input name="admin_email" type="email" className={input} />
              </Field>
            </div>
            <p className="mt-4 text-sm text-ink-400">A temporary password is shown once on the next screen. They choose their own at first sign-in.</p>
          </Card>
          <Notice tone="info">The court starts in “pilot” with a starter fee schedule. The court administrator should replace the fees with the current approved schedule.</Notice>
          <button className={btn.primary + ' w-full !py-3'}>Create court</button>
        </div>
      </form>
    </>
  )
}
