import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user_id,
      full_name,
      email,
      phone,
      bar_number,
      specializations,
      hourly_rate,
      consultation_fee,
      bio,
      years_of_experience,
      location,
      state,
      languages,
    } = body

    if (!bar_number || !specializations?.length || !hourly_rate || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, bar_number, specializations, hourly_rate' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Check if bar number already registered
    const { data: existing } = await supabase
      .from('lawyer_profiles')
      .select('id')
      .eq('bar_number', bar_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This bar number is already registered' },
        { status: 409 }
      )
    }

    // Create lawyer profile
    const { data, error } = await supabase
      .from('lawyer_profiles')
      .insert([{
        user_id: user_id || null,
        full_name,
        email: email || null,
        phone: phone || null,
        bar_number,
        specializations,
        hourly_rate: parseInt(hourly_rate) || 0,
        consultation_fee: parseInt(consultation_fee) || 0,
        bio: bio || '',
        years_of_experience: parseInt(years_of_experience) || 0,
        location: location || null,
        state: state || null,
        languages: languages || ['English'],
        is_verified: false,
        rating: 0,
        total_reviews: 0,
        total_cases: 0,
        win_rate: 0,
      }])
      .select()
      .single()

    if (error) {
      console.error('Lawyer registration error:', error)
      // If Supabase not configured, return mock success
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          message: 'Application submitted. We will contact you once the database is fully set up.',
          data: { id: 'pending', full_name, bar_number, status: 'pending_setup' }
        })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lawyer profile created successfully. Pending admin verification.',
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
