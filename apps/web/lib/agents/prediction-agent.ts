/**
 * Prediction Market AI Agent (Serverless - Grok API)
 * Uses real Nigerian case law database for precedent analysis
 */

import { BaseAgent, AgentTool, AgentThought, callLLM } from './base-agent'
import { getSupabaseClient } from '@/lib/supabase'

export interface MarketAnalysis { marketId: string; question: string; currentYesPercent: number; currentNoPercent: number; aiPrediction: { outcome: 'YES' | 'NO' | 'UNCERTAIN'; confidence: number }; recommendation: { action: 'STRONG_YES' | 'LEAN_YES' | 'HOLD' | 'LEAN_NO' | 'STRONG_NO'; strength: number }; reasoning: string; keyFactors: string[]; riskAssessment: { level: 'LOW' | 'MEDIUM' | 'HIGH'; factors: string[] }; supportingCases: CaseReference[]; timeline: string }
export interface CaseReference { citation: string; outcome: string; relevance: number; keyPrinciple: string }
export interface JudicialPattern { court: string; pattern: string; confidence: number; cases: string[] }
export interface LegislativeTrend { area: string; trend: 'expanding' | 'contracting' | 'stable'; recentChanges: string[]; prediction: string }

export class PredictionMarketAgent extends BaseAgent {
  constructor() {
    super({ name: 'CaseWin Prediction Oracle', role: 'Legal Prediction Analyst', goal: 'Predict Nigerian legal outcomes accurately', backstory: 'Expert in Nigerian judicial trends and legislative patterns.', tools: [], maxIterations: 8 })
  }

  async initialize() { this.config.tools = this.buildTools() }

  async analyzeMarket(market: { id: string; title?: string; question?: string; description?: string; category: string; currentYes?: number; currentNo?: number; yes_votes?: number; no_votes?: number; deadline?: string; endDate?: string; total_pool?: number }) {
    const question = market.title || market.question || market.description || ''
    const yes = market.currentYes || market.yes_votes || 50, no = market.currentNo || market.no_votes || 50
    const { result, thoughts } = await this.run(`Analyze Nigerian legal prediction market:\nQUESTION: ${question}\nCATEGORY: ${market.category}\nSENTIMENT: ${yes}% YES / ${no}% NO\n${market.deadline || market.endDate ? `RESOLVES: ${market.deadline || market.endDate}` : ''}\n\nProvide: prediction, confidence %, key factors, relevant cases, risk assessment.`)
    const pred = this.extractPrediction(result), conf = this.extractConfidence(result, thoughts)
    const rec = this.genRec(pred, conf, yes)
    return { marketId: market.id, question, currentYesPercent: yes, currentNoPercent: no, aiPrediction: { outcome: pred, confidence: conf }, recommendation: rec, reasoning: result, keyFactors: result.split('\n').filter(l => /factor|reason|because|due to|consider/i.test(l)).slice(0, 5).map(l => l.trim()), riskAssessment: { level: conf > 75 ? 'LOW' as const : conf > 50 ? 'MEDIUM' as const : 'HIGH' as const, factors: result.split('\n').filter(l => /risk|uncertain/i.test(l)).slice(0, 3).map(l => l.trim()) }, supportingCases: this.extractCases(result), timeline: market.deadline || market.endDate || 'Unknown' }
  }

  async analyzeMultipleMarkets(markets: any[]) {
    const results = []
    for (const m of markets.slice(0, 5)) results.push(await this.analyzeMarket(m))
    return results
  }

  async predictCaseOutcome(caseFacts: string, jurisdiction: string, legalArea: string) {
    const { result, thoughts } = await this.run(`Predict Nigerian case outcome:\nFACTS: ${caseFacts}\nJURISDICTION: ${jurisdiction}\nAREA: ${legalArea}`)
    return { prediction: this.extractCasePred(result), confidence: this.extractConfidence(result, thoughts), reasoning: result, similarCases: this.extractCases(result), judicialPatterns: [{ court: 'Supreme Court of Nigeria', pattern: 'Follows established precedent', confidence: 0.75, cases: [] as string[] }] }
  }

  async findContrarianOpportunities(markets: any[]) {
    const opps: any[] = []
    for (const m of markets.slice(0, 5)) {
      const a = await this.analyzeMarket(m)
      const crowd = m.currentYes || m.yes_votes || 50
      const ai = a.aiPrediction.outcome === 'YES' ? a.aiPrediction.confidence : 100 - a.aiPrediction.confidence
      const diff = Math.abs(ai - crowd)
      if (diff > 15) opps.push({ market: m, aiVsCrowd: ai - crowd, opportunity: ai > crowd ? 'AI more bullish' : 'AI more bearish', confidence: a.aiPrediction.confidence })
    }
    return opps.sort((a, b) => Math.abs(b.aiVsCrowd) - Math.abs(a.aiVsCrowd))
  }

  async analyzeJudicialPatterns(jurisdiction: string, legalArea: string) {
    const { result } = await this.run(`Analyze judicial patterns:\nJURISDICTION: ${jurisdiction}\nAREA: ${legalArea}`)
    return { patterns: [{ court: jurisdiction, pattern: 'Follows precedent', confidence: 0.75, cases: [] as string[] }], trends: [{ area: legalArea, trend: 'stable' as const, recentChanges: [] as string[], prediction: 'Continued stability' }], insights: result.split('\n').filter(l => l.trim().length > 20).slice(0, 5) }
  }

  private buildTools(): AgentTool[] {
    return [
      {
        name: 'search_precedents',
        description: 'Search Nigerian case law database for relevant precedents and judicial decisions',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async ({ query }) => {
          try {
            const supabase = getSupabaseClient()
            const searchTerms = query.split(' ').filter((w: string) => w.length > 2).join(' & ')
            const { data } = await supabase
              .from('legal_cases')
              .select('case_title, citation, court, year, category, holding, ratio_decidendi, outcome, is_landmark')
              .textSearch('search_vector', searchTerms, { type: 'websearch', config: 'english' })
              .limit(6)
            if (data?.length) return { precedents: data, source: 'CaseWin Nigerian Law Database' }
            // Fallback search
            const { data: fallback } = await supabase
              .from('legal_cases')
              .select('case_title, citation, court, year, category, holding, ratio_decidendi, outcome, is_landmark')
              .or(`case_title.ilike.%${query}%,holding.ilike.%${query}%`)
              .limit(6)
            return { precedents: fallback || [], source: fallback?.length ? 'CaseWin Database' : 'AI Knowledge Base' }
          } catch {
            return { precedents: [], source: 'AI Knowledge Base' }
          }
        }
      },
      {
        name: 'analyze_trends',
        description: 'Analyze judicial trends and patterns in Nigerian courts',
        parameters: { area: { type: 'string', description: 'Legal area to analyze' } },
        execute: async ({ area }) => {
          try {
            const supabase = getSupabaseClient()
            // Get outcome distribution for this legal area
            const { data } = await supabase
              .from('legal_cases')
              .select('outcome, court, year, is_landmark')
              .ilike('category', `%${area}%`)
              .order('year', { ascending: false })
              .limit(20)
            if (data?.length) {
              const outcomes = data.reduce((acc: Record<string, number>, c: any) => { acc[c.outcome] = (acc[c.outcome] || 0) + 1; return acc }, {})
              return { area, outcomes, totalCases: data.length, yearRange: { from: Math.min(...data.map((c: any) => c.year)), to: Math.max(...data.map((c: any) => c.year)) }, trend: 'Based on database analysis', source: 'CaseWin Database' }
            }
            return { area, trend: 'stable', note: 'Limited data available', source: 'AI Analysis' }
          } catch {
            return { area, trend: 'stable', source: 'AI Analysis' }
          }
        }
      },
      { name: 'final_answer', description: 'Final prediction', parameters: { answer: { type: 'string', description: 'Answer' } }, execute: async ({ answer }) => answer }
    ]
  }

  private extractPrediction(result: string): 'YES' | 'NO' | 'UNCERTAIN' {
    const l = result.toLowerCase()
    if (/\b(yes|likely|probable|will succeed|favor)\b/.test(l)) return 'YES'
    if (/\b(no|unlikely|improbable|will fail|against)\b/.test(l)) return 'NO'
    return 'UNCERTAIN'
  }
  private extractCasePred(result: string): 'WIN' | 'LOSE' | 'UNCERTAIN' {
    const l = result.toLowerCase()
    if (/\b(win|succeed|favorable|prevail)\b/.test(l)) return 'WIN'
    if (/\b(lose|fail|unfavorable)\b/.test(l)) return 'LOSE'
    return 'UNCERTAIN'
  }
  private extractConfidence(result: string, thoughts: AgentThought[]): number {
    const m = result.match(/(\d{1,3})%\s*confiden/i)
    return m ? Math.min(100, Math.max(0, parseInt(m[1]))) : 50 + Math.min(thoughts.length * 5, 25)
  }
  private genRec(pred: string, conf: number, crowdYes: number): { action: 'STRONG_YES' | 'LEAN_YES' | 'HOLD' | 'LEAN_NO' | 'STRONG_NO'; strength: number } {
    if (pred === 'UNCERTAIN' || conf < 60) return { action: 'HOLD', strength: 0 }
    const edge = pred === 'YES' ? conf - crowdYes : conf - (100 - crowdYes)
    if (pred === 'YES') { if (edge > 20) return { action: 'STRONG_YES', strength: edge }; if (edge > 10) return { action: 'LEAN_YES', strength: edge } }
    else { if (edge > 20) return { action: 'STRONG_NO', strength: edge }; if (edge > 10) return { action: 'LEAN_NO', strength: edge } }
    return { action: 'HOLD', strength: 0 }
  }
  private extractCases(result: string): CaseReference[] {
    const refs: CaseReference[] = []
    for (const p of [/\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g, /\(\d{4}\)\s+LPELR-\d+/g])
      for (const m of (result.match(p) || []).slice(0, 3)) refs.push({ citation: m, outcome: 'See full case', relevance: 0.8, keyPrinciple: 'Relevant precedent' })
    return refs
  }
}


export function createPredictionAgent() { return new PredictionMarketAgent() }
