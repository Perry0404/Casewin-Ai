import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
const NGN_PER_USD = 1600

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

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

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        wallet: { user_email: email, naira_balance: 0, total_deposits: 0, total_withdrawals: 0 },
        mock: true
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get or create wallet record
    let { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (error && error.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({ user_email: email, naira_balance: 0 })
        .select()
        .single()
      if (createError) throw createError
      wallet = newWallet
    } else if (error) {
      throw error
    }

    // If user has a ZendFi sub-account, fetch real USDC balance from ZendFi
    // NOTE: This is shown as a separate "deposited" balance, but does NOT
    // overwrite naira_balance. The local naira_balance is the source of truth
    // for platform operations (bets, payouts, withdrawals).
    let zendfiBalance = null
    if (wallet?.zendfi_subaccount_id && zendfiApiKey) {
      try {
        const balRes = await fetch(
          `${ZENDFI_BASE}/subaccounts/${wallet.zendfi_subaccount_id}/balance`,
          { headers: { 'Authorization': `Bearer ${zendfiApiKey}` } }
        )
        if (balRes.ok) {
          const balData = await balRes.json()
          const usdcBalance = balData.usdc_balance || balData.data?.usdc_balance || 0
          const solBalance = balData.sol_balance || balData.data?.sol_balance || 0
          const nairaFromUsdc = Math.round(usdcBalance * NGN_PER_USD)

          zendfiBalance = {
            usdc: usdcBalance,
            sol: solBalance,
            naira_equivalent: nairaFromUsdc
          }

          // Only credit the wallet if ZendFi balance is HIGHER than what we've
          // already tracked — this means a new deposit arrived that wasn't
          // picked up by the webhook. We add the DIFFERENCE, not overwrite.
          const trackedZendfi = wallet.zendfi_synced_usdc || 0
          if (usdcBalance > trackedZendfi) {
            const newUsdc = usdcBalance - trackedZendfi
            const newNaira = Math.round(newUsdc * NGN_PER_USD)
            const updatedBalance = (wallet.naira_balance || 0) + newNaira

            await supabase
              .from('user_wallets')
              .update({
                naira_balance: updatedBalance,
                zendfi_synced_usdc: usdcBalance,
                updated_at: new Date().toISOString()
              })
              .eq('user_email', email)
            wallet = { ...wallet, naira_balance: updatedBalance, zendfi_synced_usdc: usdcBalance }
          }
        }
      } catch (err) {
        console.error('Failed to fetch ZendFi sub-account balance:', err)
      }
    }

    return NextResponse.json({ wallet, zendfi_balance: zendfiBalance })
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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
