import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function getAuthUser(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/wallet - Get authenticated user's wallet balance
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = authUser.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // If no Supabase configured, return mock wallet
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        wallet: {
          user_email: email,
          naira_balance: 0,
          total_deposits: 0,
          total_withdrawals: 0
        },
        mock: true
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get or create wallet
    let { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (error && error.code === 'PGRST116') {
      // Wallet doesn't exist, create it
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_email: email,
          naira_balance: 0
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      wallet = newWallet
    } else if (error) {
      throw error
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}

// POST /api/wallet - Update wallet balance (internal use)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, transaction_type, notes } = body
    const email = authUser.email

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        message: 'Mock wallet update (Supabase not configured)',
        mock: true
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // If connecting a crypto wallet, save the address
    if (transaction_type === 'wallet_connect' && notes) {
      const walletAddress = notes
      const { error: addrErr } = await supabase
        .from('user_wallets')
        .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
        .eq('user_email', email)
      if (!addrErr) {
        return NextResponse.json({ success: true, wallet_address: walletAddress })
      }
    }

    if (!amount || !transaction_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Calculate new balance (amount is in kobo)
    const newBalance = wallet.naira_balance + amount

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Update wallet
    await supabase
      .from('user_wallets')
      .update({
        naira_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', email)

    // Record transaction
    await supabase.from('wallet_transactions').insert({
      user_email: email,
      amount,
      transaction_type,
      balance_after: newBalance,
      notes
    })

    return NextResponse.json({
      success: true,
      new_balance: newBalance
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    )
  }
}
