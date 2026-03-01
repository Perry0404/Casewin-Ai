import { NextRequest, NextResponse } from 'next/server'
import { AgentCrew, getVerificationLayer } from '@/lib/agents'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { contractText, contractType, clientSide, includeReasoningTrace = false } = await req.json()

    if (!contractText) {
      return NextResponse.json({ success: false, error: 'Contract text is required' }, { status: 400 })
    }

    const crew = new AgentCrew()
    await crew.initialize()

    const analysis = await crew.analyzeContract(contractText)

    const verifier = getVerificationLayer()
    const verification = await verifier.verify(analysis.analysis, 'analysis')

    const riskScore = Math.min(100, 20 + analysis.risks.length * 10)

    const response: any = {
      success: true,
      summary: {
        riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High',
        riskScore,
        issuesFound: analysis.risks.length,
        confidence: Math.round((0.7 + Math.min(analysis.risks.length * 0.03, 0.2)) * 100)
      },
      risks: analysis.risks.map((risk, i) => ({
        id: i + 1,
        description: risk,
        severity: 'medium'
      })),
      recommendations: analysis.recommendations,
      verification: {
        passed: verification.verified,
        confidence: Math.round(verification.confidence * 100),
        warnings: verification.warnings
      },
      fullAnalysis: analysis.analysis,
      metadata: {
        contractType: contractType || 'general',
        agentsUsed: ['Analysis', 'Research', 'Verification', 'Strategy'],
        processingTimeMs: Date.now() - startTime
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Agent contract analysis error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
