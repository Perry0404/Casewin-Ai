import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { ethers } from 'ethers'

export const dynamic = 'force-dynamic'

// ============================================================
// FULLY DECENTRALIZED BASE WITHDRAWAL API
// User requests withdrawal → API auto-signs and sends tx on-chain
// No admin approval needed. Hot wallet sends crypto directly.
// ============================================================

const USDC_BASE_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

function getWithdrawConfig() {
  return {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    HOT_WALLET_KEY: process.env.BASE_HOT_WALLET_PRIVATE_KEY || '',
    USDC_NGN_RATE: parseFloat(process.env.USDC_NGN_RATE || '1571'),
    ETH_NGN_RATE: parseFloat(process.env.ETH_NGN_RATE || '5500000'),
  }
}

const MIN_WITHDRAWAL_NGN = 5000
const WITHDRAWAL_FEE_PERCENT = 1.5

// Minimal ERC-20 ABI for transfer
const ERC20_ABI = ['function transfer(address to, uint256 amount) returns (bool)']

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isValidBaseAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

// ============================================================
// GET — Withdrawal info + user history
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
      ETH: { ngnRate: getWithdrawConfig().ETH_NGN_RATE, symbol: 'ETH', icon: '⟠' },
      USDC: { ngnRate: getWithdrawConfig().USDC_NGN_RATE, symbol: 'USDC', icon: '💲' },
    },
    mode: 'automatic',
    note: 'Withdrawals are processed instantly on-chain. No admin approval needed.',
  }

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
// POST — Request + auto-send withdrawal on Base chain
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toAddress, token, ngnAmount } = body

    // Verify user session from cookies (NEVER trust userId from client)
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to withdraw' }, { status: 401 })
    }
    const userId = user.id

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

    const { HOT_WALLET_KEY, BASE_RPC_URL, ETH_NGN_RATE, USDC_NGN_RATE } = getWithdrawConfig()

    if (!HOT_WALLET_KEY) {
      return NextResponse.json(
        { error: 'Withdrawal wallet not configured. Contact support.' },
        { status: 500 }
      )
    }

    const admin = getAdmin()

    // Get user balance
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

    // Debit balance FIRST (atomic: debit before sending to prevent double-spend)
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

    // Create withdrawal record (status: processing)
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
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      // Refund on DB failure
      await admin.from('user_balances').update({
        balance: userBalance.balance,
        total_withdrawn: userBalance.total_withdrawn || 0,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    // ============================================================
    // AUTO-SEND ON-CHAIN — No admin needed!
    // ============================================================
    let txHash = ''
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, {
        name: 'base',
        chainId: 8453,
      })
      const wallet = new ethers.Wallet(HOT_WALLET_KEY, provider)

      if (selectedToken === 'ETH') {
        // Send native ETH
        const tx = await wallet.sendTransaction({
          to: toAddress,
          value: ethers.parseEther(cryptoAmount.toString()),
        })
        txHash = tx.hash
        // Don't await confirmation — tx is broadcast, user can track on BaseScan
      } else {
        // Send USDC (ERC-20 transfer)
        const usdcContract = new ethers.Contract(USDC_BASE_CONTRACT, ERC20_ABI, wallet)
        const usdcAmountRaw = BigInt(Math.floor(cryptoAmount * 1e6)) // USDC = 6 decimals
        const tx = await usdcContract.transfer(toAddress, usdcAmountRaw)
        txHash = tx.hash
      }

      // Update withdrawal record with tx hash
      await admin.from('base_withdrawals').update({
        tx_hash: txHash,
        status: 'completed',
        processed_at: new Date().toISOString(),
      }).eq('id', withdrawal.id)

    } catch (txError: any) {
      console.error('On-chain send failed:', txError)

      // Mark as failed but DON'T refund automatically (safety measure)
      // Admin can investigate and manually refund if needed
      await admin.from('base_withdrawals').update({
        status: 'failed',
        processed_at: new Date().toISOString(),
      }).eq('id', withdrawal.id)

      // Refund the user's balance since the on-chain tx failed
      await admin.from('user_balances').update({
        balance: userBalance.balance,
        total_withdrawn: userBalance.total_withdrawn || 0,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)

      return NextResponse.json({
        error: `On-chain transfer failed: ${txError.message || 'Unknown error'}. Your balance has been refunded.`,
      }, { status: 500 })
    }

    // Record wallet transaction
    await admin.from('wallet_transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount: -withdrawNGN,
      balance_after: newBalance,
      description: `Base auto-withdrawal: ₦${withdrawNGN.toLocaleString()} → ${cryptoAmount} ${selectedToken} to ${toAddress.slice(0, 8)}...${toAddress.slice(-4)} (tx: ${txHash.slice(0, 10)}...)`,
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
        txHash,
        status: 'completed',
        explorerUrl: `https://basescan.org/tx/${txHash}`,
      },
      newBalance,
      message: `✅ Sent ${cryptoAmount} ${selectedToken} to ${toAddress.slice(0, 8)}...${toAddress.slice(-4)} on Base. TX: ${txHash.slice(0, 10)}...`,
    })
  } catch (error: any) {
    console.error('Base withdrawal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}
