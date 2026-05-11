import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

interface CaseResult {
  id: string
  title: string
  citation: string
  court: string
  year: number
  summary: string
  relevance: number
  keyPrinciples: string[]
  source: 'database' | 'ai'
  category?: string
  isLandmark?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { query, jurisdiction, category, yearFrom, yearTo, limit = 20 } = await req.json()

    if (!query) {
      return NextResponse.json({ success: false, error: 'Research query is required' }, { status: 400 })
    }

    // 1. Search database first
    const dbResults = await searchDatabase(query, jurisdiction, category, yearFrom, yearTo, limit)

    // 2. Always also query AI for broader research
    const aiResults = await searchWithAI(query, jurisdiction, limit)

    // 3. Merge: DB results first (real cases), then AI results (deduped)
    const merged = mergeResults(dbResults, aiResults, limit)

    // 4. Also get the raw AI research text for display
    const researchText = aiResults.length > 0 ? '' : '' // We use structured results now

    return NextResponse.json({
      success: true,
      query,
      results: merged,
      total: merged.length,
      research: researchText,
      dbCount: dbResults.length,
      aiCount: aiResults.length,
      searchedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Legal research error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function searchDatabase(
  query: string,
  jurisdiction?: string,
  category?: string,
  yearFrom?: string,
  yearTo?: string,
  limit = 20
): Promise<CaseResult[]> {
  try {
    const supabase = getSupabaseClient()

    // Try full-text search first
    let dbQuery = supabase
      .from('legal_cases')
      .select('id, case_title, citation, court, year, category, subject_matter, holding, ratio_decidendi, outcome, is_landmark')

    // Full-text search
    const searchTerms = query.split(/\s+/).filter(t => t.length > 2).join(' & ')
    if (searchTerms) {
      dbQuery = dbQuery.textSearch('search_vector', searchTerms, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Filters
    if (jurisdiction && jurisdiction !== 'All Courts') {
      dbQuery = dbQuery.ilike('court', `%${jurisdiction.replace('of Nigeria', '').trim()}%`)
    }
    if (category && category !== 'All Categories') {
      dbQuery = dbQuery.ilike('category', `%${category.replace(/\s+/g, '_').toLowerCase()}%`)
    }
    if (yearFrom) dbQuery = dbQuery.gte('year', parseInt(yearFrom))
    if (yearTo) dbQuery = dbQuery.lte('year', parseInt(yearTo))

    const { data: cases, error } = await dbQuery
      .order('year', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('DB search error:', error.message)
      // If full-text search fails (e.g. no search_vector column), try ilike fallback
      const { data: fallbackCases, error: fbErr } = await supabase
        .from('legal_cases')
        .select('id, case_title, citation, court, year, category, subject_matter, holding, ratio_decidendi, outcome, is_landmark')
        .or(`case_title.ilike.%${query}%,holding.ilike.%${query}%,ratio_decidendi.ilike.%${query}%`)
        .order('year', { ascending: false })
        .limit(limit)

      if (fbErr || !fallbackCases?.length) {
        return getFallbackCases(query)
      }
      return fallbackCases.map(mapDbCase)
    }

    if (!cases?.length) {
      // Try ilike fallback if full-text returned nothing
      const { data: fallbackCases } = await supabase
        .from('legal_cases')
        .select('id, case_title, citation, court, year, category, subject_matter, holding, ratio_decidendi, outcome, is_landmark')
        .or(`case_title.ilike.%${query}%,holding.ilike.%${query}%,ratio_decidendi.ilike.%${query}%`)
        .order('year', { ascending: false })
        .limit(limit)

      if (fallbackCases?.length) return fallbackCases.map(mapDbCase)
      return getFallbackCases(query)
    }

    return cases.map(mapDbCase)
  } catch (err) {
    console.error('DB search failed:', err)
    return getFallbackCases(query)
  }
}

function mapDbCase(c: Record<string, unknown>): CaseResult {
  return {
    id: `db-${c.id}`,
    title: (c.case_title as string) || 'Untitled',
    citation: (c.citation as string) || '',
    court: (c.court as string) || '',
    year: (c.year as number) || 0,
    summary: (c.holding as string) || (c.ratio_decidendi as string) || '',
    relevance: 95,
    keyPrinciples: [
      c.ratio_decidendi as string,
      ...(Array.isArray(c.subject_matter) ? (c.subject_matter as string[]).map((s: string) => `Subject: ${s}`) : []),
    ].filter(Boolean),
    source: 'database',
    category: (c.category as string) || undefined,
    isLandmark: (c.is_landmark as boolean) || false,
  }
}

async function searchWithAI(query: string, jurisdiction?: string, limit = 10): Promise<CaseResult[]> {
  if (!GROK_API_KEY) return []

  try {
    const grokRes = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian legal research AI. Return ONLY a JSON array of case objects. No markdown, no explanation — just the JSON array. Each object must have these fields:
  { "title": "Case Name v. Party", "citation": "[YEAR] CITATION", "court": "Court Name", "year": 2000, "summary": "Brief summary of facts and decision", "keyPrinciples": ["Principle 1", "Principle 2"], "category": "contract_law", "isLandmark": false }
  Return up to ${limit} real Nigerian cases. Use actual case citations. If you cannot find real cases, return fewer results rather than fake ones.`
          },
          {
            role: 'user',
            content: `Find Nigerian ${jurisdiction && jurisdiction !== 'All Courts' ? jurisdiction : ''} cases about: "${query}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!grokRes.ok) return []

    const grokData = await grokRes.json()
    const content = grokData.choices?.[0]?.message?.content || ''

    // Parse JSON from AI response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.map((c: Record<string, unknown>, i: number) => ({
      id: `ai-${i}`,
      title: (c.title as string) || 'Unknown Case',
      citation: (c.citation as string) || '',
      court: (c.court as string) || '',
      year: (c.year as number) || 0,
      summary: (c.summary as string) || '',
      relevance: 80 - i, // AI results ranked lower
      keyPrinciples: Array.isArray(c.keyPrinciples) ? (c.keyPrinciples as string[]) : [],
      source: 'ai' as const,
      category: (c.category as string) || undefined,
      isLandmark: (c.isLandmark as boolean) || false,
    }))
  } catch (err) {
    console.error('AI search error:', err)
    return []
  }
}

function mergeResults(dbResults: CaseResult[], aiResults: CaseResult[], limit: number): CaseResult[] {
  const merged: CaseResult[] = [...dbResults]
  const existingTitles = new Set(dbResults.map(r => r.title.toLowerCase().replace(/\s+/g, '')))

  for (const aiCase of aiResults) {
    const normalized = aiCase.title.toLowerCase().replace(/\s+/g, '')
    // Skip duplicates
    if (existingTitles.has(normalized)) continue
    // Skip if citation matches
    if (aiCase.citation && dbResults.some(d => d.citation === aiCase.citation)) continue
    merged.push(aiCase)
    existingTitles.add(normalized)
  }

  return merged.slice(0, limit)
}

function getFallbackCases(query: string): CaseResult[] {
  const q = query.toLowerCase()
  const allCases: CaseResult[] = [
    {
      id: 'f-1', title: 'Madukolu v. Nkemdilim', citation: '[1962] 2 SCNLR 341',
      court: 'Supreme Court', year: 1962, relevance: 90, source: 'database',
      summary: 'A court is competent when: (1) it is properly constituted; (2) the subject matter is within its jurisdiction; (3) the case comes before it initiated by due process of law; and (4) any condition precedent has been fulfilled.',
      keyPrinciples: ['Court competence requires four conditions: proper constitution, subject matter jurisdiction, due process, and conditions precedent fulfilled.'],
      category: 'civil_procedure', isLandmark: true,
    },
    {
      id: 'f-2', title: 'Abacha v. Fawehinmi', citation: '[2000] 6 NWLR (Pt 660) 228',
      court: 'Supreme Court', year: 2000, relevance: 90, source: 'database',
      summary: 'The African Charter on Human and Peoples\' Rights, enacted into law, is part of Nigerian law and must be upheld by courts.',
      keyPrinciples: ['International treaties ratified and enacted become part of domestic law.', 'The African Charter is enforceable in Nigerian courts.'],
      category: 'constitutional_law', isLandmark: true,
    },
    {
      id: 'f-3', title: 'Savannah Bank v. Ajilo', citation: '[1989] 1 NWLR (Pt 97) 305',
      court: 'Supreme Court', year: 1989, relevance: 88, source: 'database',
      summary: 'Any alienation of a right of occupancy without the consent of the governor is null and void.',
      keyPrinciples: ['Under Section 22 of the Land Use Act 1978, any transaction without prior consent of the Governor is null and void ab initio.'],
      category: 'land_law', isLandmark: true,
    },
    {
      id: 'f-4', title: 'Ariori v. Elemo', citation: '[1983] 1 SCNLR 1',
      court: 'Supreme Court', year: 1983, relevance: 87, source: 'database',
      summary: 'Adverse possession for 12 years extinguishes the original owner\'s title under the Limitation Act.',
      keyPrinciples: ['Limitation period for recovery of land is 12 years.', 'Adverse possession extinguishes original owner title.'],
      category: 'land_law', isLandmark: true,
    },
    {
      id: 'f-5', title: 'Atiku v. INEC', citation: '[2007] 1 NWLR (Pt 1015) 1',
      court: 'Supreme Court', year: 2007, relevance: 85, source: 'database',
      summary: 'INEC has no power to disqualify a candidate. Only a court of law can disqualify a candidate from contesting an election.',
      keyPrinciples: ['Disqualification is exclusively a judicial function.', 'INEC role is administrative, not judicial.'],
      category: 'electoral_law', isLandmark: true,
    },
    {
      id: 'f-6', title: 'AG Federation v. AG Abia State', citation: '[2002] 6 NWLR (Pt 764) 542',
      court: 'Supreme Court', year: 2002, relevance: 84, source: 'database',
      summary: 'Natural resources in the continental shelf belong to the Federal Government. Littoral states do not have territory extending into the sea.',
      keyPrinciples: ['Natural resources in territorial waters belong to the Federation.', 'Derivation principle applies only onshore.'],
      category: 'constitutional_law', isLandmark: true,
    },
    {
      id: 'f-7', title: 'Amaechi v. INEC', citation: '[2008] 5 NWLR (Pt 1080) 227',
      court: 'Supreme Court', year: 2008, relevance: 83, source: 'database',
      summary: 'A candidate who won an election but was unlawfully substituted is entitled to the mandate. The court can declare the rightful winner.',
      keyPrinciples: ['Unlawful substitution of a winning candidate can be remedied by the court.'],
      category: 'electoral_law', isLandmark: true,
    },
    {
      id: 'f-8', title: 'Inec v. Musa', citation: '[2003] 3 NWLR (Pt 806) 72',
      court: 'Supreme Court', year: 2003, relevance: 82, source: 'database',
      summary: 'Pre-election matters must be determined before election. Courts have jurisdiction over intra-party disputes affecting nominations.',
      keyPrinciples: ['Pre-election matters are justiciable.', 'Courts have jurisdiction over party nomination disputes.'],
      category: 'electoral_law', isLandmark: true,
    },
    {
      id: 'f-9', title: 'Olafisoye v. FRN', citation: '[2004] 4 NWLR (Pt 864) 580',
      court: 'Supreme Court', year: 2004, relevance: 81, source: 'database',
      summary: 'The Corrupt Practices Act is constitutional. The ICPC has powers to investigate and prosecute corruption.',
      keyPrinciples: ['Anti-corruption laws are constitutional.', 'ICPC has valid powers of investigation and prosecution.'],
      category: 'criminal_law', isLandmark: true,
    },
    {
      id: 'f-10', title: 'Adegoke Motors v. Adesanya', citation: '[1989] 3 NWLR (Pt 109) 250',
      court: 'Supreme Court', year: 1989, relevance: 80, source: 'database',
      summary: 'Locus standi requires sufficient interest in the matter. A person must show that their civil rights and obligations are affected.',
      keyPrinciples: ['Locus standi requires sufficient interest.', 'Civil rights and obligations must be directly affected.'],
      category: 'civil_procedure', isLandmark: true,
    },
  ]

  // Filter by query relevance
  if (!q) return allCases

  const scored = allCases.map(c => {
    let score = 0
    const fields = [c.title, c.citation, c.summary, c.category || '', ...c.keyPrinciples].join(' ').toLowerCase()
    const terms = q.split(/\s+/)
    for (const term of terms) {
      if (fields.includes(term)) score += 10
    }
    return { ...c, relevance: Math.min(99, c.relevance + score) }
  })

  return scored.sort((a, b) => b.relevance - a.relevance)
}
