import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt = 'Draft a ' + body.documentType + ' for ' + body.parties

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    })

    if (!ollamaRes.ok) {
      throw new Error(`Ollama returned ${ollamaRes.status}: ${await ollamaRes.text()}`)
    }

    const data = await ollamaRes.json()
    return NextResponse.json({ success: true, document: data.response })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
