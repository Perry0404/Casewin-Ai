import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'casewinadmin2024'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized — wrong admin password' }, { status: 403 })
    }

    const body = await request.json()
    const { lawyer_id, is_verified } = body

    if (!lawyer_id || typeof is_verified !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Database not configured — SUPABASE_SERVICE_ROLE_KEY missing in Vercel env vars' }, { status: 503 })
    }
    // Always create a fresh client with service role key — bypasses RLS
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: lawyerData, error } = await supabase
      .from('lawyer_profiles')
      .update({
        is_verified,
        verification_date: is_verified ? new Date().toISOString() : null
      })
      .eq('id', lawyer_id)
      .select('user_id')
      .single()

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Sync profiles.user_type so LawyerGuard grants/revokes access immediately
    if (lawyerData?.user_id) {
      await supabase
        .from('profiles')
        .update({ user_type: is_verified ? 'lawyer' : 'lawyer_pending' })
        .eq('id', lawyerData.user_id)
    }

    return NextResponse.json({ 
      success: true, 
      message: is_verified ? 'Lawyer verified and granted tool access' : 'Verification removed' 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to update lawyer' }, { status: 500 })
  }
}


