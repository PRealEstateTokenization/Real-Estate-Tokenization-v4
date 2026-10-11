import { ethers } from 'ethers'
import { getConfig, getAbis } from '@/lib/chain'

async function rpc(method, params) {
  const res = await fetch(getConfig().rpc, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || 'RPC error')
  return json.result
}

/* One Alchemy request returns every transfer for the token. */
export async function fetchTransfers(tokenAddr, onProgress = () => {}) {
  const out = []
  let pageKey, page = 0
  do {
    const req = { fromBlock: '0x0', toBlock: 'latest', contractAddresses: [tokenAddr], category: ['erc20'], excludeZeroValue: false, withMetadata: true, order: 'asc', maxCount: '0x3e8' }
    if (pageKey) req.pageKey = pageKey
    const r = await rpc('alchemy_getAssetTransfers', [req])
    out.push(...(r.transfers || []))
    pageKey = r.pageKey
    if (pageKey) onProgress('Reading page ' + (++page + 1))
  } while (pageKey && out.length < 20000)
  return out.map((t) => ({
    from: t.from, to: t.to,
    value: BigInt(t.rawContract?.value || '0x0'),
    block: parseInt(t.blockNum, 16), hash: t.hash,
    time: t.metadata?.blockTimestamp || '',
  }))
}

/* Fallback for a non-Alchemy RPC: scan recent blocks only. */
async function fetchTransfersByLogs(tokenAddr, onProgress) {
  const pv = new ethers.JsonRpcProvider(getConfig().rpc, 11155111, { staticNetwork: true, batchMaxCount: 1, batchStallTime: 0 })
  const topic = ethers.id('Transfer(address,address,uint256)')
  const latest = await pv.getBlockNumber()
  const SPAN = 10, start = Math.max(0, latest - 50000), ranges = []
  for (let b = start; b <= latest; b += SPAN) ranges.push([b, Math.min(b + SPAN - 1, latest)])
  const iface = new ethers.Interface(getAbis().PropertyToken)
  const rows = []
  for (let i = 0; i < ranges.length; i += 4) {
    onProgress('Reading chain ' + Math.min(99, Math.round((i * 100) / ranges.length)) + '%')
    const batch = ranges.slice(i, i + 4).map(([f, t]) => pv.getLogs({ address: tokenAddr, topics: [topic], fromBlock: f, toBlock: t }).catch(() => []))
    for (const logs of await Promise.all(batch)) for (const lg of logs) {
      const p = iface.parseLog(lg)
      rows.push({ from: p.args[0], to: p.args[1], value: p.args[2], block: lg.blockNumber, hash: lg.transactionHash, time: '' })
    }
  }
  return rows.sort((a, b) => a.block - b.block)
}

export async function downloadHistory({ address, name, symbol }, onProgress = () => {}) {
  let rows
  try { rows = await fetchTransfers(address, onProgress) }
  catch { rows = await fetchTransfersByLogs(address, onProgress) }
  const cfg = getConfig()
  const ZERO = ethers.ZeroAddress.toLowerCase()
  const cell = (s) => { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const tag = (a) => (a && a.toLowerCase() === cfg.marketplace.toLowerCase() ? a + ' (Marketplace escrow)' : a)
  const body = rows.map((t, i) => {
    const mint = t.from?.toLowerCase() === ZERO
    return [i + 1, mint ? 'Mint (initial issue)' : 'Transfer', mint ? '(newly minted)' : tag(t.from), tag(t.to), t.value.toString(), t.block, t.time, t.hash]
  })
  const meta = [['Property', name], ['Token Symbol', symbol], ['Token Contract', address], ['Network', cfg.network || 'sepolia'], ['Exported', new Date().toLocaleString()], ['Total Records', body.length], []]
  const header = ['#', 'Type', 'From', 'To', 'Units', 'Block', 'Timestamp (UTC)', 'Transaction Hash']
  const csv = [...meta, header, ...body].map((r) => r.map(cell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url; a.download = `${symbol || 'property'}_ownership_history.csv`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
