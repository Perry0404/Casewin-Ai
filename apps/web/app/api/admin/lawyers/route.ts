import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: lawyers, error } = await getSupabaseClient()
      .from('lawyer_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ lawyers: [], error: error.message })
    }

    // Transform data - use lawyer_profiles own columns directly
    const transformedLawyers = (lawyers || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      full_name: l.full_name || 'Unknown',
      email: l.email || '',
      location: l.location || '',
      bar_number: l.bar_number || '',
      specializations: l.specializations || [],
      is_verified: l.is_verified || false,
      years_of_experience: l.years_of_experience || 0,
      hourly_rate: l.hourly_rate || 0
    }))

    return NextResponse.json({ lawyers: transformedLawyers })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ lawyers: [], error: 'Failed to fetch lawyers' })
  }
}


