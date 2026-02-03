import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: lawyers, error } = await supabase
      .from('lawyer_profiles')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          location
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ lawyers: [], error: error.message })
    }

    // Transform data
    const transformedLawyers = (lawyers || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      full_name: l.profiles?.full_name || 'Unknown',
      email: l.profiles?.email || '',
      location: l.profiles?.location || '',
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
