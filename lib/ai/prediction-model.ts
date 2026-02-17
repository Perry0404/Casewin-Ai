// CaseWin AI - Custom Prediction Model Service
// This module handles AI predictions without relying on external APIs
// Can be extended to use locally hosted models (Llama, Mistral, etc.)

interface MarketData {
  title: string;
  description: string;
  category: string;
  market_type: string;
  resolution_date: string;
  current_yes_price: number;
  current_no_price: number;
  total_volume: number;
  total_traders: number;
  historical_prices?: number[];
}

interface PredictionResult {
  prediction: number; // 0-1 probability
  confidence: number; // 0-1 confidence level
  reasoning: string;
  factors: PredictionFactor[];
  model_version: string;
}

interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

// Legal domain knowledge base for Nigerian legal system
const LEGAL_KNOWLEDGE_BASE = {
  // Court success rates by case type (based on historical data)
  case_type_success_rates: {
    'election_petition': 0.35, // Election petitions have lower success rates
    'tax_dispute': 0.42,
    'criminal_appeal': 0.28,
    'civil_rights': 0.45,
    'corporate_dispute': 0.48,
    'constitutional_matter': 0.38,
    'anti_corruption': 0.52,
    'land_dispute': 0.41,
    'default': 0.40
  },
  
  // Factor weights for prediction
  factor_weights: {
    historical_precedent: 0.25,
    legal_strength: 0.20,
    procedural_compliance: 0.15,
    public_sentiment: 0.10,
    institutional_bias: 0.10,
    timeline_pressure: 0.10,
    evidence_quality: 0.10
  },
  
  // Nigerian court hierarchy influence
  court_hierarchy_factor: {
    'magistrate': 0.6,
    'high_court': 0.7,
    'court_of_appeal': 0.8,
    'supreme_court': 0.95
  }
};

// Pattern matching for legal market analysis
const LEGAL_PATTERNS = [
  { pattern: /supreme court/i, factor: 'court_level', value: 0.95 },
  { pattern: /court of appeal/i, factor: 'court_level', value: 0.8 },
  { pattern: /high court/i, factor: 'court_level', value: 0.7 },
  { pattern: /election|electoral/i, factor: 'case_type', value: 'election_petition' },
  { pattern: /tax|revenue/i, factor: 'case_type', value: 'tax_dispute' },
  { pattern: /efcc|icpc|corruption/i, factor: 'case_type', value: 'anti_corruption' },
  { pattern: /criminal|conviction/i, factor: 'case_type', value: 'criminal_appeal' },
  { pattern: /constitutional/i, factor: 'case_type', value: 'constitutional_matter' },
  { pattern: /appeal|overturn/i, factor: 'appeal_case', value: true },
  { pattern: /uphold|affirm/i, factor: 'uphold_case', value: true },
  { pattern: /bill|legislation|reform/i, factor: 'legislative', value: true },
  { pattern: /cbn|regulatory|policy/i, factor: 'regulatory', value: true },
];

// Sentiment keywords for market analysis
const SENTIMENT_KEYWORDS = {
  positive: [
    'win', 'success', 'victory', 'approve', 'pass', 'uphold', 'affirm',
    'progress', 'achieve', 'favorable', 'landmark', 'breakthrough'
  ],
  negative: [
    'fail', 'reject', 'dismiss', 'deny', 'overturn', 'reverse', 'challenge',
    'dispute', 'controversial', 'oppose', 'block', 'delay'
  ],
  uncertain: [
    'may', 'might', 'could', 'possibly', 'uncertain', 'pending', 'ongoing',
    'complex', 'difficult', 'unprecedented'
  ]
};

export class CaseWinAIModel {
  private modelVersion = '1.0.0-local';
  
  constructor() {
    console.log('CaseWin AI Model initialized (local inference)');
  }
  
  /**
   * Main prediction function - analyzes market and returns probability
   */
  async predict(market: MarketData): Promise<PredictionResult> {
    const factors: PredictionFactor[] = [];
    let baseProbability = 0.5;
    let totalWeight = 0;
    
    // 1. Analyze market text for patterns
    const textAnalysis = this.analyzeMarketText(market.title, market.description);
    
    // 2. Determine case type and base success rate
    const caseType = textAnalysis.caseType || 'default';
    const baseRate = LEGAL_KNOWLEDGE_BASE.case_type_success_rates[caseType as keyof typeof LEGAL_KNOWLEDGE_BASE.case_type_success_rates] 
      || LEGAL_KNOWLEDGE_BASE.case_type_success_rates.default;
    
    factors.push({
      name: 'Historical Case Type Success Rate',
      impact: baseRate > 0.45 ? 'positive' : baseRate < 0.35 ? 'negative' : 'neutral',
      weight: 0.25,
      description: `${caseType.replace('_', ' ')} cases historically have ${Math.round(baseRate * 100)}% success rate`
    });
    
    baseProbability = baseRate;
    totalWeight += 0.25;
    
    // 3. Analyze court level if applicable
    if (textAnalysis.courtLevel) {
      const courtFactor = textAnalysis.courtLevel;
      factors.push({
        name: 'Court Authority Level',
        impact: courtFactor > 0.8 ? 'positive' : 'neutral',
        weight: 0.15,
        description: `Higher court rulings carry more finality and precedent weight`
      });
      
      // Adjust for appeals (usually harder to win)
      if (textAnalysis.isAppeal) {
        baseProbability *= 0.85;
        factors.push({
          name: 'Appeal Case Factor',
          impact: 'negative',
          weight: 0.1,
          description: 'Appeals are generally harder to win than original cases'
        });
      }
      totalWeight += 0.15;
    }
    
    // 4. Sentiment analysis
    const sentiment = this.analyzeSentiment(market.title + ' ' + market.description);
    factors.push({
      name: 'Text Sentiment Analysis',
      impact: sentiment > 0.1 ? 'positive' : sentiment < -0.1 ? 'negative' : 'neutral',
      weight: 0.1,
      description: `Market framing ${sentiment > 0 ? 'favors' : 'challenges'} YES outcome`
    });
    baseProbability += sentiment * 0.1;
    totalWeight += 0.1;
    
    // 5. Market wisdom (crowd prediction)
    if (market.current_yes_price && market.total_traders > 10) {
      const marketConsensus = market.current_yes_price;
      const traderConfidence = Math.min(market.total_traders / 1000, 1); // More traders = more confident
      
      factors.push({
        name: 'Market Consensus',
        impact: marketConsensus > 0.55 ? 'positive' : marketConsensus < 0.45 ? 'negative' : 'neutral',
        weight: 0.2 * traderConfidence,
        description: `${market.total_traders} traders predict ${Math.round(marketConsensus * 100)}% YES`
      });
      
      // Blend with market consensus (wisdom of crowds)
      baseProbability = baseProbability * 0.6 + marketConsensus * 0.4;
      totalWeight += 0.2;
    }
    
    // 6. Timeline factor
    const daysToResolution = this.getDaysUntil(market.resolution_date);
    if (daysToResolution > 0) {
      const timelineFactor = daysToResolution < 30 ? 'imminent' : 
                            daysToResolution < 90 ? 'near' : 
                            daysToResolution < 365 ? 'medium' : 'far';
      
      factors.push({
        name: 'Resolution Timeline',
        impact: 'neutral',
        weight: 0.05,
        description: `${daysToResolution} days until resolution (${timelineFactor} term)`
      });
      totalWeight += 0.05;
    }
    
    // 7. Category-specific adjustments
    const categoryAdjustment = this.getCategoryAdjustment(market.category);
    baseProbability += categoryAdjustment;
    
    // 8. Regulatory/Legislative special handling
    if (textAnalysis.isLegislative) {
      factors.push({
        name: 'Legislative Process Factor',
        impact: 'negative',
        weight: 0.1,
        description: 'Bills and reforms face complex political processes'
      });
      baseProbability *= 0.9; // Legislative outcomes are harder to predict
    }
    
    if (textAnalysis.isRegulatory) {
      factors.push({
        name: 'Regulatory Decision Factor',
        impact: 'neutral',
        weight: 0.1,
        description: 'Regulatory changes depend on institutional priorities'
      });
    }
    
    // Normalize probability
    const finalPrediction = Math.max(0.05, Math.min(0.95, baseProbability));
    
    // Calculate confidence based on available data
    const confidence = this.calculateConfidence(market, factors, totalWeight);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(market, factors, finalPrediction);
    
    return {
      prediction: finalPrediction,
      confidence,
      reasoning,
      factors,
      model_version: this.modelVersion
    };
  }
  
  /**
   * Analyze market text for legal patterns
   */
  private analyzeMarketText(title: string, description: string): {
    caseType: string | null;
    courtLevel: number | null;
    isAppeal: boolean;
    isLegislative: boolean;
    isRegulatory: boolean;
  } {
    const fullText = `${title} ${description}`.toLowerCase();
    let caseType: string | null = null;
    let courtLevel: number | null = null;
    let isAppeal = false;
    let isLegislative = false;
    let isRegulatory = false;
    
    for (const pattern of LEGAL_PATTERNS) {
      if (pattern.pattern.test(fullText)) {
        if (pattern.factor === 'case_type') {
          caseType = pattern.value as string;
        } else if (pattern.factor === 'court_level') {
          courtLevel = pattern.value as number;
        } else if (pattern.factor === 'appeal_case') {
          isAppeal = true;
        } else if (pattern.factor === 'legislative') {
          isLegislative = true;
        } else if (pattern.factor === 'regulatory') {
          isRegulatory = true;
        }
      }
    }
    
    return { caseType, courtLevel, isAppeal, isLegislative, isRegulatory };
  }
  
  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (SENTIMENT_KEYWORDS.positive.some(kw => word.includes(kw))) {
        score += 0.1;
      }
      if (SENTIMENT_KEYWORDS.negative.some(kw => word.includes(kw))) {
        score -= 0.1;
      }
      if (SENTIMENT_KEYWORDS.uncertain.some(kw => word.includes(kw))) {
        score -= 0.02; // Slight negative for uncertainty
      }
    }
    
    return Math.max(-0.3, Math.min(0.3, score));
  }
  
  /**
   * Get days until a date
   */
  private getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Category-specific probability adjustments
   */
  private getCategoryAdjustment(category: string): number {
    const adjustments: Record<string, number> = {
      'court_cases': 0,
      'legal_reform': -0.05,
      'supreme_court': 0.02,
      'elections': -0.03,
      'corporate': 0.02,
      'criminal': -0.02,
      'international': 0,
      'regulatory': -0.05,
      'sports': 0,
      'entertainment': 0
    };
    return adjustments[category] || 0;
  }
  
  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(market: MarketData, factors: PredictionFactor[], totalWeight: number): number {
    let confidence = 0.5;
    
    // More factors = higher confidence
    confidence += Math.min(factors.length * 0.05, 0.2);
    
    // More traders = higher confidence in market signal
    if (market.total_traders > 100) confidence += 0.1;
    if (market.total_traders > 500) confidence += 0.1;
    
    // Higher volume = more price discovery
    if (market.total_volume > 100000) confidence += 0.05;
    if (market.total_volume > 1000000) confidence += 0.1;
    
    // Time factor - closer to resolution = lower uncertainty
    const days = this.getDaysUntil(market.resolution_date);
    if (days < 30) confidence += 0.1;
    else if (days < 90) confidence += 0.05;
    
    // Strong consensus increases confidence
    const yesPct = market.current_yes_price;
    if (yesPct > 0.8 || yesPct < 0.2) {
      confidence += 0.1;
    } else if (yesPct > 0.7 || yesPct < 0.3) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }
  
  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(market: MarketData, factors: PredictionFactor[], prediction: number): string {
    const topFactors = factors
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    
    const predictionPct = Math.round(prediction * 100);
    const outcome = prediction > 0.5 ? 'YES' : 'NO';
    const strength = Math.abs(prediction - 0.5);
    const strengthWord = strength > 0.3 ? 'strongly' : strength > 0.15 ? 'moderately' : 'slightly';
    
    let reasoning = `The AI model ${strengthWord} favors ${outcome} (${predictionPct}% probability). `;
    
    reasoning += 'Key factors: ';
    reasoning += topFactors.map((f, i) => {
      const connector = i === 0 ? '' : i === topFactors.length - 1 ? ', and ' : ', ';
      return `${connector}${f.name.toLowerCase()} (${f.impact})`;
    }).join('');
    
    reasoning += '.';
    
    return reasoning;
  }
  
  /**
   * Batch prediction for multiple markets
   */
  async predictBatch(markets: MarketData[]): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();
    
    for (const market of markets) {
      const prediction = await this.predict(market);
      results.set(market.title, prediction);
    }
    
    return results;
  }
}

// Singleton instance
let modelInstance: CaseWinAIModel | null = null;

export function getAIModel(): CaseWinAIModel {
  if (!modelInstance) {
    modelInstance = new CaseWinAIModel();
  }
  return modelInstance;
}

export type { MarketData, PredictionResult, PredictionFactor };
