import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/agents/base-agent';

export async function POST(req: NextRequest) {
  try {
    const { caseDescription, budget, urgency, location } = await req.json();
    if (!caseDescription) {
      return NextResponse.json({ error: 'Case description is required' }, { status: 400 });
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are a Nigerian legal AI assistant that matches clients with the best lawyers.
Given a case description, analyze the legal issues and recommend:
1. The most relevant legal specialization(s)
2. Key factors for choosing a lawyer
3. Estimated complexity (simple/moderate/complex)
4. Recommended experience level (junior: 1-3 years / mid: 4-8 years / senior: 9+ years)
5. Priority actions the client should take

Respond in JSON format:
{
  "specializations": ["Primary Area", "Secondary Area"],
  "complexity": "simple|moderate|complex",
  "experienceLevel": "junior|mid|senior",
  "keyFactors": ["factor1", "factor2"],
  "priorityActions": ["action1", "action2"],
  "estimatedTimeline": "e.g. 2-4 weeks",
  "riskAssessment": "brief risk overview",
  "summary": "brief case analysis"
}`
      },
      {
        role: 'user' as const,
        content: `Case Description: ${caseDescription}\nBudget: ${budget || 'Not specified'}\nUrgency: ${urgency || 'Normal'}\nLocation: ${location || 'Nigeria'}`
      }
    ];

    const result = await callLLM(messages, 0.3);
    let analysis;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: result, specializations: ['General Practice'] };
    } catch {
      analysis = { summary: result, specializations: ['General Practice'], complexity: 'moderate', experienceLevel: 'mid', keyFactors: [], priorityActions: [], estimatedTimeline: 'Varies', riskAssessment: 'Consult a lawyer for detailed assessment' };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI matching failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
