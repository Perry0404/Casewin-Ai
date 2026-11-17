import { createHash, randomBytes } from 'crypto'
import { KINDS } from '@/lib/constants'
import { intlPhone } from '@/lib/cases'

// Panels: lawyers an organisation vouches for, added by name and phone number. They have no
// password. Each gets a personal sign-in link on WhatsApp (/k/<token>); we keep only its hash.

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://legalaid.casewinai.com'

export function newAccessToken() {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** The hidden login email for a panel lawyer with no email of their own. Never shown or mailed. */
export function panelEmail(phone: string) {
  return `${phone}@panel.casewinai.com`
}

/** "uche .c. iheoiwa Esq" → "Uche C. Iheoiwa" */
export function tidyName(raw: string) {
  return raw
    .replace(/\besq\.?/gi, ' ')
    .replace(/\./g, '. ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const word = w.replace(/\.$/, '')
      if (!word) return ''
      if (word.length === 1) return word.toUpperCase() + '.'
      return word[0].toUpperCase() + word.slice(1).toLowerCase()
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+,/g, ',')
    .trim()
}

export interface RosterRow {
  name: string
  phones: string[] // international format, first is WhatsApp
  line: string
}

/** One lawyer per line: a name and one or more Nigerian numbers in any format. */
export function parseRoster(text: string): { rows: RosterRow[]; skipped: string[] } {
  const rows: RosterRow[] = []
  const skipped: string[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const nums = line.match(/(\+?234|0)[789][01]\d[\s-]?\d{3}[\s-]?\d{4}/g) ?? []
    const phones = [...new Set(nums.map((n) => intlPhone(n)).filter((n): n is string => Boolean(n)))]
    const name = tidyName(line.replace(/(\+?234|0)[789][01]\d[\s-]?\d{3}[\s-]?\d{4}/g, ' ').replace(/[\/,;|]+/g, ' '))
    if (!phones.length || name.length < 3) skipped.push(line.trim())
    else rows.push({ name, phones, line: line.trim() })
  }
  return { rows, skipped }
}

export function localPhone(p: string) {
  return p.startsWith('234') ? '0' + p.slice(3) : p
}

export function welcomeMessage(o: { name: string; orgName: string; token: string }) {
  const first = o.name.split(' ')[0]
  return [
    `Hello ${first},`,
    ``,
    `${o.orgName} has added you to its pro bono panel on CaseWin Legal Aid.`,
    ``,
    `When someone needs a lawyer, the case will be sent to you here on WhatsApp. Tap the case link to see it; the first lawyer to accept takes it, and it is recorded to you.`,
    ``,
    `Your personal sign-in link. Tap it once now, and again whenever you are asked to sign in. Please don't forward it:`,
    `${SITE}/k/${o.token}`,
    ``,
    `Please save this number as "CaseWin Legal Aid" so case alerts reach you. Reply STOP if you would rather not receive them.`,
  ].join('\n')
}

/** For the panel's WhatsApp group: no names, no family numbers. */
export function caseAlertMessage(c: { ref: string; kind: string; state: string; lga: string | null; facility: string | null; allegation?: string | null }, orgName: string) {
  const where = [c.facility, c.lga, c.state].filter(Boolean).join(', ')
  return [
    `*New legal aid case — ${orgName}*`,
    ``,
    `${KINDS[c.kind]?.short ?? 'Request'}${where ? ` · ${where}` : ''}`,
    c.allegation ? `Alleged: ${c.allegation}` : null,
    ``,
    `Who can take it? Reply here. The coordinator will send the full details to the lawyer who takes it.`,
    ``,
    `Ref ${c.ref}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

type DetailCase = {
  ref: string; kind: string; state: string; lga: string | null; facility: string | null; person_name: string; person_age: number | null; allegation: string | null
  arrested_on: string | null; court_name: string | null; next_hearing_on: string | null; reporter_name: string | null; reporter_phone: string | null; reporter_relationship: string | null; safe_contact: string | null; safe_contact_note: string | null
}

/** Sent privately to the lawyer who took the case. */
export function caseDetailsMessage(c: DetailCase, lawyer: string) {
  const contact =
    c.safe_contact === 'no_calls' || c.safe_contact === 'other_way'
      ? `Do NOT call the family's number — it may not be safe.${c.safe_contact_note ? ` They said: ${c.safe_contact_note}` : ''} Ask the coordinator how to reach them.`
      : `${c.reporter_name ?? 'Family'}${c.reporter_relationship ? ` (${c.reporter_relationship})` : ''}: ${c.reporter_phone ?? 'no number given'}${c.safe_contact === 'text_only' ? ' — text only, no calls' : ''}`
  return [
    `Thank you, ${lawyer.split(' ')[0]}. Case ${c.ref} is recorded to you.`,
    ``,
    `Person: ${c.person_name}${c.person_age ? `, ${c.person_age}` : ''}`,
    `Matter: ${KINDS[c.kind]?.short ?? c.kind}${c.allegation ? ` — ${c.allegation}` : ''}`,
    `Where: ${[c.facility, c.lga, c.state].filter(Boolean).join(', ')}`,
    c.arrested_on ? `Arrested: ${c.arrested_on}` : null,
    c.court_name ? `Court: ${c.court_name}${c.next_hearing_on ? `, next date ${c.next_hearing_on}` : ''}` : null,
    `Contact: ${contact}`,
    ``,
    `Please contact them within 48 hours and tell me when you have. Keep these details private.`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export function waLink(phone: string | null, text: string) {
  const n = phone ? intlPhone(phone) : null
  return `https://wa.me/${n ?? ''}?text=${encodeURIComponent(text)}`
}
