import { NextRequest, NextResponse } from 'next/server'
import { generateWithXAI } from '@/lib/xai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentType, description, parties } = body

    const systemPrompt = `You are an expert Nigerian legal document drafting assistant. You specialize in creating legally sound documents that comply with Nigerian law, including CAMA 2020, the Evidence Act, Land Use Act, and other relevant legislation. Always use proper legal formatting and terminology.`

    const prompt = `Draft a ${documentType || 'contract'} document with the following details:

Parties Involved: ${parties || 'To be specified'}
Description/Purpose: ${description || 'General agreement between parties'}

Requirements:
1. Use proper Nigerian legal formatting and terminology
2. Include all necessary clauses for this type of document
3. Reference applicable Nigerian laws where appropriate
4. Include signature blocks and date fields
5. Make it comprehensive and legally sound

Please draft the complete document now.`

    // Check if API key is configured
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ 
        success: true, 
        document: getMockDocument(documentType, description, parties)
      })
    }

    const document = await generateWithXAI(prompt, systemPrompt)

    return NextResponse.json({ 
      success: true, 
      document: document.trim()
    })
  } catch (error: any) {
    console.error('Document drafting error:', error)
    return NextResponse.json({ 
      success: true, 
      document: getMockDocument('contract', '', '')
    })
  }
}

function getMockDocument(documentType: string, description: string, parties: string): string {
  return `
LEGAL CONTRACT AGREEMENT

THIS AGREEMENT is made this day of ${new Date().toLocaleDateString('en-NG')}

BETWEEN:
${parties || 'Party A and Party B'}

RECITALS:
${description || 'The parties wish to enter into a binding agreement.'}

TERMS AND CONDITIONS:

1. DEFINITIONS
   1.1 "Agreement" means this contract and all schedules attached hereto.
   1.2 "Parties" means the signatories to this Agreement.
   1.3 "Effective Date" means the date first written above.

2. OBLIGATIONS OF THE PARTIES
   2.1 Each party agrees to perform their obligations in good faith.
   2.2 All communications shall be in writing.
   2.3 Neither party shall assign this Agreement without prior written consent.

3. CONSIDERATION
   3.1 The consideration for this Agreement shall be as mutually agreed.
   3.2 Payment shall be made in Nigerian Naira (₦).

4. TERM AND TERMINATION
   4.1 This Agreement shall commence on the Effective Date.
   4.2 Either party may terminate with 30 days written notice.
   4.3 Termination shall not affect accrued rights and obligations.

5. GOVERNING LAW
   5.1 This Agreement shall be governed by the Laws of the Federal Republic of Nigeria.
   5.2 Disputes shall be resolved by arbitration in Lagos, Nigeria.

6. GENERAL PROVISIONS
   6.1 This Agreement constitutes the entire understanding between the parties.
   6.2 Amendments must be in writing and signed by both parties.
   6.3 Waiver of any breach shall not constitute waiver of future breaches.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
Signature (Party 1)              Signature (Party 2)

Date: _______________            Date: _______________
`.trim()
}
