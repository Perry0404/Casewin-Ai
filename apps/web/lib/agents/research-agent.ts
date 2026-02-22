/**
 * Autonomous Legal Research Agent
 */
import { BaseAgent, AgentThought } from './base-agent'
import { getMemoryManager } from './memory'

export interface ResearchPlan {
  objective: string
  steps: { id: string; description: string; expectedOutput: string; status: string }[]
  estimatedTime: string
}

export interface ResearchFinding {
  type: 'case' | 'statute' | 'doctrine' | 'commentary'
  title: string
  citation?: string
  relevance: number
  summary: string
  keyPoints: string[]
  source: string
}

export interface ResearchReport {
  query: string
  executiveSummary: string
  findings: ResearchFinding[]
  analysis: string
  recommendations: string[]
  citations: string[]
  confidence: number
  researchPlan: ResearchPlan
  thoughts: AgentThought[]
  generatedAt: Date
  researchTime: number
}

export class AutonomousResearchAgent extends BaseAgent {
  private memory = getMemoryManager()

  constructor() {
    super({
      name: 'CaseWin Research Agent',
      role: 'Autonomous Legal Research Specialist',
      goal: 'Conduct comprehensive legal research and provide actionable insights',
      backstory: 'The most advanced legal research AI in Nigeria, trained on Nigerian case law.',
      tools: [],
      maxIterations: 15,
      verbose: true
    })
  }

  async initialize() {
    await super.initialize()
    await this.memory.initialize()
  }

  async research(query: string, options: {
    depth?: 'quick' | 'standard' | 'comprehensive'
    jurisdiction?: string[]
    yearRange?: { from: number; to: number }
    userId?: string
  } = {}): Promise<ResearchReport> {
    const startTime = Date.now()
    const { depth = 'standard', userId } = options

    this.memory.addTurn('user', `Research request: ${query}`)

    const plan = await this.createResearchPlan(query, depth)
    const { result, thoughts } = await this.run(`Research: ${query}\nDepth: ${depth}`)
    
    const findings = this.parseFindings(result)
    const executiveSummary = result.split('\n')[0] || 'Research completed'
    const citations = this.extractCitations(result)

    this.memory.addTurn('assistant', executiveSummary)

    return {
      query,
      executiveSummary,
      findings,
      analysis: result,
      recommendations: this.extractRecommendations(result),
      citations,
      confidence: 0.75 + (thoughts.length * 0.02),
      researchPlan: plan,
      thoughts,
      generatedAt: new Date(),
      researchTime: Date.now() - startTime
    }
  }

  private async createResearchPlan(query: string, depth: string): Promise<ResearchPlan> {
    return {
      objective: query,
      steps: [
        { id: '1', description: 'Search relevant cases', expectedOutput: 'Case list', status: 'pending' },
        { id: '2', description: 'Identify statutes', expectedOutput: 'Statute refs', status: 'pending' },
        { id: '3', description: 'Analyze legal position', expectedOutput: 'Analysis', status: 'pending' },
        { id: '4', description: 'Synthesize findings', expectedOutput: 'Report', status: 'pending' }
      ],
      estimatedTime: depth === 'quick' ? '5s' : depth === 'standard' ? '15s' : '30s'
    }
  }

  private parseFindings(result: string): ResearchFinding[] {
    return [{
      type: 'case',
      title: 'Research findings',
      relevance: 0.8,
      summary: result.slice(0, 200),
      keyPoints: [],
      source: 'AI Analysis'
    }]
  }

  private extractCitations(text: string): string[] {
    const pattern = /\(\d{4}\)\s+LPELR-?\d+\([A-Z]+\)/g
    return text.match(pattern) || []
  }

  private extractRecommendations(text: string): string[] {
    return text.split('\n').filter(l => /^\d+\.|^-|^\*/.test(l.trim())).slice(0, 5)
  }
}

export function createResearchAgent(): AutonomousResearchAgent {
  return new AutonomousResearchAgent()
}

export default AutonomousResearchAgent
