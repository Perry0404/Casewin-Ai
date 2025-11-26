import { NextRequest, NextResponse } from 'next/server'
import Ollama from 'ollama'
import { QdrantClient } from '@qdrant/js-client-rest'

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' })

export async function POST(req: NextRequest) {
  try {
    const { caseFacts, legalIssues, jurisdiction } = await req.json()

    // Generate embedding for semantic search
    const embeddingResponse = await ollama.embeddings({
      model: 'llama3.2:3b',
      prompt: `${caseFacts} ${legalIssues}`,
    })

    // Search similar cases in Qdrant
    const searchResults = await qdrant.search('nigerian_cases', {
      vector: embeddingResponse.embedding,
      limit: 5,
    })

    const similarCases = searchResults.map((result: any) => ({
      case_name: result.payload.case_name,
      citation: result.payload.citation,
      summary: result.payload.summary,
      similarity: result.score,
    }))

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
