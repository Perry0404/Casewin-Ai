import OpenAI from 'openai'

// xAI uses OpenAI-compatible API
export const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
})

export const XAI_MODEL = 'grok-4'

export async function generateWithXAI(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  messages.push({ role: 'user', content: prompt })

  const completion = await xai.chat.completions.create({
    model: XAI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  })

  return completion.choices[0]?.message?.content || ''
}
