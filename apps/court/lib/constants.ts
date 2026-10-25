export const CASE_TYPES = [
  { value: 'civil', label: 'General civil' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land & property' },
  { value: 'family', label: 'Family & matrimonial' },
  { value: 'probate', label: 'Probate & estates' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'fundamental_rights', label: 'Fundamental rights' },
  { value: 'election', label: 'Election petition' },
  { value: 'employment', label: 'Employment' },
] as const

export const PROCESS_TYPES = [
  { value: 'writ', label: 'Writ of summons' },
  { value: 'originating_summons', label: 'Originating summons' },
  { value: 'petition', label: 'Petition' },
  { value: 'motion', label: 'Originating motion' },
  { value: 'charge', label: 'Charge / information' },
] as const

export const HEARING_PURPOSES = [
  { value: 'mention', label: 'Mention' },
  { value: 'motion', label: 'Motion' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'trial', label: 'Trial' },
  { value: 'adoption', label: 'Adoption of addresses' },
  { value: 'ruling', label: 'Ruling' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'report', label: 'Report of settlement' },
] as const

export const ADJOURNMENT_REASONS = [
  'Counsel absent',
  'Party absent',
  'Witness absent',
  'Judge not sitting',
  'Hearing notice not served',
  'Case file not ready',
  'Time ran out',
  'Settlement talks',
  'Industrial action',
  'Other',
] as const

export const FILING_STATUS: Record<string, { label: string; tone: Tone; help: string }> = {
  submitted: { label: 'Submitted', tone: 'info', help: 'Waiting for the registry to open it.' },
  under_review: { label: 'Under review', tone: 'info', help: 'A registry clerk is checking the papers.' },
  queried: { label: 'Queried', tone: 'warn', help: 'The registry needs something fixed before it can continue.' },
  assessed: { label: 'Fees assessed', tone: 'warn', help: 'Pay the assessed filing fees and enter the receipt number.' },
  paid: { label: 'Payment received', tone: 'info', help: 'The registry is confirming payment and opening the case.' },
  accepted: { label: 'Accepted', tone: 'good', help: 'The case is open and has a suit number.' },
  rejected: { label: 'Rejected', tone: 'bad', help: 'The registry could not accept this filing.' },
}

export const CASE_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending_assignment: { label: 'Awaiting judge', tone: 'warn' },
  active: { label: 'Active', tone: 'good' },
  adjourned: { label: 'Adjourned', tone: 'warn' },
  reserved: { label: 'Judgment reserved', tone: 'info' },
  judgment_delivered: { label: 'Judgment delivered', tone: 'neutral' },
  struck_out: { label: 'Struck out', tone: 'neutral' },
  settled: { label: 'Settled', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  transferred: { label: 'Transferred', tone: 'neutral' },
}

/** Statuses that mean the case has left the docket. */
export const DISPOSED_STATUSES = ['judgment_delivered', 'struck_out', 'settled', 'withdrawn', 'transferred']

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export function label<T extends readonly { value: string; label: string }[]>(list: T, value: string | null | undefined) {
  return list.find((x) => x.value === value)?.label ?? value ?? '—'
}

export const OPENLEGAL_URL = process.env.NEXT_PUBLIC_OPENLEGAL_URL || 'https://openlegal.casewinai.com'
export const LEGALAID_URL = process.env.NEXT_PUBLIC_LEGALAID_URL || 'https://legalaid.casewinai.com'
export const CASEWIN_URL = process.env.NEXT_PUBLIC_CASEWIN_URL || 'https://casewinai.com'
