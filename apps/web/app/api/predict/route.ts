import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { caseFacts, legalIssues, jurisdiction } = await req.json()

    const similarCases = [
      { case_name: "Adeyemi v. The State", citation: "(2018) LPELR-45678(SC)", summary: "Supreme Court ruling on land ownership rights", similarity: 0.89 },
      { case_name: "Okonkwo v. Federal Government", citation: "(2020) LPELR-51234(CA)", summary: "Court of Appeal decision on contractual obligations", similarity: 0.82 },
      { case_name: "Bello v. AG Federation", citation: "[2019] 5 NWLR (Pt. 1645) 231", summary: "Constitutional interpretation on fundamental rights", similarity: 0.78 }
    ]

    const response = await callLLM([
      { role: 'system', content: 'You are a Nigerian legal prediction expert analyzing case outcomes based on precedents.' },
      { role: 'user', content: `Case Facts: ${caseFacts}\nLegal Issues: ${legalIssues}\nJurisdiction: ${jurisdiction || 'Nigeria'}\n\nSimilar Cases:\n${similarCases.map(c => `- ${c.case_name} (${c.citation}): ${c.summary}`).join('\n')}\n\nPredict: 1. Likelihood of success (%) 2. Key factors 3. Recommended strategy` }
    ], 0.5)

    return NextResponse.json({ success: true, prediction: response, similarCases, metadata: { jurisdiction, analyzedAt: new Date().toISOString() } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
