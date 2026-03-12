import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createUserWallet, getWalletBalance, transferFromWallet } from '@/lib/cdp'
import { getLiveRates } from '@/lib/rates'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ============================================================
// GET — Get or create user's CDP embedded wallet
// Returns their unique Base deposit address + on-chain balance
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getAdmin()

    // Check if user already has a CDP wallet
    const { data: existing } = await admin
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Wallet exists — return address + fetch on-chain balance
      let onChainBalance = null
      try {
        onChainBalance = await getWalletBalance(existing.cdp_wallet_id, existing.wallet_seed)
      } catch (e) {
        console.error('Failed to fetch on-chain balance:', e)
      }

      // Also get DB balance (for trading)
      const { data: dbBalance } = await admin
        .from('user_balances')
        .select('balance, total_deposited, total_withdrawn')
        .eq('user_id', user.id)
        .single()

      return NextResponse.json({
        walletAddress: existing.wallet_address,
        cdpWalletId: existing.cdp_wallet_id,
        createdAt: existing.created_at,
        onChainBalance: onChainBalance || { eth: 0, usdc: 0, ethNGN: 0, usdcNGN: 0, totalNGN: 0 },
        tradingBalance: dbBalance?.balance || 0,
        totalDeposited: dbBalance?.total_deposited || 0,
        totalWithdrawn: dbBalance?.total_withdrawn || 0,
        chain: 'Base',
        chainId: 8453,
        explorer: `https://basescan.org/address/${existing.wallet_address}`,
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    // No wallet yet — create one via CDP
    const { walletId, address, seed } = await createUserWallet()

    // Store wallet data in DB
    await admin.from('user_wallets').insert({
      user_id: user.id,
      cdp_wallet_id: walletId,
      wallet_address: address.toLowerCase(),
      wallet_seed: seed, // encrypted seed for re-importing
      network: 'base-mainnet',
    })

    // Create user_balances row if it doesn't exist
    await admin.from('user_balances').upsert(
      {
        user_id: user.id,
        balance: 0,
        total_deposited: 0,
        total_withdrawn: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.json({
      walletAddress: address.toLowerCase(),
      cdpWalletId: walletId,
      createdAt: new Date().toISOString(),
      onChainBalance: { eth: 0, usdc: 0, ethNGN: 0, usdcNGN: 0, totalNGN: 0 },
      tradingBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      chain: 'Base',
      chainId: 8453,
      explorer: `https://basescan.org/address/${address.toLowerCase()}`,
      isNew: true,
      message: '🎉 Your personal Base wallet has been created! Send USDC or ETH to your address below.',
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error: any) {
    console.error('CDP wallet error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get/create wallet' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST — Sync on-chain balance to trading balance
// User calls this after depositing crypto to their wallet
// Reads on-chain balance and credits the difference to DB
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const admin = getAdmin()

    // Get user's CDP wallet
    const { data: wallet } = await admin
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: 'No wallet found. Create one first via GET.' }, { status: 404 })
    }

    if (action === 'sync') {
      // ===== SYNC: Read on-chain balance and credit difference to DB =====
      const onChain = await getWalletBalance(wallet.cdp_wallet_id, wallet.wallet_seed)

      // Get last synced on-chain amounts
      const lastSyncedETH = parseFloat(wallet.last_synced_eth || '0')
      const lastSyncedUSDC = parseFloat(wallet.last_synced_usdc || '0')

      // Calculate new deposits since last sync (using live rates)
      const rates = await getLiveRates()
      const newETH = Math.max(0, onChain.eth - lastSyncedETH)
      const newUSDC = Math.max(0, onChain.usdc - lastSyncedUSDC)
      const newNGN = Math.floor(newETH * rates.ethNGN)
        + Math.floor(newUSDC * rates.usdcNGN)

      if (newNGN > 0) {
        // Credit trading balance
        const { data: currentBalance } = await admin
          .from('user_balances')
          .select('balance, total_deposited')
          .eq('user_id', user.id)
          .single()

        const newBalance = (currentBalance?.balance || 0) + newNGN
        await admin.from('user_balances').upsert(
          {
            user_id: user.id,
            balance: newBalance,
            total_deposited: (currentBalance?.total_deposited || 0) + newNGN,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

        // Update last synced amounts
        await admin.from('user_wallets').update({
          last_synced_eth: onChain.eth.toString(),
          last_synced_usdc: onChain.usdc.toString(),
          last_synced_at: new Date().toISOString(),
        }).eq('user_id', user.id)

        // Record transaction
        await admin.from('wallet_transactions').insert({
          user_id: user.id,
          type: 'deposit_sync',
          amount: newNGN,
          balance_after: newBalance,
          description: `Auto-sync: ${newETH > 0 ? `${newETH.toFixed(6)} ETH` : ''}${newETH > 0 && newUSDC > 0 ? ' + ' : ''}${newUSDC > 0 ? `${newUSDC.toFixed(2)} USDC` : ''} → ₦${newNGN.toLocaleString()}`,
        })

        return NextResponse.json({
          success: true,
          credited: newNGN,
          newBalance,
          onChainBalance: onChain,
          message: `✅ ₦${newNGN.toLocaleString()} credited to your trading balance!`,
        })
      }

      return NextResponse.json({
        success: true,
        credited: 0,
        onChainBalance: onChain,
        message: 'No new deposits detected. Send USDC or ETH to your wallet address first.',
      })
    }

    if (action === 'withdraw') {
      // ===== WITHDRAW: Send from user's CDP wallet to external address =====
      const { toAddress, token, amount } = body

      if (!toAddress || !/^0x[0-9a-fA-F]{40}$/.test(toAddress)) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
      }

      const result = await transferFromWallet(
        wallet.cdp_wallet_id,
        wallet.wallet_seed,
        toAddress,
        amount,
        token?.toLowerCase() || 'usdc'
      )

      return NextResponse.json({
        success: true,
        txHash: result.txHash,
        status: result.status,
        explorerUrl: `https://basescan.org/tx/${result.txHash}`,
        message: `✅ Sent ${amount} ${token || 'USDC'} to ${toAddress.slice(0, 8)}...`,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "sync" or "withdraw".' }, { status: 400 })
  } catch (error: any) {
    console.error('CDP wallet action error:', error)
    return NextResponse.json(
      { error: error.message || 'Wallet action failed' },
      { status: 500 }
    )
  }
}
