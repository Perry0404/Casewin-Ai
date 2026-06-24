import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const location = searchParams.get('location')
    const id = searchParams.get('id')

    // A single profile is fetched by id (for the lawyer detail page) and is
    // returned regardless of verification; the public list shows verified only.
    let query = getSupabaseClient().from('lawyer_profiles').select('*')
    query = id ? query.eq('id', id) : query.eq('is_verified', true).order('rating', { ascending: false })

    const { data: lawyerProfiles, error: lawyerError } = await query

    if (lawyerError) {
      console.error('getSupabaseClient() error:', lawyerError)
      return NextResponse.json({ success: false, lawyers: [], error: lawyerError.message })
    }

    // Transform and filter data - use lawyer_profiles own columns. Columns that
    // may not exist (education, courts_of_practice) fall back safely.
    let lawyers = (lawyerProfiles || []).map(lp => ({
      id: lp.id,
      user_id: lp.user_id,
      full_name: lp.full_name || 'Anonymous Lawyer',
      email: lp.email || '',
      bio: lp.bio || '',
      location: lp.location || 'Nigeria',
      state: lp.state || '',
      avatar_url: lp.avatar_url || '',
      bar_number: lp.bar_number || '',
      bar_enrollment_number: lp.bar_number || '',
      education: lp.education || '',
      languages: lp.languages || [],
      courts_of_practice: lp.courts_of_practice || [],
      years_of_experience: lp.years_of_experience || 0,
      specializations: lp.specializations || [],
      hourly_rate: lp.hourly_rate || 10000,
      consultation_fee: lp.consultation_fee || 5000,
      rating: lp.rating || 0,
      total_reviews: lp.total_reviews || 0,
      is_verified: lp.is_verified || false
    }))

    // Filter by specialty if provided
    if (specialty && specialty !== 'all') {
      lawyers = lawyers.filter(l => 
        l.specializations.some((s: string) => 
          s.toLowerCase().includes(specialty.toLowerCase())
        )
      )
    }

    // Filter by location if provided
    if (location && location !== 'all') {
      lawyers = lawyers.filter(l => 
        l.location.toLowerCase().includes(location.toLowerCase())
      )
    }

    return NextResponse.json({ success: true, lawyers })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ lawyers: [], error: 'Failed to fetch lawyers' })
  }
}


