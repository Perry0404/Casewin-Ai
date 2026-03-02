import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export async function POST(req: NextRequest) {
  try {
    const { mode, caseName, year, court, volume, page, reporter, text } = await req.json()

    const prompt = mode === 'format'
      ? `Format this Nigerian legal citation properly:
Case Name: ${caseName}
Year: ${year}
Court: ${court}
Volume: ${volume || 'N/A'}
Page: ${page || 'N/A'}
Reporter: ${reporter || 'Auto-detect'}

Provide the citation in all applicable Nigerian formats:
1. NWLR format: [Year] Volume NWLR (Pt. X) Page
2. LPELR format: (Year) LPELR-XXXXX(Court)
3. SC/CA format: (Year) X SC/CA Page
4. FWLR format: [Year] Volume FWLR (Pt. X) Page
5. All Nigeria Law Reports: [Year] All NLR Page

Return JSON: { "citations": [{ "format": "name", "citation": "formatted citation", "isPrimary": bool }], "caseInfo": { "caseName": "", "year": "", "court": "", "summary": "brief note" } }`
      : `Extract and properly format all legal citations from this text:

${text}

For each citation found:
1. Identify the case name
2. Format it in proper Nigerian citation style (NWLR, LPELR, SC, etc.)
3. Note which court decided it

Return JSON: { "citations": [{ "original": "as found in text", "formatted": "proper citation", "caseName": "", "court": "", "year": "" }], "totalFound": number }`

    const response = await callLLM([
      { role: 'system', content: `You are an expert in Nigerian legal citations. You know all Nigerian law report series: NWLR (Nigerian Weekly Law Reports), LPELR (Law Pavilion Electronic Law Reports), FWLR (Federation Weekly Law Reports), All NLR, SC (Supreme Court Reports), NSCC (Nigerian Supreme Court Cases), WRN (Weekly Reports of Nigeria). You format citations precisely according to Nigerian legal writing standards.` },
      { role: 'user', content: prompt }
    ], 0.2)

    let parsed
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { parsed = null }

    return NextResponse.json({
      success: true,
      result: parsed || { fullAnalysis: response },
      rawAnalysis: response,
      formattedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
