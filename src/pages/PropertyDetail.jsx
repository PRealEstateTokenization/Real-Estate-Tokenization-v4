import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, Landmark, Repeat, Settings2, Share2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import PhotoMosaic from '@/components/PhotoMosaic'
import InvestPanel from '@/components/InvestPanel'
import HoldingCard from '@/components/HoldingCard'
import OffersList from '@/components/OffersList'
import PerformanceChart from '@/components/PerformanceChart'
import ActivityFeed from '@/components/ActivityFeed'
import DocumentsList from '@/components/DocumentsList'
import LocationMap from '@/components/LocationMap'
import OwnerTools from '@/components/OwnerTools'
import { useWallet } from '@/context/WalletContext'
import { loadProperty } from '@/lib/data'
import { downloadHistory } from '@/lib/history'
import { placeholderImg } from '@/lib/placeholder'
import { initials, nameFor, rupee, rupeeShort, short } from '@/lib/format'
import { prettyErr } from '@/lib/chain'
import { EXPLORER } from '@/config'

const SECTIONS = [['overview', 'Overview'], ['performance', 'Performance'], ['offers', 'Units for sale'], ['documents', 'Documents'], ['location', 'Location']]

function Section({ id, title, aside, children }) {
  return (
    <section id={id} className="scroll-mt-32 border-t py-10">
      {title && <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-[22px] font-bold">{title}</h2>{aside}</div>}
      {children}
    </section>
  )
}

function About({ text }) {
  const [more, setMore] = useState(false)
  const long = text.length > 320
  return (
    <div>
      <p className={`max-w-[68ch] leading-relaxed whitespace-pre-line text-foreground/85 ${long && !more ? 'line-clamp-4' : ''}`}>{text}</p>
      {long && <button type="button" onClick={() => setMore((m) => !m)} className="mt-3 font-semibold underline underline-offset-4">{more ? 'Show less' : 'Show more'}</button>}
    </div>
  )
}

export default function PropertyDetail() {
  const { address } = useParams()
  const { session, version } = useWallet()
  const [p, setP] = useState(null)
  const [err, setErr] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [dl, setDl] = useState(null)
  const [manage, setManage] = useState(false)
  const panel = useRef(null)

  useEffect(() => {
    let live = true
    loadProperty(address, session?.address).then((d) => live && (setP(d), setErr(null))).catch((e) => live && setErr(prettyErr(e)))
    return () => { live = false }
  }, [address, session?.address, version])

  if (err) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-lg font-semibold">Could not load this property</p><p className="mt-1 text-muted-foreground">{err}</p></div>
  if (!p) return <DetailSkeleton />

  const m = p.media
  const imgs = m.image_urls?.length ? m.image_urls : [placeholderImg(p.address)]
  const unitPct = p.supply > 0n ? (100 / Number(p.supply)).toFixed(2) : '0'
  const buyFrom = (id) => { setSelectedId(id); panel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  async function exportCsv() {
    setDl('Preparing…')
    try { await downloadHistory(p, setDl); toast.success('Ownership history downloaded') }
    catch (e) { toast.error('Could not export history: ' + (e.message || e)) }
    finally { setDl(null) }
  }
  const share = () => navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied'), () => toast(window.location.href))

  const stats = [
    ['Price per unit', p.minPrice !== null ? rupee(p.minPrice) : 'No offers'],
    ['Units for sale', `${p.forSale} of ${p.supply}`],
    ['One unit earns', `${unitPct}% of rent`],
    ['Rent paid out', rupeeShort(p.rentPaid)],
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:pb-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All properties</Link>
          <h1 className="text-[28px] leading-tight font-bold sm:text-3xl">{p.name}</h1>
        </div>
        <div className="flex gap-1">
          {p.isOwner && <Button variant="outline" size="sm" onClick={() => setManage(true)}><Settings2 /> Manage listing</Button>}
          <Button variant="ghost" size="sm" onClick={share}><Share2 /> <span className="underline underline-offset-4">Share</span></Button>
          <Button variant="ghost" size="sm" asChild><a href={`${EXPLORER}/token/${p.address}`} target="_blank" rel="noopener"><ExternalLink /> <span className="underline underline-offset-4">Ledger</span></a></Button>
        </div>
      </div>

      <PhotoMosaic images={imgs} name={p.name} isPlaceholder={!m.image_urls?.length} />

      <nav className="sticky top-16 z-20 -mx-4 mt-6 hidden gap-7 border-b bg-white px-4 sm:-mx-6 sm:px-6 md:flex">
        {SECTIONS.filter(([id]) => id !== 'location' || m.location).map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
            className="border-b-2 border-transparent py-4 text-sm font-semibold text-muted-foreground hover:border-foreground hover:text-foreground">{label}</a>
        ))}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
        <div className="min-w-0">
          <section id="overview" className="scroll-mt-32 pt-8 pb-8">
            <h2 className="text-[22px] font-bold">{m.property_type || 'Property'} in {m.location || 'India'}</h2>
            <p className="mt-1 text-muted-foreground">{p.supply.toString()} units · {p.symbol}</p>
            <div className="mt-6 flex items-center gap-4 border-y py-5">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-bold text-white">{initials(nameFor(p.registrant))}</span>
              <div><p className="font-semibold">Listed by {nameFor(p.registrant)}{p.isOwner ? ' (you)' : ''}</p><p className="text-sm text-muted-foreground">Property owner · {short(p.registrant)}</p></div>
            </div>
            <ul className="mt-7 space-y-6">
              {[
                [Landmark, 'Rent shared by units', `${rupeeShort(p.rentPaid)} paid to unit holders so far. Each unit gets an equal share.`],
                [ShieldCheck, 'Ownership on a public ledger', 'Every unit you hold is recorded on Ethereum, and the title document is fingerprinted.'],
                [Repeat, 'Sell whenever you like', 'List your units at your own price. They stay in escrow until they sell.'],
              ].map(([Icon, t, d]) => (
                <li key={t} className="flex gap-5"><Icon className="mt-0.5 size-6 shrink-0" strokeWidth={1.6} /><div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div></li>
              ))}
            </ul>
          </section>

          <Section title="About this property">
            <About text={m.description || (p.isOwner ? 'Add a description from "Manage listing" so investors know the building, its tenants and the rent it earns.' : 'The owner has not added a description yet.')} />
            <dl className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
              {stats.map(([k, v]) => <div key={k}><dt className="text-sm text-muted-foreground">{k}</dt><dd className="mt-0.5 text-lg font-bold">{v}</dd></div>)}
            </dl>
          </Section>

          <Section id="performance" title="Performance"><PerformanceChart address={p.address} /></Section>

          <Section id="offers" title="Units for sale"><OffersList p={p} onBuy={buyFrom} /></Section>

          <Section id="documents" title="Documents"><DocumentsList /></Section>

          {m.location && <Section id="location" title="Where it is"><p className="-mt-3 mb-4 text-muted-foreground">{m.location}</p><LocationMap location={m.location} /></Section>}

          <Section title="Recent activity" aside={
            <button type="button" disabled={!!dl} onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 disabled:opacity-50"><Download className="size-4" />{dl || 'Download history'}</button>}>
            <ActivityFeed address={p.address} version={version} />
          </Section>
        </div>

        <aside className="order-first pt-8 lg:order-none">
          <div className="space-y-4 lg:sticky lg:top-36" ref={panel}>
            <InvestPanel p={p} selectedId={selectedId} onSelect={setSelectedId} />
            {p.myBalance > 0n && <HoldingCard p={p} />}
          </div>
        </aside>
      </div>

      {p.isOwner && (
        <Dialog open={manage} onOpenChange={setManage}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><OwnerTools key={version} p={p} /></DialogContent>
        </Dialog>
      )}

      {p.buyable.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t bg-white px-5 py-3 lg:hidden">
          <div><p className="font-bold">{rupee(p.minPrice)} <span className="text-sm font-normal text-muted-foreground">per unit</span></p><p className="text-xs text-muted-foreground">{p.forSale.toString()} units for sale</p></div>
          <Button size="lg" onClick={() => buyFrom(p.buyable[0].id)}>Buy units</Button>
        </div>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-9 w-2/3" />
      <Skeleton className="mt-5 h-[300px] rounded-2xl md:h-[460px]" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>
    </div>
  )
}
