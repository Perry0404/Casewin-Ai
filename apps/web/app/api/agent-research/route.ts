import { NextRequest, NextResponse } from 'next/server'
import { createResearchAgent, getVerificationLayer, getMemoryManager } from '@/lib/agents'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { query, depth = 'standard', verifyResults = true, userId } = await req.json()

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 })
    }

    const agent = createResearchAgent()
    const memory = getMemoryManager()
    
    await agent.initialize()
    await memory.initialize()

    const report = await agent.research(query, { depth, userId })

    let verification = null
    if (verifyResults) {
      const verifier = getVerificationLayer()
      verification = await verifier.verify(report.analysis, 'research')
    }

    return NextResponse.json({
      success: true,
      query,
      summary: report.executiveSummary,
      findings: report.findings,
      analysis: report.analysis,
      recommendations: report.recommendations,
      citations: report.citations,
      confidence: {
        overall: Math.round(report.confidence * 100),
        verified: verification?.verified || false,
        issues: verification?.issues?.length || 0
      },
      metadata: {
        depth,
        timeMs: Date.now() - startTime,
        agentVersion: '2.0.0-agents'
      }
    })

  } catch (error: any) {
    console.error('Agent research error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
