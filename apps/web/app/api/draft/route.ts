import { NextRequest, NextResponse } from 'next/server'
import Ollama from 'ollama'

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })

export async function POST(req: NextRequest) {
  try {
    const { documentType, parties, clauses, jurisdiction } = await req.json()

    const prompt = `You are a legal document drafting assistant specializing in Nigerian law.

Draft a ${documentType} with the following details:
- Parties: ${JSON.stringify(parties)}
- Clauses: ${JSON.stringify(clauses)}
- Jurisdiction: ${jurisdiction || 'Federal Republic of Nigeria'}

Use formal legal language, proper formatting, and ensure compliance with Nigerian law.
Include all necessary clauses (force majeure, dispute resolution, governing law, etc.).`

    const response = await ollama.generate({
      model: 'llama3.2:3b',
      prompt,
      stream: false,
    })

    return NextResponse.json({
      success: true,
      document: response.response,
      metadata: {
        documentType,
        jurisdiction,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('Document drafting error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
