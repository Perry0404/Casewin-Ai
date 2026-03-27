import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'

export async function POST(req: NextRequest) {
  try {
    const { query, jurisdiction, limit = 10 } = await req.json()

    // Generate embedding for the research query via Ollama REST API
    const embeddingRes = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: query }),
    })

    if (!embeddingRes.ok) {
      throw new Error(`Ollama embeddings returned ${embeddingRes.status}: ${await embeddingRes.text()}`)
    }

    const embeddingData = await embeddingRes.json()

    // Search Qdrant for relevant cases via REST API
    const qdrantBody: any = {
      vector: embeddingData.embedding,
      limit,
    }
    if (jurisdiction) {
      qdrantBody.filter = {
        must: [{ key: 'jurisdiction', match: { value: jurisdiction } }],
      }
    }

    const qdrantRes = await fetch(`${QDRANT_URL}/collections/nigerian_cases/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qdrantBody),
    })

    if (!qdrantRes.ok) {
      throw new Error(`Qdrant search returned ${qdrantRes.status}: ${await qdrantRes.text()}`)
    }

    const qdrantData = await qdrantRes.json()
    const searchResults = qdrantData.result || []

    const cases = searchResults.map((result: any) => ({
      case_name: result.payload?.case_name,
      citation: result.payload?.citation,
      court: result.payload?.court,
      year: result.payload?.year,
      summary: result.payload?.summary,
      key_holdings: result.payload?.key_holdings,
      relevance_score: result.score,
    }))

    return NextResponse.json({
      success: true,
      query,
      totalResults: cases.length,
      cases,
      searchedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Legal research error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
