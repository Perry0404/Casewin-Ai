import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const response = await callLLM([
      { role: 'system', content: 'You are a Nigerian legal document drafting expert. Draft professional legal documents following Nigerian legal standards, citing relevant Nigerian laws (CAMA 2020, Evidence Act 2011, etc.).' },
      { role: 'user', content: `Draft a ${body.documentType || 'legal document'} for ${body.parties || 'the parties'}.${body.jurisdiction ? ` Jurisdiction: ${body.jurisdiction}` : ' Jurisdiction: Nigeria'}${body.details ? `\nDetails: ${body.details}` : ''}` }
    ], 0.5)
    return NextResponse.json({ success: true, document: response })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
