/**
 * CaseWin AI Agent Framework (Serverless Compatible)
 * 
 * Uses xAI/OpenAI API instead of Ollama for serverless deployment
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

async function callLLM(messages: { role: string; content: string }[], temperature: number = 0.7): Promise<string> {
  const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY
  const baseUrl = process.env.XAI_API_KEY 
    ? 'https://api.x.ai/v1'
    : 'https://api.openai.com/v1'
  const model = process.env.XAI_API_KEY ? 'grok-beta' : 'gpt-4-turbo-preview'
  
  if (!apiKey) {
    throw new Error('No API key configured. Set XAI_API_KEY or OPENAI_API_KEY.')
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export class BaseAgent {
  protected config: AgentConfig
  protected memory: AgentMemory

  constructor(config: AgentConfig) {
    this.config = {
      maxIterations: 10,
      verbose: true,
      temperature: 0.7,
      ...config
    }
    this.memory = {
      shortTerm: [],
      longTerm: new Map(),
      episodic: []
    }
  }

  async initialize() {
    // No initialization needed for serverless
  }

  async run(task: string): Promise<{ result: string; thoughts: AgentThought[] }> {
    const thoughts: AgentThought[] = []
    let currentContext = task
    let finalAnswer = ''
    let iteration = 0

    while (iteration < this.config.maxIterations!) {
      iteration++

      const { thought, action, actionInput, finalResponse } = await this.think(currentContext, thoughts)
      
      const agentThought: AgentThought = {
        step: iteration,
        thought,
        action,
        actionInput,
        timestamp: new Date()
      }

      if (finalResponse) {
        agentThought.observation = 'Task completed'
        thoughts.push(agentThought)
        finalAnswer = finalResponse
        break
      }

      if (action) {
        const tool = this.config.tools.find(t => t.name === action)
        if (tool) {
          try {
            const result = await tool.execute(actionInput)
            agentThought.observation = JSON.stringify(result, null, 2)
            currentContext = `${currentContext}\n\nPrevious action: ${action}\nResult: ${agentThought.observation}`
          } catch (error: any) {
            agentThought.observation = `Error: ${error.message}`
          }
        } else {
          agentThought.observation = `Tool "${action}" not found`
        }
      }

      thoughts.push(agentThought)
      this.memory.episodic.push(agentThought)

      if (this.config.verbose) {
        console.log(`[${this.config.name}] Step ${iteration}:`, thought)
      }
    }

    return { result: finalAnswer, thoughts }
  }

  protected async think(context: string, previousThoughts: AgentThought[]) {
    const toolDescriptions = this.config.tools.map(t => 
      `- ${t.name}: ${t.description}`
    ).join('\n')

    const thoughtHistory = previousThoughts.map(t =>
      `Step ${t.step}:\nThought: ${t.thought}\nAction: ${t.action || 'None'}\nObservation: ${t.observation || 'None'}`
    ).join('\n\n')

    const systemPrompt = `You are ${this.config.name}, ${this.config.role}.

GOAL: ${this.config.goal}

BACKSTORY: ${this.config.backstory}

You have access to these tools:
${toolDescriptions}

IMPORTANT INSTRUCTIONS:
1. Think step-by-step before taking any action
2. Use tools to gather information before giving final answers
3. Verify facts by cross-referencing multiple sources
4. If uncertain, use tools to research more
5. Always cite Nigerian legal sources when applicable

RESPONSE FORMAT (use exactly this format):
Thought: [Your reasoning about what to do next]
Action: [tool_name OR "final_answer"]
Action Input: [JSON parameters for tool OR your final response]

Previous reasoning:
${thoughtHistory || 'None - this is the first step'}

Current task: ${context}`

    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Continue with the task.' }
    ], this.config.temperature)

    return this.parseResponse(response)
  }

  protected parseResponse(response: string): {
    thought: string
    action?: string
    actionInput?: any
    finalResponse?: string
  } {
    const thoughtMatch = response.match(/Thought:\s*(.+?)(?=Action:|$)/s)
    const actionMatch = response.match(/Action:\s*(.+?)(?=Action Input:|$)/s)
    const actionInputMatch = response.match(/Action Input:\s*(.+?)$/s)

    const thought = thoughtMatch?.[1]?.trim() || response
    const action = actionMatch?.[1]?.trim()
    const actionInputRaw = actionInputMatch?.[1]?.trim()

    if (action?.toLowerCase() === 'final_answer' || action?.toLowerCase() === 'final answer') {
      return { thought, finalResponse: actionInputRaw }
    }

    let actionInput = actionInputRaw
    try {
      if (actionInputRaw) {
        actionInput = JSON.parse(actionInputRaw)
      }
    } catch {
      // Keep as string if not valid JSON
    }

    return { thought, action, actionInput }
  }

  remember(key: string, value: any) {
    this.memory.longTerm.set(key, value)
  }

  recall(key: string): any {
    return this.memory.longTerm.get(key)
  }

  getReasoningChain(): string {
    return this.memory.episodic.map(t => 
      `[Step ${t.step}] ${t.thought}`
    ).join('\n')
  }
}

export { callLLM }
