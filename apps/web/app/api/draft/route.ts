import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt = 'Draft a ' + body.documentType + ' for ' + body.parties
    
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false
    })
    
    return NextResponse.json({ success: true, document: res.data.response })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
