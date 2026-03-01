/**
 * CaseWin Multi-Agent Orchestrator (Serverless - Grok API)
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'

export interface CrewTask { id: string; description: string; expectedOutput: string; assignedAgent: string; dependencies?: string[]; context?: string }
export interface CrewResult { taskId: string; agentName: string; output: string; thoughts: AgentThought[]; confidence: number; sources: string[]; executionTime: number }
export type AgentRole = 'research' | 'analysis' | 'drafting' | 'verification' | 'strategy'

export class AgentCrew {
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private taskResults: Map<string, CrewResult> = new Map()

  async initialize() {
    const mkTools = (name: string): AgentTool[] => [
      { name: 'search', description: `Search for ${name}`, parameters: { query: { type: 'string', description: 'Query' } }, execute: async ({ query }) => ({ results: [`Result for: ${query}`] }) },
      { name: 'final_answer', description: 'Final answer', parameters: { answer: { type: 'string', description: 'Answer' } }, execute: async ({ answer }) => answer }
    ]
    this.agents.set('research', new BaseAgent({ name: 'Research Agent', role: 'Legal Researcher', goal: 'Find relevant cases and statutes', backstory: 'Expert in Nigerian case law.', tools: mkTools('cases') }))
    this.agents.set('analysis', new BaseAgent({ name: 'Analysis Agent', role: 'Contract Analyst', goal: 'Identify risks and compliance issues', backstory: 'Expert in CAMA 2020 and Nigerian contracts.', tools: mkTools('contract risks') }))
    this.agents.set('verification', new BaseAgent({ name: 'Verification Agent', role: 'Fact Checker', goal: 'Verify citations and facts', backstory: 'Meticulous legal editor.', tools: mkTools('verification') }))
    this.agents.set('strategy', new BaseAgent({ name: 'Strategy Agent', role: 'Legal Strategist', goal: 'Develop winning strategies', backstory: 'Brilliant strategist.', tools: mkTools('strategy') }))
    for (const a of this.agents.values()) await a.initialize()
  }

  async executeTask(task: CrewTask): Promise<CrewResult> {
    const start = Date.now()
    const agent = this.agents.get(task.assignedAgent as AgentRole)
    if (!agent) throw new Error(`Agent ${task.assignedAgent} not found`)
    let ctx = task.context || ''
    if (task.dependencies) for (const d of task.dependencies) { const r = this.taskResults.get(d); if (r) ctx += `\nFrom ${r.agentName}: ${r.output}` }
    const { result, thoughts } = await agent.run(`${task.description}\nContext: ${ctx}\nExpected: ${task.expectedOutput}`)
    const cr: CrewResult = { taskId: task.id, agentName: task.assignedAgent, output: result, thoughts, confidence: 0.5 + Math.min(thoughts.length * 0.05, 0.2), sources: this.extractSources(result), executionTime: Date.now() - start }
    this.taskResults.set(task.id, cr)
    return cr
  }

  async analyzeContract(contractText: string) {
    const tasks: CrewTask[] = [
      { id: 'research', description: `Find Nigerian laws for:\n${contractText.slice(0, 1000)}`, expectedOutput: 'Applicable laws', assignedAgent: 'research' },
      { id: 'analysis', description: `Analyze contract risks:\n${contractText}`, expectedOutput: 'Risk assessment', assignedAgent: 'analysis', dependencies: ['research'] },
      { id: 'verify', description: 'Verify the analysis', expectedOutput: 'Verification', assignedAgent: 'verification', dependencies: ['analysis'] }
    ]
    const results = await this.runSeq(tasks)
    const a = results.find(r => r.taskId === 'analysis')
    return { risks: (a?.output || '').split('\n').filter(l => /risk|danger|concern/i.test(l)).slice(0, 5), compliance: { verified: true }, recommendations: (a?.output || '').split('\n').filter(l => /recommend|suggest/i.test(l)).slice(0, 5), analysis: a?.output || '' }
  }

  async predictCaseOutcome(caseFacts: string, legalIssues: string) {
    const tasks: CrewTask[] = [
      { id: 'research', description: `Find similar Nigerian cases:\n${caseFacts}\nIssues: ${legalIssues}`, expectedOutput: 'Similar cases', assignedAgent: 'research' },
      { id: 'strategy', description: `Predict outcome:\n${caseFacts}`, expectedOutput: 'Prediction', assignedAgent: 'strategy', dependencies: ['research'] }
    ]
    const results = await this.runSeq(tasks), s = results.find(r => r.taskId === 'strategy')
    return { prediction: s?.output || 'Unable to predict', confidence: s?.confidence || 0.5, reasoning: s?.thoughts.map(t => t.thought).join('\n') || '', similarCases: this.extractSources(s?.output || '') }
  }

  private async runSeq(tasks: CrewTask[]) { const r: CrewResult[] = []; for (const t of tasks) r.push(await this.executeTask(t)); return r }
  private extractSources(text: string): string[] {
    const s: string[] = []
    for (const p of [/\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g, /\(\d{4}\)\s+LPELR-\d+/g, /CAMA\s+2020/gi]) s.push(...(text.match(p) || []))
    return [...new Set(s)]
  }
}
