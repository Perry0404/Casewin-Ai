import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// CDP (Coinbase Developer Platform) Wallet Service
// Creates non-custodial embedded wallets per user on Base
// No private keys in our env — Coinbase manages via MPC
// Reads CDP credentials from Supabase app_config (Vercel env
// vars are unreliable, Supabase connection always works)
// ============================================================

let initialized = false

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function initCDP() {
  if (initialized) return

  // Try env vars first, fallback to Supabase app_config table
  let apiKeyName = process.env.CDP_API_KEY_NAME || ''
  let privateKey = process.env.CDP_API_KEY_PRIVATE_KEY || ''

  if (!apiKeyName || !privateKey) {
    // Load from Supabase app_config table (reliable)
    const admin = getAdmin()
    const { data: configs } = await admin
      .from('app_config')
      .select('key, value')
      .in('key', ['CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY'])

    if (configs) {
      for (const cfg of configs) {
        if (cfg.key === 'CDP_API_KEY_NAME') apiKeyName = cfg.value
        if (cfg.key === 'CDP_API_KEY_PRIVATE_KEY') privateKey = cfg.value
      }
    }
  }

  if (!apiKeyName || !privateKey) {
    throw new Error('CDP credentials not found in env vars or app_config table')
  }

  new Coinbase({
    apiKeyName,
    privateKey,
  })

  initialized = true
}

/**
 * Create a new CDP wallet for a user on Base Mainnet.
 * Returns the wallet ID, default address, and seed (encrypted export).
 */
export async function createUserWallet(): Promise<{
  walletId: string
  address: string
  seed: string
}> {
  await initCDP()

  const wallet = await Wallet.create({
    networkId: Coinbase.networks.BaseMainnet,
  })

  const addresses = await wallet.listAddresses()
  const defaultAddress = addresses[0]

  // Export wallet data (contains seed for re-importing later)
  const walletData = wallet.export()

  return {
    walletId: walletData.walletId || '',
    address: defaultAddress.getId(),
    seed: walletData.seed || '',
  }
}

/**
 * Load an existing CDP wallet by its ID and seed.
 * Used to perform operations (transfers, balance checks) on a user's wallet.
 */
export async function loadUserWallet(walletId: string, seed: string): Promise<Wallet> {
  await initCDP()

  const wallet = await Wallet.import({
    walletId,
    seed,
  }, Coinbase.networks.BaseMainnet)

  return wallet
}

/**
 * Get the on-chain balance of a user's CDP wallet.
 */
export async function getWalletBalance(walletId: string, seed: string): Promise<{
  eth: number
  usdc: number
  ethNGN: number
  usdcNGN: number
  totalNGN: number
}> {
  const wallet = await loadUserWallet(walletId, seed)
  const balances = await wallet.listBalances()

  const ethBalance = parseFloat(balances.get(Coinbase.assets.Eth)?.toString() || '0')
  const usdcBalance = parseFloat(balances.get(Coinbase.assets.Usdc)?.toString() || '0')

  const ETH_NGN_RATE = parseFloat(process.env.ETH_NGN_RATE || '5500000')
  const USDC_NGN_RATE = parseFloat(process.env.USDC_NGN_RATE || '1571')

  const ethNGN = Math.floor(ethBalance * ETH_NGN_RATE)
  const usdcNGN = Math.floor(usdcBalance * USDC_NGN_RATE)

  return {
    eth: ethBalance,
    usdc: usdcBalance,
    ethNGN,
    usdcNGN,
    totalNGN: ethNGN + usdcNGN,
  }
}

/**
 * Transfer USDC from a user's CDP wallet to another address.
 * Used when users place trades (funds go to market pool).
 */
export async function transferFromWallet(
  walletId: string,
  seed: string,
  toAddress: string,
  amount: number,
  assetId: string = 'usdc'
): Promise<{ txHash: string; status: string }> {
  const wallet = await loadUserWallet(walletId, seed)

  const transfer = await wallet.createTransfer({
    amount: amount,
    assetId: assetId,
    destination: toAddress,
  })

  return {
    txHash: transfer.getTransactionHash() || '',
    status: transfer.getStatus() || 'pending',
  }
}
