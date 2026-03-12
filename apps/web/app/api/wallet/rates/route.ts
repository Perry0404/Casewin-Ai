import { NextResponse } from 'next/server'
import { getLiveRates } from '@/lib/rates'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rates = await getLiveRates()

  return NextResponse.json({
    ethNGN: rates.ethNGN,
    usdcNGN: rates.usdcNGN,
    source: rates.source,
    updatedAt: rates.updatedAt,
    formatted: {
      eth: `₦${rates.ethNGN.toLocaleString()}/ETH`,
      usdc: `₦${rates.usdcNGN.toLocaleString()}/USDC`,
    },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
