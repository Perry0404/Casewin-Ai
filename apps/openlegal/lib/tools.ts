// The operations OpenLegal exposes to programs. The REST API and the MCP
// server both call these, so the two always agree.

import { SITE_URL, caseTypeLabel, citeAs } from './constants'
import { db } from './db'
import { getJudgment, getLaw, getLawSection, searchJudgments, searchLawSections } from './queries'

const strip = (s: string | null | undefined) => (s ?? '').replace(/<\/?mark>/g, '')

export async function toolSearchJudgments(args: { query?: string; court?: string; case_type?: string; year_from?: number; year_to?: number; page?: number; limit?: number; include_samples?: boolean }) {
  const { results, total, page, perPage } = await searchJudgments({
    q: args.query,
    court: args.court,
    type: args.case_type,
    from: args.year_from,
    to: args.year_to,
    page: args.page,
    perPage: Math.min(args.limit ?? 10, 25),
    includeSamples: args.include_samples ?? false,
  })
  return {
    query: args.query ?? '',
    total,
    page,
    per_page: perPage,
    results: results.map((r) => ({
      id: r.slug,
      title: r.title,
      suit_number: r.suit_number,
      court: r.court_name,
      division: r.division,
      case_type: caseTypeLabel(r.case_type),
      delivered_on: r.delivered_on,
      judges: r.judges,
      holding: r.holding,
      excerpt: strip(r.snippet),
      cite_as: citeAs(r),
      provenance: r.source === 'community' ? 'community-contributed, verified by OpenLegal reviewers' : 'published by the court registry',
      url: `${SITE_URL}/judgments/${r.slug}`,
      ...(r.is_sample ? { sample: true, warning: 'Demonstration data — not a real decision.' } : {}),
    })),
  }
}

export async function toolGetJudgment(args: { id: string; max_chars?: number }) {
  const j = await getJudgment(args.id)
  if (!j) return null
  const max = Math.min(Math.max(args.max_chars ?? 60000, 1000), 200000)
  return {
    id: j.slug,
    title: j.title,
    suit_number: j.suit_number,
    citation: j.citation,
    cite_as: citeAs(j),
    court: j.court_name,
    division: j.division,
    state: j.state,
    judges: j.judges,
    case_type: caseTypeLabel(j.case_type),
    delivered_on: j.delivered_on,
    holding: j.holding,
    summary: j.summary,
    issues: j.issues,
    statutes_cited: j.statutes_cited,
    cases_cited: j.cases_cited,
    keywords: j.keywords,
    full_text: j.full_text.length > max ? j.full_text.slice(0, max) + '\n\n[Truncated — request a larger max_chars or read it at the URL.]' : j.full_text,
    provenance: j.source === 'community' ? 'community-contributed, verified by OpenLegal reviewers' : 'published by the court registry',
    url: `${SITE_URL}/judgments/${j.slug}`,
    ...(j.is_sample ? { sample: true, warning: 'Demonstration data — not a real decision. Do not cite.' } : {}),
  }
}

export async function toolSearchLaws(args: { query: string; law?: string; limit?: number }) {
  const hits = await searchLawSections(args.query, args.law, Math.min(args.limit ?? 8, 25))
  return {
    query: args.query,
    results: hits.map((h) => ({
      law: h.law_title,
      law_id: h.law_slug,
      section: h.number,
      heading: h.heading,
      part: h.part,
      excerpt: strip(h.snippet),
      url: `${SITE_URL}/laws/${h.law_slug}#s-${h.number}`,
    })),
  }
}

export async function toolGetLawSection(args: { law_id: string; section: string }) {
  const r = await getLawSection(args.law_id, args.section)
  if (!r) return null
  return {
    law: r.law.title,
    law_id: r.law.slug,
    year: r.law.year,
    section: r.section.number,
    heading: r.section.heading,
    part: r.section.part,
    text: r.section.body,
    url: `${SITE_URL}/laws/${r.law.slug}#s-${r.section.number}`,
    note: 'Confirm against the official gazette where the provision may have been amended.',
  }
}

export async function toolListLaws() {
  const { data } = await db().from('laws').select('slug, title, short_title, year, jurisdiction, category').order('title')
  return { laws: (data ?? []).map((l) => ({ law_id: l.slug, title: l.title, short_title: l.short_title, year: l.year, jurisdiction: l.jurisdiction, category: l.category })) }
}

export async function toolListCourts() {
  const { data } = await db().from('courts').select('name, short_name, state, tier, status').order('name')
  return { courts: data ?? [] }
}

export { getLaw }
