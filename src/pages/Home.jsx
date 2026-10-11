import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building, Building2, House, LayoutGrid, Search, Store, Warehouse } from 'lucide-react'
import PropertyCard, { PropertyCardSkeleton } from '@/components/PropertyCard'
import { useWallet } from '@/context/WalletContext'
import { loadCatalog } from '@/lib/data'
import { prettyErr } from '@/lib/chain'
import { PROPERTY_TYPES } from '@/config'
import { cn } from '@/lib/utils'

const ICONS = { 'Commercial office': Building2, Retail: Store, Warehousing: Warehouse, Residential: House, 'Mixed use': Building }
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

export default function Home() {
  const { version } = useWallet()
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('new')

  useEffect(() => { loadCatalog().then((c) => setItems(c.items)).catch((e) => setErr(prettyErr(e))) }, [version])

  const shown = useMemo(() => {
    let list = (items || []).filter((p) => (type === 'All' || p.type === type) &&
      (!q || `${p.name} ${p.location} ${p.type}`.toLowerCase().includes(q.toLowerCase())))
    if (sort === 'price') list = [...list].sort((a, b) => (a.minPrice === null) - (b.minPrice === null) || (a.minPrice !== null && b.minPrice !== null ? cmp(a.minPrice, b.minPrice) : 0))
    if (sort === 'avail') list = [...list].sort((a, b) => cmp(b.forSale, a.forSale))
    return list
  }, [items, q, type, sort])

  const cats = [['All', LayoutGrid], ...PROPERTY_TYPES.map((t) => [t, ICONS[t] || Building])]

  return (
    <>
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 text-center sm:px-6 sm:pt-16">
          <h1 className="text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">Real estate for every Indian.</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">Own units in rent-earning buildings, collect your share of the rent, and sell when you like.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-8 flex max-w-2xl items-center rounded-full border bg-white p-2 pl-6 shadow-[0_6px_20px_-8px_rgba(20,35,31,.25)]">
            <div className="min-w-0 flex-1 text-left">
              <label htmlFor="q" className="block text-xs font-semibold">Where</label>
              <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by city, area or building"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="mx-4 hidden h-8 border-l sm:block" />
            <div className="hidden text-left sm:block">
              <label htmlFor="sort" className="block text-xs font-semibold">Sort</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent pr-2 text-[15px] text-muted-foreground outline-none">
                <option value="new">Newest</option><option value="price">Lowest price</option><option value="avail">Most for sale</option>
              </select>
            </div>
            <button type="submit" aria-label="Search" className="ml-2 grid size-12 shrink-0 place-items-center rounded-full bg-primary text-white hover:bg-primary/90"><Search className="size-5" /></button>
          </form>
        </div>
        <div className="mx-auto flex max-w-7xl justify-start gap-8 overflow-x-auto px-4 sm:justify-center sm:px-6">
          {cats.map(([t, Icon]) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={cn('flex shrink-0 flex-col items-center gap-1.5 border-b-2 pt-2 pb-3 text-xs font-semibold transition-colors',
                type === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground')}>
              <Icon className="size-6" strokeWidth={1.6} />{t}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {err ? <p className="py-20 text-center text-destructive">{err}</p> : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {!items ? [0, 1, 2, 3].map((k) => <PropertyCardSkeleton key={k} />)
              : shown.length ? shown.map((p) => <PropertyCard key={p.address} p={p} />)
              : <div className="col-span-full py-16 text-center">
                  <p className="text-lg font-semibold">{items.length ? 'No properties match' : 'No properties yet'}</p>
                  <p className="mt-1 text-muted-foreground">{items.length ? 'Try another area or category.' : <Link to="/list" className="font-semibold text-primary underline">List the first one</Link>}</p>
                </div>}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 border-t py-14 md:grid-cols-3">
          {[
            ['Choose a building', 'Every listing shows photos, documents, the location and how it has done against the market.'],
            ['Buy units', 'Pay the seller in rupees. The units are recorded in your own wallet straight away.'],
            ['Earn the rent', 'Rent is split across all units. Claim your share from your portfolio, and sell whenever you like.'],
          ].map(([t, d], i) => (
            <div key={t}>
              <p className="text-sm font-semibold text-muted-foreground">Step {i + 1}</p>
              <p className="mt-1 text-xl font-bold">{t}</p>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
