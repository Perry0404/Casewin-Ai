/**
 * Autonomous Legal Research Agent (Serverless Compatible)
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'

export interface ResearchPlan {
  objective: string
  steps: {
    id: string
    description: string
    expectedOutput: string
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
  }[]
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
  constructor() {
    super({
      name: 'CaseWin Research Agent',
      role: 'Autonomous Legal Research Specialist',
      goal: 'Conduct comprehensive legal research and provide actionable insights',
      backstory: `You are the most advanced legal research AI in Nigeria. You understand Nigerian 
        law deeply - from constitutional principles to commercial law, from criminal procedure 
        to family law. You conduct research methodically, verify all citations, and provide 
        analysis that rivals senior advocates. You never make up cases or citations.`,
      tools: [],
      maxIterations: 10,
      verbose: true
    })
  }

  async initialize() {
    this.config.tools = this.buildTools()
  }

  async research(query: string, options: {
    depth?: 'quick' | 'standard' | 'comprehensive'
    jurisdiction?: string[]
    yearRange?: { from: number; to: number }
    userId?: string
  } = {}): Promise<ResearchReport> {
    const startTime = Date.now()
    const { depth = 'standard', jurisdiction = ['Nigeria'], yearRange } = options

    // Create research plan
    const plan = await this.createResearchPlan(query, depth)

    // Execute research
    const { result, thoughts } = await this.run(`
      Execute this research plan:
      
      QUERY: ${query}
      
      PLAN: ${plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}
      
      CONSTRAINTS:
      - Focus on Nigerian law
      - Only cite real cases and statutes
      - Depth: ${depth}
      - Jurisdictions: ${jurisdiction.join(', ')}
      ${yearRange ? `- Year range: ${yearRange.from}-${yearRange.to}` : ''}
    `)

    const findings = this.parseFindings(result, thoughts)
    const executiveSummary = await this.generateSummary(query, findings)
    const citations = this.extractAllCitations(result)
    const confidence = this.calculateResearchConfidence(findings, thoughts)

    return {
      query,
      executiveSummary,
      findings,
      analysis: result,
      recommendations: this.extractRecommendations(result),
      citations,
      confidence,
      researchPlan: plan,
      thoughts,
      generatedAt: new Date(),
      researchTime: Date.now() - startTime
    }
  }

  private async createResearchPlan(query: string, depth: string): Promise<ResearchPlan> {
    try {
      const response = await callLLM([
        {
          role: 'system',
          content: `Create a research plan as JSON: {"objective":"...","steps":[{"id":"1","description":"...","expectedOutput":"...","status":"pending"}],"estimatedTime":"..."}`
        },
        { role: 'user', content: `Research: ${query}, Depth: ${depth}` }
      ], 0.3)

      return JSON.parse(response)
    } catch {
      return {
        objective: query,
        steps: [
          { id: '1', description: 'Search for relevant cases', expectedOutput: 'Case list', status: 'pending' },
          { id: '2', description: 'Identify applicable statutes', expectedOutput: 'Statute references', status: 'pending' },
          { id: '3', description: 'Analyze legal position', expectedOutput: 'Analysis', status: 'pending' }
        ],
        estimatedTime: '15 seconds'
      }
    }
  }

  private buildTools(): AgentTool[] {
    return [
      {
        name: 'search_cases',
        description: 'Search Nigerian case law database',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => {
          return { results: [`Sample case result for: ${query}`], source: 'Nigerian Law Reports' }
        }
      },
      {
        name: 'search_statutes',
        description: 'Search Nigerian statutes and legislation',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => {
          return { results: [`Relevant statute for: ${query}`], source: 'Laws of Federation' }
        }
      },
      {
        name: 'final_answer',
        description: 'Provide final research findings',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  private parseFindings(result: string, thoughts: AgentThought[]): ResearchFinding[] {
    const findings: ResearchFinding[] = []
    
    // Extract case references
    const casePattern = /\[\d{4}\]\s+\d+\s+NWLR|LPELR-\d+/g
    const cases = result.match(casePattern) || []
    
    for (const caseRef of cases.slice(0, 5)) {
      findings.push({
        type: 'case',
        title: `Case ${caseRef}`,
        citation: caseRef,
        relevance: 0.8,
        summary: 'Relevant legal precedent',
        keyPoints: ['Key legal principle'],
        source: 'Nigerian Law Reports'
      })
    }

    if (findings.length === 0) {
      findings.push({
        type: 'doctrine',
        title: 'Legal Analysis',
        relevance: 0.9,
        summary: result.slice(0, 500),
        keyPoints: ['Based on Nigerian legal principles'],
        source: 'AI Analysis'
      })
    }

    return findings
  }

  private async generateSummary(query: string, findings: ResearchFinding[]): Promise<string> {
    try {
      return await callLLM([
        { role: 'system', content: 'Summarize legal research findings concisely in 2-3 sentences.' },
        { role: 'user', content: `Query: ${query}\nFindings: ${findings.map(f => f.summary).join('; ')}` }
      ], 0.3)
    } catch {
      return `Research completed for: ${query}. ${findings.length} findings identified.`
    }
  }

  private extractAllCitations(text: string): string[] {
    const patterns = [
      /\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g,
      /\(\d{4}\)\s+LPELR-\d+/g,
      /[A-Za-z]+\s+v\.\s+[A-Za-z\s]+\[\d{4}\]/g
    ]
    const citations: string[] = []
    for (const pattern of patterns) {
      citations.push(...(text.match(pattern) || []))
    }
    return [...new Set(citations)]
  }

  private calculateResearchConfidence(findings: ResearchFinding[], thoughts: AgentThought[]): number {
    let confidence = 0.5
    confidence += Math.min(findings.length * 0.1, 0.3)
    confidence += thoughts.length > 3 ? 0.1 : 0
    return Math.min(confidence, 0.95)
  }

  private extractRecommendations(text: string): string[] {
    const lines = text.split('\n')
    return lines
      .filter(l => /recommend|suggest|advise|should/i.test(l))
      .slice(0, 3)
      .map(l => l.trim())
  }
}

export function createResearchAgent(): AutonomousResearchAgent {
  return new AutonomousResearchAgent()
}
