import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { caseType, role, witnessName, caseDetails, objectives } = await req.json()

    const response = await callLLM([
      { role: 'system', content: `You are a Nigerian litigation expert specializing in court appearance preparation, witness examination, and cross-examination techniques. You know Nigerian Evidence Act 2011, court etiquette, and advocacy best practices.

Return a JSON object:
{
  "preparation": {
    "courtEtiquette": ["Court behavior tips"],
    "dresscode": "Appropriate attire",
    "documentsToCarry": ["List of documents"]
  },
  "examinationInChief": [
    { "question": "Question text", "purpose": "Why this question", "expectedAnswer": "What to expect", "followUp": "Follow-up if needed" }
  ],
  "crossExamination": [
    { "question": "Question text", "technique": "Leading/Confrontation/etc", "objective": "What you aim to achieve" }
  ],
  "reExamination": [
    { "question": "Question text", "purpose": "Rehabilitate on what point" }
  ],
  "objectionsToWatch": [
    { "type": "Hearsay/Leading/Relevance", "when": "When to raise it", "authority": "Evidence Act section" }
  ],
  "closingTips": ["Strategic tips for closing"]
}` },
      { role: 'user', content: `Prepare for court hearing:
Case Type: ${caseType}
My Role: ${role || 'Counsel for Plaintiff/Prosecution'}
Witness: ${witnessName || 'Key witness'}
Case Details: ${caseDetails}
Objectives: ${objectives || 'Establish facts favorable to client'}

Generate comprehensive hearing preparation in JSON format.` }
    ], 0.4)

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
