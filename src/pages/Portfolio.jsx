import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ConnectPrompt from '@/components/ConnectPrompt'
import { useTx, useWallet } from '@/context/WalletContext'
import { loadPortfolio } from '@/lib/data'
import { prettyErr } from '@/lib/chain'
import { placeholderImg } from '@/lib/placeholder'
import { pct, rupee, rupeeShort } from '@/lib/format'
import { cn } from '@/lib/utils'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function Portfolio() {
  const { session, version } = useWallet()
  const run = useTx()
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(null)
  const [tab, setTab] = useState('holdings')

  useEffect(() => {
    if (!session) return
    setErr(null)
    loadPortfolio(session.address).then(setData).catch((e) => setErr(prettyErr(e)))
  }, [session, version])

  if (!session) return <ConnectPrompt title="Your portfolio" body="Connect your wallet to see the units you hold and the rent you can claim." />

  const h = data?.holdings || []
  const offers = data?.myOffers || []
  const pending = h.reduce((a, x) => a + x.pending, 0n)
  const value = h.reduce((a, x) => a + (x.value || 0n), 0n)
  const units = h.reduce((a, x) => a + x.balance, 0n)

  async function act(key, params) { setBusy(key); try { await run(params) } catch {} finally { setBusy(null) } }
  const claim = (x) => act(x.address, { label: `Claiming rent from ${x.name}`, success: `${rupee(x.pending)} rent claimed`, address: x.address, contract: 'PropertyToken', method: 'claimYield', args: [] })
  const cancel = (o) => act('o' + o.id, { label: 'Cancelling your offer', success: 'Offer cancelled. Unsold units are back in your wallet.', contract: 'Marketplace', method: 'cancel', args: [o.id] })

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-bold">Portfolio</h1>

      <section className="mt-6 rounded-2xl border p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Current value</p>
            {data ? <p className="mt-1 text-4xl font-extrabold tracking-tight">{rupee(value)}</p> : <Skeleton className="mt-2 h-10 w-52" />}
          </div>
          <div className="flex gap-10">
            <div><p className="text-sm text-muted-foreground">Rent to claim</p><p className={cn('mt-1 text-xl font-bold', pending > 0n && 'text-positive')}>{data ? rupee(pending) : '–'}</p></div>
            <div><p className="text-sm text-muted-foreground">Units held</p><p className="mt-1 text-xl font-bold">{data ? units.toString() : '–'}</p></div>
          </div>
        </div>
        {h.length > 0 && (
          <div className="mt-6">
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
              {h.map((x, i) => <span key={x.address} style={{ flex: Number(x.balance), background: COLORS[i % COLORS.length] }} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {h.map((x, i) => <span key={x.address} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{x.name} {pct(x.balance, units, 0)}</span>)}
            </div>
          </div>
        )}
        <p className="mt-5 text-xs text-muted-foreground">Value uses the lowest price each property is offered at today.</p>
      </section>

      {err && <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-destructive">Could not load your portfolio: {err}</p>}

      <div className="mt-8 flex gap-7 border-b">
        {[['holdings', `Holdings${data ? ` (${h.length})` : ''}`], ['offers', `Selling${data ? ` (${offers.length})` : ''}`]].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            className={cn('-mb-px border-b-2 py-3 text-[15px] font-semibold', tab === v ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{l}</button>
        ))}
      </div>

      {tab === 'holdings' ? (
        <div className="divide-y">
          {!data ? [0, 1].map((k) => <div key={k} className="flex gap-4 py-5"><Skeleton className="size-16 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></div></div>)
            : h.length ? h.map((x) => (
              <div key={x.address} className="flex flex-wrap items-center gap-4 py-5 sm:flex-nowrap">
                <Link to={`/properties/${x.address}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <img src={x.image || placeholderImg(x.address)} alt="" className="size-16 shrink-0 rounded-xl bg-moss object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold hover:underline">{x.name}</p>
                    <p className="text-sm text-muted-foreground">{x.balance.toString()} units · {pct(x.balance, x.supply)} of the building</p>
                  </div>
                </Link>
                <div className="flex w-full items-center justify-between gap-6 sm:w-auto">
                  <div className="sm:w-28 sm:text-right"><p className="font-semibold">{x.value !== null ? rupeeShort(x.value) : '—'}</p><p className="text-xs text-muted-foreground">Value</p></div>
                  <div className="sm:w-28 sm:text-right"><p className={cn('font-semibold', x.pending > 0n && 'text-positive')}>{rupee(x.pending)}</p><p className="text-xs text-muted-foreground">Rent to claim</p></div>
                  <Button size="sm" variant={x.pending > 0n ? 'default' : 'outline'} className="w-28" disabled={x.pending === 0n || busy === x.address} onClick={() => claim(x)}>
                    {x.pending > 0n ? 'Claim' : 'Nothing due'}
                  </Button>
                </div>
              </div>
            ))
            : <Empty title="You don't own any units yet" body="Buy units in a building to start earning a share of its rent." />}
        </div>
      ) : (
        <div className="divide-y">
          {!data ? <Skeleton className="my-5 h-6 w-2/3" />
            : offers.length ? offers.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
                <Link to={`/properties/${o.token}`} className="flex min-w-0 flex-1 items-center gap-1 font-semibold hover:underline">{o.property?.name || 'Property'}<ChevronRight className="size-4 text-muted-foreground" /></Link>
                <span className="text-sm text-muted-foreground"><b className="text-foreground">{o.remaining.toString()}</b> units at <b className="text-foreground">{rupee(o.price)}</b> each</span>
                <Button variant="outline" size="sm" disabled={busy === 'o' + o.id} onClick={() => cancel(o)}>Cancel</Button>
              </div>
            ))
            : <Empty title="You aren't selling any units" body="Open a property you own and choose Sell to list units at your price." />}
        </div>
      )}
    </div>
  )
}

function Empty({ title, body }) {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
      <Button className="mt-5" asChild><Link to="/">Explore properties <ArrowRight /></Link></Button>
    </div>
  )
}
