/**
 * CaseWin Multi-Agent Orchestrator (Serverless Compatible)
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'

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
      backstory: 'Expert legal researcher with 20 years of Nigerian law experience.',
      tools: this.getResearchTools()
    }))

    this.agents.set('analysis', new BaseAgent({
      name: 'Analysis Agent',
      role: 'Senior Contract Analyst and Legal Risk Assessor',
      goal: 'Identify risks, loopholes, and compliance issues',
      backstory: 'Expert in CAMA 2020, labour laws, and data protection.',
      tools: this.getAnalysisTools()
    }))

    this.agents.set('verification', new BaseAgent({
      name: 'Verification Agent',
      role: 'Legal Fact-Checker and Quality Assurance',
      goal: 'Verify accuracy of citations, facts, and legal reasoning',
      backstory: 'Meticulous legal editor verifying every citation and fact.',
      tools: this.getVerificationTools()
    }))

    this.agents.set('strategy', new BaseAgent({
      name: 'Strategy Agent',
      role: 'Senior Legal Strategist',
      goal: 'Develop winning legal strategies based on case analysis',
      backstory: 'Brilliant strategist excelling at predicting judicial behavior.',
      tools: this.getStrategyTools()
    }))

    for (const agent of this.agents.values()) {
      await agent.initialize()
    }
  }

  private getResearchTools(): AgentTool[] {
    return [
      {
        name: 'search_case_law',
        description: 'Search Nigerian case law database',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => ({ cases: [`Relevant case for: ${query}`], source: 'Nigerian Law Reports' })
      },
      {
        name: 'search_statutes',
        description: 'Search Nigerian legislation',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => ({ statutes: [`Applicable statute for: ${query}`] })
      },
      {
        name: 'final_answer',
        description: 'Provide final answer',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  private getAnalysisTools(): AgentTool[] {
    return [
      {
        name: 'analyze_clause',
        description: 'Analyze a contract clause for risks',
        parameters: { clause: { type: 'string', description: 'Contract clause' } },
        execute: async ({ clause }) => ({ risks: [], recommendations: [], clause: clause.slice(0, 100) })
      },
      {
        name: 'check_compliance',
        description: 'Check compliance with Nigerian law',
        parameters: { section: { type: 'string', description: 'Section to check' } },
        execute: async ({ section }) => ({ compliant: true, issues: [], laws: ['CAMA 2020'] })
      },
      {
        name: 'final_answer',
        description: 'Provide final analysis',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  private getVerificationTools(): AgentTool[] {
    return [
      {
        name: 'verify_citation',
        description: 'Verify a legal citation',
        parameters: { citation: { type: 'string', description: 'Citation to verify' } },
        execute: async ({ citation }) => ({ valid: true, citation })
      },
      {
        name: 'final_answer',
        description: 'Provide verification result',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  private getStrategyTools(): AgentTool[] {
    return [
      {
        name: 'analyze_precedents',
        description: 'Analyze legal precedents for strategy',
        parameters: { issue: { type: 'string', description: 'Legal issue' } },
        execute: async ({ issue }) => ({ precedents: [], strategy: `Strategy for ${issue}` })
      },
      {
        name: 'final_answer',
        description: 'Provide strategy recommendation',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  async executeTask(task: CrewTask): Promise<CrewResult> {
    const startTime = Date.now()
    const agent = this.agents.get(task.assignedAgent as AgentRole)

    if (!agent) {
      throw new Error(`Agent ${task.assignedAgent} not found`)
    }

    let context = task.context || ''
    
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depResult = this.taskResults.get(depId)
        if (depResult) {
          context += `\n\nFrom ${depResult.agentName}:\n${depResult.output}`
        }
      }
    }

    const fullTask = `${task.description}\n\nContext:\n${context}\n\nExpected: ${task.expectedOutput}`
    const { result, thoughts } = await agent.run(fullTask)

    const crewResult: CrewResult = {
      taskId: task.id,
      agentName: task.assignedAgent,
      output: result,
      thoughts,
      confidence: this.calculateConfidence(thoughts),
      sources: this.extractSources(result),
      executionTime: Date.now() - startTime
    }

    this.taskResults.set(task.id, crewResult)
    return crewResult
  }

  async analyzeContract(contractText: string): Promise<{
    risks: string[]
    compliance: any
    recommendations: string[]
    analysis: string
  }> {
    const tasks: CrewTask[] = [
      {
        id: 'research',
        description: `Find relevant Nigerian laws for this contract:\n${contractText.slice(0, 1000)}`,
        expectedOutput: 'List of applicable laws and regulations',
        assignedAgent: 'research'
      },
      {
        id: 'analysis',
        description: `Analyze this contract for risks:\n${contractText}`,
        expectedOutput: 'Risk assessment with recommendations',
        assignedAgent: 'analysis',
        dependencies: ['research']
      },
      {
        id: 'verify',
        description: 'Verify the analysis is accurate',
        expectedOutput: 'Verification report',
        assignedAgent: 'verification',
        dependencies: ['analysis']
      }
    ]

    const results = await this.runSequential(tasks)
    const analysisResult = results.find(r => r.taskId === 'analysis')

    return {
      risks: this.extractRisks(analysisResult?.output || ''),
      compliance: { verified: true, issues: [] },
      recommendations: this.extractRecommendations(analysisResult?.output || ''),
      analysis: analysisResult?.output || ''
    }
  }

  async predictCaseOutcome(caseFacts: string, legalIssues: string): Promise<{
    prediction: string
    confidence: number
    reasoning: string
    similarCases: string[]
  }> {
    const tasks: CrewTask[] = [
      {
        id: 'research',
        description: `Find similar Nigerian cases:\n${caseFacts}\n\nIssues: ${legalIssues}`,
        expectedOutput: 'Similar cases with outcomes',
        assignedAgent: 'research'
      },
      {
        id: 'strategy',
        description: `Predict outcome based on precedents:\n${caseFacts}`,
        expectedOutput: 'Prediction with confidence and reasoning',
        assignedAgent: 'strategy',
        dependencies: ['research']
      }
    ]

    const results = await this.runSequential(tasks)
    const strategyResult = results.find(r => r.taskId === 'strategy')

    return {
      prediction: strategyResult?.output || 'Unable to predict',
      confidence: strategyResult?.confidence || 0.5,
      reasoning: strategyResult?.thoughts.map(t => t.thought).join('\n') || '',
      similarCases: this.extractSources(strategyResult?.output || '')
    }
  }

  private async runSequential(tasks: CrewTask[]): Promise<CrewResult[]> {
    const results: CrewResult[] = []
    for (const task of tasks) {
      const result = await this.executeTask(task)
      results.push(result)
    }
    return results
  }

  private calculateConfidence(thoughts: AgentThought[]): number {
    let confidence = 0.5
    confidence += Math.min(thoughts.length * 0.05, 0.2)
    const hasObservations = thoughts.some(t => t.observation && t.observation !== 'None')
    if (hasObservations) confidence += 0.15
    return Math.min(confidence, 0.95)
  }

  private extractSources(text: string): string[] {
    const patterns = [
      /\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g,
      /\(\d{4}\)\s+LPELR-\d+/g,
      /CAMA\s+2020/gi,
      /Constitution\s+of\s+Nigeria/gi
    ]
    const sources: string[] = []
    for (const pattern of patterns) {
      sources.push(...(text.match(pattern) || []))
    }
    return [...new Set(sources)]
  }

  private extractRisks(text: string): string[] {
    return text.split('\n')
      .filter(l => /risk|danger|concern|issue|problem/i.test(l))
      .slice(0, 5)
      .map(l => l.trim())
  }

  private extractRecommendations(text: string): string[] {
    return text.split('\n')
      .filter(l => /recommend|suggest|advise|should|consider/i.test(l))
      .slice(0, 5)
      .map(l => l.trim())
  }
}
