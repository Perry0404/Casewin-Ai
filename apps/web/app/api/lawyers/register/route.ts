import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user_id,
      bar_number,
      specializations,
      hourly_rate,
      bio,
      years_of_experience,
      law_firm,
    } = body

    if (!user_id || !bar_number || !specializations || !hourly_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create lawyer profile
    const { data, error } = await getSupabaseClient()
      .from('lawyer_profiles')
      .insert([
        {
          user_id,
          bar_number,
          specializations,
          hourly_rate,
          bio: bio || '',
          years_of_experience: years_of_experience || 0,
          law_firm: law_firm || null,
          is_verified: false, // Will be verified by admin
          rating: 0,
          total_reviews: 0,
          total_cases: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lawyer profile created successfully',
      data
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create lawyer profile' },
      { status: 500 }
    )
  }
}


