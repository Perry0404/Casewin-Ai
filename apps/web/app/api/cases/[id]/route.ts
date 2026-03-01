import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/cases/[id] — Get full case details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()

    const { data: caseData, error } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Also fetch related cases (same category or cited cases)
    const { data: relatedCases } = await supabase
      .from('legal_cases')
      .select('id, case_title, citation, court, year, category, holding')
      .eq('category', caseData.category)
      .neq('id', caseData.id)
      .limit(5)

    return NextResponse.json({
      ...caseData,
      related_cases: relatedCases || []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    )
  }
}
