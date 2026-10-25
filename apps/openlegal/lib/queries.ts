import { db } from './db'

export interface JudgmentHit {
  id: string
  slug: string
  title: string
  suit_number: string | null
  citation: string | null
  court_name: string
  division: string | null
  state: string | null
  judges: string[]
  case_type: string | null
  delivered_on: string | null
  holding: string | null
  summary: string | null
  keywords: string[]
  source: string
  is_sample: boolean
  snippet: string
  rank: number
  total_count: number
}

export interface Judgment extends Omit<JudgmentHit, 'snippet' | 'rank' | 'total_count'> {
  issues: string[]
  statutes_cited: string[]
  cases_cited: string[]
  full_text: string
  published_at: string | null
}

export interface SearchParams {
  q?: string
  court?: string
  type?: string
  from?: number
  to?: number
  page?: number
  perPage?: number
  includeSamples?: boolean
}

export async function searchJudgments(p: SearchParams) {
  const perPage = Math.min(p.perPage ?? 10, 50)
  const page = Math.max(1, p.page ?? 1)
  const { data, error } = await db().rpc('search_judgments', {
    q: p.q ?? '',
    p_court: p.court || null,
    p_case_type: p.type || null,
    p_year_from: p.from || null,
    p_year_to: p.to || null,
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
    p_include_samples: p.includeSamples ?? true,
  })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as JudgmentHit[]
  return { results: rows, total: Number(rows[0]?.total_count ?? 0), page, perPage }
}

export async function getJudgment(slug: string) {
  const { data } = await db().from('judgments').select('*').eq('slug', slug).maybeSingle()
  return (data as Judgment | null) ?? null
}

export type RecentJudgment = Pick<Judgment, 'id' | 'slug' | 'title' | 'suit_number' | 'court_name' | 'division' | 'case_type' | 'delivered_on' | 'holding' | 'judges' | 'is_sample' | 'source'>

export async function recentJudgments(limit = 6) {
  const { data } = await db()
    .from('judgments')
    .select('id, slug, title, suit_number, court_name, division, case_type, delivered_on, holding, judges, is_sample, source')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []) as RecentJudgment[]
}

export async function relatedJudgments(j: { id: string; keywords: string[] }, limit = 4) {
  if (!j.keywords.length) return []
  const { results } = await searchJudgments({ q: j.keywords.slice(0, 4).join(' or '), perPage: limit + 1 })
  return results.filter((r) => r.id !== j.id).slice(0, limit)
}

export async function stats() {
  const [judgments, laws, sections, courts] = await Promise.all([
    db().from('judgments').select('id', { count: 'exact', head: true }),
    db().from('laws').select('id', { count: 'exact', head: true }),
    db().from('law_sections').select('id', { count: 'exact', head: true }),
    db().from('judgments').select('court_name').limit(5000),
  ])
  return {
    judgments: judgments.count ?? 0,
    laws: laws.count ?? 0,
    sections: sections.count ?? 0,
    courts: new Set((courts.data ?? []).map((r) => r.court_name)).size,
  }
}

export async function courtsWithCounts() {
  const { data } = await db().from('judgments').select('court_name, state').limit(20000)
  const map = new Map<string, { name: string; state: string | null; count: number }>()
  for (const r of data ?? []) {
    const e = map.get(r.court_name) ?? { name: r.court_name, state: r.state, count: 0 }
    e.count++
    map.set(r.court_name, e)
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export interface LawSectionHit {
  id: string
  law_slug: string
  law_title: string
  law_year: number | null
  part: string | null
  number: string
  heading: string | null
  snippet: string
  rank: number
}

export async function searchLawSections(q: string, lawSlug?: string, limit = 5) {
  if (!q.trim()) return []
  const { data } = await db().rpc('search_law_sections', { q, p_law_slug: lawSlug ?? null, p_limit: limit })
  return (data ?? []) as LawSectionHit[]
}

export async function listLaws() {
  const { data } = await db().from('laws').select('id, slug, title, short_title, year, jurisdiction, category, description, law_sections(count)').order('title')
  return (data ?? []).map((l) => ({ ...l, sections: (l.law_sections as unknown as { count: number }[])[0]?.count ?? 0 }))
}

export interface Law {
  id: string
  slug: string
  title: string
  short_title: string | null
  year: number | null
  jurisdiction: string
  category: string | null
  description: string | null
  source_url: string | null
  source_name: string | null
  edition: string | null
  currency_note: string | null
  long_title: string | null
  law_sections: { id: string; part: string | null; number: string; heading: string | null; body: string; position: number }[]
}

export async function getLaw(slug: string) {
  const { data } = await db().from('laws').select('*, law_sections(id, part, number, heading, body, position)').eq('slug', slug).maybeSingle()
  if (!data) return null
  const law = data as Law
  law.law_sections.sort((a, b) => a.position - b.position)
  return law
}

export async function getLawSection(slug: string, number: string) {
  const law = await getLaw(slug)
  if (!law) return null
  const section = law.law_sections.find((s) => s.number === number)
  return section ? { law: { slug: law.slug, title: law.title, year: law.year, source_url: law.source_url, source_name: law.source_name, edition: law.edition, currency_note: law.currency_note }, section } : null
}
