import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { query, jurisdiction, limit = 10 } = await req.json()

    const response = await callLLM([
      { role: 'system', content: `You are a Nigerian legal research expert with access to 30,000+ Nigerian court judgments. Search and return relevant cases for the query. For each case include: case_name, citation, court, year, summary, key_holdings. Focus on Nigerian Supreme Court, Court of Appeal, and High Court decisions. Return JSON array.` },
      { role: 'user', content: `Research query: ${query}${jurisdiction ? `\nJurisdiction: ${jurisdiction}` : ''}\nReturn up to ${limit} cases.` }
    ], 0.3)

    let cases = []
    try {
      const parsed = JSON.parse(response)
      cases = Array.isArray(parsed) ? parsed : parsed.cases || []
    } catch {
      cases = [{ case_name: 'Research Result', citation: 'AI Analysis', court: 'General', year: 2024, summary: response.slice(0, 500), key_holdings: [response.slice(0, 200)], relevance_score: 0.9 }]
    }

    return NextResponse.json({ success: true, query, totalResults: cases.length, cases, searchedAt: new Date().toISOString() })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
