import { readContract, tokenContract, withTimeout } from '@/lib/chain'
import { getAllMedia, getMedia } from '@/lib/media'

const byPrice = (a, b) => (a.price < b.price ? -1 : a.price > b.price ? 1 : 0)
const same = (a, b) => a?.toLowerCase() === b?.toLowerCase()

export async function loadOffers() {
  const market = readContract('Marketplace')
  const n = Number(await market.nextListingId())
  const all = await Promise.all(Array.from({ length: n }, (_, i) => market.listings(i)))
  return all.map((l, i) => ({ id: i, seller: l[0], token: l[1], remaining: l[2], price: l[3], active: l[4] }))
}

async function tokenAddresses() {
  const all = await withTimeout(readContract('PropertyTokenFactory').getAllTokens(), 15000,
    'Timed out reaching Sepolia. Check the rpc URL in addresses.json.')
  return [...all].reverse() // newest first
}

/* Everything the browse pages need, in one pass */
export async function loadCatalog() {
  const [tokens, media, offers] = await Promise.all([tokenAddresses(), getAllMedia().catch(() => ({})), loadOffers().catch(() => [])])
  const items = await Promise.all(tokens.map(async (t, order) => {
    const tk = tokenContract(t)
    const [name, symbol, supply, rentPaid] = await Promise.all([
      tk.name().catch(() => 'Property'), tk.symbol().catch(() => ''), tk.totalSupply().catch(() => 0n), tk.totalYieldDeposited().catch(() => 0n),
    ])
    const m = media[t.toLowerCase()] || {}
    const open = offers.filter((o) => o.active && same(o.token, t)).sort(byPrice)
    return {
      address: t, order, name, symbol, supply, rentPaid,
      image: (m.image_urls || [])[0] || null, location: m.location || '', type: m.property_type || '',
      minPrice: open[0]?.price ?? null, forSale: open.reduce((a, o) => a + o.remaining, 0n), offers: open.length,
    }
  }))
  return { items, offers }
}

export async function loadProperty(address, me) {
  const tk = tokenContract(address)
  const [name, symbol, supply, docHash, registrant] = await withTimeout(
    Promise.all([tk.name(), tk.symbol(), tk.totalSupply(), tk.docHash(), tk.registrant()]), 15000, 'Timed out reaching Sepolia.')
  const [rentPaid, myBalance, myPending, media, offers] = await Promise.all([
    tk.totalYieldDeposited().catch(() => 0n),
    me ? tk.balanceOf(me) : 0n,
    me ? tk.pendingYield(me) : 0n,
    getMedia(address).catch(() => null),
    loadOffers(),
  ])
  const mine = offers.filter((o) => same(o.token, address))
  const open = mine.filter((o) => o.active).sort(byPrice)
  return {
    address, name, symbol, supply, docHash, registrant, rentPaid, myBalance, myPending,
    media: media || {}, open, past: mine.filter((o) => !o.active),
    buyable: open.filter((o) => !me || !same(o.seller, me)),
    isOwner: !!me && same(me, registrant),
    minPrice: open[0]?.price ?? null,
    forSale: open.reduce((a, o) => a + o.remaining, 0n),
  }
}

export async function loadPortfolio(me) {
  const { items, offers } = await loadCatalog()
  const holdings = (await Promise.all(items.map(async (p) => {
    const tk = tokenContract(p.address)
    const bal = await tk.balanceOf(me)
    if (bal === 0n) return null
    const pending = await tk.pendingYield(me)
    return { ...p, balance: bal, pending, value: p.minPrice !== null ? bal * p.minPrice : null }
  }))).filter(Boolean)
  const myOffers = offers.filter((o) => o.active && same(o.seller, me))
    .map((o) => ({ ...o, property: items.find((p) => same(p.address, o.token)) }))
  return { holdings, myOffers }
}
