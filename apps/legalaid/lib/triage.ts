// Statutory checks on a real file, from the dates on record. These are the
// questions a duty lawyer asks first; the answers decide who is seen today.

export interface Rule {
  id: string
  ref: string
  name: string
  text: string
  /** OpenLegal search that lands on the provision. */
  q: string
}

export const RULES: Rule[] = [
  { id: 'R1', ref: 'Constitution s.35(4)–(5)', name: 'Production before a court', text: 'A person arrested must be brought before a court within 24 hours where there is a court within 40 km, otherwise within 48 hours.', q: 'reasonable time 35 arrested detained' },
  { id: 'R2', ref: 'ACJA 2015 s.296(1)–(4)', name: 'Remand order', text: 'A remand order lasts no more than 14 days in the first instance.', q: 'remand order 296' },
  { id: 'R3', ref: 'ACJA 2015 s.296(5)–(7)', name: 'Extension and release', text: 'One further 14 days on good cause; after that the person must be released unless the prosecution shows good cause.', q: 'remand extension 296' },
  { id: 'R4', ref: 'Constitution s.36(6)(c)', name: 'Right to counsel', text: 'Everyone charged with a criminal offence is entitled to defend themselves through a legal practitioner of their choice.', q: 'legal practitioner of his own choice' },
  { id: 'R5', ref: 'Child Rights Act 2003', name: 'Child justice', text: 'A child (under 18) must be dealt with in the child justice system, with detention a last resort.', q: 'child justice' },
  { id: 'R6', ref: 'Practice threshold', name: 'Stalled file', text: 'No hearing recorded in 90 days: the file needs someone to move it.', q: '' },
]
export const rule = (id: string) => RULES.find((r) => r.id === id)!

export type Severity = 'critical' | 'urgent' | 'watch' | 'ok'
export interface Flag {
  rule: string
  severity: Severity
  text: string
}
export interface Assessment {
  daysHeld: number | null
  remandDays: number | null
  daysSinceHearing: number | null
  flags: Flag[]
  severity: Severity
  score: number
}

const DAY = 86400000
const daysSince = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d + 'T00:00:00+01:00').getTime()) / DAY) : null)

export interface TriageInput {
  kind: string
  status: string
  arrested_on: string | null
  remanded_on: string | null
  last_hearing_on: string | null
  next_hearing_on: string | null
  person_age: number | null
  has_lawyer: boolean
  assigned_to: string | null
  facility_type: string | null
}

export function assess(c: TriageInput): Assessment {
  const daysHeld = daysSince(c.arrested_on)
  const remandDays = daysSince(c.remanded_on)
  const daysSinceHearing = daysSince(c.last_hearing_on)
  const flags: Flag[] = []
  const open = !['resolved', 'closed', 'spam'].includes(c.status)
  const custody = c.kind === 'detention'
  const represented = c.has_lawyer || Boolean(c.assigned_to)

  if (open && custody) {
    const minor = c.person_age != null && c.person_age < 18
    if (minor) flags.push({ rule: 'R5', severity: 'critical', text: `A child of ${c.person_age} is in custody` })
    // Held with no remand order on record: s.35 — the clock is in hours, not days.
    if (daysHeld != null && !c.remanded_on && daysHeld >= 2)
      flags.push({ rule: 'R1', severity: daysHeld >= 7 ? 'critical' : 'urgent', text: `Held ${daysHeld} days with no court order on record` })
    if (remandDays != null && remandDays > 28) flags.push({ rule: 'R3', severity: 'critical', text: `Remanded ${remandDays} days — beyond both 14-day periods` })
    else if (remandDays != null && remandDays > 14) flags.push({ rule: 'R2', severity: 'urgent', text: `Remanded ${remandDays} days — first 14-day order has expired` })
    if (!represented) flags.push({ rule: 'R4', severity: daysHeld != null && daysHeld > 1 ? 'urgent' : 'watch', text: 'No lawyer yet' })
    if (daysSinceHearing != null && daysSinceHearing > 90 && !c.next_hearing_on) flags.push({ rule: 'R6', severity: 'urgent', text: `No hearing for ${daysSinceHearing} days and none listed` })
  } else if (open && !represented) {
    flags.push({ rule: 'R4', severity: 'watch', text: 'No lawyer yet' })
  }

  const order: Severity[] = ['critical', 'urgent', 'watch']
  const severity: Severity = !open ? 'ok' : order.find((s) => flags.some((f) => f.severity === s)) ?? 'watch'
  const score = { critical: 3e6, urgent: 2e6, watch: 1e6, ok: 0 }[severity] + (represented ? 0 : 5e5) + (daysHeld ?? 0) * 100 + (remandDays ?? 0)
  return { daysHeld, remandDays, daysSinceHearing, flags, severity, score }
}

export const SEVERITY: Record<Severity, { label: string; tone: 'bad' | 'warn' | 'info' | 'good' }> = {
  critical: { label: 'Critical', tone: 'bad' },
  urgent: { label: 'Urgent', tone: 'warn' },
  watch: { label: 'Open', tone: 'info' },
  ok: { label: 'Closed', tone: 'good' },
}
