/**
 * CaseWin Self-Verification Layer
 */
export interface VerificationResult {
  verified: boolean
  confidence: number
  issues: VerificationIssue[]
  corrections: Correction[]
  warnings: string[]
  metadata: { verificationType: string; timeMs: number; checksPerformed: string[] }
}

export interface VerificationIssue {
  type: 'citation_error' | 'factual_error' | 'inconsistency' | 'hallucination' | 'outdated' | 'ambiguous'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location?: string
  suggestion?: string
}

export interface Correction {
  original: string
  corrected: string
  reason: string
  confidence: number
}

export interface CitationCheck {
  citation: string
  exists: boolean
  correct_format: boolean
  case_name_matches: boolean
  year_correct: boolean
  court_correct: boolean
}

export class VerificationLayer {
  private ollama: any
  private model: string

  constructor() {
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b'
  }

  async initialize() {
    const { Ollama } = await import('ollama')
    this.ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })
  }

  async verify(content: string, contentType: 'research' | 'draft' | 'analysis' | 'prediction'): Promise<VerificationResult> {
    const startTime = Date.now()
    await this.initialize()

    const issues: VerificationIssue[] = []
    const warnings: string[] = []
    const checksPerformed: string[] = []

    // Check citations
    const citations = this.extractCitations(content)
    checksPerformed.push('citation_verification')
    for (const citation of citations) {
      const valid = this.validateCitationFormat(citation)
      if (!valid) {
        issues.push({
          type: 'citation_error',
          severity: 'medium',
          description: `Citation format may be incorrect: ${citation}`,
          location: citation
        })
      }
    }

    // Check for outdated laws
    checksPerformed.push('currency_check')
    const outdatedRefs = ['CAMA 1990', 'Evidence Act 2004', '1979 Constitution']
    for (const ref of outdatedRefs) {
      if (content.includes(ref)) {
        issues.push({
          type: 'outdated',
          severity: 'high',
          description: `Reference to outdated law: ${ref}`
        })
      }
    }

    // Calculate confidence
    let confidence = 1.0
    confidence -= issues.filter(i => i.severity === 'critical').length * 0.25
    confidence -= issues.filter(i => i.severity === 'high').length * 0.1
    confidence -= issues.filter(i => i.severity === 'medium').length * 0.05
    confidence = Math.max(0, Math.min(1, confidence))

    return {
      verified: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length < 2,
      confidence,
      issues,
      corrections: [],
      warnings,
      metadata: { verificationType: contentType, timeMs: Date.now() - startTime, checksPerformed }
    }
  }

  private extractCitations(text: string): string[] {
    const pattern = /\(\d{4}\)\s+LPELR-?\d+\([A-Z]+\)/g
    return text.match(pattern) || []
  }

  private validateCitationFormat(citation: string): boolean {
    const yearMatch = citation.match(/\((\d{4})\)/)
    if (!yearMatch) return false
    const year = parseInt(yearMatch[1])
    return year >= 1960 && year <= new Date().getFullYear()
  }

  async quickVerify(content: string): Promise<{ passed: boolean; criticalIssues: number; warnings: string[] }> {
    const result = await this.verify(content, 'research')
    return {
      passed: result.verified,
      criticalIssues: result.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length,
      warnings: result.warnings
    }
  }
}

let verificationInstance: VerificationLayer | null = null

export function getVerificationLayer(): VerificationLayer {
  if (!verificationInstance) verificationInstance = new VerificationLayer()
  return verificationInstance
}

export default VerificationLayer
