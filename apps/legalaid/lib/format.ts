const LAGOS = 'Africa/Lagos'

export function naira(n: number | null | undefined) {
  if (n == null) return '—'
  return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function date(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { timeZone: LAGOS, ...opts })
}

export function dateTime(d: string | Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { timeZone: LAGOS, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function time(d: string | Date) {
  return new Date(d).toLocaleTimeString('en-GB', { timeZone: LAGOS, hour: '2-digit', minute: '2-digit' })
}

/** YYYY-MM-DD for "today" in Lagos, regardless of server timezone. */
export function lagosToday(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return d.toLocaleDateString('en-CA', { timeZone: LAGOS })
}

/** Start/end ISO instants for a Lagos calendar day (WAT is UTC+1, no DST). */
export function lagosDayRange(day: string) {
  const start = new Date(`${day}T00:00:00+01:00`)
  const end = new Date(start.getTime() + 86400000)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function relative(d: string | Date | null | undefined) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const abs = Math.abs(diff)
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 86400000],
    ['month', 30 * 86400000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') return fmt.format(-Math.round(diff / ms), unit)
  }
  return ''
}

export function partyNames(list: { name: string }[] | null | undefined) {
  if (!list?.length) return '—'
  return list.map((p) => p.name).join(', ')
}

export function plural(n: number, one: string, many = one + 's') {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

/** Short, unambiguous tracking code: no 0/O/1/I. */
export function trackingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return 'EF-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}
