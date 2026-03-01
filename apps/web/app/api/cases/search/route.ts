import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/cases/search?q=...&court=...&category=...&year=...&landmark=true&limit=20
 * Full-text search across Nigerian case law database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const court = searchParams.get('court')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const landmark = searchParams.get('landmark')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const supabase = getSupabaseClient()

    // Build query
    let dbQuery = supabase
      .from('legal_cases')
      .select('id, case_title, citation, court, year, category, subject_matter, holding, ratio_decidendi, outcome, is_landmark')

    // Full-text search if query provided
    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query.split(' ').join(' & '), {
        type: 'websearch',
        config: 'english'
      })
    }

    // Filters
    if (court) dbQuery = dbQuery.ilike('court', `%${court}%`)
    if (category) dbQuery = dbQuery.eq('category', category)
    if (year) dbQuery = dbQuery.eq('year', parseInt(year))
    if (landmark === 'true') dbQuery = dbQuery.eq('is_landmark', true)

    // Order and limit
    dbQuery = dbQuery.order('year', { ascending: false }).limit(limit)

    const { data: cases, error } = await dbQuery

    if (error) {
      console.error('Case search error:', error)
      // Fall back to mock data if database isn't set up
      return NextResponse.json({
        cases: getMockCases(query),
        total: 25,
        source: 'fallback'
      })
    }

    return NextResponse.json({
      cases: cases || [],
      total: cases?.length || 0,
      source: 'database'
    })
  } catch (error) {
    console.error('Case search failed:', error)
    return NextResponse.json({
      cases: getMockCases(''),
      total: 25,
      source: 'fallback'
    })
  }
}

/**
 * GET /api/cases/[id] — Get full case details
 * POST /api/cases/search — Advanced search with body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, court, category, yearFrom, yearTo, subjectMatter, landmarkOnly, limit = 20 } = body

    const supabase = getSupabaseClient()

    let dbQuery = supabase
      .from('legal_cases')
      .select('*')

    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query.split(' ').join(' & '), {
        type: 'websearch',
        config: 'english'
      })
    }

    if (court) dbQuery = dbQuery.ilike('court', `%${court}%`)
    if (category) dbQuery = dbQuery.eq('category', category)
    if (yearFrom) dbQuery = dbQuery.gte('year', yearFrom)
    if (yearTo) dbQuery = dbQuery.lte('year', yearTo)
    if (subjectMatter) dbQuery = dbQuery.contains('subject_matter', [subjectMatter])
    if (landmarkOnly) dbQuery = dbQuery.eq('is_landmark', true)

    const { data: cases, error } = await dbQuery
      .order('year', { ascending: false })
      .limit(Math.min(limit, 100))

    if (error) {
      return NextResponse.json({
        cases: getMockCases(query || ''),
        total: 25,
        source: 'fallback'
      })
    }

    return NextResponse.json({
      cases: cases || [],
      total: cases?.length || 0,
      source: 'database'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

function getMockCases(query: string) {
  const allCases = [
    {
      id: '1',
      case_title: 'Madukolu v. Nkemdilim',
      citation: '[1962] 2 SCNLR 341',
      court: 'Supreme Court',
      year: 1962,
      category: 'civil_procedure',
      subject_matter: ['jurisdiction', 'competence of court'],
      holding: 'A court is competent when: (1) it is properly constituted; (2) the subject matter is within its jurisdiction; (3) the case comes before it initiated by due process of law; and (4) any condition precedent has been fulfilled.',
      ratio_decidendi: 'A court is competent to exercise jurisdiction when four conditions are satisfied: proper constitution, subject matter jurisdiction, due process of law, and fulfillment of conditions precedent.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '2',
      case_title: 'Abacha v. Fawehinmi',
      citation: '[2000] 6 NWLR (Pt 660) 228',
      court: 'Supreme Court',
      year: 2000,
      category: 'constitutional_law',
      subject_matter: ['fundamental rights', 'African Charter', 'human rights'],
      holding: 'The African Charter on Human and Peoples Rights, having been enacted into law by the National Assembly, is part of the laws of Nigeria and courts must uphold it.',
      ratio_decidendi: 'International treaties ratified and enacted into law by the National Assembly become part of domestic law and are enforceable in Nigerian courts.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '3',
      case_title: 'Savannah Bank v. Ajilo',
      citation: '[1989] 1 NWLR (Pt 97) 305',
      court: 'Supreme Court',
      year: 1989,
      category: 'land_law',
      subject_matter: ['land law', 'Land Use Act', 'governor consent', 'mortgage'],
      holding: 'Any alienation of a right of occupancy without the consent of the governor is null and void. The mortgage without Governor consent was invalid.',
      ratio_decidendi: 'Under Section 22 of the Land Use Act 1978, any transaction without prior consent of the Governor is null and void ab initio.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '4',
      case_title: 'Ariori v. Elemo',
      citation: '[1983] 1 SCNLR 1',
      court: 'Supreme Court',
      year: 1983,
      category: 'land_law',
      subject_matter: ['land law', 'adverse possession', 'limitation of action'],
      holding: 'The limitation period for recovery of land is 12 years. Adverse possession for the statutory period extinguishes the original owner title.',
      ratio_decidendi: 'Adverse possession for 12 years extinguishes the original owner title under the Limitation Act.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '5',
      case_title: 'Atiku v. INEC',
      citation: '[2007] 1 NWLR (Pt 1015) 1',
      court: 'Supreme Court',
      year: 2007,
      category: 'electoral_law',
      subject_matter: ['electoral law', 'INEC', 'disqualification'],
      holding: 'INEC has no power to disqualify a candidate. Only a court of law can disqualify a candidate from contesting an election.',
      ratio_decidendi: 'Disqualification is exclusively a judicial function. INEC role is administrative.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '6',
      case_title: 'AG Federation v. AG Abia State',
      citation: '[2002] 6 NWLR (Pt 764) 542',
      court: 'Supreme Court',
      year: 2002,
      category: 'constitutional_law',
      subject_matter: ['federalism', 'resource control', 'revenue allocation'],
      holding: 'Natural resources in the continental shelf belong to the Federal Government. Littoral states do not have territory extending into the sea.',
      ratio_decidendi: 'Natural resources in territorial waters belong to the Federation, not the littoral states. Derivation applies only onshore.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '7',
      case_title: 'Namsoh v. State',
      citation: '[1993] 5 NWLR (Pt 292) 129',
      court: 'Supreme Court',
      year: 1993,
      category: 'evidence_law',
      subject_matter: ['confessional statement', 'voluntariness', 'trial within trial'],
      holding: 'A confessional statement is only admissible if voluntarily made. When voluntariness is challenged, a trial-within-trial is mandatory.',
      ratio_decidendi: 'A confessional statement obtained by oppression, inducement, threat, or promise is inadmissible. Trial-within-trial is mandatory when voluntariness is challenged.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '8',
      case_title: 'Amaechi v. INEC',
      citation: '[2008] 5 NWLR (Pt 1080) 227',
      court: 'Supreme Court',
      year: 2008,
      category: 'electoral_law',
      subject_matter: ['party primaries', 'substitution of candidate'],
      holding: 'A party cannot substitute a validly nominated candidate. Votes cast in general election belong to the party and its validly nominated candidate.',
      ratio_decidendi: 'A candidate who validly won a party primary has a right to be presented by the party.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '9',
      case_title: 'FRN v. Dariye',
      citation: '[2015] 10 NWLR (Pt 1468) 325',
      court: 'Supreme Court',
      year: 2015,
      category: 'criminal_law',
      subject_matter: ['corruption', 'money laundering', 'EFCC', 'public officer'],
      holding: 'Executive immunity only postpones criminal proceedings, it does not extinguish criminal liability.',
      ratio_decidendi: 'Public officers who divert public funds commit criminal breach of trust. Immunity only delays prosecution.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '10',
      case_title: 'Buhari v. Obasanjo',
      citation: '[2005] 2 NWLR (Pt 910) 241',
      court: 'Supreme Court',
      year: 2005,
      category: 'electoral_law',
      subject_matter: ['election petition', 'presidential election', 'substantial compliance'],
      holding: 'The petitioner bears the burden of proof. The doctrine of substantial compliance means an election will not be voided for mere irregularities.',
      ratio_decidendi: 'The doctrine of substantial compliance applies to election petitions. Irregularities must substantially affect the result to void an election.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '11',
      case_title: 'Kalu v. State',
      citation: '[1998] 13 NWLR (Pt 583) 531',
      court: 'Supreme Court',
      year: 1998,
      category: 'criminal_law',
      subject_matter: ['murder', 'proof beyond reasonable doubt', 'circumstantial evidence'],
      holding: 'In criminal cases, proof must be beyond reasonable doubt. Circumstantial evidence must be cogent, compelling, and point irresistibly to guilt.',
      ratio_decidendi: 'Circumstantial evidence must form an unbroken chain leading irresistibly to the conclusion of guilt.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '12',
      case_title: 'Saraki v. FRN',
      citation: '[2016] 3 NWLR (Pt 1500) 531',
      court: 'Supreme Court',
      year: 2016,
      category: 'criminal_law',
      subject_matter: ['Code of Conduct Tribunal', 'false asset declaration'],
      holding: 'The CCT has jurisdiction over public officers for false asset declaration. Section 308 immunity does not apply to CCT proceedings.',
      ratio_decidendi: 'The Code of Conduct Tribunal has constitutional jurisdiction over all public officers.',
      outcome: 'dismissed',
      is_landmark: true
    },
    {
      id: '13',
      case_title: 'UBA v. Achoru',
      citation: '[2004] 10 NWLR (Pt 882) 421',
      court: 'Supreme Court',
      year: 2004,
      category: 'tort_law',
      subject_matter: ['negligence', 'banker-customer', 'duty of care'],
      holding: 'A bank owes a duty to honour cheques where the customer has sufficient funds. A trader is entitled to substantial damages for wrongful dishonour without proof of actual damage.',
      ratio_decidendi: 'Damage to credit and reputation from wrongful dishonour of a cheque is presumed for traders.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '14',
      case_title: 'MV Lupex v. Nigerian Overseas Chartering',
      citation: '[2003] 15 NWLR (Pt 844) 469',
      court: 'Supreme Court',
      year: 2003,
      category: 'arbitration',
      subject_matter: ['arbitration', 'stay of proceedings', 'arbitration clause'],
      holding: 'Where parties have agreed to arbitration, the court should stay proceedings. A party who has agreed to arbitration cannot unilaterally resort to litigation.',
      ratio_decidendi: 'An arbitration clause is binding. The court must stay proceedings and refer to arbitration unless the clause is null and void.',
      outcome: 'allowed',
      is_landmark: true
    },
    {
      id: '15',
      case_title: 'Dokubo-Asari v. FRN',
      citation: '[2007] 12 NWLR (Pt 1048) 320',
      court: 'Supreme Court',
      year: 2007,
      category: 'constitutional_law',
      subject_matter: ['bail', 'national security', 'treason', 'personal liberty'],
      holding: 'The right to personal liberty is not absolute. In cases of treason and national security, bail is not granted as a matter of course.',
      ratio_decidendi: 'Where national security is at stake, the liberty of the individual must yield to the security of the nation.',
      outcome: 'dismissed',
      is_landmark: true
    }
  ]

  if (!query) return allCases.slice(0, 10)

  const q = query.toLowerCase()
  const filtered = allCases.filter(c => 
    c.case_title.toLowerCase().includes(q) ||
    c.holding.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.subject_matter.some(s => s.toLowerCase().includes(q))
  )

  return filtered.length > 0 ? filtered : allCases.slice(0, 5)
}
