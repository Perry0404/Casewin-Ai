import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublicPage } from '@/components/site'
import { getMember, getUser, isPlatformAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Platform admins land here after sign-in, so their own account can still be used as a volunteer.
export default async function Choose() {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!(await isPlatformAdmin(user.id))) redirect('/go')
  const member = await getMember()

  const options: [string, string, string][] = [
    member?.status === 'approved'
      ? ['/desk', 'My volunteer desk', 'The cases you have taken, and the board of people waiting for help.']
      : member
        ? ['/volunteer', 'My volunteer application', 'See where your application stands.']
        : ['/volunteer', 'Volunteer with this account', 'Register as a lawyer, paralegal or law student. You are verified like anyone else.'],
    ['/help', 'Ask for help', 'The public form a family uses to report someone who needs a lawyer.'],
    ['/admin', 'Legal Aid admin', 'Review reports, complaints, overdue claims and verifications.'],
  ]

  return (
    <PublicPage>
      <p className="text-[13px] text-ink-500">Signed in as {user.email}</p>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950">Where would you like to go?</h1>
      <ul className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
        {options.map(([href, title, sub]) => (
          <li key={href}>
            <Link href={href} className="flex items-center justify-between gap-4 py-5 transition hover:bg-parchment/60 sm:px-3">
              <span>
                <span className="block text-[17px] font-semibold text-ink-950">{title}</span>
                <span className="mt-0.5 block text-sm text-ink-500">{sub}</span>
              </span>
              <span className="text-ink-400" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PublicPage>
  )
}
