import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building, Building2, Check, House, LayoutGrid, MapPin, Search, Store, Warehouse, X } from 'lucide-react'
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
    <div className="relative w-72 rounded-2xl bg-white text-foreground shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
      <div className="p-5 pb-4">
        <p className="text-xs font-semibold text-brick">1 unit of</p>
        <p className="mt-0.5 truncate font-serif text-xl font-semibold">{p.name}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="size-3.5" />{p.location || 'India'}</p>
      </div>
      <div className="relative border-t border-dashed">
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-[#1d2a3c]" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-[#1d2a3c]" />
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

  const goList = (e) => { e?.preventDefault(); document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' }) }
  const cats = [['All', LayoutGrid], ...PROPERTY_TYPES.map((t) => [t, ICONS[t] || Building])]

  return (
    <>
      {/* hero */}
      <section className="navy-glow relative overflow-hidden">
        <div className="pointer-events-none absolute top-1/3 -right-40 size-[640px] rounded-full bg-[radial-gradient(circle,rgba(184,100,60,.35)_0%,transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-[#f0b08c]">
              <span className="size-1.5 rounded-full bg-[#f0b08c]" />Units from {totals.min !== null ? rupeeShort(totals.min) : 'a few lakh'}
            </p>
            <h1 className="mt-6 text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">Real estate for every Indian.</h1>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              Own units in rent-earning offices, shops and warehouses. Collect your share of the rent, and sell your units whenever you like.
            </p>
            <form onSubmit={goList} className="mt-8 flex max-w-xl items-center rounded-full bg-white p-2 pl-6 text-foreground shadow-[0_18px_40px_-12px_rgba(0,0,0,.45)]">
              <div className="min-w-0 flex-1">
                <label htmlFor="q" className="block text-xs font-semibold">Where</label>
                <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, area or building"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
              </div>
              <button type="submit" className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-gradient-to-b from-[#d5865b] to-[#bc6840] px-5 font-semibold text-white hover:brightness-105"><Search className="size-4.5" />Search</button>
            </form>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mr-0">
            {!items ? <Skeleton className="aspect-[4/5] rounded-[2rem] bg-white/10" /> : (
              <>
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
                  <Link to={hero ? `/properties/${hero.address}` : '/'} className="block aspect-[4/5] overflow-hidden rounded-[2rem] bg-white/10 ring-1 ring-white/10">
                    <img src={hero?.image || placeholderImg(hero?.address || 'parcel')} alt={hero?.name || ''} className="size-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
                  </Link>
                </motion.div>
                {hero && (
                  <motion.div initial={{ opacity: 0, y: 24, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 0.35, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute -bottom-8 -left-4 sm:-left-12">
                    <UnitTicket p={hero} />
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* live numbers */}
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 border-t border-white/10 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            [totals.count, 'buildings listed'],
            [totals.forSale.toString(), 'units for sale now'],
            [rupeeShort(totals.rent), 'rent paid to holders'],
            [totals.min !== null ? rupeeShort(totals.min) : '—', 'smallest ticket today'],
          ].map(([v, k]) => (
            <div key={k}>
              <p className="font-serif text-4xl font-semibold">{items ? v : '–'}</p>
              <p className="mt-1 text-sm text-white/60">{k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* listings */}
      <section id="listings" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl">Open for investment</h2>
            <p className="mt-2 text-muted-foreground">Every listing shows photos, documents, the location and how it has performed.</p>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
            className="rounded-full border bg-white px-4 py-2 text-sm font-medium outline-none">
            <option value="new">Newest first</option><option value="price">Lowest price</option><option value="avail">Most units for sale</option>
          </select>
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
              {[`Start from ${totals.min !== null ? rupee(totals.min) : 'one unit'}`, 'The building is managed for you; rent is split by units', 'List your units for sale whenever you like', 'Every unit you hold is recorded on a public ledger'].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-brick" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
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
