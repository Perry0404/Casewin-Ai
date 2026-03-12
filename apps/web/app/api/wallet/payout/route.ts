import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Load Korapay key from env or Supabase app_config
async function getKorapayKey(): Promise<string> {
  // Try env first
  const envKey = process.env.KORAPAY_SECRET_KEY
  if (envKey) return envKey

  // Fallback: load from Supabase app_config
  const admin = getAdmin()
  const { data } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'KORAPAY_SECRET_KEY')
    .single()

  if (data?.value) return data.value
  throw new Error('Korapay secret key not configured')
}

// ============================================================
// POST — Cash out Naira balance to Nigerian bank account
// User's trading balance (₦) → Korapay payout → their bank
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, bankCode, accountNumber, accountName } = body

    // Validate inputs
    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 })
    }
    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Bank details required (bankCode, accountNumber, accountName)' }, { status: 400 })
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 })
    }

    const admin = getAdmin()

    // Check user's trading balance
    const { data: balance } = await admin
      .from('user_balances')
      .select('balance, total_withdrawn')
      .eq('user_id', user.id)
      .single()

    if (!balance || balance.balance < amount) {
      return NextResponse.json({
        error: `Insufficient balance. You have ₦${(balance?.balance || 0).toLocaleString()}, tried to withdraw ₦${amount.toLocaleString()}`,
      }, { status: 400 })
    }

    // Get Korapay key
    const korapayKey = await getKorapayKey()

    // Generate unique reference
    const reference = `casewin-payout-${user.id.slice(0, 8)}-${Date.now()}`

    // Call Korapay Disbursement API
    const korapayRes = await fetch('https://api.korapay.com/merchant/api/v1/transactions/disburse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${korapayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        destination: {
          type: 'bank_account',
          amount: amount,
          currency: 'NGN',
          narration: `CaseWin AI payout - ${user.email || user.id.slice(0, 8)}`,
          bank_account: {
            bank: bankCode,
            account: accountNumber,
            account_name: accountName,
          },
        },
      }),
    })

    const korapayData = await korapayRes.json()

    if (!korapayRes.ok || korapayData.status !== true) {
      console.error('Korapay payout failed:', korapayData)
      return NextResponse.json({
        error: korapayData.message || 'Payout failed. Please try again.',
      }, { status: 400 })
    }

    // Deduct from user's trading balance
    const newBalance = balance.balance - amount
    await admin.from('user_balances').update({
      balance: newBalance,
      total_withdrawn: (balance.total_withdrawn || 0) + amount,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    // Record transaction
    await admin.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'naira_payout',
      amount: -amount,
      balance_after: newBalance,
      description: `Naira payout: ₦${amount.toLocaleString()} → ${bankCode} ${accountNumber.slice(0, 3)}****${accountNumber.slice(-3)}`,
      metadata: {
        reference,
        bankCode,
        accountNumber: `${accountNumber.slice(0, 3)}****${accountNumber.slice(-3)}`,
        korapayRef: korapayData.data?.reference,
      },
    })

    return NextResponse.json({
      success: true,
      reference,
      amount,
      newBalance,
      bankDetails: `${bankCode} ${accountNumber.slice(0, 3)}****${accountNumber.slice(-3)}`,
      message: `✅ ₦${amount.toLocaleString()} sent to your bank account! Arrives in 1-5 minutes.`,
    })
  } catch (error: any) {
    console.error('Naira payout error:', error)
    return NextResponse.json(
      { error: error.message || 'Payout failed' },
      { status: 500 }
    )
  }
}

// ============================================================
// GET — Get Nigerian bank list for payout form
// ============================================================
export async function GET() {
  // Common Nigerian banks
  const banks = [
    { code: '044', name: 'Access Bank' },
    { code: '023', name: 'Citibank Nigeria' },
    { code: '063', name: 'Diamond Bank (Access)' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '084', name: 'Enterprise Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '101', name: 'Kuda Microfinance Bank' },
    { code: '526', name: 'Moniepoint' },
    { code: '999992', name: 'Opay' },
    { code: '999991', name: 'PalmPay' },
    { code: '076', name: 'Polaris Bank' },
    { code: '125', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
  ]

  return NextResponse.json({ banks })
}
