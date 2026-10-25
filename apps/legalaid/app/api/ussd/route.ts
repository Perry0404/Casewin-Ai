import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { STATES } from '@/lib/constants'
import { hashPin, newPin, newRef } from '@/lib/cases'
import { logEvent } from '@/lib/auth'
import { alertNewCase } from '@/lib/notify'

// Africa's Talking USSD callback. Register https://legalaid.casewinai.com/api/ussd?key=<USSD_SECRET>
// as the callback URL for your service code. AT posts sessionId, serviceCode, phoneNumber and
// `text` — every answer so far joined with '*'. Replies start with CON (ask more) or END.

export const dynamic = 'force-dynamic'

const KIND_BY_KEY: Record<string, string> = { '1': 'detention', '2': 'police_abuse', '3': 'family', '4': 'other_civil' }
const SAFE_BY_KEY: Record<string, string> = { '1': 'yes', '2': 'text_only', '3': 'no_calls' }

const reply = (body: string) => new NextResponse(body, { headers: { 'content-type': 'text/plain' } })

function findState(input: string) {
  const t = input.trim().toLowerCase().replace(/\s+state$/, '')
  if (!t) return null
  if (['abuja', 'fct', 'federal capital territory'].includes(t)) return 'FCT'
  return STATES.find((s) => s.toLowerCase() === t) ?? STATES.find((s) => s.toLowerCase().startsWith(t.slice(0, 4))) ?? null
}

export async function POST(req: NextRequest) {
  const secret = process.env.USSD_SECRET
  if (secret && req.nextUrl.searchParams.get('key') !== secret) return new NextResponse('forbidden', { status: 403 })
  const form = await req.formData()
  const phone = String(form.get('phoneNumber') ?? '')
  const text = String(form.get('text') ?? '')
  const a = text === '' ? [] : text.split('*')

  if (a.length === 0)
    return reply('CON CaseWin Legal Aid - free lawyer\n1. Someone is detained\n2. Police took money / abuse\n3. Violence at home\n4. Other legal problem')
  const kind = KIND_BY_KEY[a[0]!]
  if (!kind) return reply('END Choose 1, 2, 3 or 4. Please dial again.')
  if (a.length === 1) return reply(kind === 'detention' ? 'CON Full name of the person detained:' : 'CON Full name of the person who needs help:')
  if (a.length === 2) return reply('CON Which state? (e.g. Imo, Lagos, Abuja)')
  const state = findState(a[2]!)
  if (!state) return reply('END We did not recognise that state. Please dial again.')
  if (a.length === 3) return reply(kind === 'detention' ? 'CON Where are they held? (station or prison, town)' : 'CON Which town or area?')
  if (a.length === 4) return reply('CON In a few words, what happened?')
  if (a.length === 5) return reply('CON Is it safe for us to call this number?\n1. Yes\n2. Text only, do not call\n3. No, do not contact it')
  const safe = SAFE_BY_KEY[a[5]!]
  if (!safe) return reply('END Choose 1, 2 or 3. Please dial again.')
  if (a.length === 6) return reply('CON Send? Only a verified volunteer lawyer will see it.\n1. Yes, send\n2. Cancel')
  if (a[6] !== '1') return reply('END Cancelled. Nothing was sent.')

  const name = a[1]!.trim().slice(0, 160)
  const place = a[3]!.trim().slice(0, 200)
  const story = a[4]!.trim().slice(0, 1000)
  if (name.length < 3 || story.length < 3) return reply('END Some answers were too short. Please dial again.')

  const db = createAdminClient()
  const { count } = await db.from('la_cases').select('id', { count: 'exact', head: true }).eq('reporter_phone', phone).eq('channel', 'phone').gte('created_at', new Date(Date.now() - 86400000).toISOString())
  if ((count ?? 0) >= 5) return reply('END Too many requests from this number today. Call the Legal Aid Council of Nigeria if urgent.')

  const ref = newRef()
  const pin = newPin()
  const { data, error } = await db
    .from('la_cases')
    .insert({
      ref,
      kind,
      channel: 'phone',
      state,
      facility: kind === 'detention' ? place : null,
      lga: kind === 'detention' ? null : place,
      facility_type: kind === 'detention' ? 'unknown' : null,
      person_name: name,
      reporter_phone: phone,
      story: `${story}\n\n(Reported by USSD.)`,
      safe_contact: safe,
      safe_contact_note: safe === 'no_calls' ? 'Reported by USSD: do not contact this number. Wait for the person to make contact again, or reach them through a facility visit.' : null,
      consent_at: new Date().toISOString(),
      pin_hash: hashPin(ref, pin),
      form_language: 'en',
    })
    .select('id')
    .single()
  if (error || !data) return reply('END Sorry, something went wrong. Please dial again.')
  await logEvent({ case_id: data.id, kind: 'reported', actor_label: 'Reporter (USSD)', body: 'Request received by phone.', public: true })
  await alertNewCase({ id: data.id, ref, kind, state, facility: place, reporter_phone: phone, safe_contact: safe }).catch(() => {})
  return reply(`END Sent. Ref ${ref} PIN ${pin}. Write them down. A volunteer lawyer will help within 48 hours. It is FREE - never pay anyone.`)
}
