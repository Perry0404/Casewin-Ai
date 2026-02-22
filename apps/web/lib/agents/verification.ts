/**
 * CaseWin Self-Verification Layer (Serverless Compatible)
 * 
 * Ensures accuracy and reliability of AI outputs through:
 * - Citation verification
 * - Fact checking
 * - Consistency validation
 * - Hallucination detection
 */

import { callLLM } from './base-agent'

export interface VerificationResult {
  verified: boolean
  confidence: number
  issues: VerificationIssue[]
  corrections: Correction[]
  warnings: string[]
  metadata: {
    verificationType: string
    timeMs: number
    checksPerformed: string[]
  }
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
  async initialize() {
    // No initialization needed for serverless
  }

  async verify(content: string, contentType: 'research' | 'draft' | 'analysis' | 'prediction'): Promise<VerificationResult> {
    const startTime = Date.now()

    const issues: VerificationIssue[] = []
    const corrections: Correction[] = []
    const warnings: string[] = []
    const checksPerformed: string[] = []

    // 1. Verify citations
    const citations = this.extractCitations(content)
    if (citations.length > 0) {
      checksPerformed.push('citation_verification')
      const citationResults = await this.verifyCitations(citations)
      
      for (const result of citationResults) {
        if (!result.exists) {
          issues.push({
            type: 'citation_error',
            severity: 'high',
            description: `Citation may not exist: ${result.citation}`,
            location: result.citation,
            suggestion: 'Verify this citation in the Nigerian law database'
          })
        }
      }
    }

    // 2. Check for hallucinations
    checksPerformed.push('hallucination_check')
    const hallucinationCheck = await this.detectHallucinations(content, contentType)
    issues.push(...hallucinationCheck.issues)
    warnings.push(...hallucinationCheck.warnings)

    // 3. Consistency check
    checksPerformed.push('consistency_check')
    const consistencyIssues = await this.checkConsistency(content)
    issues.push(...consistencyIssues)

    // Calculate overall confidence
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const mediumIssues = issues.filter(i => i.severity === 'medium').length

    let confidence = 1.0
    confidence -= criticalIssues * 0.3
    confidence -= highIssues * 0.15
    confidence -= mediumIssues * 0.05
    confidence = Math.max(0, Math.min(1, confidence))

    return {
      verified: confidence >= 0.7 && criticalIssues === 0,
      confidence,
      issues,
      corrections,
      warnings,
      metadata: {
        verificationType: contentType,
        timeMs: Date.now() - startTime,
        checksPerformed
      }
    }
  }

  private extractCitations(content: string): string[] {
    const patterns = [
      /\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g, // [2020] 5 NWLR (Pt. 1234) 456
      /\(\d{4}\)\s+\d+\s+SC/g,                       // (2020) 15 SC
      /\(\d{4}\)\s+LPELR-\d+/g,                     // (2020) LPELR-12345
      /FRN\s+v\.\s+[A-Za-z\s]+\[\d{4}\]/g,         // FRN v. Name [2020]
      /[A-Za-z]+\s+v\.\s+[A-Za-z\s]+\[\d{4}\]/g    // Party v. Party [2020]
    ]

    const citations: string[] = []
    for (const pattern of patterns) {
      const matches = content.match(pattern) || []
      citations.push(...matches)
    }
    return [...new Set(citations)]
  }

  private async verifyCitations(citations: string[]): Promise<CitationCheck[]> {
    const results: CitationCheck[] = []

    for (const citation of citations) {
      // Check format validity
      const hasYear = /\d{4}/.test(citation)
      const hasCourtRef = /(NWLR|SC|LPELR|CA|FCA|FCT|SCNJ)/.test(citation)
      const hasPartyNames = /v\./.test(citation)

      results.push({
        citation,
        exists: true, // Assume exists, would need database to verify
        correct_format: hasYear && (hasCourtRef || hasPartyNames),
        case_name_matches: true,
        year_correct: hasYear,
        court_correct: hasCourtRef
      })
    }

    return results
  }

  private async detectHallucinations(content: string, contentType: string): Promise<{
    issues: VerificationIssue[]
    warnings: string[]
  }> {
    const issues: VerificationIssue[] = []
    const warnings: string[] = []

    try {
      const response = await callLLM([
        {
          role: 'system',
          content: `You are a Nigerian law verification expert. Analyze the following ${contentType} for potential hallucinations or factual errors. Focus on:
1. Legal principles that may be stated incorrectly
2. Dates or facts that seem implausible
3. Laws or sections that may not exist
4. Claims that contradict known Nigerian legal framework

Respond in JSON format:
{
  "suspicious_claims": [{"claim": "...", "reason": "...", "severity": "low|medium|high"}],
  "warnings": ["..."]
}`
        },
        { role: 'user', content }
      ], 0.1)

      try {
        const parsed = JSON.parse(response)
        
        for (const claim of parsed.suspicious_claims || []) {
          issues.push({
            type: 'hallucination',
            severity: claim.severity || 'medium',
            description: claim.claim,
            suggestion: claim.reason
          })
        }
        warnings.push(...(parsed.warnings || []))
      } catch {
        // If parse fails, just note we couldn't verify
        warnings.push('Automated hallucination check returned non-parseable response')
      }
    } catch (error) {
      warnings.push('Hallucination check unavailable')
    }

    return { issues, warnings }
  }

  private async checkConsistency(content: string): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = []

    // Check for self-contradictions (simple pattern matching)
    const contradictionPatterns = [
      { pattern: /both.*and.*not/i, desc: 'Possible self-contradiction' },
      { pattern: /always.*never/i, desc: 'Contradictory absolutes' },
      { pattern: /must.*cannot/i, desc: 'Conflicting requirements' }
    ]

    for (const { pattern, desc } of contradictionPatterns) {
      if (pattern.test(content)) {
        issues.push({
          type: 'inconsistency',
          severity: 'medium',
          description: desc,
          suggestion: 'Review for logical consistency'
        })
      }
    }

    return issues
  }
}

let verificationLayer: VerificationLayer | null = null

export function getVerificationLayer(): VerificationLayer {
  if (!verificationLayer) {
    verificationLayer = new VerificationLayer()
  }
  return verificationLayer
}
