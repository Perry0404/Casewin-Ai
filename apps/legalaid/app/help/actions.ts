'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { FACILITY_TYPES, KINDS, STATES } from '@/lib/constants'
import { hashIp, hashPin, newPin, newRef, validPhone } from '@/lib/cases'
import { getUser, logEvent } from '@/lib/auth'

const str = (f: FormData, k: string, n = 200) => String(f.get(k) ?? '').trim().slice(0, n)
const day = (f: FormData, k: string) => {
  const v = str(f, k, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v).getTime() <= Date.now() + 366 * 86400000 ? v : null
}

export type ReportState = { error?: string } | undefined

export async function submitReport(_: ReportState, f: FormData): Promise<ReportState> {
  // Bots fill every field; people never see this one.
  if (str(f, 'website')) return { error: 'Something went wrong. Please try again.' }

  const kind = str(f, 'kind', 30)
  const state = str(f, 'state', 40)
  const story = str(f, 'story', 6000)
  const reporterPhone = str(f, 'reporter_phone', 30)
  const personName = str(f, 'person_name', 160)
  if (!KINDS[kind]) return { error: 'Choose what kind of help is needed.' }
  if (!(STATES as readonly string[]).includes(state)) return { error: 'Choose the state.' }
  if (personName.length < 3) return { error: 'Give the full name of the person who needs help.' }
  if (!validPhone(reporterPhone)) return { error: 'Give a phone number we can reach you on, e.g. 0803 123 4567.' }
  if (story.length < 30) return { error: 'Tell us a little more about what happened (a few sentences).' }
  if (f.get('consent') !== 'on') return { error: 'Please confirm the consent box so a volunteer can use these details.' }

  const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'unknown'
  const ipHash = hashIp(ip)
  const db = createAdminClient()
  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await db.from('la_cases').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if ((count ?? 0) >= 5) return { error: 'Too many reports from this connection today. If this is an emergency, call the Legal Aid Council of Nigeria.' }

  const age = Number(str(f, 'person_age', 3))
  const facilityType = str(f, 'facility_type', 30)
  const user = await getUser()
  const pin = newPin()
  let ref = newRef()
  let inserted: { id: string } | null = null
  for (let i = 0; i < 3 && !inserted; i++) {
    const { data, error } = await db
      .from('la_cases')
      .insert({
        ref,
        kind,
        channel: 'web',
        state,
        lga: str(f, 'lga', 80) || null,
        facility: str(f, 'facility', 200) || null,
        facility_type: FACILITY_TYPES[facilityType] ? facilityType : null,
        person_name: personName,
        person_age: Number.isInteger(age) && age > 0 && age < 121 ? age : null,
        person_sex: ['female', 'male'].includes(str(f, 'person_sex')) ? str(f, 'person_sex') : 'unspecified',
        person_phone: str(f, 'person_phone', 30) || null,
        reporter_name: str(f, 'reporter_name', 160) || null,
        reporter_phone: reporterPhone,
        reporter_email: str(f, 'reporter_email', 200).toLowerCase() || null,
        reporter_relationship: str(f, 'relationship', 40) || null,
        language: str(f, 'language', 30) || null,
        arrested_on: day(f, 'arrested_on'),
        remanded_on: day(f, 'remanded_on'),
        next_hearing_on: day(f, 'next_hearing_on'),
        court_name: str(f, 'court_name', 200) || null,
        allegation: str(f, 'allegation', 300) || null,
        story,
        has_lawyer: f.get('has_lawyer') === 'yes',
        can_pay: f.get('can_pay') === 'yes',
        consent_at: new Date().toISOString(),
        pin_hash: hashPin(ref, pin),
        ip_hash: ipHash,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single()
    if (data) inserted = data
    else if (error?.code === '23505') ref = newRef()
    else return { error: 'We could not save the report. Please try again in a minute.' }
  }
  if (!inserted) return { error: 'We could not save the report. Please try again.' }

  await logEvent({ case_id: inserted.id, kind: 'reported', actor_label: 'Reporter', body: 'Request received.', public: true })
  // Shown once on the next page; never put in a URL.
  cookies().set('issued', JSON.stringify({ ref, pin }), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 900, path: '/help/sent' })
  redirect('/help/sent')
}
