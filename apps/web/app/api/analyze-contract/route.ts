import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { contractText } = await req.json()
    const response = await callLLM([
      { role: 'system', content: 'You are a contract analysis expert in Nigerian law. Analyze contracts for risks, unfair terms, missing clauses, and compliance with CAMA 2020, Evidence Act, etc. Include a risk score 0-100.' },
      { role: 'user', content: `Analyze this contract:\n${contractText}` }
    ], 0.3)

    const riskMatch = response.match(/risk score[:\s]+(\d+)/i)
    const riskScore = riskMatch ? parseInt(riskMatch[1]) : 50

    return NextResponse.json({ success: true, analysis: response, riskScore, riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High', analyzedAt: new Date().toISOString() })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
