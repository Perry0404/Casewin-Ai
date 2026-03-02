import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { matterType, court, complexity, jurisdiction, details } = await req.json()

    const response = await callLLM([
      { role: 'system', content: `You are a Nigerian legal fee estimation expert. You know:
- NBA recommended fee scales
- Court filing fees for all Nigerian courts (FHC, State HC, CA, SC, NIC, Magistrate)
- Typical retainer fees by practice area in Nigeria
- Professional charges for different legal services
- VAT implications on legal fees (7.5%)
- Stamp duty where applicable

Return a JSON object:
{
  "estimate": {
    "lowRange": "₦X",
    "highRange": "₦Y",
    "average": "₦Z"
  },
  "breakdown": [
    { "item": "Fee item", "amount": "₦X", "notes": "explanation" }
  ],
  "courtFees": [
    { "item": "Filing fee / stamp duty", "amount": "₦X" }
  ],
  "totalEstimate": { "low": "₦X", "high": "₦Y" },
  "factors": ["Factors affecting the fee"],
  "paymentStructure": "Recommended payment approach",
  "disclaimer": "This is an estimate..."
}` },
      { role: 'user', content: `Estimate legal fees for:
Matter Type: ${matterType}
Court: ${court || 'Not yet determined'}
Complexity: ${complexity || 'Medium'}
Jurisdiction: ${jurisdiction || 'Lagos State'}
Details: ${details || 'General inquiry'}

Provide a comprehensive fee estimate in JSON format.` }
    ], 0.3)

    let parsed
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
