import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lawyer_id, is_verified } = body

    if (!lawyer_id || typeof is_verified !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await getSupabaseClient()
      .from('lawyer_profiles')
      .update({
        is_verified,
        verification_date: is_verified ? new Date().toISOString() : null
      })
      .eq('id', lawyer_id)

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: is_verified ? 'Lawyer verified' : 'Verification removed' 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to update lawyer' }, { status: 500 })
  }
}


