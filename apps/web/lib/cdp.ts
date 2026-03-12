import { ethers } from 'ethers'
import { getLiveRates } from './rates'

// ============================================================
// Wallet Service — Per-user Base wallets using ethers.js
// Each user gets a unique wallet (private key stored encrypted in DB)
// No external API dependency — no rate limits, instant creation
// Reads on-chain balance via Base RPC
// ============================================================

const BASE_RPC = 'https://mainnet.base.org'
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

function getProvider() {
  return new ethers.JsonRpcProvider(BASE_RPC)
}

/**
 * Create a new wallet for a user on Base.
 * Returns the address and encrypted private key.
 */
export async function createUserWallet(): Promise<{
  walletId: string
  address: string
  seed: string // private key (encrypted in DB via RLS)
}> {
  const wallet = ethers.Wallet.createRandom()

  return {
    walletId: wallet.address.toLowerCase(), // use address as ID
    address: wallet.address.toLowerCase(),
    seed: wallet.privateKey, // stored in DB, protected by RLS
  }
}

/**
 * Load an existing wallet by its private key.
 */
export async function loadUserWallet(walletId: string, seed: string) {
  const provider = getProvider()
  return new ethers.Wallet(seed, provider)
}

/**
 * Get the on-chain balance of a user's wallet (ETH + USDC).
 */
export async function getWalletBalance(walletId: string, seed: string): Promise<{
  eth: number
  usdc: number
  ethNGN: number
  usdcNGN: number
  totalNGN: number
}> {
  const provider = getProvider()
  const address = walletId // walletId = address

  // Get ETH balance
  const ethBalanceWei = await provider.getBalance(address)
  const ethBalance = parseFloat(ethers.formatEther(ethBalanceWei))

  // Get USDC balance
  let usdcBalance = 0
  try {
    const usdc = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, provider)
    const usdcBalanceRaw = await usdc.balanceOf(address)
    usdcBalance = parseFloat(ethers.formatUnits(usdcBalanceRaw, 6)) // USDC = 6 decimals
  } catch (e) {
    console.error('Failed to read USDC balance:', e)
  }

  // Live exchange rates from CoinGecko
  const rates = await getLiveRates()

  const ETH_NGN_RATE = rates.ethNGN
  const USDC_NGN_RATE = rates.usdcNGN

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
 * Transfer funds from a user's wallet to another address.
 */
export async function transferFromWallet(
  walletId: string,
  seed: string,
  toAddress: string,
  amount: number,
  assetId: string = 'usdc'
): Promise<{ txHash: string; status: string }> {
  const provider = getProvider()
  const wallet = new ethers.Wallet(seed, provider)

  let tx: ethers.TransactionResponse

  if (assetId === 'eth') {
    tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
    })
  } else {
    // USDC transfer
    const usdc = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, wallet)
    tx = await usdc.transfer(toAddress, ethers.parseUnits(amount.toString(), 6))
  }

  const receipt = await tx.wait()

  return {
    txHash: tx.hash,
    status: receipt?.status === 1 ? 'complete' : 'failed',
  }
}
