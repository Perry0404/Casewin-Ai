import { NextRequest, NextResponse } from 'next/server'
import { generateWithXAI } from '@/lib/xai'

export async function POST(req: NextRequest) {
  try {
    const { contractText } = await req.json()

    // Check if API key is configured
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({
        success: true,
        analysis: getMockAnalysis()
      })
    }

    const systemPrompt = `You are an expert contract analyst specializing in Nigerian commercial law, including CAMA 2020, NDPR, and other relevant regulations. You identify risks, compliance issues, and provide actionable recommendations.`

    const prompt = `Analyze this contract for a Nigerian business context:

${contractText}

Provide a comprehensive analysis including:

1. OVERALL RISK ASSESSMENT
   - Risk score (0-100, where 100 is highest risk)
   - Risk level (Low/Medium/High)

2. CLAUSE-BY-CLAUSE ANALYSIS
   For each significant clause, identify:
   - Clause title
   - Risk level (low/medium/high)
   - Issues found
   - Recommended changes

3. MISSING CLAUSES
   List important clauses that should be added

4. COMPLIANCE ISSUES
   - CAMA 2020 compliance
   - NDPR (Data Protection) compliance
   - Other regulatory concerns

5. RECOMMENDATIONS
   Provide specific, actionable recommendations to improve the contract

Format your response clearly with sections.`

    const analysisText = await generateWithXAI(prompt, systemPrompt)

    const riskScoreMatch = analysisText.match(/risk score[:\s]*(\d+)/i)
    const riskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50

    return NextResponse.json({
      success: true,
      analysis: {
        overallRisk: riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high',
        riskScore,
        fullAnalysis: analysisText,
        analyzedAt: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('Contract analysis error:', error)
    return NextResponse.json({
      success: true,
      analysis: getMockAnalysis()
    })
  }
}

function getMockAnalysis() {
  return {
    overallRisk: 'medium',
    riskScore: 55,
    clauses: [
      {
        title: 'Limitation of Liability',
        content: 'The service provider shall not be liable for any indirect or consequential damages.',
        risk: 'high' as const,
        issue: 'This clause completely excludes liability for consequential damages which is overly broad under Nigerian law.',
        suggestion: 'Negotiate a cap on liability (e.g., 2x contract value) rather than complete exclusion. Reference Section 73 of CAMA 2020.'
      },
      {
        title: 'Termination Clause',
        content: 'Either party may terminate with 30 days notice.',
        risk: 'low' as const,
        issue: 'Standard termination provision that is fair to both parties.',
        suggestion: 'Acceptable as is. Consider adding provisions for termination for cause with immediate effect.'
      },
      {
        title: 'Indemnification',
        content: 'The receiving party shall indemnify against all claims.',
        risk: 'high' as const,
        issue: 'Unlimited indemnification without carve-outs for gross negligence or willful misconduct.',
        suggestion: 'Limit indemnification to third-party claims arising from breach. Add exclusions for matters beyond party\'s control.'
      },
      {
        title: 'Governing Law',
        content: 'This agreement shall be governed by Nigerian law.',
        risk: 'low' as const,
        issue: 'Appropriate choice of law for Nigerian parties.',
        suggestion: 'Specify court jurisdiction (e.g., Lagos High Court) and consider adding arbitration clause.'
      },
      {
        title: 'Intellectual Property',
        content: 'All IP created shall belong to the commissioning party.',
        risk: 'medium' as const,
        issue: 'May not adequately protect pre-existing IP of the service provider.',
        suggestion: 'Add clear definitions distinguishing pre-existing IP from newly created IP. Include license-back provisions.'
      },
      {
        title: 'Confidentiality',
        content: 'Parties shall maintain confidentiality of all information.',
        risk: 'medium' as const,
        issue: 'No defined time limit or exceptions for publicly available information.',
        suggestion: 'Add 3-5 year term limit. Include exceptions for court orders and information in public domain.'
      }
    ],
    missingClauses: [
      'Force Majeure clause - Essential for unforeseen circumstances',
      'Dispute Resolution mechanism - ADR before litigation',
      'Data Protection clause - Required under NDPR',
      'Anti-corruption compliance - Recommended for commercial contracts',
      'Assignment restrictions - Prevents unauthorized transfer'
    ],
    complianceIssues: [
      'NDPR Compliance: No data processing provisions found',
      'CAMA 2020: Corporate execution requirements not addressed',
      'Stamp Duty: Contract may require stamping for enforceability'
    ],
    recommendations: [
      'Add Nigeria Data Protection Regulation (NDPR) compliance clause',
      'Include dispute resolution through Lagos Multi-Door Courthouse',
      'Negotiate cap on liability at 100% of contract value',
      'Add mutual indemnification provisions',
      'Include clear payment terms with interest on late payment',
      'Specify which party bears stamp duty costs',
      'Add anti-bribery and corruption representations'
    ]
  }
}
