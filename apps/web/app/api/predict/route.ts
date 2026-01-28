import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'

export async function POST(req: NextRequest) {
  try {
    const { caseFacts, legalIssues, jurisdiction } = await req.json()

    // Mock similar cases (Qdrant not available)
    const similarCases = [
      {
        case_name: "Adeyemi v. The State",
        citation: "(2018) LPELR-45678(SC)",
        summary: "Supreme Court ruling on land ownership rights",
        similarity: 0.89
      },
      {
        case_name: "Okonkwo v. Federal Government",
        citation: "(2020) LPELR-51234(CA)",
        summary: "Court of Appeal decision on contractual obligations",
        similarity: 0.82
      }
    ]

    // Generate prediction using Llama 3.2
    const prompt = `You are a legal expert specializing in Nigerian case law.

Case Facts: ${caseFacts}
Legal Issues: ${legalIssues}
Jurisdiction: ${jurisdiction || 'Nigeria'}

Similar Cases:
${similarCases.map((c: any) => `- ${c.case_name} (${c.citation}): ${c.summary}`).join('\n')}

Based on the similar cases and Nigerian legal precedents, predict:
1. Likelihood of success (percentage)
2. Key factors influencing the outcome
3. Recommended legal strategy

Provide a detailed analysis.`

    const response = await ollama.generate({
      model: 'llama3.2:3b',
      prompt,
      stream: false,
    })

    return NextResponse.json({
      success: true,
      prediction: response.response,
      similarCases,
      metadata: {
        jurisdiction,
        analyzedAt: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('Case prediction error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
