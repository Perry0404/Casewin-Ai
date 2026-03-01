import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/agents/base-agent';

const DOCUMENT_TEMPLATES = {
  nda: 'Non-Disclosure Agreement (NDA)',
  employment: 'Employment Contract',
  tenancy: 'Tenancy Agreement',
  partnership: 'Partnership Agreement',
  demand_letter: 'Legal Demand Letter',
  affidavit: 'Sworn Affidavit',
  power_of_attorney: 'Power of Attorney',
  memorandum: 'Memorandum of Understanding (MOU)',
  sale_agreement: 'Sale Agreement',
  service_agreement: 'Service Level Agreement',
};

export async function POST(req: NextRequest) {
  try {
    const { documentType, details } = await req.json();
    if (!documentType || !details) {
      return NextResponse.json({ error: 'Document type and details are required' }, { status: 400 });
    }

    const templateName = DOCUMENT_TEMPLATES[documentType as keyof typeof DOCUMENT_TEMPLATES] || documentType;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a Nigerian legal document drafting AI. Generate a professional ${templateName} under Nigerian law.
Include proper legal formatting, clauses, and placeholders ([PARTY_NAME], [DATE], [ADDRESS], etc.) where specific info is needed.
The document should be legally sound under Nigerian jurisdiction and follow standard legal drafting conventions.
Include relevant Nigerian legal references where applicable (e.g., relevant Acts, regulations).
Start with the document title and use proper numbered sections.`
      },
      {
        role: 'user' as const,
        content: `Generate a ${templateName} with these details:\n${JSON.stringify(details, null, 2)}`
      }
    ];

    const document = await callLLM(messages, 0.2);

    return NextResponse.json({
      success: true,
      document: {
        type: documentType,
        title: templateName,
        content: document,
        generatedAt: new Date().toISOString(),
        disclaimer: 'This AI-generated document is for reference only. Please have it reviewed by a qualified Nigerian lawyer before use.',
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Document generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    templates: Object.entries(DOCUMENT_TEMPLATES).map(([key, name]) => ({
      id: key,
      name,
    }))
  });
}
