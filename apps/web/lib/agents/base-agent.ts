/**
 * CaseWin AI Agent Framework (Serverless - Grok API)
 */

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean }>
  execute: (params: Record<string, any>) => Promise<any>
}

export interface AgentThought {
  step: number
  thought: string
  action?: string
  actionInput?: any
  observation?: string
  timestamp: Date
}

export interface AgentMemory {
  shortTerm: string[]
  longTerm: Map<string, any>
  episodic: AgentThought[]
}

export interface AgentConfig {
  name: string
  role: string
  goal: string
  backstory: string
  tools: AgentTool[]
  maxIterations?: number
  verbose?: boolean
  temperature?: number
}

export async function callLLM(
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('No API key. Set XAI_API_KEY or OPENAI_API_KEY.')
  const isXai = !!process.env.XAI_API_KEY
  const baseUrl = isXai ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1'
  const model = isXai ? 'grok-3' : 'gpt-4-turbo-preview'
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: 4000 }),
  })
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content
}

export class BaseAgent {
  protected config: AgentConfig
  protected memory: AgentMemory

  constructor(config: AgentConfig) {
    this.config = { maxIterations: 10, verbose: true, temperature: 0.7, ...config }
    this.memory = { shortTerm: [], longTerm: new Map(), episodic: [] }
  }

  async initialize() {}

  async run(task: string): Promise<{ result: string; thoughts: AgentThought[] }> {
    const thoughts: AgentThought[] = []
    let ctx = task, finalAnswer = '', i = 0
    while (i < this.config.maxIterations!) {
      i++
      const { thought, action, actionInput, finalResponse } = await this.think(ctx, thoughts)
      const t: AgentThought = { step: i, thought, action, actionInput, timestamp: new Date() }
      if (finalResponse) { t.observation = 'Done'; thoughts.push(t); finalAnswer = finalResponse; break }
      if (action) {
        const tool = this.config.tools.find(x => x.name === action)
        if (tool) {
          try { const r = await tool.execute(actionInput); t.observation = JSON.stringify(r).slice(0, 2000); ctx += `\nAction: ${action}\nResult: ${t.observation}` }
          catch (e: any) { t.observation = `Error: ${e.message}` }
        } else { t.observation = `Tool "${action}" not found` }
      }
      thoughts.push(t); this.memory.episodic.push(t)
    }
    return { result: finalAnswer || 'Analysis complete.', thoughts }
  }

  protected async think(context: string, prev: AgentThought[]) {
    const tools = this.config.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')
    const hist = prev.map(t => `Step ${t.step}: ${t.thought}\nAction: ${t.action || 'None'}\nObs: ${t.observation || 'None'}`).join('\n')
    const sys = `You are ${this.config.name}, ${this.config.role}.\nGOAL: ${this.config.goal}\nBACKSTORY: ${this.config.backstory}\n\nTools:\n${tools}\n\nFormat:\nThought: [reasoning]\nAction: [tool_name OR "final_answer"]\nAction Input: [params or final response]\n\nPrevious:\n${hist || 'None'}\n\nTask: ${context}`
    const response = await callLLM([{ role: 'system', content: sys }, { role: 'user', content: 'Continue.' }], this.config.temperature)
    return this.parseResponse(response)
  }

  protected parseResponse(response: string) {
    const thought = response.match(/Thought:\s*(.+?)(?=Action:|$)/s)?.[1]?.trim() || response
    const action = response.match(/Action:\s*(.+?)(?=Action Input:|$)/s)?.[1]?.trim()
    const raw = response.match(/Action Input:\s*(.+?)$/s)?.[1]?.trim()
    if (action?.toLowerCase().includes('final_answer') || action?.toLowerCase().includes('final answer'))
      return { thought, finalResponse: raw }
    let actionInput: any = raw
    try { if (raw) actionInput = JSON.parse(raw) } catch {}
    return { thought, action, actionInput }
  }

  remember(key: string, value: any) { this.memory.longTerm.set(key, value) }
  recall(key: string) { return this.memory.longTerm.get(key) }
  getReasoningChain() { return this.memory.episodic.map(t => `[${t.step}] ${t.thought}`).join('\n') }
}
