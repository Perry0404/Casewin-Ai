import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const ETH_NGN_RATE = Number(process.env.ETH_NGN_RATE || '5500000') // ~N5.5M per ETH

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

    const { tx_hash, chain } = await request.json()

    if (!tx_hash || chain !== 'base') {
      return NextResponse.json({ error: 'Transaction hash and chain=base required' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify transaction on Base using RPC
    const receiptRes = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [tx_hash],
        id: 1
      })
    })

    const receiptData = await receiptRes.json()
    const receipt = receiptData.result

    if (!receipt) {
      return NextResponse.json({ error: 'Transaction not found. It may still be pending - try again in a minute.' }, { status: 400 })
    }

    if (receipt.status !== '0x1') {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 })
    }

    // Get full transaction details
    const txRes = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [tx_hash],
        id: 1
      })
    })

    const txData = await txRes.json()
    const tx = txData.result

    if (!tx) {
      return NextResponse.json({ error: 'Could not retrieve transaction details' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = authUser.email

    // Per-user wallet: verify the tx came FROM the user's registered wallet address
    const { data: userWallet } = await supabase
      .from('user_wallets')
      .select('wallet_address')
      .eq('user_email', email)
      .single()

    if (userWallet?.wallet_address && tx.from?.toLowerCase() !== userWallet.wallet_address.toLowerCase()) {
      return NextResponse.json({ error: 'Transaction does not match your registered wallet address' }, { status: 400 })
    }

    // Calculate ETH amount and Naira equivalent
    const ethAmount = parseInt(tx.value, 16) / 1e18
    const nairaAmount = Math.floor(ethAmount * ETH_NGN_RATE)

    if (nairaAmount < 100) {
      return NextResponse.json({ error: `Deposit too small. ${ethAmount.toFixed(6)} ETH = N${nairaAmount}. Minimum is N100 equivalent.` }, { status: 400 })
    }

    // Check for duplicate transaction
    const { data: existingTx } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('related_id', tx_hash)
      .single()

    if (existingTx) {
      return NextResponse.json({ error: 'This transaction has already been credited to your account' }, { status: 400 })
    }

    // Get or create wallet
    let { data: wallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    const currentBalance = wallet?.naira_balance || 0
    const newBalance = currentBalance + nairaAmount

    if (wallet) {
      await supabase.from('user_wallets')
        .update({
          naira_balance: newBalance,
          total_deposits: (wallet.total_deposits || 0) + nairaAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', email)
    } else {
      await supabase.from('user_wallets')
        .insert({
          user_email: email,
          naira_balance: nairaAmount,
          total_deposits: nairaAmount
        })
    }

    // Record transaction
    const { error: txErr } = await supabase.from('wallet_transactions').insert({
      user_email: email,
      amount: nairaAmount,
      transaction_type: 'crypto_deposit',
      related_id: tx_hash,
      balance_after: newBalance,
      notes: `Base ETH deposit: ${ethAmount.toFixed(6)} ETH @ N${ETH_NGN_RATE.toLocaleString()}/ETH = N${nairaAmount.toLocaleString()}`
    })
    if (txErr) console.warn('Transaction record failed:', txErr.message)

    // Notification
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_email: email,
      type: 'deposit',
      title: 'Crypto Deposit Confirmed!',
      message: `${ethAmount.toFixed(6)} ETH deposited via Base network. N${nairaAmount.toLocaleString()} credited to your wallet.`,
      read: false
    })
    if (notifErr) console.warn('Notification insert failed:', notifErr.message)

    return NextResponse.json({
      success: true,
      eth_amount: ethAmount,
      naira_credited: nairaAmount,
      new_balance: newBalance,
      tx_hash,
      rate: ETH_NGN_RATE
    })
  } catch (error) {
    console.error('Crypto deposit error:', error)
    return NextResponse.json({ error: 'Failed to process crypto deposit' }, { status: 500 })
  }
}
