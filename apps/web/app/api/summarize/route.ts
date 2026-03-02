import { NextRequest, NextResponse } from 'next/server'
import { generateWithXAI } from '@/lib/xai'

export async function POST(req: NextRequest) {
  try {
    const { judgmentText, summaryLength } = await req.json()

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service not configured. Please set XAI_API_KEY.' }, { status: 500 })
    }

    const systemPrompt = `You are an expert Nigerian legal analyst who specializes in summarizing court judgments. You can identify key legal principles, ratio decidendi, and obiter dicta from Nigerian court decisions.`

    const lengthInstruction = summaryLength === 'brief' ? 'Keep the summary concise (about 500 words).' : 
                             summaryLength === 'detailed' ? 'Provide a comprehensive summary (about 1500 words).' :
                             'Provide a standard summary (about 1000 words).'

    const prompt = `Summarize this Nigerian court judgment:

${judgmentText}

${lengthInstruction}

Please provide:
1. CASE TITLE & CITATION
2. COURT & DATE
3. PARTIES (Plaintiff/Appellant vs Defendant/Respondent)
4. FACTS OF THE CASE (brief narrative)
5. ISSUES FOR DETERMINATION (numbered list)
6. HOLDING/DECISION (what the court decided)
7. REASONING (why the court decided this way)
8. RATIO DECIDENDI (the binding legal principle)
9. OBITER DICTA (other observations by the court)
10. SIGNIFICANCE (why this case matters)

Format clearly with headings.`

    const summaryText = await generateWithXAI(prompt, systemPrompt)

    return NextResponse.json({ 
      success: true, 
      summary: {
        fullSummary: summaryText,
        summarizedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Summarization error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Summarization failed' }, { status: 500 })
  }
}

function _unusedMockSummary() {
  return {
    title: 'Ariori v. Elemo',
    citation: '(1983) LPELR-SC.71/1982; [1983] 1 SCNLR 1',
    court: 'Supreme Court of Nigeria',
    date: 'March 15, 1983',
    parties: {
      plaintiff: 'Chief Ariori and Others',
      defendant: 'Alhaji Elemo and Others'
    },
    facts: `The appellants were customary tenants on a parcel of land in Lagos. The respondents, who claimed to be the overlords of the land, sought to eject the appellants for failure to pay customary tribute. The appellants had been in possession for over 50 years and claimed that their long possession had ripened into ownership. The trial court found in favor of the respondents, but the Court of Appeal reversed this decision. The respondents appealed to the Supreme Court.`,
    issues: [
      'Whether long possession by a customary tenant can ripen into absolute ownership under Nigerian land law',
      'Whether the appellants\' failure to pay customary tribute constitutes grounds for forfeiture',
      'Whether the doctrine of laches applies to bar the respondents\' claim',
      'The nature and extent of a customary tenant\'s interest in land'
    ],
    holding: `Appeal dismissed. The Supreme Court held that a customary tenant\'s possession, however long, cannot mature into ownership unless there is evidence of a change in the character of the tenancy. The tenant must continue to acknowledge the overlord\'s title. However, the court found that the respondents had acquiesced in the appellants\' possession and were barred by laches from seeking forfeiture.`,
    reasoning: `The court reasoned that customary land tenure in Nigeria recognizes the distinction between ownership and possession. A tenant who holds under a customary grant does not acquire ownership merely by effluxion of time, unlike adverse possession under English law. The tenant's possession is not adverse but permissive. However, where an overlord has slept on his rights for an extended period and the tenant has made substantial improvements, equity may intervene to prevent forfeiture.`,
    ratio: `A customary tenant's possession, regardless of duration, cannot ripen into ownership without evidence of the overlord's express or implied grant of the fee simple, or conduct amounting to abandonment of the overlordship. The character of possession matters - permissive possession cannot become adverse through mere passage of time.`,
    obiter: [
      'The court noted that the Land Use Act 1978 may affect customary tenancies, though this was not directly in issue.',
      'Payment of tribute, while customary, is not always essential to maintaining the relationship if other forms of acknowledgment exist.',
      'Nigerian courts should be cautious in applying English adverse possession principles to customary land tenure.'
    ],
    fullSummary: 'This is a landmark Supreme Court decision on customary land tenure in Nigeria that established important principles regarding the rights of customary tenants and the limitations of possessory rights.'
  }
}
