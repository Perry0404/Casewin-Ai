import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { QdrantClient } = await import('@qdrant/js-client-rest')
  const { Ollama } = await import('ollama')
  
  const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' })
  const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })
  
  try {
    const { query, jurisdiction, limit = 10 } = await req.json()

    // Generate embedding for the research query
    const embeddingResponse = await ollama.embeddings({
      model: 'llama3.2:3b',
      prompt: query,
    })

    // Search Qdrant for relevant cases
    const searchResults = await qdrant.search('nigerian_cases', {
      vector: embeddingResponse.embedding,
      limit,
      filter: jurisdiction ? {
        must: [{ key: 'jurisdiction', match: { value: jurisdiction } }]
      } : undefined,
    })

    const cases = searchResults.map((result: any) => ({
      case_name: result.payload.case_name,
      citation: result.payload.citation,
      court: result.payload.court,
      year: result.payload.year,
      summary: result.payload.summary,
      key_holdings: result.payload.key_holdings,
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
