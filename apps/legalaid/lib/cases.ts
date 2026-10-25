import { createHash, randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Reference a family can read over the phone: LA-7KQ-M2X. */
export function newRef() {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)]
  return `LA-${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`
}

export const newPin = () => String(randomInt(100000, 1000000))

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export function hashPin(ref: string, pin: string) {
  return sha256(`${ref.toUpperCase()}:${pin}`)
}

/** Salted so the stored value can't be reversed to an IP by guessing. */
export function hashIp(ip: string) {
  return sha256(`${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? 'la'}:${ip}`)
}

/** Nigerian numbers to international form for wa.me / tel: links. */
export function intlPhone(p: string | null | undefined) {
  if (!p) return null
  const d = p.replace(/\D/g, '')
  if (d.startsWith('234')) return d
  if (d.startsWith('0') && d.length === 11) return '234' + d.slice(1)
  return d.length >= 10 ? d : null
}

export function whatsapp(p: string | null | undefined, text: string) {
  const n = intlPhone(p)
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null
}

export const validPhone = (p: string) => (intlPhone(p)?.length ?? 0) >= 12

export const CASE_SELECT =
  'id, ref, kind, status, channel, state, lga, facility, facility_type, person_name, person_age, person_sex, arrested_on, remanded_on, last_hearing_on, next_hearing_on, court_name, allegation, has_lawyer, verified_at, assigned_to, assigned_org, assigned_at, first_action_due, first_action_at, outcome, outcome_on, created_at'

export interface CaseRow {
  id: string
  ref: string
  kind: string
  status: string
  channel: string
  state: string
  lga: string | null
  facility: string | null
  facility_type: string | null
  person_name: string
  person_age: number | null
  person_sex: string | null
  arrested_on: string | null
  remanded_on: string | null
  last_hearing_on: string | null
  next_hearing_on: string | null
  court_name: string | null
  allegation: string | null
  has_lawyer: boolean
  verified_at: string | null
  assigned_to: string | null
  assigned_org: string | null
  assigned_at: string | null
  first_action_due: string | null
  first_action_at: string | null
  outcome: string | null
  outcome_on: string | null
  created_at: string
}

/** Initials only, for anyone who hasn't taken the case. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + '.')
    .join(' ')
