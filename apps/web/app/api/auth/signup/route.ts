import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Use service role to bypass RLS for profile/wallet creation
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, userType } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const validTypes = ['client', 'lawyer', 'law_firm']
    const safeUserType = validTypes.includes(userType) ? userType : 'client'

    const admin = getAdmin()

    // Step 1: Create user via auth (trigger may or may not work)
    const { data, error } = await admin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          user_type: safeUserType,
        },
      },
    })

    if (error) {
      // Check for duplicate user
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please sign in instead.' 
        }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    const userId = data?.user?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 })
    }

    // Step 2: Manually ensure profile exists (bypasses trigger issues)
    try {
      await admin
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName || '',
          user_type: safeUserType,
        }, { onConflict: 'id' })
    } catch (e) {
      console.error('Profile upsert fallback error:', e)
    }

    // Step 3: Manually ensure wallet exists
    try {
      await admin
        .from('wallets')
        .upsert({
          user_id: userId,
          balance: 0,
          currency: 'NGN',
        }, { onConflict: 'user_id' })
    } catch (e) {
      console.error('Wallet upsert fallback error:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: data.user,
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'An unexpected error occurred' }, { status: 500 })
  }
}


