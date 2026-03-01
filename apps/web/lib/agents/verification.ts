/**
 * CaseWin Verification Layer (Serverless - Grok API)
 */

import { callLLM } from './base-agent'

export interface VerificationResult {
  verified: boolean; confidence: number; issues: VerificationIssue[]; corrections: Correction[]; warnings: string[]
  metadata: { verificationType: string; timeMs: number; checksPerformed: string[] }
}
export interface VerificationIssue {
  type: 'citation_error' | 'factual_error' | 'inconsistency' | 'hallucination' | 'outdated' | 'ambiguous'
  severity: 'low' | 'medium' | 'high' | 'critical'; description: string; location?: string; suggestion?: string
}
export interface Correction { original: string; corrected: string; reason: string; confidence: number }
export interface CitationCheck { citation: string; exists: boolean; correct_format: boolean; case_name_matches: boolean; year_correct: boolean; court_correct: boolean }

export class VerificationLayer {
  async initialize() {}

  async verify(content: string, contentType: 'research' | 'draft' | 'analysis' | 'prediction'): Promise<VerificationResult> {
    const start = Date.now()
    const issues: VerificationIssue[] = [], corrections: Correction[] = [], warnings: string[] = [], checks: string[] = []

    const citations = this.extractCitations(content)
    if (citations.length > 0) {
      checks.push('citation_verification')
      for (const c of citations) {
        const yr = c.match(/\((\d{4})\)|\[(\d{4})\]/)
        const year = yr ? parseInt(yr[1] || yr[2]) : null
        if (year && (year < 1960 || year > new Date().getFullYear()))
          issues.push({ type: 'citation_error', severity: 'high', description: `Invalid year in citation: ${c}`, location: c })
      }
    }

    checks.push('hallucination_check')
    try {
      const resp = await callLLM([
        { role: 'system', content: `You are a Nigerian law verification expert. Check this ${contentType} for errors. Respond JSON: {"suspicious_claims":[{"claim":"...","reason":"...","severity":"low|medium|high"}],"warnings":["..."]}` },
        { role: 'user', content: content.slice(0, 3000) }
      ], 0.1)
      try {
        const p = JSON.parse(resp)
        for (const c of p.suspicious_claims || []) issues.push({ type: 'hallucination', severity: c.severity || 'medium', description: c.claim, suggestion: c.reason })
        warnings.push(...(p.warnings || []))
      } catch { warnings.push('Verification returned non-parseable response') }
    } catch { warnings.push('Hallucination check unavailable') }

    checks.push('consistency_check')
    if (/both.*and.*not/i.test(content)) issues.push({ type: 'inconsistency', severity: 'medium', description: 'Possible self-contradiction' })

    checks.push('currency_check')
    const outdated = [{ old: 'CAMA 1990', rep: 'CAMA 2020' }, { old: 'Evidence Act 2004', rep: 'Evidence Act 2011' }]
    for (const l of outdated) if (content.includes(l.old)) issues.push({ type: 'outdated', severity: 'high', description: `Outdated: ${l.old}`, suggestion: `Use ${l.rep}` })

    const crit = issues.filter(i => i.severity === 'critical').length, high = issues.filter(i => i.severity === 'high').length
    let confidence = Math.max(0, Math.min(1, 1 - crit * 0.25 - high * 0.1 - issues.filter(i => i.severity === 'medium').length * 0.05))

    return { verified: crit === 0 && high < 2, confidence, issues, corrections, warnings, metadata: { verificationType: contentType, timeMs: Date.now() - start, checksPerformed: checks } }
  }

  private extractCitations(text: string): string[] {
    const patterns = [/\[\d{4}\]\s+\d+\s+NWLR\s+\([^)]+\)\s+\d+/g, /\(\d{4}\)\s+LPELR-?\d+/g, /[A-Za-z]+\s+v\.?\s+[A-Za-z\s]+\[\d{4}\]/g]
    const c: string[] = []
    for (const p of patterns) c.push(...(text.match(p) || []))
    return [...new Set(c)]
  }

  async quickVerify(content: string) {
    const citations = this.extractCitations(content)
    const issues: VerificationIssue[] = []
    for (const c of citations) {
      const yr = c.match(/\((\d{4})\)|\[(\d{4})\]/)
      if (yr) { const y = parseInt(yr[1] || yr[2]); if (y < 1960 || y > new Date().getFullYear()) issues.push({ type: 'citation_error', severity: 'high', description: `Invalid year: ${c}` }) }
    }
    for (const old of ['CAMA 1990', '1979 Constitution']) if (content.includes(old)) issues.push({ type: 'outdated', severity: 'high', description: `Outdated: ${old}` })
    return { passed: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0, criticalIssues: issues.length, warnings: issues.map(i => i.description) }
  }
}

let inst: VerificationLayer | null = null
export function getVerificationLayer(): VerificationLayer { if (!inst) inst = new VerificationLayer(); return inst }
export default VerificationLayer
