import { NextRequest, NextResponse } from 'next/server'
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })

export async function POST(req: NextRequest) {
  try {
    const { contractText } = await req.json()

    const prompt = `You are a contract analysis expert specializing in Nigerian law.

Analyze the following contract for:
1. Legal risks and liabilities
2. Unfair or one-sided terms
3. Missing clauses (force majeure, dispute resolution, etc.)
4. Compliance with Nigerian contract law (CAMA 2020, Evidence Act, etc.)
5. Recommendations for improvement

Contract:
${contractText}

Provide a detailed analysis with a risk score (0-100).`

    const response = await ollama.generate({
      model: 'llama3.2:3b',
      prompt,
      stream: false,
    })

    // Extract risk score (simple regex parsing)
    const riskScoreMatch = response.response.match(/risk score[:\s]+(\d+)/i)
    const riskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50

    return NextResponse.json({
      success: true,
      analysis: response.response,
      riskScore,
      riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High',
      analyzedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Contract analysis error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
