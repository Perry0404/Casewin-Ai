/**
 * Prediction Market AI Agent (Serverless Compatible)
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'

export interface MarketAnalysis {
  marketId: string
  question: string
  currentYesPercent: number
  currentNoPercent: number
  aiPrediction: 'YES' | 'NO' | 'UNCERTAIN'
  aiConfidence: number
  recommendation: 'STRONG_YES' | 'LEAN_YES' | 'HOLD' | 'LEAN_NO' | 'STRONG_NO'
  reasoning: string
  keyFactors: string[]
  riskAssessment: { level: 'LOW' | 'MEDIUM' | 'HIGH'; factors: string[] }
  supportingCases: CaseReference[]
  relevantStatutes: string[]
  historicalPatterns: string[]
}

export interface CaseReference {
  citation: string
  outcome: string
  relevance: number
  keyPrinciple: string
}

export interface JudicialPattern {
  court: string
  pattern: string
  confidence: number
  cases: string[]
}

export interface LegislativeTrend {
  area: string
  trend: 'expanding' | 'contracting' | 'stable'
  recentChanges: string[]
  prediction: string
}

export class PredictionMarketAgent extends BaseAgent {
  constructor() {
    super({
      name: 'CaseWin Prediction Oracle',
      role: 'Legal Prediction Market Analyst',
      goal: 'Provide accurate predictions on Nigerian legal outcomes',
      backstory: `You are an expert legal analyst specializing in Nigerian law prediction markets. 
        You analyze judicial trends, legislative patterns, and historical outcomes to provide 
        data-driven predictions on legal matters.`,
      tools: [],
      maxIterations: 8,
      verbose: true
    })
  }

  async initialize() {
    this.config.tools = this.buildTools()
  }

  async analyzeMarket(market: {
    id: string
    question: string
    category: string
    currentYes: number
    currentNo: number
    endDate?: string
  }): Promise<MarketAnalysis> {
    const { result, thoughts } = await this.run(`
      Analyze this Nigerian legal prediction market:
      
      QUESTION: ${market.question}
      CATEGORY: ${market.category}
      CURRENT SENTIMENT: ${market.currentYes}% YES / ${market.currentNo}% NO
      ${market.endDate ? `RESOLVES: ${market.endDate}` : ''}
      
      Provide:
      1. Your prediction (YES/NO/UNCERTAIN)
      2. Confidence level (0-100%)
      3. Key factors influencing the outcome
      4. Relevant Nigerian cases
      5. Risk assessment
    `)

    const prediction = this.extractPrediction(result)
    const confidence = this.extractConfidence(result, thoughts)

    return {
      marketId: market.id,
      question: market.question,
      currentYesPercent: market.currentYes,
      currentNoPercent: market.currentNo,
      aiPrediction: prediction,
      aiConfidence: confidence,
      recommendation: this.generateRecommendation(prediction, confidence, market.currentYes),
      reasoning: result,
      keyFactors: this.extractKeyFactors(result),
      riskAssessment: this.assessRisk(result, confidence),
      supportingCases: this.extractCaseReferences(result),
      relevantStatutes: this.extractStatutes(result),
      historicalPatterns: this.extractPatterns(result)
    }
  }

  async predictCaseOutcome(caseFacts: string, jurisdiction: string, legalArea: string): Promise<{
    prediction: 'WIN' | 'LOSE' | 'UNCERTAIN'
    confidence: number
    reasoning: string
    similarCases: CaseReference[]
    judicialPatterns: JudicialPattern[]
  }> {
    const { result, thoughts } = await this.run(`
      Predict the outcome of this Nigerian legal case:
      
      FACTS: ${caseFacts}
      JURISDICTION: ${jurisdiction}
      LEGAL AREA: ${legalArea}
      
      Analyze similar precedents and judicial patterns.
    `)

    return {
      prediction: this.extractCasePrediction(result),
      confidence: this.extractConfidence(result, thoughts),
      reasoning: result,
      similarCases: this.extractCaseReferences(result),
      judicialPatterns: this.extractJudicialPatterns(result)
    }
  }

  async findContrarianOpportunities(markets: any[]): Promise<Array<{
    market: any
    aiVsCrowd: number
    opportunity: string
    confidence: number
  }>> {
    const opportunities: Array<{
      market: any
      aiVsCrowd: number
      opportunity: string
      confidence: number
    }> = []

    for (const market of markets.slice(0, 5)) {
      const analysis = await this.analyzeMarket(market)
      
      const crowdYes = market.currentYes
      const aiYes = analysis.aiPrediction === 'YES' ? analysis.aiConfidence : (100 - analysis.aiConfidence)
      const difference = Math.abs(aiYes - crowdYes)

      if (difference > 15) {
        opportunities.push({
          market,
          aiVsCrowd: aiYes - crowdYes,
          opportunity: aiYes > crowdYes ? 'AI more bullish than crowd' : 'AI more bearish than crowd',
          confidence: analysis.aiConfidence
        })
      }
    }

    return opportunities.sort((a, b) => Math.abs(b.aiVsCrowd) - Math.abs(a.aiVsCrowd))
  }

  async analyzeJudicialPatterns(jurisdiction: string, legalArea: string): Promise<{
    patterns: JudicialPattern[]
    trends: LegislativeTrend[]
    insights: string[]
  }> {
    const { result } = await this.run(`
      Analyze judicial patterns in Nigerian courts:
      
      JURISDICTION: ${jurisdiction}
      LEGAL AREA: ${legalArea}
      
      Identify:
      1. How courts typically rule on similar matters
      2. Recent legislative changes
      3. Emerging trends
    `)

    return {
      patterns: this.extractJudicialPatterns(result),
      trends: this.extractLegislativeTrends(result),
      insights: result.split('\n').filter(l => l.trim().length > 20).slice(0, 5)
    }
  }

  private buildTools(): AgentTool[] {
    return [
      {
        name: 'search_precedents',
        description: 'Search Nigerian legal precedents',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => ({ precedents: [`Result for: ${query}`] })
      },
      {
        name: 'analyze_trends',
        description: 'Analyze legal trends in Nigeria',
        parameters: { area: { type: 'string', description: 'Legal area' } },
        execute: async ({ area }) => ({ trend: 'stable', area })
      },
      {
        name: 'final_answer',
        description: 'Provide final prediction',
        parameters: { answer: { type: 'string', description: 'Final answer' } },
        execute: async ({ answer }) => answer
      }
    ]
  }

  private extractPrediction(result: string): 'YES' | 'NO' | 'UNCERTAIN' {
    const lower = result.toLowerCase()
    if (/\b(yes|likely|probable|will succeed|favor)\b/.test(lower)) return 'YES'
    if (/\b(no|unlikely|improbable|will fail|against)\b/.test(lower)) return 'NO'
    return 'UNCERTAIN'
  }

  private extractCasePrediction(result: string): 'WIN' | 'LOSE' | 'UNCERTAIN' {
    const lower = result.toLowerCase()
    if (/\b(win|succeed|favorable|likely to prevail)\b/.test(lower)) return 'WIN'
    if (/\b(lose|fail|unfavorable|likely to lose)\b/.test(lower)) return 'LOSE'
    return 'UNCERTAIN'
  }

  private extractConfidence(result: string, thoughts: AgentThought[]): number {
    const confidenceMatch = result.match(/(\d{1,3})%\s*confiden/i)
    if (confidenceMatch) {
      return Math.min(100, Math.max(0, parseInt(confidenceMatch[1])))
    }
    return 50 + Math.min(thoughts.length * 5, 25)
  }

  private generateRecommendation(
    prediction: 'YES' | 'NO' | 'UNCERTAIN',
    confidence: number,
    currentYes: number
  ): 'STRONG_YES' | 'LEAN_YES' | 'HOLD' | 'LEAN_NO' | 'STRONG_NO' {
    if (prediction === 'UNCERTAIN' || confidence < 60) return 'HOLD'
    
    const edge = prediction === 'YES' ? (confidence - currentYes) : (confidence - (100 - currentYes))
    
    if (prediction === 'YES') {
      if (edge > 20) return 'STRONG_YES'
      if (edge > 10) return 'LEAN_YES'
    } else {
      if (edge > 20) return 'STRONG_NO'
      if (edge > 10) return 'LEAN_NO'
    }
    return 'HOLD'
  }

  private extractKeyFactors(result: string): string[] {
    return result.split('\n')
      .filter(l => /factor|reason|because|due to|consider/i.test(l))
      .slice(0, 5)
      .map(l => l.trim())
  }

  private assessRisk(result: string, confidence: number): { level: 'LOW' | 'MEDIUM' | 'HIGH'; factors: string[] } {
    const level = confidence > 75 ? 'LOW' : confidence > 50 ? 'MEDIUM' : 'HIGH'
    const factors = result.split('\n')
      .filter(l => /risk|uncertain|volatile|unpredictable/i.test(l))
      .slice(0, 3)
      .map(l => l.trim())
    return { level, factors }
  }

  private extractCaseReferences(result: string): CaseReference[] {
    const patterns = [
      /\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g,
      /\(\d{4}\)\s+LPELR-\d+/g
    ]
    const refs: CaseReference[] = []
    for (const pattern of patterns) {
      const matches = result.match(pattern) || []
      for (const match of matches.slice(0, 3)) {
        refs.push({
          citation: match,
          outcome: 'See full case',
          relevance: 0.8,
          keyPrinciple: 'Relevant precedent'
        })
      }
    }
    return refs
  }

  private extractStatutes(result: string): string[] {
    const patterns = [
      /CAMA\s+2020/gi,
      /Constitution\s+of\s+Nigeria/gi,
      /[A-Z][a-z]+\s+Act,?\s+\d{4}/g,
      /Section\s+\d+/gi
    ]
    const statutes: string[] = []
    for (const pattern of patterns) {
      statutes.push(...(result.match(pattern) || []))
    }
    return [...new Set(statutes)].slice(0, 5)
  }

  private extractPatterns(result: string): string[] {
    return result.split('\n')
      .filter(l => /pattern|trend|typically|usually|historically/i.test(l))
      .slice(0, 3)
      .map(l => l.trim())
  }

  private extractJudicialPatterns(result: string): JudicialPattern[] {
    return [{
      court: 'Supreme Court of Nigeria',
      pattern: 'Generally follows established precedent',
      confidence: 0.75,
      cases: []
    }]
  }

  private extractLegislativeTrends(result: string): LegislativeTrend[] {
    return [{
      area: 'General',
      trend: 'stable',
      recentChanges: [],
      prediction: 'Continued stability expected'
    }]
  }
}

export function createPredictionAgent(): PredictionMarketAgent {
  return new PredictionMarketAgent()
}
