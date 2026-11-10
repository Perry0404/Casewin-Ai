import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getUser, isPlatformAdmin } from '@/lib/auth'
import { PublicShell } from '@/components/site'

export const dynamic = 'force-dynamic'

// Post-login router:
//   court officer → /registry · approved filer → /portal · anyone else → /register
//   platform admins choose: the same account is often also a filer or court officer,
//   so they are not forced into /admin.
export default async function Go({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const next = searchParams.next?.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : null
  const db = createAdminClient()
  const [{ data: staff }, { data: filer }, admin] = await Promise.all([
    db.from('court_staff').select('id, court:courts(name)').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle(),
    db.from('filer_accounts').select('user_id').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
    isPlatformAdmin(user.id),
  ])
  if (staff) await db.from('court_staff').update({ last_login_at: new Date().toISOString() }).eq('id', staff.id)

  // Honour where they were headed when they have access to it.
  if (next?.startsWith('/registry') && staff) redirect(next)
  if ((next?.startsWith('/portal') || next?.startsWith('/file')) && filer) redirect(next)
  if (next?.startsWith('/admin') && admin) redirect(next)
  if (!admin) {
    if (staff) redirect('/registry')
    if (filer) redirect('/portal')
    redirect('/register')
  }

  const courtName = (staff?.court as unknown as { name: string } | null)?.name
  const options: [string, string, string][] = [
    filer
      ? ['/portal', 'My filing portal', 'File new cases, pay fees and follow your cases.']
      : ['/register', 'File as a lawyer or litigant', 'Register this account to file and track cases. It is approved like anyone else’s.'],
    ...(staff ? [['/registry', 'Court registry', `Work as court staff${courtName ? ` at ${courtName}` : ''}.`] as [string, string, string]] : []),
    ['/admin', 'Justice admin', 'Approvals, judgments, courts and the activity log across all three products.'],
  ]

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[13px] text-ink-500">Signed in as {user.email}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Where would you like to go?</h1>
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
      </div>
    </PublicShell>
  )
}
