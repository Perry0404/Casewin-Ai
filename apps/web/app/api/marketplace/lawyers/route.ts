import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const location = searchParams.get('location')

    // Get all lawyer profiles with their user profile data
    const { data: lawyerProfiles, error: lawyerError } = await getSupabaseClient()
      .from('lawyer_profiles')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          bio,
          location,
          avatar_url
        )
      `)
      .order('rating', { ascending: false })

    if (lawyerError) {
      console.error('getSupabaseClient() error:', lawyerError)
      return NextResponse.json({ lawyers: [], error: lawyerError.message })
    }

    // Transform and filter data
    let lawyers = (lawyerProfiles || []).map(lp => ({
      id: lp.id,
      user_id: lp.user_id,
      full_name: lp.profiles?.full_name || 'Anonymous Lawyer',
      email: lp.profiles?.email || '',
      bio: lp.profiles?.bio || '',
      location: lp.profiles?.location || 'Nigeria',
      avatar_url: lp.profiles?.avatar_url || '',
      bar_number: lp.bar_number || '',
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

    return NextResponse.json({ lawyers })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ lawyers: [], error: 'Failed to fetch lawyers' })
  }
}


