import { NextRequest, NextResponse } from 'next/server'
import { generateWithXAI } from '@/lib/xai'

export async function POST(req: NextRequest) {
  try {
    const { casePosition, caseFacts, legalIssues, opposingArguments } = await req.json()

    const position = casePosition === 'plaintiff' ? 'Plaintiff/Claimant' : 'Defendant/Respondent'

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service not configured. Please set XAI_API_KEY.' }, { status: 500 })
    }

    const systemPrompt = `You are an expert Nigerian litigation lawyer with decades of experience in advocacy. You excel at crafting compelling legal arguments supported by Nigerian case law and statutes.`

    const prompt = `Generate legal arguments for the ${position} in this case:

Case Facts: ${caseFacts || 'To be provided'}
Legal Issues: ${legalIssues || 'To be determined'}
${opposingArguments ? `Opposing Arguments to Counter: ${opposingArguments}` : ''}

Please provide:

1. MAIN ARGUMENTS (3-4 strong arguments)
   For each argument:
   - Title/Heading
   - Full argument with legal reasoning
   - Supporting Nigerian case authorities (with proper citations like LPELR, NWLR, SC)
   - Relevant statutory provisions

2. COUNTER-ARGUMENTS
   Anticipate 3 arguments the opposing party might make and provide rebuttals

3. CONCLUSION
   A powerful closing submission

Use formal legal language appropriate for Nigerian courts.`

    const argumentsText = await generateWithXAI(prompt, systemPrompt)

    return NextResponse.json({ 
      success: true, 
      arguments: {
        position: casePosition,
        fullArguments: argumentsText,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Arguments generation error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Argument generation failed' }, { status: 500 })
  }
}

function _unusedMockArguments(casePosition: string) {
  const isPlaintiff = casePosition === 'plaintiff'

  return {
    mainArguments: isPlaintiff ? [
      {
        title: 'Breach of Contractual Obligation',
        content: 'The Defendant has clearly breached the terms of the agreement between the parties. The contract explicitly required performance by the specified date, and the Defendant\'s failure to perform constitutes a material breach entitling the Claimant to damages.',
        authorities: [
          'Yesufu v. ACB Ltd (1976) 4 SC 1 - "A breach of contract occurs when a party fails to perform their obligations"',
          'SCOA (Nig) Ltd v. Bowring (1958) 3 FSC 44 - "Material breach entitles the innocent party to treat the contract as repudiated"',
          'Cardoso v. Executors of Daniel (1986) 2 NWLR (Pt. 20) 1'
        ]
      },
      {
        title: 'Causation and Loss',
        content: 'The Defendant\'s breach directly caused the losses suffered by the Claimant. There is a clear causal link between the breach and the damages claimed. The losses were reasonably foreseeable at the time of contracting.',
        authorities: [
          'Hadley v. Baxendale (1854) 9 Ex 341 - Applied in Nigerian courts for remoteness',
          'Koiki v. Magnusson (1999) 8 NWLR (Pt. 615) 492 - "Damages must flow naturally from the breach"',
          'Victoria Laundry v. Newman Industries (1949) 2 KB 528'
        ]
      },
      {
        title: 'Quantum of Damages',
        content: 'The Claimant is entitled to be placed in the position they would have been in had the contract been properly performed. The damages claimed represent the actual losses suffered and are supported by documentary evidence.',
        authorities: [
          'Robinson v. Harman (1848) 1 Ex 850 - "Damages are compensatory, not punitive"',
          'UTC Nigeria Ltd v. Pamotei (1989) 2 NWLR (Pt. 103) 244',
          'Wema Bank Plc v. Osilaru (2008) 10 NWLR (Pt. 1094) 150'
        ]
      }
    ] : [
      {
        title: 'No Breach Occurred',
        content: 'The Defendant did not breach any contractual obligation. The Defendant performed all obligations as required under the agreement, or alternatively, was excused from performance by the Claimant\'s own conduct or external circumstances.',
        authorities: [
          'Faloughi v. Faloughi (2016) LPELR-40582(CA) - "The burden of proving breach lies on the Claimant"',
          'Onagoruwa v. State (1993) 7 NWLR (Pt. 303) 49',
          'Evidence Act 2011, Sections 131-133'
        ]
      },
      {
        title: 'Contributory Conduct of Claimant',
        content: 'The Claimant\'s own actions contributed to any alleged loss. The Claimant failed to mitigate their losses and/or their own breach or conduct caused the situation complained of.',
        authorities: [
          'British Westinghouse v. Underground Electric (1912) AC 673',
          'Adekunle v. Rockview Hotel (1995) 4 NWLR (Pt. 392) 704 - Duty to mitigate',
          'Pilkington v. Wood (1953) Ch 770'
        ]
      },
      {
        title: 'Damages are Excessive or Unproven',
        content: 'The damages claimed are speculative, excessive, or not supported by evidence. The Claimant has failed to prove the quantum of their alleged losses with sufficient certainty.',
        authorities: [
          'Chaplin v. Hicks (1911) 2 KB 786',
          'Attorney General v. Blake (2001) 1 AC 268',
          'Shell v. Farah (1995) 3 NWLR (Pt. 382) 148 - Proof of damages required'
        ]
      }
    ],
    counterArguments: isPlaintiff ? [
      {
        point: 'The Defendant may argue force majeure or frustration',
        rebuttal: 'Force majeure requires the event to be unforeseeable, unavoidable, and beyond the party\'s control. The circumstances here do not meet this threshold. Moreover, the Defendant did not give timely notice as required by the contract.'
      },
      {
        point: 'The Defendant may claim the contract terms were ambiguous',
        rebuttal: 'The contract terms are clear and unambiguous. In any event, contra proferentem rule applies against the drafter, and the Defendant drafted/proposed these terms.'
      },
      {
        point: 'The Defendant may argue limitation of liability clause',
        rebuttal: 'The limitation clause does not apply to fundamental breach, and/or is unreasonable under the circumstances. Nigerian courts have struck down such clauses where they offend public policy.'
      }
    ] : [
      {
        point: 'The Claimant may argue strict liability under the contract',
        rebuttal: 'Contract terms must be interpreted reasonably. Strict liability was not the parties\' intention, and the Defendant\'s obligations were subject to implied conditions of reasonableness.'
      },
      {
        point: 'The Claimant may present documentary evidence of losses',
        rebuttal: 'The documents should be scrutinized for authenticity and accuracy. The Defendant reserves the right to challenge their admissibility under the Evidence Act 2011.'
      },
      {
        point: 'The Claimant may call witnesses to prove the breach',
        rebuttal: 'Witness testimony should be tested under cross-examination. The Defendant maintains that any witnesses may be biased or their evidence is hearsay and inadmissible.'
      }
    ],
    conclusion: isPlaintiff 
      ? 'In light of the foregoing, we respectfully submit that the Claimant has established a clear case of breach of contract. The Defendant\'s liability is evident from the facts and supported by established legal principles. We urge this Honourable Court to grant the reliefs sought and award costs to the Claimant.'
      : 'In the circumstances, we humbly submit that the Claimant has failed to discharge the burden of proof required to establish the alleged breach. The Defendant has acted in good faith throughout and should not be held liable. We urge this Honourable Court to dismiss the claim with costs.'
  }
}
