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

export function caseAlertMessage(c: { id: string; ref: string; kind: string; state: string; lga: string | null; facility: string | null; created_at: string }, orgName: string) {
  const where = [c.facility, c.lga, c.state].filter(Boolean).join(', ')
  return [
    `New legal aid request — ${orgName}`,
    ``,
    `${KINDS[c.kind]?.short ?? 'Request'}${where ? ` · ${where}` : ''}`,
    ``,
    `Tap to see the case and accept it. The first lawyer to accept takes it:`,
    `${SITE}/desk/cases/${c.id}`,
    ``,
    `Ref ${c.ref}. Please don't forward this message.`,
  ].join('\n')
}

export function waLink(phone: string | null, text: string) {
  const n = phone ? intlPhone(phone) : null
  return `https://wa.me/${n ?? ''}?text=${encodeURIComponent(text)}`
}
