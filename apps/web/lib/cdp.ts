import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'

// ============================================================
// CDP (Coinbase Developer Platform) Wallet Service
// Creates non-custodial embedded wallets per user on Base
// No private keys in our env — Coinbase manages via MPC
// ============================================================

let initialized = false

function initCDP() {
  if (initialized) return

  const apiKeyName = process.env.CDP_API_KEY_NAME || ''
  const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY || ''

  if (!apiKeyName || !apiKeyPrivateKey) {
    throw new Error('CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set')
  }

  // The private key from CDP comes with \n escaped — unescape it
  const privateKey = apiKeyPrivateKey.replace(/\\n/g, '\n')

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
  initCDP()

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
  initCDP()

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
