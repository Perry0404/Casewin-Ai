import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ============================================================
// BASE CHAIN CONFIG (read at runtime, not build time)
// ============================================================
const USDC_BASE_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base

function getConfig() {
  return {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    DEPOSIT_WALLET: process.env.BASE_DEPOSIT_WALLET || '0xcc759988e6e7476ba34bbb2e7ea8ad4d47f3550e',
    ETH_NGN_RATE: parseFloat(process.env.ETH_NGN_RATE || '5500000'),
    USDC_NGN_RATE: parseFloat(process.env.USDC_NGN_RATE || '1571'),
  }
}

// Minimum deposits
const MIN_ETH_DEPOSIT = 0.0005 // ~$1.75
const MIN_USDC_DEPOSIT = 1 // $1

// ERC-20 Transfer event signature
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ============================================================
// BASE JSON-RPC HELPERS (zero dependencies)
// ============================================================
async function rpcCall(method: string, params: any[], rpcUrl?: string): Promise<any> {
  const url = rpcUrl || process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result
}

function hexToNumber(hex: string): number {
  return parseInt(hex, 16)
}

function hexToWei(hex: string): bigint {
  return BigInt(hex)
}

function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18
}

function hexToUSDC(hex: string): number {
  // USDC has 6 decimals
  return Number(BigInt(hex)) / 1e6
}

// ============================================================
// GET — Deposit info (wallet address, rates, supported tokens)
// ============================================================
export async function GET() {
  const { DEPOSIT_WALLET, ETH_NGN_RATE, USDC_NGN_RATE } = getConfig()
  
  const response = NextResponse.json({
    chain: 'Base',
    chainId: 8453,
    depositAddress: DEPOSIT_WALLET,
    _debug: {
      hasWallet: !!DEPOSIT_WALLET,
      walletLength: DEPOSIT_WALLET.length,
      deployedAt: '2026-03-11T15:30:00Z',
    },
    supportedTokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        ngnRate: ETH_NGN_RATE,
        minDeposit: MIN_ETH_DEPOSIT,
        icon: '⟠',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        contract: USDC_BASE_CONTRACT,
        ngnRate: USDC_NGN_RATE,
        minDeposit: MIN_USDC_DEPOSIT,
        icon: '💲',
      },
    ],
    instructions: [
      'Send ETH or USDC on Base network to the deposit address',
      'After sending, paste your transaction hash below to verify',
      'Funds will be credited to your CaseWin wallet in ₦ (Naira)',
      'Minimum: 0.0005 ETH or 1 USDC',
    ],
    network: {
      name: 'Base Mainnet',
      rpc: 'https://mainnet.base.org',
      explorer: 'https://basescan.org',
      bridgeUrl: 'https://bridge.base.org',
    },
  })
  
  // Force no-cache on this response
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  return response
}

// ============================================================
// POST — Verify deposit transaction and credit wallet
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { DEPOSIT_WALLET, BASE_RPC_URL, ETH_NGN_RATE, USDC_NGN_RATE } = getConfig()
    
    // Verify user session from cookies (not from request body)
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null
    
    const body = await request.json()
    const { txHash } = body

    if (!txHash || !txHash.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid transaction hash (0x...) is required' }, { status: 400 })
    }

    if (!DEPOSIT_WALLET) {
      return NextResponse.json(
        { error: 'Deposit wallet not configured. Contact admin.' },
        { status: 500 }
      )
    }

    const admin = getAdmin()

    // Check if this tx has already been processed
    const { data: existingTx } = await admin
      .from('base_deposits')
      .select('id')
      .eq('tx_hash', txHash.toLowerCase())
      .single()

    if (existingTx) {
      return NextResponse.json(
        { error: 'This transaction has already been credited' },
        { status: 400 }
      )
    }

    // Fetch transaction from Base chain via JSON-RPC
    let tx: any
    let receipt: any
    try {
      tx = await rpcCall('eth_getTransactionByHash', [txHash])
      receipt = await rpcCall('eth_getTransactionReceipt', [txHash])
    } catch (err) {
      return NextResponse.json(
        { error: 'Transaction not found on Base chain. Make sure you sent on Base network.' },
        { status: 404 }
      )
    }

    if (!tx || !receipt) {
      return NextResponse.json(
        { error: 'Transaction not found. It may still be pending — try again in a moment.' },
        { status: 404 }
      )
    }

    if (receipt.status !== '0x1') {
      return NextResponse.json(
        { error: 'Transaction failed on-chain' },
        { status: 400 }
      )
    }

    // Determine if ETH transfer or USDC transfer
    let tokenSymbol = ''
    let amount = 0
    let ngnAmount = 0
    const depositAddr = DEPOSIT_WALLET.toLowerCase()

    // Check for native ETH transfer
    if (tx.to?.toLowerCase() === depositAddr && tx.value && hexToWei(tx.value) > 0n) {
      const ethAmount = weiToEth(hexToWei(tx.value))
      if (ethAmount < MIN_ETH_DEPOSIT) {
        return NextResponse.json(
          { error: `ETH deposit below minimum (${MIN_ETH_DEPOSIT} ETH)` },
          { status: 400 }
        )
      }
      tokenSymbol = 'ETH'
      amount = ethAmount
      ngnAmount = Math.floor(ethAmount * ETH_NGN_RATE)
    }

    // Check for USDC transfer (ERC-20 Transfer event)
    if (!tokenSymbol && receipt.logs) {
      for (const log of receipt.logs) {
        if (
          log.address?.toLowerCase() === USDC_BASE_CONTRACT.toLowerCase() &&
          log.topics?.[0] === TRANSFER_TOPIC
        ) {
          // topics[2] is the 'to' address (padded to 32 bytes)
          const toAddr = '0x' + log.topics[2]?.slice(26)
          if (toAddr.toLowerCase() === depositAddr) {
            const usdcAmount = hexToUSDC(log.data)
            if (usdcAmount < MIN_USDC_DEPOSIT) {
              return NextResponse.json(
                { error: `USDC deposit below minimum ($${MIN_USDC_DEPOSIT})` },
                { status: 400 }
              )
            }
            tokenSymbol = 'USDC'
            amount = usdcAmount
            ngnAmount = Math.floor(usdcAmount * USDC_NGN_RATE)
            break
          }
        }
      }
    }

    if (!tokenSymbol || amount <= 0) {
      return NextResponse.json(
        { error: 'No valid deposit found to our wallet in this transaction. Ensure you sent ETH or USDC on Base to the correct address.' },
        { status: 400 }
      )
    }

    // Get block timestamp
    const block = await rpcCall('eth_getBlockByNumber', [receipt.blockNumber, false])
    const blockTime = block?.timestamp
      ? new Date(hexToNumber(block.timestamp) * 1000).toISOString()
      : new Date().toISOString()

    // Record the deposit
    await admin.from('base_deposits').insert({
      tx_hash: txHash.toLowerCase(),
      user_id: userId || null,
      from_address: tx.from.toLowerCase(),
      token: tokenSymbol,
      amount: amount,
      ngn_amount: ngnAmount,
      rate_used: tokenSymbol === 'ETH' ? ETH_NGN_RATE : USDC_NGN_RATE,
      block_number: hexToNumber(receipt.blockNumber),
      block_time: blockTime,
      status: 'confirmed',
    })

    // Credit user's wallet if userId provided
    if (userId) {
      const { data: existing } = await admin
        .from('user_balances')
        .select('balance, total_deposited')
        .eq('user_id', userId)
        .single()

      const currentBalance = existing?.balance || 0
      const totalDeposited = existing?.total_deposited || 0

      await admin.from('user_balances').upsert(
        {
          user_id: userId,
          balance: currentBalance + ngnAmount,
          total_deposited: totalDeposited + ngnAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      // Record wallet transaction
      await admin.from('wallet_transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount: ngnAmount,
        balance_after: currentBalance + ngnAmount,
        description: `Base ${tokenSymbol} deposit: ${amount} ${tokenSymbol} → ₦${ngnAmount.toLocaleString()} (TX: ${txHash.slice(0, 10)}...)`,
      })
    }

    return NextResponse.json({
      success: true,
      deposit: {
        txHash,
        token: tokenSymbol,
        amount,
        ngnAmount,
        rate: tokenSymbol === 'ETH' ? ETH_NGN_RATE : USDC_NGN_RATE,
        blockNumber: hexToNumber(receipt.blockNumber),
        explorerUrl: `https://basescan.org/tx/${txHash}`,
      },
      message: `✅ ${amount} ${tokenSymbol} deposited → ₦${ngnAmount.toLocaleString()} credited to your wallet`,
    })
  } catch (error: any) {
    console.error('Base deposit error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify deposit' },
      { status: 500 }
    )
  }
}
