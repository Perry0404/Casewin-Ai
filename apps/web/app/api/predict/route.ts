import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { caseFacts, legalIssues, jurisdiction } = await req.json()

    const response = await callLLM([
      { role: 'system', content: 'You are a Nigerian legal prediction expert. Analyze case outcomes based on Nigerian precedents, statutes, and judicial patterns. Provide win probability, key factors, similar cases with proper Nigerian citations (NWLR, LPELR, SC, CA), and recommended strategy. Return structured analysis.' },
      { role: 'user', content: `Case Facts: ${caseFacts}\nLegal Issues: ${legalIssues}\nJurisdiction: ${jurisdiction || 'Nigeria'}\n\nProvide:\n1. Likelihood of success (percentage)\n2. Key factors affecting outcome\n3. Similar Nigerian cases with citations\n4. Recommended legal strategy\n5. Potential risks and how to mitigate them` }
    ], 0.5)

    return NextResponse.json({ success: true, prediction: response, metadata: { jurisdiction, analyzedAt: new Date().toISOString() } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
