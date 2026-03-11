import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Only show if env vars exist, never show actual values
  const envStatus = {
    BASE_DEPOSIT_WALLET: process.env.BASE_DEPOSIT_WALLET ? `set (${process.env.BASE_DEPOSIT_WALLET.length} chars, starts: ${process.env.BASE_DEPOSIT_WALLET.slice(0, 6)}...)` : 'NOT SET',
    BASE_HOT_WALLET_PRIVATE_KEY: process.env.BASE_HOT_WALLET_PRIVATE_KEY ? `set (${process.env.BASE_HOT_WALLET_PRIVATE_KEY.length} chars)` : 'NOT SET',
    BASE_RPC_URL: process.env.BASE_RPC_URL ? `set (${process.env.BASE_RPC_URL.length} chars)` : 'NOT SET',
    ETH_NGN_RATE: process.env.ETH_NGN_RATE || 'NOT SET (using default 5500000)',
    USDC_NGN_RATE: process.env.USDC_NGN_RATE || 'NOT SET (using default 1571)',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'NOT SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(envStatus, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
