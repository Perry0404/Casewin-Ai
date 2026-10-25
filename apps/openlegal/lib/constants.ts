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

export function caseTypeLabel(v: string | null | undefined) {
  return CASE_TYPES.find((c) => c.value === v)?.label ?? v ?? ''
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://openlegal.casewinai.com'
export const COURT_URL = process.env.NEXT_PUBLIC_COURT_URL || 'https://court.casewinai.com'
export const CASEWIN_URL = process.env.NEXT_PUBLIC_CASEWIN_URL || 'https://casewinai.com'
export const LEGALAID_URL = process.env.NEXT_PUBLIC_LEGALAID_URL || 'https://legalaid.casewinai.com'

export function longDate(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d.length === 10 ? `${d}T12:00:00Z` : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Neutral citation used for "Cite as". */
export function citeAs(j: { title: string; suit_number: string | null; court_name: string; delivered_on: string | null; citation?: string | null }) {
  if (j.citation) return `${j.title} ${j.citation}`
  const year = j.delivered_on?.slice(0, 4)
  return `${j.title} (${year ?? 'n.d.'}) Suit No. ${j.suit_number ?? '—'}, ${j.court_name}`
}

/** ts_headline returns <mark> tags around matches; everything else must be escaped. */
export function safeSnippet(s: string | null | undefined) {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;mark&gt;/g, '<mark>')
    .replace(/&lt;\/mark&gt;/g, '</mark>')
}
