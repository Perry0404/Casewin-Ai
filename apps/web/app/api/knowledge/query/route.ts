import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

// POST /api/knowledge/query — Search firm's knowledge base with AI
export async function POST(req: NextRequest) {
  try {
    const { firmId, query } = await req.json()

    if (!firmId || !query) {
      return NextResponse.json({ error: 'firmId and query required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Search for relevant chunks using text matching
    const searchTerms = query.split(/\s+/).filter((t: string) => t.length > 2)
    const { data: chunks, error } = await supabase
      .from('firm_knowledge')
      .select('chunk_text, document_name, document_type')
      .eq('firm_id', firmId)
      .or(searchTerms.map((t: string) => `chunk_text.ilike.%${t}%`).join(','))
      .limit(10)

    if (error) {
      console.error('Knowledge search error:', error)
    }

    const context = chunks?.map(c => `[${c.document_name}]: ${c.chunk_text}`).join('\n\n') || ''

    if (!GROK_API_KEY) {
      return NextResponse.json({
        success: true,
        answer: context ? `Based on your documents:\n\n${context}` : 'No relevant documents found. Upload documents to your knowledge base first.',
        sources: chunks?.map(c => c.document_name) || [],
      })
    }

    // Use AI to synthesize answer from chunks
    const grokRes = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian legal AI assistant with access to this firm's private knowledge base. Answer the question using ONLY the provided document context. If the context doesn't contain relevant information, say so clearly. Always cite which document the information comes from.

FIRM KNOWLEDGE BASE CONTEXT:
${context || 'No documents found in the knowledge base.'}`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    })

    if (!grokRes.ok) {
      return NextResponse.json({
        success: true,
        answer: context || 'No relevant documents found.',
        sources: chunks?.map(c => c.document_name) || [],
      })
    }

    const grokData = await grokRes.json()
    const answer = grokData.choices?.[0]?.message?.content || 'No answer generated'

    return NextResponse.json({
      success: true,
      answer,
      sources: [...new Set(chunks?.map(c => c.document_name) || [])],
      chunksUsed: chunks?.length || 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
