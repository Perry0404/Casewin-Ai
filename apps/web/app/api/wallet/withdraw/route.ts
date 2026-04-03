import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'

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

// POST /api/wallet/withdraw - Withdraw to Nigerian bank account via ZendFi
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

    // Read env at runtime (Vercel env injection workaround)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check wallet balance
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
        error: `Insufficient balance. You have NGN ${(wallet.naira_balance || 0).toLocaleString()}`
      }, { status: 400 })
    }

    // Bank withdrawal via ZendFi
    if (method === 'bank') {
      if (!bank_details?.bank || !bank_details?.account || !bank_details?.name) {
        return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 })
      }

      if (!/^\d{10}$/.test(bank_details.account)) {
        return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 })
      }

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

      let withdrawalId = null
      if (zendfiApiKey && wallet.zendfi_subaccount_id) {
        try {
          const ngnToUsdcRate = 1600
          const usdcAmount = Math.round((amount / ngnToUsdcRate) * 100) / 100

          const zendfiRes = await fetch(
            `${ZENDFI_BASE}/subaccounts/${wallet.zendfi_subaccount_id}/withdraw-bank`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${zendfiApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount_usdc: usdcAmount,
                bank_id: bank_details.bank,
                account_number: bank_details.account,
                account_name: bank_details.name
              })
            }
          )

          const zendfiData = await zendfiRes.json()
          if (zendfiRes.ok) {
            withdrawalId = zendfiData.id || zendfiData.data?.id
          } else {
            console.error('ZendFi withdrawal error:', zendfiData)
            await supabase
              .from('user_wallets')
              .update({
                naira_balance: wallet.naira_balance,
                total_withdrawals: wallet.total_withdrawals || 0,
                updated_at: new Date().toISOString()
              })
              .eq('user_email', email)
            return NextResponse.json({
              error: zendfiData.message || 'Withdrawal failed. Your balance has been restored.'
            }, { status: 500 })
          }
        } catch (err) {
          console.error('ZendFi withdrawal request failed:', err)
          await supabase
            .from('user_wallets')
            .update({
              naira_balance: wallet.naira_balance,
              total_withdrawals: wallet.total_withdrawals || 0,
              updated_at: new Date().toISOString()
            })
            .eq('user_email', email)
          return NextResponse.json({ error: 'Withdrawal service unavailable. Please try again.' }, { status: 503 })
        }
      }

      await supabase.from('wallet_transactions').insert({
        user_email: email,
        amount: -amount,
        transaction_type: 'withdrawal',
        related_id: withdrawalId,
        balance_after: newBalance,
        notes: `Bank withdrawal to ${bank_details.bank} - ${bank_details.account}`
      })

      return NextResponse.json({
        success: true,
        message: `NGN ${amount.toLocaleString()} withdrawal to ${bank_details.bank} is being processed.`,
        new_balance: newBalance
      })
    }

    // Crypto withdrawal (Base wallet)
    if (method === 'crypto') {
      if (!wallet_address) {
        return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
        return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
      }

      const newBalance = wallet.naira_balance - amount
      await supabase
        .from('user_wallets')
        .update({
          naira_balance: newBalance,
          total_withdrawals: (wallet.total_withdrawals || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', email)

      await supabase.from('wallet_transactions').insert({
        user_email: email,
        amount: -amount,
        transaction_type: 'crypto_withdrawal',
        balance_after: newBalance,
        notes: `Crypto withdrawal (${token || 'USDC'}) to ${wallet_address}`
      })

      return NextResponse.json({
        success: true,
        message: `NGN ${amount.toLocaleString()} crypto withdrawal submitted. Processing within 1 hour.`,
        new_balance: newBalance
      })
    }

    return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}
