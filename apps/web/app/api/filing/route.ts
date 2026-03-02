import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { court, documentType, caseType, details } = await req.json()

    const response = await callLLM([
      { role: 'system', content: `You are a Nigerian court filing expert with deep knowledge of:
- Federal High Court (Civil Procedure) Rules 2019
- Lagos State High Court (Civil Procedure) Rules 2019
- Court of Appeal Rules 2021
- Supreme Court Rules 2014
- National Industrial Court Rules
- Magistrate Court Rules
- Administration of Criminal Justice Act/Law

You know exact formatting requirements, required documents, filing fees, number of copies, font sizes, margin requirements, page numbering, and cover page formats for each court.

Return your response as a JSON object:
{
  "court": "Court name",
  "documentType": "Document type",
  "checklist": [
    { "item": "Required item", "required": true, "copies": number, "notes": "Details" }
  ],
  "formattingRules": {
    "paperSize": "A4",
    "margins": "Top/Bottom/Left/Right measurements",
    "fontSize": "12pt or 14pt",
    "lineSpacing": "Double/1.5",
    "font": "Times New Roman",
    "pagination": "Bottom center",
    "binding": "Requirement"
  },
  "filingFees": [
    { "item": "Fee description", "amount": "NGN amount", "notes": "" }
  ],
  "coverPage": "Description of cover page format",
  "timeline": "Expected processing timeline",
  "tips": ["Practical tips for filing"]
}` },
      { role: 'user', content: `Prepare filing requirements for:
Court: ${court}
Document Type: ${documentType}
Case Type: ${caseType || 'Civil'}
Additional Details: ${details || 'Standard filing'}

Return the JSON object with complete filing preparation guide.` }
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
      generatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
