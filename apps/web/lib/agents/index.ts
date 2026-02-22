/**
 * CaseWin AI Agent Framework - Exports
 */
export { BaseAgent } from './base-agent'
export type { AgentTool, AgentThought, AgentMemory, AgentConfig } from './base-agent'
export { AgentCrew } from './crew'
export type { CrewTask, CrewResult, AgentRole } from './crew'
export { AutonomousResearchAgent, createResearchAgent } from './research-agent'
export type { ResearchPlan, ResearchFinding, ResearchReport } from './research-agent'
export { MemoryManager, getMemoryManager } from './memory'
export type { Memory, ConversationTurn } from './memory'
export { VerificationLayer, getVerificationLayer } from './verification'
export type { VerificationResult, VerificationIssue, Correction, CitationCheck } from './verification'

export async function researchWithVerification(query: string) {
  const { createResearchAgent } = await import('./research-agent')
  const { getVerificationLayer } = await import('./verification')
  const agent = createResearchAgent()
  await agent.initialize()
  const report = await agent.research(query)
  const verifier = getVerificationLayer()
  const verification = await verifier.verify(report.analysis, 'research')
  return { ...report, verification }
}

export async function analyzeContractWithAgents(contractText: string) {
  const { AgentCrew } = await import('./crew')
  const { getVerificationLayer } = await import('./verification')
  const crew = new AgentCrew()
  await crew.initialize()
  const analysis = await crew.analyzeContract(contractText)
  const verifier = getVerificationLayer()
  const verification = await verifier.verify(analysis.analysis, 'analysis')
  return { ...analysis, verification }
}

export async function predictCaseWithAgents(caseFacts: string, legalIssues: string) {
  const { AgentCrew } = await import('./crew')
  const crew = new AgentCrew()
  await crew.initialize()
  return await crew.predictCaseOutcome(caseFacts, legalIssues)
}
