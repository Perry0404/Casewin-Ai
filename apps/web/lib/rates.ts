// ============================================================
// Live Exchange Rates — CoinGecko (free, no API key)
// Fetches current ETH/NGN and USDC/NGN rates
// Caches for 5 minutes to avoid rate limits
// ============================================================

let cachedRates: { ethNGN: number; usdcNGN: number; updatedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get live ETH/NGN and USDC/NGN rates from CoinGecko.
 * Falls back to hardcoded rates if API fails.
 */
export async function getLiveRates(): Promise<{
  ethNGN: number
  usdcNGN: number
  source: string
  updatedAt: string
}> {
  // Return cached if fresh
  if (cachedRates && Date.now() - cachedRates.updatedAt < CACHE_TTL) {
    return {
      ethNGN: cachedRates.ethNGN,
      usdcNGN: cachedRates.usdcNGN,
      source: 'coingecko (cached)',
      updatedAt: new Date(cachedRates.updatedAt).toISOString(),
    }
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=ngn',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // Next.js cache for 5 min
      }
    )

    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)

    const data = await res.json()

    const ethNGN = data?.ethereum?.ngn || 5500000
    const usdcNGN = data?.['usd-coin']?.ngn || 1571

    cachedRates = { ethNGN, usdcNGN, updatedAt: Date.now() }

    return {
      ethNGN,
      usdcNGN,
      source: 'coingecko (live)',
      updatedAt: new Date().toISOString(),
    }
  } catch (e) {
    console.error('CoinGecko rate fetch failed, using fallback:', e)

    // Fallback rates
    return {
      ethNGN: 5500000,
      usdcNGN: 1571,
      source: 'fallback (offline)',
      updatedAt: new Date().toISOString(),
    }
  }
}
