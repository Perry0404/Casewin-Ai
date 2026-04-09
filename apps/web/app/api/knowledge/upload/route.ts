import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

// POST /api/knowledge/upload — Upload document text for a firm
export async function POST(req: NextRequest) {
  try {
    const { firmId, userId, documentName, documentText, documentType } = await req.json()

    if (!firmId || !documentText) {
      return NextResponse.json({ error: 'firmId and documentText required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Store the document in chunks for retrieval
    const chunks = chunkText(documentText, 1000)

    const records = chunks.map((chunk, index) => ({
      firm_id: firmId,
      user_id: userId || '',
      document_name: documentName || 'Untitled',
      document_type: documentType || 'general',
      chunk_index: index,
      chunk_text: chunk,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('firm_knowledge')
      .insert(records)

    if (error) {
      console.error('Knowledge upload error:', error)
      return NextResponse.json({ error: 'Failed to store document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documentName,
      chunksStored: chunks.length,
      totalChars: documentText.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/knowledge/upload — List firm documents
export async function GET(req: NextRequest) {
  try {
    const firmId = req.nextUrl.searchParams.get('firmId')
    if (!firmId) {
      return NextResponse.json({ error: 'firmId required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('firm_knowledge')
      .select('document_name, document_type, created_at')
      .eq('firm_id', firmId)
      .eq('chunk_index', 0) // Only get first chunk to count documents
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ documents: [] })
    }

    return NextResponse.json({ documents: data || [] })
  } catch {
    return NextResponse.json({ documents: [] })
  }
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = current ? current + ' ' + sentence : sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks
}
