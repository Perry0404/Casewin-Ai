import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
// Single merchant-level signing grant — one for ALL users/withdrawals
const ZENDFI_SIGNING_GRANT_FALLBACK = '' // Set after one-time admin approval

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

// Mint a single-use delegation token for withdrawal (API-key, fully automatic)
async function mintDelegationToken(
  subAccountId: string,
  spendLimitUsdc: number,
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(`${ZENDFI_BASE}/subaccounts/${subAccountId}/session-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scope: 'withdraw_only',
        spend_limit_usdc: spendLimitUsdc,
        expires_in_seconds: 600,
        single_use: true
      })
    })
    const text = await res.text()
    console.log('Delegation token response:', res.status, text.substring(0, 300))
    if (!res.ok) return null
    const data = text ? JSON.parse(text) : {}
    return data.delegation_token || null
  } catch (err) {
    console.error('Failed to mint delegation token:', err)
    return null
  }
}

// POST /api/wallet/withdraw - Withdraw to Nigerian bank via ZendFi withdraw-bank
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, method, bank_details, wallet_address, token } = body
    const email = authUser.email

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal is NGN 100' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if ((wallet.naira_balance || 0) < amount) {
      return NextResponse.json({
        error: `Insufficient balance. You have \u20A6${(wallet.naira_balance || 0).toLocaleString()}`
      }, { status: 400 })
    }

    // ==================== BANK WITHDRAWAL ====================
    if (method === 'bank') {
      if (!bank_details?.bank || !bank_details?.account || !bank_details?.name) {
        return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 })
      }

      if (!/^\d{10}$/.test(bank_details.account)) {
        return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 })
      }

      if (!wallet.zendfi_subaccount_id) {
        return NextResponse.json({ error: 'No payment account found. Please make a deposit first.' }, { status: 400 })
      }

      // Use single merchant-level signing grant for ALL withdrawals
      const signingGrant = process.env.ZENDFI_SIGNING_GRANT || ZENDFI_SIGNING_GRANT_FALLBACK
      if (!signingGrant) {
        return NextResponse.json({
          error: 'Withdrawals are temporarily unavailable. Please try again later.',
        }, { status: 503 })
      }

      const ngnToUsdcRate = 1600
      const usdcAmount = Math.round((amount / ngnToUsdcRate) * 100) / 100

      // Step 1: Mint delegation token (API-key compatible, fully automatic)
      const delegationToken = await mintDelegationToken(
        wallet.zendfi_subaccount_id,
        usdcAmount + 1,
        zendfiApiKey
      )

      if (!delegationToken) {
        return NextResponse.json({
          error: 'Failed to authorize withdrawal. Please try again.'
        }, { status: 500 })
      }

      // Step 2: Deduct balance (before calling ZendFi — will refund on failure)
      const newBalance = wallet.naira_balance - amount
      const { error: deductErr } = await supabase
        .from('user_wallets')
        .update({
          naira_balance: newBalance,
          total_withdrawals: (wallet.total_withdrawals || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', email)

      if (deductErr) {
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
      }

      // Step 3: Call ZendFi withdraw-bank with delegation_token + signing_grant
      const withdrawBody = {
        amount_usdc: usdcAmount,
        bank_id: bank_details.bank,
        account_number: bank_details.account,
        mode: 'live',
        delegation_token: delegationToken,
        signing_grant: signingGrant
      }

      console.log('ZendFi withdraw-bank:', JSON.stringify({
        ...withdrawBody,
        delegation_token: delegationToken.substring(0, 10) + '***',
        signing_grant: signingGrant.substring(0, 10) + '***'
      }))

      const zendfiRes = await fetch(
        `${ZENDFI_BASE}/subaccounts/${wallet.zendfi_subaccount_id}/withdraw-bank`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zendfiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(withdrawBody)
        }
      )

      const responseText = await zendfiRes.text()
      let zendfiData: Record<string, unknown> = {}
      try { zendfiData = responseText ? JSON.parse(responseText) : {} } catch { /* */ }
      console.log('ZendFi withdraw-bank response:', zendfiRes.status, responseText.substring(0, 500))

      if (!zendfiRes.ok) {
        // Refund on ZendFi failure
        await supabase.from('user_wallets').update({
          naira_balance: wallet.naira_balance,
          total_withdrawals: wallet.total_withdrawals || 0,
          updated_at: new Date().toISOString()
        }).eq('user_email', email)

        const errMsg = (zendfiData.message || zendfiData.error || responseText.substring(0, 200)) as string
        return NextResponse.json({
          error: `Withdrawal failed: ${errMsg}. Your balance has been restored.`
        }, { status: 500 })
      }

      const orderId = (zendfiData.order_id || zendfiData.id) as string
      const fiatAmount = (zendfiData.fiat_amount as number) || amount
      const exchangeRate = (zendfiData.exchange_rate as number) || ngnToUsdcRate

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_email: email,
        amount: -amount,
        transaction_type: 'withdrawal',
        related_id: orderId,
        balance_after: newBalance,
        notes: `Bank withdrawal to ${bank_details.bank} - ${bank_details.account} (${usdcAmount} USDC @ ${exchangeRate})`
      })

      return NextResponse.json({
        success: true,
        message: `\u20A6${fiatAmount.toLocaleString()} withdrawal to ${bank_details.bank} is being processed.`,
        new_balance: newBalance,
        order_id: orderId,
        exchange_rate: exchangeRate
      })
    }

    // ==================== CRYPTO WITHDRAWAL ====================
    if (method === 'crypto') {
      if (!wallet_address) {
        return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)) {
        return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
      }

      const newBalance = wallet.naira_balance - amount
      await supabase.from('user_wallets').update({
        naira_balance: newBalance,
        total_withdrawals: (wallet.total_withdrawals || 0) + amount,
        updated_at: new Date().toISOString()
      }).eq('user_email', email)

      await supabase.from('wallet_transactions').insert({
        user_email: email,
        amount: -amount,
        transaction_type: 'crypto_withdrawal',
        balance_after: newBalance,
        notes: `Crypto withdrawal (${token || 'USDC'}) to ${wallet_address}`
      })

      return NextResponse.json({
        success: true,
        message: `\u20A6${amount.toLocaleString()} crypto withdrawal submitted. Processing within 1 hour.`,
        new_balance: newBalance
      })
    }

    return NextResponse.json({ error: 'Invalid withdrawal method. Use "bank" or "crypto".' }, { status: 400 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to process withdrawal: ${msg}` }, { status: 500 })
  }
}
