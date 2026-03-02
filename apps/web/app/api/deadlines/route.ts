import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { caseType, jurisdiction, filingDate, description } = await req.json()

    const response = await callLLM([
      { role: 'system', content: `You are an expert Nigerian legal deadline calculator. You know all statutory limitation periods, filing deadlines, and court timelines under Nigerian law including:
- Limitation Law of Lagos State / various states
- Limitation Act (Federal)
- Court of Appeal Rules 2021
- Supreme Court Rules
- Federal High Court (Civil Procedure) Rules
- Sheriffs and Civil Process Act
- Administration of Criminal Justice Act 2015
- Companies Winding Up Rules

Return your response as a JSON object with this structure:
{
  "deadlines": [
    {
      "title": "Deadline name",
      "date": "YYYY-MM-DD",
      "daysRemaining": number,
      "category": "Filing|Limitation|Service|Response|Hearing",
      "authority": "Legal authority reference",
      "critical": true/false,
      "notes": "Additional context"
    }
  ],
  "limitationPeriod": "X years from date of accrual",
  "keyDates": "Summary of important dates",
  "warnings": ["Any time-sensitive warnings"]
}` },
      { role: 'user', content: `Calculate all applicable deadlines for:
Case Type: ${caseType}
Jurisdiction: ${jurisdiction || 'Lagos State'}
Filing/Incident Date: ${filingDate || 'Not specified'}
Case Details: ${description || 'General inquiry'}

Return the JSON object with all deadlines calculated from the filing/incident date.` }
    ], 0.3)

    let parsed
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response,
      calculatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
