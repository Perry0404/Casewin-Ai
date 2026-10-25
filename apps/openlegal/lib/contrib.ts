// Server-only: imports the service-role client.
import { createHash, randomBytes } from 'node:crypto'
import { adminDb } from './admin-db'
import { SITE_URL } from './constants'

export const POINTS = { verified: 10, confirmation: 1 }
const DAILY_LIMIT = 50

export interface Contributor {
  id: string
  user_id: string
  display_name: string
  institution: string | null
  role: string
  points: number
  is_blocked: boolean
  api_key_prefix: string | null
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** New personal key, shown to the contributor once. Only its hash is stored. */
export function newApiKey() {
  const key = 'olk_' + randomBytes(24).toString('base64url')
  return { key, hash: sha256(key), prefix: key.slice(0, 10) }
}

export async function contributorByKey(key: string | null | undefined): Promise<Contributor | null> {
  if (!key || !key.startsWith('olk_')) return null
  const { data } = await adminDb().from('contributors').select('*').eq('api_key_hash', sha256(key)).maybeSingle()
  return data && !data.is_blocked ? (data as Contributor) : null
}

export async function contributorByUser(userId: string): Promise<Contributor | null> {
  const { data } = await adminDb().from('contributors').select('*').eq('user_id', userId).maybeSingle()
  return (data as Contributor) ?? null
}

/** Pulls the key from "Authorization: Bearer olk_…", "x-openlegal-key" or ?key= (for clients without custom headers). */
export function keyFromRequest(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return req.headers.get('x-openlegal-key') ?? new URL(req.url).searchParams.get('key')
}

export interface SubmissionInput {
  title?: string
  suit_number?: string
  court?: string
  division?: string
  delivered_on?: string
  judges?: string[] | string
  case_type?: string
  full_text?: string
  source_url?: string
  source_note?: string
}

export type SubmitResult =
  | { status: 'received'; submission_id: string; message: string; flags: string[] }
  | { status: 'already_published'; message: string; url: string }
  | { status: 'already_submitted'; message: string }
  | { status: 'rejected_input'; message: string }

function normaliseText(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)

/**
 * The single entry point for a new contribution (web form, REST API or MCP).
 * Returns a plain-language result the contributor's AI can relay verbatim.
 */
export async function submitJudgment(c: Contributor, input: SubmissionInput, channel: 'web' | 'mcp' | 'api'): Promise<SubmitResult> {
  const db = adminDb()
  const title = clip(input.title, 300)
  const court = clip(input.court, 200)
  const fullText = String(input.full_text ?? '').trim()
  const suit = clip(input.suit_number, 80) || null
  const delivered = /^\d{4}-\d{2}-\d{2}$/.test(input.delivered_on ?? '') ? input.delivered_on! : null
  const judges = (Array.isArray(input.judges) ? input.judges : String(input.judges ?? '').split(/[,;\n]/)).map((j) => clip(j, 120)).filter(Boolean).slice(0, 10)

  if (title.length < 5 || !/\bv\.?\s|\bversus\b|^(re|in re)\b|\bstate\b/i.test(title))
    return { status: 'rejected_input', message: 'Give the case title in the usual form, e.g. "Okonkwo v. Eze".' }
  if (court.length < 5) return { status: 'rejected_input', message: 'Say which court delivered the judgment, e.g. "High Court of Imo State" or "Court of Appeal, Owerri Division".' }
  if (fullText.length < 1500)
    return { status: 'rejected_input', message: 'Send the full text of the judgment (at least a few pages). Summaries and headnotes cannot be published.' }
  if (fullText.length > 400000) return { status: 'rejected_input', message: 'That text is too long. Send one judgment at a time.' }

  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await db.from('submissions').select('id', { count: 'exact', head: true }).eq('contributor_id', c.id).gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return { status: 'rejected_input', message: `Daily limit reached (${DAILY_LIMIT} submissions). Please continue tomorrow.` }

  const fingerprint = createHash('sha256').update(normaliseText(fullText)).digest('hex')
  const { data: existing } = await db.rpc('find_existing_case', {
    p_suit: suit,
    p_court: court,
    p_title: title,
    p_year: delivered ? Number(delivered.slice(0, 4)) : null,
    p_fingerprint: fingerprint,
  })
  const hit = (existing ?? [])[0] as { kind: string; id: string; slug: string | null; title: string; contributor_id: string | null } | undefined

  if (hit?.kind === 'judgment') {
    return { status: 'already_published', message: `“${hit.title}” is already on OpenLegal Nigeria. No points for duplicates — thank you for checking.`, url: `${SITE_URL}/judgments/${hit.slug}` }
  }
  if (hit?.kind === 'submission') {
    if (hit.contributor_id === c.id) return { status: 'already_submitted', message: `You already submitted “${hit.title}”. It is waiting for review.` }
    await db.from('submission_confirmations').upsert({ submission_id: hit.id, contributor_id: c.id }, { onConflict: 'submission_id,contributor_id', ignoreDuplicates: true })
    const { count: n } = await db.from('submission_confirmations').select('*', { count: 'exact', head: true }).eq('submission_id', hit.id)
    await db.from('submissions').update({ confirmations: n ?? 0 }).eq('id', hit.id)
    return {
      status: 'already_submitted',
      message: `Someone submitted “${hit.title}” first. Your copy has been recorded as an independent confirmation — you earn ${POINTS.confirmation} point if it is verified.`,
    }
  }

  const head = fullText.slice(0, 4000)
  const flags: string[] = []
  if (/nigerian weekly law reports|lawpavilion|\bLPELR-\d|\bheadnote|^\s*HELD\s*:/im.test(head)) flags.push('possible_law_report_copy')
  if (!suit) flags.push('no_suit_number')
  if (!delivered) flags.push('no_date')
  if (fullText.length < 5000) flags.push('short_text')

  const { data, error } = await db
    .from('submissions')
    .insert({
      contributor_id: c.id,
      channel,
      title,
      suit_number: suit,
      court_name: court,
      division: clip(input.division, 120) || null,
      delivered_on: delivered,
      judges,
      case_type: clip(input.case_type, 40) || null,
      full_text: fullText,
      source_url: clip(input.source_url, 500) || null,
      source_note: clip(input.source_note, 500) || null,
      fingerprint,
      match_key: suit ? `${suit.toUpperCase().replace(/[^A-Z0-9]/g, '')}|${court.toUpperCase().replace(/[^A-Z0-9]/g, '')}` : null,
      flags,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')

  return {
    status: 'received',
    submission_id: data.id,
    flags,
    message:
      `Received “${title}” — it is new to OpenLegal Nigeria. A reviewer will check it against the court record; you earn ${POINTS.verified} points when it is verified and published.` +
      (flags.includes('possible_law_report_copy') ? ' Note: this looks like it may be copied from a law report. Only the court’s own judgment text can be published, not a report’s headnotes or editorial content.' : ''),
  }
}

export async function myContributions(c: Contributor) {
  const db = adminDb()
  const [{ data: subs }, { count: ahead }] = await Promise.all([
    db.from('submissions').select('id, title, court_name, status, confirmations, reviewer_note, judgment_id, created_at').eq('contributor_id', c.id).order('created_at', { ascending: false }).limit(50),
    db.from('contributors').select('id', { count: 'exact', head: true }).gt('points', c.points),
  ])
  return {
    name: c.display_name,
    points: c.points,
    rank: c.points > 0 ? (ahead ?? 0) + 1 : null,
    submissions: subs ?? [],
  }
}
