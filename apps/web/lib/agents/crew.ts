/**
 * CaseWin Multi-Agent Orchestrator (CrewAI-style)
 */
import { BaseAgent, AgentConfig, AgentTool, AgentThought } from './base-agent'

export interface CrewTask {
  id: string
  description: string
  expectedOutput: string
  assignedAgent: string
  dependencies?: string[]
  context?: string
}

export interface CrewResult {
  taskId: string
  agentName: string
  output: string
  thoughts: AgentThought[]
  confidence: number
  sources: string[]
  executionTime: number
}

export type AgentRole = 'research' | 'analysis' | 'drafting' | 'verification' | 'strategy'

export class AgentCrew {
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private taskResults: Map<string, CrewResult> = new Map()
  private verbose: boolean

  constructor(verbose = true) {
    this.verbose = verbose
  }

  async initialize() {
    this.agents.set('research', new BaseAgent({
      name: 'Research Agent',
      role: 'Senior Legal Researcher specializing in Nigerian case law',
      goal: 'Find relevant cases, statutes, and legal precedents',
      backstory: 'Expert legal researcher with 20 years experience in Nigerian law.',
      tools: []
    }))

    this.agents.set('analysis', new BaseAgent({
      name: 'Analysis Agent',
      role: 'Senior Contract Analyst and Legal Risk Assessor',
      goal: 'Identify risks, loopholes, and compliance issues',
      backstory: 'Seasoned contract lawyer with expertise in CAMA 2020 and Nigerian regulations.',
      tools: []
    }))

    this.agents.set('verification', new BaseAgent({
      name: 'Verification Agent',
      role: 'Legal Fact-Checker and Quality Assurance',
      goal: 'Verify accuracy of citations, facts, and legal reasoning',
      backstory: 'Meticulous legal editor who verifies every citation.',
      tools: []
    }))

    this.agents.set('strategy', new BaseAgent({
      name: 'Strategy Agent',
      role: 'Senior Legal Strategist',
      goal: 'Develop winning legal strategies based on case analysis',
      backstory: 'Brilliant legal strategist who has advised on landmark Nigerian cases.',
      tools: []
    }))

    for (const agent of this.agents.values()) {
      await agent.initialize()
    }
  }

  async analyzeContract(contractText: string): Promise<{
    analysis: string
    risks: string[]
    recommendations: string[]
    confidence: number
  }> {
    const agent = this.agents.get('analysis')!
    const { result, thoughts } = await agent.run(`Analyze this contract for risks:\n\n${contractText}`)
    
    return {
      analysis: result,
      risks: this.extractRisks(result),
      recommendations: this.extractRecommendations(result),
      confidence: this.calculateConfidence(thoughts)
    }
  }

  async predictCaseOutcome(caseFacts: string, legalIssues: string): Promise<{
    prediction: string
    likelihood: number
    supportingCases: string[]
    strategy: string
    confidence: number
  }> {
    const researchAgent = this.agents.get('research')!
    const strategyAgent = this.agents.get('strategy')!
    
    const research = await researchAgent.run(`Find similar Nigerian cases for:\nFacts: ${caseFacts}\nIssues: ${legalIssues}`)
    const strategy = await strategyAgent.run(`Develop strategy based on:\n${research.result}`)
    
    return {
      prediction: research.result,
      likelihood: 0.7,
      supportingCases: [],
      strategy: strategy.result,
      confidence: 0.75
    }
  }

  async researchAndVerify(query: string): Promise<{
    research: string
    verification: string
    confidence: number
    sources: string[]
  }> {
    const researchAgent = this.agents.get('research')!
    const verifyAgent = this.agents.get('verification')!
    
    const research = await researchAgent.run(query)
    const verify = await verifyAgent.run(`Verify this research:\n${research.result}`)
    
    return {
      research: research.result,
      verification: verify.result,
      confidence: 0.8,
      sources: []
    }
  }

  private calculateConfidence(thoughts: AgentThought[]): number {
    return Math.min(0.5 + thoughts.length * 0.05, 0.95)
  }

  private extractRisks(text: string): string[] {
    const lines = text.split('\n').filter(l => l.includes('risk') || l.includes('Risk'))
    return lines.slice(0, 5)
  }

  private extractRecommendations(text: string): string[] {
    const lines = text.split('\n').filter(l => /^\d+\.|^-|^\*/.test(l.trim()))
    return lines.map(l => l.replace(/^\d+\.\s*|^[-*]\s*/, '').trim()).slice(0, 5)
  }
}

export default AgentCrew
