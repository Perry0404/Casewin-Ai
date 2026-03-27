import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method, bank_details, wallet_address } = await request.json()
    const email = authUser.email

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦100' }, { status: 400 })
    }

    if (method === 'bank' && (!bank_details?.bank || !bank_details?.account || !bank_details?.name)) {
      return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 })
    }

    if (method === 'crypto' && !wallet_address) {
      return NextResponse.json({ error: 'Base wallet address is required for crypto withdrawal' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 400 })
    }

    if ((wallet.naira_balance || 0) < amount) {
      return NextResponse.json({
        error: `Insufficient balance. You have ₦${(wallet.naira_balance || 0).toLocaleString()} but requested ₦${amount.toLocaleString()}`,
        balance: wallet.naira_balance || 0
      }, { status: 400 })
    }

    // Deduct from wallet
    const newBalance = (wallet.naira_balance || 0) - amount
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        naira_balance: newBalance,
        total_withdrawals: (wallet.total_withdrawals || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', email)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
    }

    // Record wallet transaction
    const txNotes = method === 'bank'
      ? `Bank withdrawal to ${bank_details.bank} - ****${String(bank_details.account).slice(-4)} (${bank_details.name})`
      : `Crypto withdrawal to ${wallet_address}`

    await supabase.from('wallet_transactions').insert({
      user_email: email,
      amount: -amount,
      transaction_type: method === 'bank' ? 'bank_withdrawal' : 'crypto_withdrawal',
      balance_after: newBalance,
      notes: txNotes
    })

    // Create notification for user
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_email: email,
      type: 'withdrawal',
      title: 'Withdrawal Requested',
      message: `₦${amount.toLocaleString()} withdrawal via ${method === 'bank' ? 'bank transfer' : 'Base crypto'} has been submitted. ${method === 'bank' ? 'Funds will arrive within 24 hours.' : 'Crypto will be sent within 1 hour.'}`,
      read: false
    })
    if (notifErr) console.warn('Notification insert failed:', notifErr.message)

    return NextResponse.json({
      success: true,
      message: method === 'bank'
        ? `₦${amount.toLocaleString()} withdrawal to ${bank_details.bank} submitted. Funds will arrive within 24 hours.`
        : `₦${amount.toLocaleString()} equivalent crypto withdrawal to ${wallet_address} submitted. Will be processed within 1 hour.`,
      new_balance: newBalance
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}
