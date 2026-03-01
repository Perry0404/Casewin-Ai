// CaseWin AI Agent Framework - Serverless Edition
// Uses xAI Grok API (no local dependencies)

export { BaseAgent, callLLM } from './base-agent';
export { MemoryManager, getMemoryManager } from './memory';
export { VerificationLayer } from './verification';
export { ResearchAgent } from './research-agent';
export { AgentCrew } from './crew';
export {
  PredictionMarketAgent,
  type MarketAnalysis,
  type PredictionResult
} from './prediction-agent';
