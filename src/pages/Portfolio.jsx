import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Building2, CalendarClock, Coins, Compass, MapPin, Plus, Tag, Wallet } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ConnectPrompt from '@/components/ConnectPrompt'
import { useTx, useWallet } from '@/context/WalletContext'
import { loadPortfolio } from '@/lib/data'
import { prettyErr, tokenContract } from '@/lib/chain'
import { placeholderImg } from '@/lib/placeholder'
import { greeting, pct, rupee, rupeeShort, short } from '@/lib/format'
import { cn } from '@/lib/utils'

const COLORS = ['#b8643c', '#1d2a3c', '#9aa1ab', '#d9a441', '#5b8a9a']
const fmtDate = (s) => new Date(Number(s) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* extra per-holding numbers from the time-weighted contracts (older contracts just skip these) */
async function enrich(h, me) {
  const tk = tokenContract(h.address)
  let earned = null
  try { earned = await tk.totalEarned(me) } catch { /* older contract */ }
  let payments = []
  try {
    const n = Number(await tk.periodCount())
    const idx = Array.from({ length: Math.min(n, 4) }, (_, i) => n - 1 - i)
    payments = await Promise.all(idx.map(async (i) => {
      const [start, end, amount] = await tk.periodAt(i)
      return { property: h.name, address: h.address, start, end, amount }
    }))
  } catch { /* older contract */ }
  return { ...h, earned, payments }
}

export default function Portfolio() {
  const { session, version } = useWallet()
  const run = useTx()
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!session) return
    let live = true
    setErr(null)
    loadPortfolio(session.address)
      .then(async (d) => ({ ...d, holdings: await Promise.all(d.holdings.map((h) => enrich(h, session.address))) }))
      .then((d) => live && setData(d))
      .catch((e) => live && setErr(prettyErr(e)))
    return () => { live = false }
  }, [session, version])

  if (!session) return <ConnectPrompt title="Your portfolio" body="Connect your wallet to see the units you hold, the rent you've earned and what you can claim." />

  const h = data?.holdings || []
  const offers = data?.myOffers || []
  const pending = h.reduce((a, x) => a + x.pending, 0n)
  const value = h.reduce((a, x) => a + (x.value || 0n), 0n)
  const units = h.reduce((a, x) => a + x.balance, 0n)
  const earned = h.some((x) => x.earned !== null) ? h.reduce((a, x) => a + (x.earned ?? x.pending), 0n) : null
  const payments = h.flatMap((x) => x.payments).sort((a, b) => Number(b.end - a.end)).slice(0, 5)
  const pie = h.map((x) => ({ name: x.name, value: Number(x.value ?? x.balance) }))

  async function act(key, params) { setBusy(key); try { await run(params) } catch {} finally { setBusy(null) } }
  const claim = (x) => act(x.address, { label: `Claiming rent from ${x.name}`, success: `${rupee(x.pending)} rent claimed`, address: x.address, contract: 'PropertyToken', method: 'claimYield', args: [] })
  async function claimAll() {
    setBusy('all')
    for (const x of h.filter((y) => y.pending > 0n)) {
      try { await run({ label: `Claiming rent from ${x.name}`, success: `${rupee(x.pending)} rent claimed`, address: x.address, contract: 'PropertyToken', method: 'claimYield', args: [] }) } catch { break }
    }
    setBusy(null)
  }
  const cancel = (o) => act('o' + o.id, { label: 'Cancelling your offer', success: 'Offer cancelled', contract: 'Marketplace', method: 'cancel', args: [o.id] })

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground">{greeting()}, {session.name}</p>
          <h1 className="mt-1 text-4xl">Your portfolio</h1>
        </div>
        <p className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm text-muted-foreground"><Wallet className="size-4" />{short(session.address)}</p>
      </div>

      {/* summary */}
      <section className="navy-glow mt-6 rounded-3xl p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm text-white/60">Current value</p>
            {data ? <p className="mt-1 font-serif text-5xl font-semibold tracking-tight">{rupee(value)}</p> : <Skeleton className="mt-2 h-12 w-56 bg-white/10" />}
            <p className="mt-2 text-sm text-white/55">Based on the lowest price each building is offered at today.</p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">Rent ready to claim</p>
              <p className={cn('mt-0.5 text-3xl font-bold', pending > 0n && 'text-[#8fd4ad]')}>{data ? rupee(pending) : '–'}</p>
            </div>
            <Button variant="brick" size="lg" disabled={!data || pending === 0n || busy === 'all'} onClick={claimAll}>
              <Coins /> {pending > 0n ? 'Claim all' : 'Nothing to claim'}
            </Button>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4">
          {[
            ['Rent earned so far', earned !== null ? rupee(earned) : '—'],
            ['Buildings', data ? h.length : '–'],
            ['Units held', data ? units.toString() : '–'],
            ['Units on sale', data ? offers.reduce((a, o) => a + o.remaining, 0n).toString() : '–'],
          ].map(([k, v]) => <div key={k}><dt className="text-sm text-white/55">{k}</dt><dd className="mt-0.5 text-xl font-bold">{v}</dd></div>)}
        </dl>
      </section>

      {/* quick actions */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          [Compass, 'Buy more units', 'Browse buildings open for investment', '/'],
          [Tag, 'Sell units', 'Open a building you own and choose Sell', h[0] ? `/properties/${h[0].address}` : '/'],
          [Plus, 'List a building', 'Split your property into units', '/list'],
        ].map(([Icon, t, d, to]) => (
          <Link key={t} to={to} className="group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-md">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brick-soft text-brick"><Icon className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">{t}</span><span className="block truncate text-sm text-muted-foreground">{d}</span></span>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {err && <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-destructive">Could not load your portfolio: {err}</p>}

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-12">
          {/* holdings */}
          <section>
            <h2 className="text-2xl">Your buildings</h2>
            <div className="mt-5 space-y-4">
              {!data ? [0, 1].map((k) => <Skeleton key={k} className="h-44 rounded-2xl" />)
                : h.length ? h.map((x) => (
                  <article key={x.address} className="overflow-hidden rounded-2xl border bg-white sm:flex">
                    <Link to={`/properties/${x.address}`} className="relative block h-40 shrink-0 bg-moss sm:h-auto sm:w-52">
                      <img src={x.image || placeholderImg(x.address)} alt="" className="absolute inset-0 size-full object-cover" />
                    </Link>
                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/properties/${x.address}`} className="text-lg font-bold hover:underline">{x.name}</Link>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{x.location || 'Location to be added'}{x.type && <> · {x.type}</>}</p>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{pct(x.balance, x.supply)} of the building</span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <div><dt className="text-muted-foreground">Units</dt><dd className="font-bold">{x.balance.toString()}</dd></div>
                        <div><dt className="text-muted-foreground">Value</dt><dd className="font-bold">{x.value !== null ? rupeeShort(x.value) : '—'}</dd></div>
                        <div><dt className="text-muted-foreground">Rent earned</dt><dd className="font-bold">{x.earned !== null ? rupee(x.earned) : '—'}</dd></div>
                        <div><dt className="text-muted-foreground">To claim</dt><dd className={cn('font-bold', x.pending > 0n && 'text-positive')}>{rupee(x.pending)}</dd></div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant={x.pending > 0n ? 'brick' : 'outline'} disabled={x.pending === 0n || !!busy} onClick={() => claim(x)}>
                          <Coins /> {x.pending > 0n ? `Claim ${rupee(x.pending)}` : 'Nothing to claim'}
                        </Button>
                        <Button size="sm" variant="outline" asChild><Link to={`/properties/${x.address}`}><Tag /> Sell units</Link></Button>
                        <Button size="sm" variant="ghost" asChild><Link to={`/properties/${x.address}`}>View building <ArrowRight /></Link></Button>
                      </div>
                    </div>
                  </article>
                ))
                : <StartHere />}
            </div>
          </section>

          {/* offers */}
          <section>
            <h2 className="text-2xl">Units you're selling</h2>
            <p className="mt-1 text-sm text-muted-foreground">Listed units stay in your wallet and keep earning rent until someone buys them.</p>
            <div className="mt-5 divide-y rounded-2xl border bg-white">
              {!data ? <div className="p-5"><Skeleton className="h-5 w-2/3" /></div>
                : offers.length ? offers.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
                    <img src={o.property?.image || placeholderImg(o.token)} alt="" className="size-12 rounded-xl bg-moss object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/properties/${o.token}`} className="font-semibold hover:underline">{o.property?.name || 'Property'}</Link>
                      <p className="text-sm text-muted-foreground">{o.remaining.toString()} units at {rupee(o.price)} each · {rupeeShort(o.remaining * o.price)} in total</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={busy === 'o' + o.id} onClick={() => cancel(o)}>Cancel offer</Button>
                  </div>
                ))
                : <p className="p-5 text-sm text-muted-foreground">You aren't selling any units. Open one of your buildings and choose <b>Sell</b> to set a price.</p>}
            </div>
          </section>
        </div>

        {/* side column */}
        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-sans text-base font-bold">Where your money is</h2>
            {data && h.length ? (
              <>
                <div className="relative mt-3 h-44">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pie} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="96%" paddingAngle={h.length > 1 ? 2 : 0} stroke="none">
                        {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [rupee(BigInt(Math.round(v))), 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div><p className="text-lg font-bold">{rupeeShort(value)}</p><p className="text-xs text-muted-foreground">{h.length} building{h.length > 1 ? 's' : ''}</p></div>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {h.map((x, i) => (
                    <li key={x.address} className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="min-w-0 flex-1 truncate">{x.name}</span>
                      <b>{value > 0n && x.value !== null ? pct(x.value, value, 0) : '—'}</b>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="mt-3 text-sm text-muted-foreground">Your split across buildings shows here once you own units.</p>}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 font-sans text-base font-bold"><CalendarClock className="size-4.5 text-brick" />Recent rent payments</h2>
            {payments.length ? (
              <ul className="mt-3 divide-y">
                {payments.map((p, i) => (
                  <li key={i} className="py-3">
                    <div className="flex justify-between gap-3 text-sm"><Link to={`/properties/${p.address}`} className="truncate font-semibold hover:underline">{p.property}</Link><b>{rupeeShort(p.amount)}</b></div>
                    <p className="text-xs text-muted-foreground">Covers {fmtDate(p.start)} to {fmtDate(p.end)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Rent payments on buildings you own will appear here.</p>}
          </section>

          <section className="rounded-2xl bg-brick-soft p-5">
            <h2 className="flex items-center gap-2 font-sans text-base font-bold text-brick"><Building2 className="size-4.5" />How your rent is worked out</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              Each rent payment covers the days since the previous one. You get a share for every day you held your units in that time,
              so if you sell before rent is paid, you still keep what you earned.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function StartHere() {
  return (
    <div className="rounded-2xl border border-dashed bg-white/60 p-8">
      <p className="text-lg font-bold">You don't own any units yet</p>
      <ol className="mt-4 space-y-3 text-sm">
        {['Pick a building on Explore and look through its photos, documents and performance.', 'Choose how many units to buy and confirm in MetaMask. Pay the seller in rupees.', 'Rent starts adding up from the day you buy. Claim it here.'].map((t, i) => (
          <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brick text-xs font-bold text-white">{i + 1}</span>{t}</li>
        ))}
      </ol>
      <Button className="mt-6" asChild><Link to="/">Explore properties <ArrowRight /></Link></Button>
    </div>
  )
}
