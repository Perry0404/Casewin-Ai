/**
 * CaseWin AI Agent Framework
 * 
 * A sophisticated multi-agent system that makes CaseWin stand out:
 * - Chain-of-thought reasoning
 * - Tool usage and autonomous decision-making
 * - Self-verification and fact-checking
 * - Memory persistence across sessions
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

export class BaseAgent {
  protected config: AgentConfig
  protected memory: AgentMemory
  protected ollama: any
  protected model: string

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
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b'
  }

  async initialize() {
    const { Ollama } = await import('ollama')
    this.ollama = new Ollama({ 
      host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' 
    })
  }

  async run(task: string): Promise<{ result: string; thoughts: AgentThought[] }> {
    await this.initialize()
    
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

RESPONSE FORMAT:
Thought: [Your reasoning]
Action: [tool_name OR "final_answer"]
Action Input: [JSON parameters OR final response]

Previous reasoning:
${thoughtHistory || 'None'}

Current task: ${context}`

    const response = await this.ollama.generate({
      model: this.model,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: this.config.temperature }
    })

    return this.parseResponse(response.response)
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
      if (actionInputRaw) actionInput = JSON.parse(actionInputRaw)
    } catch {}

    return { thought, action, actionInput }
  }

  remember(key: string, value: any) { this.memory.longTerm.set(key, value) }
  recall(key: string): any { return this.memory.longTerm.get(key) }
  getReasoningChain(): string {
    return this.memory.episodic.map(t => `[Step ${t.step}] ${t.thought}`).join('\n')
  }
}
