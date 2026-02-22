/**
 * CaseWin Prediction Market AI Agent
 */
import { BaseAgent, AgentTool, AgentThought } from './base-agent'
import { getMemoryManager } from './memory'

export interface MarketAnalysis {
  marketId: string
  marketTitle: string
  currentOdds: { yes: number; no: number }
  aiPrediction: { outcome: 'yes' | 'no' | 'uncertain'; confidence: number; reasoning: string }
  recommendation: { action: 'buy_yes' | 'buy_no' | 'hold' | 'avoid'; strength: 'strong' | 'moderate' | 'weak'; rationale: string }
  riskAssessment: { level: 'low' | 'medium' | 'high'; factors: string[] }
  supportingCases: CaseReference[]
  historicalPatterns: string[]
  keyFactors: string[]
  timeline: string
  updatedAt: Date
}

export interface CaseReference { name: string; citation: string; outcome: string; relevance: number; summary: string }
export interface JudicialPattern { judge: string; court: string; category: string; rulingTendency: string; sampleSize: number; confidence: number }
export interface LegislativeTrend { bill: string; chamber: string; stage: string; passageLikelihood: number; historicalComparison: string[] }

export class PredictionMarketAgent extends BaseAgent {
  private memory = getMemoryManager()

  constructor() {
    super({
      name: 'CaseWin Prediction Agent',
      role: 'Nigerian Legal Prediction Market Analyst',
      goal: 'Analyze legal markets and provide data-driven predictions',
      backstory: 'Expert analyst specializing in Nigerian legal outcomes with deep knowledge of Supreme Court, Court of Appeal, and National Assembly patterns.',
      tools: [],
      maxIterations: 12,
      verbose: true,
      temperature: 0.3
    })
  }

  async initialize() {
    await super.initialize()
    await this.memory.initialize()
  }

  async analyzeMarket(market: { id: string; title: string; description: string; category: string; deadline: string; yes_votes: number; no_votes: number; total_pool: number }): Promise<MarketAnalysis> {
    const totalVotes = market.yes_votes + market.no_votes
    const currentOdds = {
      yes: totalVotes > 0 ? Math.round((market.yes_votes / totalVotes) * 100) : 50,
      no: totalVotes > 0 ? Math.round((market.no_votes / totalVotes) * 100) : 50
    }

    const { result, thoughts } = await this.run(`Analyze Nigerian legal prediction market:
MARKET: ${market.title}
CATEGORY: ${market.category}
CURRENT ODDS: YES ${currentOdds.yes}% / NO ${currentOdds.no}%

Provide: prediction (YES/NO) with confidence %, key factors, historical precedents, trading recommendation.`)

    const aiPrediction = this.parsePrediction(result, thoughts)
    const recommendation = this.generateRecommendation(aiPrediction, currentOdds)

    await this.memory.remember(`Market: "${market.title}": ${aiPrediction.outcome} ${aiPrediction.confidence}%`, 'solution', { importance: 0.8 })

    return {
      marketId: market.id,
      marketTitle: market.title,
      currentOdds,
      aiPrediction,
      recommendation,
      riskAssessment: this.assessRisk(result, market.category),
      supportingCases: this.getMockCases(),
      historicalPatterns: this.extractPatterns(result),
      keyFactors: this.extractKeyFactors(result),
      timeline: this.estimateTimeline(market.deadline),
      updatedAt: new Date()
    }
  }

  async analyzeMultipleMarkets(markets: any[]): Promise<MarketAnalysis[]> {
    const results: MarketAnalysis[] = []
    for (const m of markets) results.push(await this.analyzeMarket(m))
    return results
  }

  async predictCaseOutcome(caseInfo: { caseName: string; court: string; legalIssues: string[]; parties: string; background: string }) {
    const { result, thoughts } = await this.run(`Predict outcome: ${caseInfo.caseName} in ${caseInfo.court}. Issues: ${caseInfo.legalIssues.join(', ')}`)
    return {
      prediction: this.extractOutcome(result),
      confidence: this.extractConfidence(result),
      reasoning: result,
      precedents: this.getMockCases(),
      timeline: this.extractTimeline(result)
    }
  }

  async findContrarianOpportunities(markets: any[]) {
    const opps = []
    for (const m of markets) {
      const analysis = await this.analyzeMarket(m)
      const marketOdds = analysis.aiPrediction.outcome === 'yes' ? analysis.currentOdds.yes : analysis.currentOdds.no
      const edge = analysis.aiPrediction.confidence - marketOdds
      opps.push({ market: m, analysis, opportunity: Math.abs(edge) > 25 ? 'strong_contrarian' : Math.abs(edge) > 10 ? 'moderate_contrarian' : 'aligned', potentialEdge: edge })
    }
    return opps.sort((a, b) => Math.abs(b.potentialEdge) - Math.abs(a.potentialEdge))
  }

  async analyzeJudicialPatterns(params: { court: string; category: string; judge?: string }): Promise<JudicialPattern[]> {
    return [{ judge: params.judge || 'Court overall', court: params.court, category: params.category, rulingTendency: 'Balanced', sampleSize: 100, confidence: 0.7 }]
  }

  private parsePrediction(result: string, thoughts: AgentThought[]): { outcome: 'yes' | 'no' | 'uncertain'; confidence: number; reasoning: string } {
    const lower = result.toLowerCase()
    let outcome: 'yes' | 'no' | 'uncertain' = 'uncertain'
    if (lower.includes('predict yes') || lower.includes('likely to pass')) outcome = 'yes'
    else if (lower.includes('predict no') || lower.includes('unlikely')) outcome = 'no'
    const confMatch = result.match(/(\d{1,3})\s*%/)
    let confidence = confMatch ? parseInt(confMatch[1]) : 50
    confidence = Math.min(confidence + thoughts.length * 2, 95)
    return { outcome, confidence, reasoning: result }
  }

  private generateRecommendation(pred: { outcome: string; confidence: number }, odds: { yes: number; no: number }) {
    if (pred.outcome === 'uncertain' || pred.confidence < 55) return { action: 'avoid' as const, strength: 'weak' as const, rationale: 'Insufficient confidence' }
    const marketOdds = pred.outcome === 'yes' ? odds.yes : odds.no
    const edge = pred.confidence - marketOdds
    if (edge > 20) return { action: (pred.outcome === 'yes' ? 'buy_yes' : 'buy_no') as 'buy_yes' | 'buy_no', strength: 'strong' as const, rationale: `Strong edge: ${edge}%` }
    if (edge > 10) return { action: (pred.outcome === 'yes' ? 'buy_yes' : 'buy_no') as 'buy_yes' | 'buy_no', strength: 'moderate' as const, rationale: `Moderate edge: ${edge}%` }
    return { action: 'hold' as const, strength: 'weak' as const, rationale: 'No significant edge' }
  }

  private assessRisk(result: string, category: string): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    const factors: string[] = []
    if (/uncertain|unclear/i.test(result)) factors.push('Outcome uncertain')
    if (/appeal/i.test(result)) factors.push('Appeals possible')
    if (/political/i.test(result)) factors.push('Political factors')
    return { level: factors.length >= 3 ? 'high' : factors.length >= 1 ? 'medium' : 'low', factors }
  }

  private extractKeyFactors(result: string): string[] {
    const numbered = result.match(/\d+\.\s*([^\n]+)/g) || []
    return numbered.map(p => p.replace(/^\d+\.\s*/, '').trim()).slice(0, 5)
  }

  private extractPatterns(result: string): string[] {
    const sentences = result.split(/[.!?]/)
    return sentences.filter(s => /historically|pattern|trend|typically/i.test(s)).slice(0, 3)
  }

  private estimateTimeline(deadline: string): string {
    const days = Math.floor((new Date(deadline).getTime() - Date.now()) / (1000*60*60*24))
    if (days < 0) return 'Ended'
    if (days < 7) return `${days} days`
    if (days < 30) return `${Math.floor(days/7)} weeks`
    return `${Math.floor(days/30)} months`
  }

  private extractOutcome(result: string): 'plaintiff' | 'defendant' | 'mixed' | 'uncertain' {
    const l = result.toLowerCase()
    if (l.includes('plaintiff') && l.includes('win')) return 'plaintiff'
    if (l.includes('defendant') && l.includes('win')) return 'defendant'
    return 'uncertain'
  }

  private extractConfidence(result: string): number {
    const m = result.match(/(\d{1,3})\s*%/)
    return m ? Math.min(parseInt(m[1]), 95) : 50
  }

  private extractTimeline(result: string): string {
    const m = result.match(/within\s+(\d+)\s+(month|year|week)/i)
    return m ? m[0] : 'Timeline uncertain'
  }

  private getMockCases(): CaseReference[] {
    return [
      { name: 'Savannah Bank v. Ajilo', citation: '(1989) LPELR-3043(SC)', outcome: 'Plaintiff', relevance: 0.85, summary: 'Contractual obligations' },
      { name: 'Attorney General v. Abubakar', citation: '(2007) LPELR-3063(SC)', outcome: 'Constitutional', relevance: 0.72, summary: 'Constitutional law' }
    ]
  }
}

export function createPredictionAgent(): PredictionMarketAgent { return new PredictionMarketAgent() }
export default PredictionMarketAgent
