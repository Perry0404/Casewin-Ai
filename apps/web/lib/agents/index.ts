// CaseWin AI Agent Framework - Serverless Edition
// Uses xAI Grok 4 API (no local dependencies)

export { BaseAgent, callLLM } from './base-agent';
export { MemoryManager, getMemoryManager } from './memory';
export { VerificationLayer, getVerificationLayer } from './verification';
export { AutonomousResearchAgent, createResearchAgent } from './research-agent';
export type { ResearchPlan, ResearchFinding, ResearchReport } from './research-agent';
export { AgentCrew } from './crew';
export { PredictionMarketAgent } from './prediction-agent';
export type { MarketAnalysis } from './prediction-agent';
