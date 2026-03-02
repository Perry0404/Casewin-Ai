import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })

    const messages = [
      { role: 'system' as const, content: `You are CaseWin AI, an expert Nigerian legal assistant. You have deep knowledge of:
- Nigerian Constitution 1999 (as amended)
- All Nigerian statutes (CAMA 2020, Criminal Code, Penal Code, Evidence Act 2011, etc.)
- Nigerian case law from Supreme Court, Court of Appeal, Federal High Court, State High Courts
- Nigerian court procedures and rules
- Legal practice in Nigeria (NBA rules, RPC, Legal Practitioners Act)
- Land Use Act, Labour Act, Matrimonial Causes Act, Child Rights Act

Rules:
1. Always cite specific sections, cases, or statutes when answering legal questions
2. Clarify that you provide legal information, not legal advice
3. If a question is outside Nigerian law, say so
4. Be conversational but professional
5. Use Nigerian legal terminology (e.g., "learned silk" for SAN, "my Lord" for judges)
6. Format responses with clear headings and numbered points when helpful` },
      ...(history || []).slice(-10).map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message }
    ]

    const response = await callLLM(messages, 0.7)

    return NextResponse.json({ success: true, response, timestamp: new Date().toISOString() })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
