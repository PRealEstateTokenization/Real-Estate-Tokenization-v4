import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building, Building2, Check, House, LayoutGrid, Search, Store, Warehouse, X } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import PropertyCard, { PropertyCardSkeleton } from '@/components/PropertyCard'
import { useWallet } from '@/context/WalletContext'
import { loadCatalog } from '@/lib/data'
import { prettyErr } from '@/lib/chain'
import { placeholderImg } from '@/lib/placeholder'
import { rupee, rupeeShort } from '@/lib/format'
import { PROPERTY_TYPES } from '@/config'
import { cn } from '@/lib/utils'

const ICONS = { 'Commercial office': Building2, Retail: Store, Warehousing: Warehouse, Residential: House, 'Mixed use': Building }
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

function SamplePortfolio({ items }) {
  // a modest example holding: cheaper buildings first, about ₹5 lakh in each
  const picks = items.filter((p) => p.minPrice !== null).sort((a, b) => (a.minPrice < b.minPrice ? -1 : 1)).slice(0, 3)
  const rows = picks.map((p) => {
    const u = BigInt(Math.min(25, Math.max(1, Math.round(500000 / Number(p.minPrice)))))
    return { p, units: u, value: u * p.minPrice, rent: p.supply > 0n ? (u * p.rentPaid) / p.supply : 0n }
  })
  const value = rows.reduce((a, r) => a + r.value, 0n)
  const rent = rows.reduce((a, r) => a + r.rent, 0n)
  const series = useMemo(() => { let v = 100; return Array.from({ length: 24 }, (_, i) => ({ i, v: (v += Math.sin(i * 1.3) * 2.6 + 1.6) })) }, [])
  return (
    <div className="relative">
      <div className="rounded-[1.75rem] border bg-white p-6 shadow-[0_30px_70px_-30px_rgba(29,42,60,.35)] sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Your portfolio</p>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Sample</span>
        </div>
        <p className="mt-2 font-serif text-4xl font-semibold tracking-tight">{rupee(value)}</p>
        <p className="mt-1 text-sm font-semibold text-positive">+{rupee(rent)} rent ready to claim</p>
        <div className="mt-4 h-24">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#b8643c" stopOpacity={0.28} /><stop offset="1" stopColor="#b8643c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#b8643c" strokeWidth={2.2} fill="url(#spark)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 divide-y">
          {rows.map(({ p, units: u, value: v }) => (
            <li key={p.address}>
              <Link to={`/properties/${p.address}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                <img src={p.image || placeholderImg(p.address)} alt="" className="size-11 rounded-xl bg-moss object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{u.toString()} units</p></div>
                <p className="text-sm font-semibold">{rupeeShort(v)}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex h-11 items-center justify-center rounded-xl bg-gradient-to-b from-[#d5865b] to-[#bc6840] text-sm font-semibold text-white">Claim {rupee(rent)}</div>
      </div>
    </div>
  )
}

export default function Home() {
  const { version } = useWallet()
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('new')

  useEffect(() => { loadCatalog().then((c) => setItems(c.items)).catch((e) => setErr(prettyErr(e))) }, [version])

  const all = items || []
  const totals = {
    count: all.length,
    forSale: all.reduce((a, p) => a + p.forSale, 0n),
    rent: all.reduce((a, p) => a + p.rentPaid, 0n),
    min: all.filter((p) => p.minPrice !== null).reduce((a, p) => (a === null || p.minPrice < a ? p.minPrice : a), null),
  }

  const shown = useMemo(() => {
    let list = all.filter((p) => (type === 'All' || p.type === type) &&
      (!q || `${p.name} ${p.location} ${p.type}`.toLowerCase().includes(q.toLowerCase())))
    if (sort === 'price') list = [...list].sort((a, b) => (a.minPrice === null) - (b.minPrice === null) || (a.minPrice !== null && b.minPrice !== null ? cmp(a.minPrice, b.minPrice) : 0))
    if (sort === 'avail') list = [...list].sort((a, b) => cmp(b.forSale, a.forSale))
    return list
  }, [items, q, type, sort])

  const goList = (e) => { e?.preventDefault?.(); document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' }) }
  const cats = [['All', LayoutGrid], ...PROPERTY_TYPES.map((t) => [t, ICONS[t] || Building])]

  return (
    <>
      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pt-20 lg:pb-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brick-soft px-3 py-1 text-sm font-semibold text-brick">
            <span className="size-1.5 rounded-full bg-brick" />Units from {totals.min !== null ? rupeeShort(totals.min) : 'a few lakh'}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] sm:text-6xl xl:text-7xl">Real estate for every Indian.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Own units in rent-earning offices, shops and warehouses. Collect your share of the rent, and sell your units whenever you like.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={goList}>Explore properties <ArrowRight /></Button>
            <Button size="lg" variant="outline" asChild><Link to="/list">List your property</Link></Button>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t pt-6">
            {[[totals.count, 'buildings listed'], [totals.forSale.toString(), 'units for sale'], [rupeeShort(totals.rent), 'rent paid out']].map(([v, k]) => (
              <div key={k}><dt className="sr-only">{k}</dt><dd className="font-serif text-3xl font-semibold">{items ? v : '–'}</dd><p className="text-sm text-muted-foreground">{k}</p></div>
            ))}
          </dl>
        </div>
        <div className="mx-auto w-full max-w-md lg:mr-0">
          {items ? <SamplePortfolio items={all} /> : <Skeleton className="h-[460px] rounded-[1.75rem]" />}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <h2 className="text-4xl">How it works</h2>
        <ol className="relative mt-10 grid gap-10 md:grid-cols-3">
          <span className="absolute top-5 right-[16%] left-[4%] hidden h-px bg-brick/40 md:block" />
          {[
            ['Choose a building', 'Look through photos, documents, the location and its performance against NIFTY and SENSEX.'],
            ['Buy units', 'Pick how many units you want and pay the seller in rupees. The units land in your own wallet.'],
            ['Earn the rent', 'Rent is split across all units. Claim your share from your portfolio and sell whenever you like.'],
          ].map(([t, d], i) => (
            <li key={t} className="relative">
              <span className="relative grid size-10 place-items-center rounded-full bg-brick font-serif text-lg font-semibold text-white ring-8 ring-background">{i + 1}</span>
              <p className="mt-5 text-xl font-bold">{t}</p>
              <p className="mt-2 max-w-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* listings */}
      <section id="listings" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl">Open for investment</h2>
            <p className="mt-2 text-muted-foreground">Every listing shows photos, documents, the location and how it has performed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city, area or building" aria-label="Search properties"
              className="h-10 w-64 rounded-full border bg-white pr-4 pl-10 text-sm outline-none focus:border-brick" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
            className="rounded-full border bg-white px-4 py-2 text-sm font-medium outline-none">
            <option value="new">Newest first</option><option value="price">Lowest price</option><option value="avail">Most units for sale</option>
          </select>
          </div>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {cats.map(([t, Icon]) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={cn('flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                type === t ? 'border-primary bg-primary text-white' : 'bg-white hover:border-primary/40')}>
              <Icon className="size-4" strokeWidth={1.8} />{t}
            </button>
          ))}
        </div>
        {err ? <p className="py-20 text-center text-destructive">{err}</p> : (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {!items ? [0, 1, 2, 3].map((k) => <PropertyCardSkeleton key={k} />)
              : shown.length ? shown.map((p) => <PropertyCard key={p.address} p={p} />)
              : <div className="col-span-full rounded-3xl border border-dashed py-16 text-center">
                  <p className="text-lg font-semibold">{all.length ? 'No buildings match that search' : 'No buildings listed yet'}</p>
                  <p className="mt-1 text-muted-foreground">{all.length ? 'Try another area or category.' : <Link to="/list" className="font-semibold text-brick underline">List the first one</Link>}</p>
                </div>}
          </div>
        )}
      </section>

      {/* why units */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <h2 className="max-w-2xl text-4xl">Rent income without buying the whole building</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border bg-white/60 p-7">
            <p className="font-semibold text-muted-foreground">Buying property yourself</p>
            <ul className="mt-5 space-y-4">
              {['Crores to get started, usually with a loan', 'You find tenants, collect rent and fix things', 'Selling takes months and a buyer for the whole thing', 'Paperwork lives in folders and offices'].map((t) => (
                <li key={t} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 size-5 shrink-0" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-7 ring-2 ring-brick/70">
            <p className="font-semibold text-brick">Owning units on Parcel.io</p>
            <ul className="mt-5 space-y-4">
              {[`Start from ${totals.min !== null ? rupee(totals.min) : 'one unit'}, in rupees`, 'The building is managed for you; rent is split by units', 'List your units for sale whenever you like', 'Every unit you hold is recorded on a public ledger'].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-brick" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* owners */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-12 text-white sm:px-12">
          <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-[radial-gradient(circle,#b8643c88_0%,transparent_65%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl">Own a rent-earning building?</h2>
              <p className="mt-3 text-white/70">List it in a few steps, split it into units, and let investors buy in. You keep running the building; they share the rent.</p>
            </div>
            <Button size="lg" variant="brick" asChild><Link to="/list">List your property <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>
    </>
  )
}
