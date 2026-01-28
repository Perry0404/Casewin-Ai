import { NextRequest, NextResponse } from 'next/server'
import { Ollama } from 'ollama'

export async function GET(req: NextRequest) {
  try {
    const ollama = new Ollama({ host: 'http://localhost:11434' })
    
    const response = await ollama.generate({
      model: 'llama3.2:3b',
      prompt: 'Say hello',
      stream: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Ollama is working!',
      response: response.response
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
