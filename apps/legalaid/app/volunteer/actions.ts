'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getMember, getUser } from '@/lib/auth'
import { LANGUAGES, ORG_KINDS, PRACTICE_AREAS, ROLES, STATES } from '@/lib/constants'
import { validPhone } from '@/lib/cases'

const str = (f: FormData, k: string, n = 200) => String(f.get(k) ?? '').trim().slice(0, n)
const pick = (f: FormData, k: string, allowed: readonly string[]) => f.getAll(k).map(String).filter((v) => allowed.includes(v))

export type FormResult = { error?: string } | undefined

export async function submitVolunteer(_: FormResult, f: FormData): Promise<FormResult> {
  const user = await getUser()
  if (!user) redirect('/login?next=/volunteer')
  const existing = await getMember()
  if (existing && ['approved', 'suspended'].includes(existing.status)) redirect('/volunteer')

  const role = str(f, 'role', 20)
  const state = str(f, 'state', 40)
  const phone = str(f, 'phone', 30)
  const enrolment = str(f, 'enrolment_number', 40).toUpperCase()
  if (!ROLES[role]) return { error: 'Choose your role.' }
  if (str(f, 'full_name', 160).length < 5) return { error: 'Give your full name as on your call-to-bar certificate or student ID.' }
  if (!validPhone(phone)) return { error: 'Give a phone number that works on WhatsApp.' }
  if (!(STATES as readonly string[]).includes(state)) return { error: 'Choose your state.' }
  if (role === 'lawyer' && !/^SCN\s?\d{3,8}$/i.test(enrolment.replace(/[\/-]/g, ''))) return { error: 'Lawyers: give your Supreme Court enrolment number (SCN…). We check it against the roll.' }
  if (role !== 'lawyer' && role !== 'coordinator' && !str(f, 'institution')) return { error: 'Give your law faculty, firm or organisation — paralegals and students work under supervision.' }
  if (f.get('pledge') !== 'on') return { error: 'Please accept the volunteer pledge.' }

  const orgId = str(f, 'org_id', 40) || null
  const covered = pick(f, 'states_covered', STATES)
  const row = {
    user_id: user.id,
    org_id: orgId,
    role,
    full_name: str(f, 'full_name', 160),
    email: user.email!,
    phone,
    state,
    states_covered: covered.length ? covered : [state],
    languages: pick(f, 'languages', LANGUAGES),
    practice_areas: pick(f, 'practice_areas', PRACTICE_AREAS),
    enrolment_number: role === 'lawyer' ? enrolment : null,
    year_called: role === 'lawyer' ? Number(str(f, 'year_called', 4)) || null : null,
    nba_branch: str(f, 'nba_branch', 80) || null,
    institution: str(f, 'institution', 160) || null,
    capacity: Math.min(20, Math.max(1, Number(str(f, 'capacity', 2)) || 2)),
    status: 'pending',
    reviewer_note: null,
  }
  const { error } = await createAdminClient().from('la_members').upsert(row)
  if (error) return { error: 'We could not save that. Please try again.' }
  redirect('/volunteer?sent=1')
}

export async function submitOrganisation(_: FormResult, f: FormData): Promise<FormResult> {
  const user = await getUser()
  if (!user) redirect('/login?next=/organisations')
  const name = str(f, 'name', 200)
  const kind = str(f, 'kind', 30)
  const state = str(f, 'state', 40)
  const phone = str(f, 'phone', 30)
  if (name.length < 4) return { error: 'Give the organisation’s registered name.' }
  if (!ORG_KINDS[kind]) return { error: 'Choose the type of organisation.' }
  if (!(STATES as readonly string[]).includes(state)) return { error: 'Choose the state of your main office.' }
  if (!validPhone(phone)) return { error: 'Give the organisation’s phone number.' }
  if (str(f, 'your_name', 160).length < 5) return { error: 'Give your own full name — you become the coordinator.' }

  const db = createAdminClient()
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}-${crypto.randomUUID().slice(0, 4)}`
  const { data: org, error } = await db
    .from('la_organisations')
    .insert({
      slug,
      name,
      kind,
      state,
      address: str(f, 'address', 300) || null,
      email: str(f, 'email', 200).toLowerCase() || user.email,
      phone,
      website: str(f, 'website', 200) || null,
      cac_number: str(f, 'cac_number', 40) || null,
      description: str(f, 'description', 1500) || null,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error || !org) return { error: 'We could not save that. Please try again.' }
  await db.from('la_members').upsert({
    user_id: user.id,
    org_id: org.id,
    role: 'coordinator',
    full_name: str(f, 'your_name', 160),
    email: user.email!,
    phone,
    state,
    states_covered: [state],
    status: 'pending',
    capacity: 20,
  })
  redirect('/organisations?sent=1')
}
