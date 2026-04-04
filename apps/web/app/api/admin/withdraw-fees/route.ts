import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
const ZENDFI_SIGNING_GRANT_FALLBACK = 'ssgt_jqOwNCgIGszx9b1LgCZ5f9f4HEqyY7ptmIGbotNsT25or9uA'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'casewinadmin2024'

// POST /api/admin/withdraw-fees - Withdraw platform fees to admin bank
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK
    const signingGrant = process.env.ZENDFI_SIGNING_GRANT || ZENDFI_SIGNING_GRANT_FALLBACK

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { amount, bank_name, account_number, account_name } = body

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal is \u20A6100' }, { status: 400 })
    }

    if (!bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check available fees
    const { data: fees } = await supabase
      .from('platform_fees')
      .select('amount, fee_type')

    const totalCollected = (fees || []).filter(f => f.fee_type !== 'fee_withdrawal').reduce((s, f) => s + (f.amount || 0), 0)
    const totalWithdrawn = (fees || []).filter(f => f.fee_type === 'fee_withdrawal').reduce((s, f) => s + (f.amount || 0), 0)
    const available = totalCollected - totalWithdrawn

    if (amount > available) {
      return NextResponse.json({
        error: `Insufficient fees. Available: \u20A6${available.toLocaleString()}`
      }, { status: 400 })
    }

    // Try ZendFi withdrawal to bank
    // Use merchant's first sub-account for the withdrawal
    const { data: anyWallet } = await supabase
      .from('user_wallets')
      .select('zendfi_subaccount_id')
      .not('zendfi_subaccount_id', 'is', null)
      .limit(1)
      .single()

    const ngnToUsdcRate = 1600
    const usdcAmount = Math.round((amount / ngnToUsdcRate) * 100) / 100

    let withdrawSuccess = false
    let orderId = ''

    if (anyWallet?.zendfi_subaccount_id && signingGrant) {
      // Try ZendFi withdraw-bank
      const withdrawBody: Record<string, unknown> = {
        amount_usdc: usdcAmount,
        bank_id: bank_name.toLowerCase().replace(/\s+/g, '_'),
        account_number: account_number,
        mode: 'live',
        signing_grant: signingGrant
      }

      const zendfiRes = await fetch(
        `${ZENDFI_BASE}/subaccounts/${anyWallet.zendfi_subaccount_id}/withdraw-bank`,
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

      if (zendfiRes.ok) {
        withdrawSuccess = true
        orderId = (zendfiData.order_id || zendfiData.id || '') as string
      } else {
        console.error('ZendFi fee withdrawal failed:', zendfiRes.status, responseText.substring(0, 300))
      }
    }

    // Record fee withdrawal regardless (manual processing if ZendFi fails)
    await supabase.from('platform_fees').insert({
      user_email: 'admin',
      amount: amount,
      fee_type: 'fee_withdrawal',
      related_id: orderId || 'manual',
      notes: `Fee withdrawal to ${bank_name} - ${account_number} (${account_name})${withdrawSuccess ? '' : ' [PENDING MANUAL]'}`
    })

    if (withdrawSuccess) {
      return NextResponse.json({
        success: true,
        message: `\u20A6${amount.toLocaleString()} fee withdrawal to ${bank_name} is being processed.`,
        order_id: orderId
      })
    } else {
      return NextResponse.json({
        success: true,
        message: `\u20A6${amount.toLocaleString()} fee withdrawal recorded. ZendFi payout pending — may need manual transfer.`,
        manual: true
      })
    }
  } catch (error) {
    console.error('Fee withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to process fee withdrawal' }, { status: 500 })
  }
}
