import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'casewinadmin2024'

// Diagnostics endpoint. Gated behind the admin key and only reports whether
// secrets are set (never their values, never the full env inventory) so it
// cannot be used to fingerprint the deployment or leak partial keys.
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const envCheck = {
    ZENDFI_API_KEY: process.env.ZENDFI_API_KEY ? 'set' : 'NOT SET',
    ZENDFI_WEBHOOK_SECRET: process.env.ZENDFI_WEBHOOK_SECRET ? 'set' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'set' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
  }

  return NextResponse.json({ envCheck, timestamp: new Date().toISOString() })
}
