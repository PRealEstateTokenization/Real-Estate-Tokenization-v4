import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building, MapPin, Building2, Check, House, LayoutGrid, Search, Store, Warehouse, X } from 'lucide-react'
import { motion } from 'framer-motion'
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

function UnitTicket({ p }) {
  const share = p.supply > 0n ? (100 / Number(p.supply)).toFixed(2) : '0'
  return (
    <div className="w-72 rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(29,42,60,.45)]">
      <div className="p-5 pb-4">
        <p className="text-xs font-semibold text-brick">1 unit of</p>
        <p className="mt-0.5 truncate font-serif text-xl font-semibold">{p.name}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" />{p.location || 'Location to be added'}</p>
      </div>
      <div className="relative border-t border-dashed">
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-background" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-background" />
      </div>
      <dl className="grid grid-cols-2 gap-y-3 p-5 pt-4 text-sm">
        <div><dt className="text-muted-foreground">You pay</dt><dd className="text-lg font-bold">{p.minPrice !== null ? rupee(p.minPrice) : '—'}</dd></div>
        <div><dt className="text-muted-foreground">You earn</dt><dd className="text-lg font-bold">{share}% <span className="text-sm font-medium text-muted-foreground">of rent</span></dd></div>
        <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
          <span className="text-muted-foreground">Rent paid to holders so far</span><b className="text-positive">{rupeeShort(p.rentPaid)}</b>
        </div>
      </dl>
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
  const hero = all.find((p) => p.image && p.rentPaid > 0n) || all.find((p) => p.image) || all[0]
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
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-20 lg:pb-20">
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
        <div className="relative mx-auto w-full max-w-xl pb-28">
          {!items ? <Skeleton className="aspect-[4/3] rounded-[2rem]" /> : (
            <>
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
                <Link to={hero ? `/properties/${hero.address}` : '/'} className="block aspect-[4/3] overflow-hidden rounded-[2rem] bg-moss shadow-[0_40px_80px_-40px_rgba(29,42,60,.5)]">
                  <img src={hero?.image || placeholderImg(hero?.address || 'parcel')} alt={hero?.name || ''} className="size-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
                </Link>
              </motion.div>
              {hero && (
                <motion.div initial={{ opacity: 0, y: 24, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 0.35, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                  className="absolute bottom-0 -left-3 sm:-left-12">
                  <UnitTicket p={hero} />
                </motion.div>
              )}
            </>
          )}
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
