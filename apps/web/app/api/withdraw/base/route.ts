import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// BASE CHAIN WITHDRAWAL API
// Users request withdrawals → balance is debited instantly
// Admin processes on-chain transfers (no private key on server)
// ============================================================

const USDC_NGN_RATE = parseFloat(process.env.USDC_NGN_RATE || '1571')
const ETH_NGN_RATE = parseFloat(process.env.ETH_NGN_RATE || '5500000')

// Minimum withdrawals
const MIN_WITHDRAWAL_NGN = 5000 // ~$3.20 worth
const WITHDRAWAL_FEE_PERCENT = 1.5 // 1.5% fee

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Validate Base address (0x + 40 hex chars)
function isValidBaseAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

// ============================================================
// GET — Withdrawal info (fees, limits, user history)
// ============================================================
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')

  const response: any = {
    chain: 'Base',
    chainId: 8453,
    supportedTokens: ['ETH', 'USDC'],
    minWithdrawalNGN: MIN_WITHDRAWAL_NGN,
    feePercent: WITHDRAWAL_FEE_PERCENT,
    rates: {
      ETH: { ngnRate: ETH_NGN_RATE, symbol: 'ETH', icon: '⟠' },
      USDC: { ngnRate: USDC_NGN_RATE, symbol: 'USDC', icon: '💲' },
    },
    estimatedProcessingTime: '5-30 minutes',
    note: 'Withdrawals are processed manually for security. You will receive your crypto on Base network.',
  }

  // If userId provided, fetch their withdrawal history
  if (userId) {
    const admin = getAdmin()
    const { data: withdrawals } = await admin
      .from('base_withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    response.history = withdrawals || []
  }

  return NextResponse.json(response)
}

// ============================================================
// POST — Request a withdrawal
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, toAddress, token, ngnAmount } = body

    // Validate inputs
    if (!userId) {
      return NextResponse.json({ error: 'You must be logged in to withdraw' }, { status: 401 })
    }

    if (!toAddress || !isValidBaseAddress(toAddress)) {
      return NextResponse.json(
        { error: 'Invalid Base wallet address. Must be 0x followed by 40 hex characters.' },
        { status: 400 }
      )
    }

    if (!token || !['ETH', 'USDC'].includes(token.toUpperCase())) {
      return NextResponse.json({ error: 'Token must be ETH or USDC' }, { status: 400 })
    }

    const withdrawNGN = parseFloat(ngnAmount)
    if (!withdrawNGN || withdrawNGN < MIN_WITHDRAWAL_NGN) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL_NGN.toLocaleString()}` },
        { status: 400 }
      )
    }

    const admin = getAdmin()

    // Get user's current balance
    const { data: userBalance, error: balError } = await admin
      .from('user_balances')
      .select('balance, total_withdrawn')
      .eq('user_id', userId)
      .single()

    if (balError || !userBalance) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (userBalance.balance < withdrawNGN) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ₦${userBalance.balance.toLocaleString()} but requested ₦${withdrawNGN.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Calculate fee and crypto amount
    const fee = Math.ceil(withdrawNGN * WITHDRAWAL_FEE_PERCENT / 100)
    const netNGN = withdrawNGN - fee
    const selectedToken = token.toUpperCase()
    const rate = selectedToken === 'ETH' ? ETH_NGN_RATE : USDC_NGN_RATE
    const cryptoAmount = selectedToken === 'ETH'
      ? parseFloat((netNGN / rate).toFixed(8))
      : parseFloat((netNGN / rate).toFixed(2))

    // Check for pending withdrawals to prevent double-spend
    const { data: pendingWithdrawals } = await admin
      .from('base_withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (pendingWithdrawals && pendingWithdrawals.length >= 3) {
      return NextResponse.json(
        { error: 'You have too many pending withdrawals. Please wait for them to process.' },
        { status: 400 }
      )
    }

    // Debit balance immediately
    const newBalance = userBalance.balance - withdrawNGN
    const { error: updateError } = await admin
      .from('user_balances')
      .update({
        balance: newBalance,
        total_withdrawn: (userBalance.total_withdrawn || 0) + withdrawNGN,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to debit wallet' }, { status: 500 })
    }

    // Create withdrawal record
    const { data: withdrawal, error: insertError } = await admin
      .from('base_withdrawals')
      .insert({
        user_id: userId,
        to_address: toAddress.toLowerCase(),
        token: selectedToken,
        crypto_amount: cryptoAmount,
        ngn_amount: withdrawNGN,
        fee_ngn: fee,
        net_ngn: netNGN,
        rate_used: rate,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      // Refund on failure
      await admin
        .from('user_balances')
        .update({
          balance: userBalance.balance,
          total_withdrawn: userBalance.total_withdrawn || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    // Record wallet transaction
    await admin.from('wallet_transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount: -withdrawNGN,
      balance_after: newBalance,
      description: `Base withdrawal: ₦${withdrawNGN.toLocaleString()} → ${cryptoAmount} ${selectedToken} to ${toAddress.slice(0, 8)}...${toAddress.slice(-4)} (fee: ₦${fee.toLocaleString()})`,
    })

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        toAddress,
        token: selectedToken,
        cryptoAmount,
        ngnAmount: withdrawNGN,
        fee,
        netNGN,
        rate,
        status: 'pending',
        estimatedTime: '5-30 minutes',
      },
      newBalance,
      message: `✅ Withdrawal requested: ${cryptoAmount} ${selectedToken} to ${toAddress.slice(0, 8)}...${toAddress.slice(-4)}. Processing shortly.`,
    })
  } catch (error: any) {
    console.error('Base withdrawal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}
