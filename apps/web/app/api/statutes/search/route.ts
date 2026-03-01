import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/statutes/search?q=...&category=...&limit=20
 * Search Nigerian statutes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const supabase = getSupabaseClient()

    let dbQuery = supabase
      .from('legal_statutes')
      .select('*')
      .eq('is_active', true)

    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query.split(' ').join(' & '), {
        type: 'websearch',
        config: 'english'
      })
    }

    if (category) dbQuery = dbQuery.eq('category', category)

    const { data, error } = await dbQuery.limit(limit)

    if (error) {
      return NextResponse.json({ statutes: getMockStatutes(query), source: 'fallback' })
    }

    return NextResponse.json({ statutes: data || [], source: 'database' })
  } catch {
    return NextResponse.json({ statutes: getMockStatutes(''), source: 'fallback' })
  }
}

function getMockStatutes(query: string) {
  const statutes = [
    { id: '1', title: 'Constitution of the Federal Republic of Nigeria 1999', short_title: 'CFRN 1999', year: 1999, section: 'Section 36', content: 'Every person is entitled to a fair hearing within a reasonable time.', category: 'constitutional_law' },
    { id: '2', title: 'Land Use Act 1978', short_title: 'LUA', year: 1978, section: 'Section 22', content: 'No alienation of right of occupancy without Governor consent.', category: 'land_law' },
    { id: '3', title: 'Evidence Act 2011', short_title: 'EA 2011', year: 2011, section: 'Section 29', content: 'Confessional statements must be voluntary to be admissible.', category: 'evidence_law' },
    { id: '4', title: 'Companies and Allied Matters Act 2020', short_title: 'CAMA 2020', year: 2020, section: 'Section 42', content: 'A company shall be a body corporate with perpetual succession.', category: 'company_law' },
    { id: '5', title: 'Electoral Act 2022', short_title: 'Electoral Act', year: 2022, section: 'Section 29', content: 'Political parties must submit candidate lists 180 days before election.', category: 'electoral_law' },
    { id: '6', title: 'Administration of Criminal Justice Act 2015', short_title: 'ACJA', year: 2015, section: 'Section 293', content: 'A suspect shall be presumed innocent until proved guilty.', category: 'criminal_procedure' },
    { id: '7', title: 'Petroleum Industry Act 2021', short_title: 'PIA', year: 2021, section: 'Section 9', content: 'Establishes NUPRC and NMDPRA for petroleum regulation.', category: 'oil_and_gas' },
    { id: '8', title: 'Nigeria Data Protection Act 2023', short_title: 'NDPA', year: 2023, section: 'Section 24', content: 'Data controllers must process personal data lawfully, fairly and transparently.', category: 'data_protection' },
  ]

  if (!query) return statutes
  const q = query.toLowerCase()
  return statutes.filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q) || s.category.includes(q))
}
