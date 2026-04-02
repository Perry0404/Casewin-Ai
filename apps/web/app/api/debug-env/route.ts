import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Read at call time to ensure no caching
  const zk = process.env['ZENDFI_API_KEY']
  const zw = process.env['ZENDFI_WEBHOOK_SECRET']
  
  const envCheck = {
    ZENDFI_API_KEY: zk ? `set (${zk.slice(0, 8)}...${zk.slice(-4)})` : 'NOT SET',
    ZENDFI_WEBHOOK_SECRET: zw ? 'set' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
    // List ALL env var names to see what Vercel is providing
    ALL_ENV_KEYS: Object.keys(process.env).filter(k => 
      !k.startsWith('npm_') && !k.startsWith('__') && !k.startsWith('PATH')
    ).sort(),
  }

  return NextResponse.json({ envCheck, timestamp: new Date().toISOString() })
}
