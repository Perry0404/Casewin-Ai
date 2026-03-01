/**
 * Autonomous Legal Research Agent (Serverless - Grok API)
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'

export interface ResearchPlan { objective: string; steps: { id: string; description: string; expectedOutput: string; status: 'pending' | 'in-progress' | 'completed' | 'failed' }[]; estimatedTime: string }
export interface ResearchFinding { type: 'case' | 'statute' | 'doctrine' | 'commentary'; title: string; citation?: string; relevance: number; summary: string; keyPoints: string[]; source: string }
export interface ResearchReport { query: string; executiveSummary: string; findings: ResearchFinding[]; analysis: string; recommendations: string[]; citations: string[]; confidence: number; researchPlan: ResearchPlan; thoughts: AgentThought[]; generatedAt: Date; researchTime: number }

export class AutonomousResearchAgent extends BaseAgent {
  constructor() {
    super({ name: 'CaseWin Research Agent', role: 'Senior Legal Researcher (Nigerian Law)', goal: 'Find relevant cases, statutes, and precedents', backstory: 'Expert legal researcher with deep Nigerian law knowledge.', tools: [], maxIterations: 8 })
  }

  async initialize() { this.config.tools = this.buildTools() }

  async research(query: string, options: { depth?: 'quick' | 'standard' | 'comprehensive'; jurisdiction?: string[]; yearRange?: { from: number; to: number }; userId?: string } = {}): Promise<ResearchReport> {
    const start = Date.now(), { depth = 'standard', jurisdiction = ['Nigeria'], yearRange } = options
    const plan = await this.createPlan(query, depth)
    const { result, thoughts } = await this.run(`Research: ${query}\nPlan: ${plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}\nDepth: ${depth}\nJurisdiction: ${jurisdiction.join(', ')}${yearRange ? `\nYears: ${yearRange.from}-${yearRange.to}` : ''}`)
    const findings = this.parseFindings(result)
    const summary = await this.genSummary(query, findings)
    return { query, executiveSummary: summary, findings, analysis: result, recommendations: result.split('\n').filter(l => /recommend|suggest|advise|should/i.test(l)).slice(0, 3).map(l => l.trim()), citations: this.extractCites(result), confidence: 0.5 + Math.min(findings.length * 0.1, 0.3) + (thoughts.length > 3 ? 0.1 : 0), researchPlan: plan, thoughts, generatedAt: new Date(), researchTime: Date.now() - start }
  }

  private async createPlan(query: string, depth: string): Promise<ResearchPlan> {
    try {
      const r = await callLLM([{ role: 'system', content: 'Create a research plan as JSON: {"objective":"...","steps":[{"id":"1","description":"...","expectedOutput":"...","status":"pending"}],"estimatedTime":"..."}' }, { role: 'user', content: `Research: ${query}, Depth: ${depth}` }], 0.3)
      return JSON.parse(r)
    } catch {
      return { objective: query, steps: [{ id: '1', description: 'Search relevant cases', expectedOutput: 'Case list', status: 'pending' }, { id: '2', description: 'Identify statutes', expectedOutput: 'Statute refs', status: 'pending' }, { id: '3', description: 'Analyze legal position', expectedOutput: 'Analysis', status: 'pending' }], estimatedTime: '15s' }
    }
  }

  private buildTools(): AgentTool[] {
    return [
      { name: 'search_cases', description: 'Search Nigerian case law', parameters: { query: { type: 'string', description: 'Query' } }, execute: async ({ query }) => ({ results: [`Case result for: ${query}`], source: 'Nigerian Law Reports' }) },
      { name: 'search_statutes', description: 'Search Nigerian legislation', parameters: { query: { type: 'string', description: 'Query' } }, execute: async ({ query }) => ({ results: [`Statute for: ${query}`] }) },
      { name: 'final_answer', description: 'Provide final answer', parameters: { answer: { type: 'string', description: 'Answer' } }, execute: async ({ answer }) => answer }
    ]
  }

  private parseFindings(result: string): ResearchFinding[] {
    const findings: ResearchFinding[] = []
    const cases = result.match(/\[\d{4}\]\s+\d+\s+NWLR|LPELR-\d+/g) || []
    for (const c of cases.slice(0, 5)) findings.push({ type: 'case', title: `Case ${c}`, citation: c, relevance: 0.8, summary: 'Relevant precedent', keyPoints: ['Key principle'], source: 'Nigerian Law Reports' })
    if (!findings.length) findings.push({ type: 'doctrine', title: 'Legal Analysis', relevance: 0.9, summary: result.slice(0, 500), keyPoints: ['Based on Nigerian legal principles'], source: 'AI Analysis' })
    return findings
  }

  private async genSummary(query: string, findings: ResearchFinding[]) {
    try { return await callLLM([{ role: 'system', content: 'Summarize legal research in 2-3 sentences.' }, { role: 'user', content: `Query: ${query}\nFindings: ${findings.map(f => f.summary).join('; ')}` }], 0.3) }
    catch { return `Research completed for: ${query}. ${findings.length} findings identified.` }
  }

  private extractCites(text: string): string[] {
    const c: string[] = []
    for (const p of [/\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g, /\(\d{4}\)\s+LPELR-\d+/g]) c.push(...(text.match(p) || []))
    return [...new Set(c)]
  }
}

export function createResearchAgent() { return new AutonomousResearchAgent() }
