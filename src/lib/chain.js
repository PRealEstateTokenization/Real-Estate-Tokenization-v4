import { ethers } from 'ethers'
import { SEPOLIA_CHAIN_ID } from '@/config'

/* ---------- config + read provider ---------- */
let CONFIG = null, ABIS = null, provider = null
const CONFIG_KEY = { Whitelist: 'whitelist', PropertyTokenFactory: 'factory', Marketplace: 'marketplace' }

export async function loadChainConfig() {
  const [addr, abis] = await Promise.all([
    fetch('./addresses.json', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('addresses.json not found'); return r.json() }),
    fetch('./abis.json', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('abis.json not found'); return r.json() }),
  ])
  CONFIG = addr; ABIS = abis
  provider = new ethers.JsonRpcProvider(CONFIG.rpc, 11155111, { staticNetwork: true })
  return { config: CONFIG, abis: ABIS }
}
export const getConfig = () => CONFIG
export const getAbis = () => ABIS
export const getProvider = () => provider

function addrFor(name, override) {
  const a = override || CONFIG?.[CONFIG_KEY[name]]
  if (!a) throw new Error('No address configured for ' + name + '.')
  return a
}
export const readContract = (name, override) => new ethers.Contract(addrFor(name, override), ABIS[name], provider)
export const tokenContract = (addr) => new ethers.Contract(addr, ABIS.PropertyToken, provider)

export function withTimeout(p, ms, msg) {
  let t
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms) })]).finally(() => clearTimeout(t))
}

/* ---------- the one write path ----------
   1) simulate + estimate gas through the read RPC (no MetaMask)
   2) ask MetaMask only to sign & send (eth_sendTransaction)
   3) wait for the receipt through the read RPC                 */
export async function sendTx({ from, contract, address, method, args = [], onStage = () => {} }) {
  if (!from) throw new Error('Connect your wallet first.')
  if (!window.ethereum) throw new Error('MetaMask not found.')
  const to = addrFor(contract, address)
  const c = new ethers.Contract(to, ABIS[contract], provider)
  if (typeof c[method] !== 'function') throw new Error(method + ' is not a function')

  const chainId = await withTimeout(window.ethereum.request({ method: 'eth_chainId' }), 10000,
    'MetaMask is not responding. Click the MetaMask icon to unlock it, then try again.')
  if (chainId !== SEPOLIA_CHAIN_ID) throw new Error('MetaMask is not on Sepolia. Switch network and try again.')

  onStage('checking')
  const gas = await withTimeout(c[method].estimateGas(...args, { from }), 20000,
    'Network check timed out. Check your internet connection and try again.')
  const data = c.interface.encodeFunctionData(method, args)

  onStage('sign')
  const hash = await withTimeout(
    window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from, to, data, gas: ethers.toQuantity((gas * 13n) / 10n) }] }),
    120000, 'MetaMask did not respond. Click the MetaMask icon (a request may be waiting there), or reload and reconnect.')

  onStage('pending', hash)
  const rc = await provider.waitForTransaction(hash, 1, 180000).catch(() => null)
  if (!rc) throw new Error('Sent but not confirmed yet. Check Etherscan for ' + hash)
  if (rc.status === 0) throw new Error('The transaction was reverted on-chain.')
  onStage('done', hash)
  return rc
}

export function prettyErr(e) {
  const m = String(e?.reason || e?.info?.error?.message || e?.shortMessage || e?.message || e)
  if (/KYC/i.test(m)) return 'This wallet is not KYC-approved on the current contracts. Run scripts/approve-wallets.js for it.'
  if (m.includes('Only property owner')) return 'Only the property owner can distribute rent.'
  if (m.includes('Seller cannot buy')) return 'You cannot buy your own offer. Cancel it instead.'
  if (m.includes('Not seller')) return 'Only the seller can cancel this offer.'
  if (m.includes('Nothing to claim')) return 'There is no rent to claim yet.'
  if (m.includes('Listing not active')) return 'This offer has just closed. Refresh to see the latest.'
  if (m.includes('Invalid amount') || m.includes('must be > 0')) return 'Enter a valid number of units.'
  if (m.includes('could not coalesce')) return 'The network provider rejected a batch of requests. Wait a few seconds and try again.'
  if (/insufficient funds/i.test(m)) return 'Not enough Sepolia test ETH for gas. Top up from a Sepolia faucet and try again.'
  if (e?.code === 4001 || e?.code === 'ACTION_REJECTED' || /user (rejected|denied)/i.test(m)) return 'You cancelled the request in MetaMask.'
  if (e?.code === -32002) return 'A MetaMask request is already open. Click the MetaMask icon to finish it.'
  if (m.includes('is not a function') || m.includes('no matching fragment')) return 'The contract ABI is out of date. Copy the latest abis.json into public/ and reload.'
  if (/could not detect network|failed to detect|network error|Failed to fetch/i.test(m)) return 'Cannot reach Sepolia. Check your connection and the rpc URL in addresses.json.'
  return m.length > 180 ? m.slice(0, 180) + '…' : m
}
