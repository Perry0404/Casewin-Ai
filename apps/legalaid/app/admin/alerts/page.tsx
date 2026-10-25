import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { dateTime } from '@/lib/format'
import { Badge, Empty, Notice, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Alerts' }

export default async function Alerts() {
  const { data } = await createAdminClient().from('la_notifications').select('*').order('created_at', { ascending: false }).limit(150)
  const sms = Boolean(process.env.TERMII_API_KEY)
  const email = Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_FROM_EMAIL)
  return (
    <>
      <PageHeader eyebrow="Legal Aid" title="Alerts" sub="Every SMS and email the service tried to send. Nothing to a number marked unsafe is ever sent." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Notice tone={sms ? 'good' : 'warn'}>
          <b>SMS {sms ? 'on' : 'off'}.</b> {sms ? 'Sending through Termii.' : 'Add TERMII_API_KEY, TERMII_SENDER_ID and TERMII_BASE_URL in Vercel to switch it on.'}
        </Notice>
        <Notice tone={email ? 'good' : 'warn'}>
          <b>Email {email ? 'on' : 'off'}.</b> {email ? 'Sending through Resend.' : 'Add RESEND_API_KEY and NOTIFY_FROM_EMAIL in Vercel to switch it on.'}
        </Notice>
      </div>
      {(data ?? []).length ? (
        <table className="w-full border-t border-ink-950 text-left text-[13px]">
          <thead>
            <tr className="border-b border-ink-200 text-[12px] text-ink-500">
              <th className="py-2 pr-3 font-medium">When</th>
              <th className="py-2 pr-3 font-medium">Channel</th>
              <th className="py-2 pr-3 font-medium">Message</th>
              <th className="py-2 pr-3 font-medium">To</th>
              <th className="py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((n) => (
              <tr key={n.id} className="border-b border-ink-200 align-top">
                <td className="py-2 pr-3 text-ink-600">{dateTime(n.created_at)}</td>
                <td className="py-2 pr-3 uppercase text-ink-600">{n.channel}</td>
                <td className="py-2 pr-3 text-ink-900">{n.template.replace(/_/g, ' ')}</td>
                <td className="py-2 pr-3 font-mono text-ink-600">{n.recipient.replace(/(\d{4})\d+(\d{3})/, '$1•••$2')}</td>
                <td className="py-2">
                  <Badge tone={n.status === 'sent' ? 'good' : n.status === 'failed' ? 'bad' : 'neutral'}>{n.status}</Badge>
                  {n.detail && <span className="ml-2 text-ink-500">{n.detail}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty title="Nothing sent yet" />
      )}
    </>
  )
}
