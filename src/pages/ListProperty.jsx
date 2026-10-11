import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { Building, Building2, House, Loader2, Store, Warehouse, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import PhotoDrop from '@/components/PhotoDrop'
import PropertyCard from '@/components/PropertyCard'
import ConnectPrompt from '@/components/ConnectPrompt'
import { useTx, useWallet } from '@/context/WalletContext'
import { getAbis } from '@/lib/chain'
import { saveMedia, sb, uploadImages } from '@/lib/media'
import { PROPERTY_TYPES } from '@/config'
import { cn } from '@/lib/utils'

const ICONS = { 'Commercial office': Building2, Retail: Store, Warehousing: Warehouse, Residential: House, 'Mixed use': Building }
const STEPS = [
  ['Which of these best describes your building?', 'Investors filter properties by type.'],
  ['Where is it?', 'Shown on the listing with a map.'],
  ['Add some photos', 'The first photo becomes the cover. You can change photos later.'],
  ['Name and describe it', 'Tell investors about the building, its tenants and the rent it earns.'],
  ['Split it into units', 'You receive every unit to start, and can offer them to investors.'],
  ['Review your listing', 'This is how investors will see it. Registering records it on the ledger.'],
]

export default function ListProperty() {
  const { session } = useWallet()
  const run = useTx()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ type: '', location: '', name: '', description: '', symbol: '', units: '1000', doc: 'Title deed and khata extract' })
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const cover = useMemo(() => (files[0] ? URL.createObjectURL(files[0]) : null), [files])

  if (!session) return <ConnectPrompt title="List your property" body="Connect your wallet to register a building and issue its units." />

  const units = /^\d+$/.test(f.units) ? BigInt(f.units) : 0n
  const ok = [!!f.type, f.location.trim().length > 1, true, f.name.trim().length > 1, !!f.symbol.trim() && units > 0n, true][step]
  const last = step === STEPS.length - 1

  async function submit() {
    setBusy(true)
    try {
      const rc = await run({
        label: 'Registering property', success: 'Property registered',
        contract: 'PropertyTokenFactory', method: 'registerLand',
        args: [f.name.trim(), f.symbol.trim(), units, ethers.keccak256(ethers.toUtf8Bytes(f.doc)), 'demo'],
      })
      const iface = new ethers.Interface(getAbis().PropertyTokenFactory)
      let token = null
      for (const log of rc.logs || []) { try { const x = iface.parseLog(log); if (x?.name === 'LandRegistered') token = x.args.tokenAddress } catch {} }
      if (token && sb) {
        const id = toast.loading(files.length ? 'Uploading photos and details' : 'Saving details')
        try {
          const urls = files.length ? await uploadImages(token, files) : []
          await saveMedia(token, { image_urls: urls, location: f.location.trim(), property_type: f.type, description: f.description.trim() }, session.address)
          toast.success('Listing published', { id })
        } catch (e) {
          console.error('[media]', e)
          toast.error('Registered, but the photos or details did not save. Add them with Manage listing.', { id })
        }
      }
      nav(token ? `/properties/${token}` : '/')
    } catch { /* toast shown */ } finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 pt-10 pb-36">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          <Link to="/" className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-muted"><X className="size-4" />Exit</Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-[34px]">{STEPS[step][0]}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{STEPS[step][1]}</p>

        <div className="mt-8">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROPERTY_TYPES.map((t) => {
                const Icon = ICONS[t] || Building
                return (
                  <button key={t} type="button" onClick={() => set('type')(t)}
                    className={cn('flex flex-col items-start gap-6 rounded-xl border-2 p-4 text-left font-semibold transition-colors',
                      f.type === t ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/50')}>
                    <Icon className="size-8" strokeWidth={1.5} />{t}
                  </button>
                )
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="loc">Area and city</Label>
              <Input id="loc" autoFocus value={f.location} onChange={set('location')} placeholder="e.g. Whitefield, Bengaluru" className="h-14 text-lg" />
            </div>
          )}

          {step === 2 && (
            <>
              <PhotoDrop files={files} onChange={setFiles} />
              {!sb && <p className="mt-3 text-sm text-brick">Photo storage is not set up yet, so photos will not be saved. Add your Supabase keys in src/config.js.</p>}
            </>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2"><Label htmlFor="name">Property name</Label><Input id="name" autoFocus value={f.name} onChange={set('name')} placeholder="e.g. Puravankara, Tower A" className="h-12 text-base" /></div>
              <div className="space-y-2"><Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={7} value={f.description} onChange={set('description')} placeholder="Grade-A office tower, fully leased to three tenants on nine-year leases. Rent is paid monthly and distributed every quarter." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="units">Number of units</Label>
                <Input id="units" type="number" min="1" step="1" value={f.units} onChange={set('units')} className="h-14 text-2xl font-bold" />
                <p className="text-sm text-muted-foreground">{units > 0n ? `Each unit earns ${(100 / Number(units)).toFixed(4).replace(/\.?0+$/, '')}% of the rent.` : 'Whole units only.'}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="sym">Short code</Label><Input id="sym" value={f.symbol} onChange={(e) => set('symbol')(e.target.value.toUpperCase())} placeholder="PRVK-A" className="h-12" />
                  <p className="text-xs text-muted-foreground">Shown next to the units on the ledger.</p></div>
                <div className="space-y-2"><Label htmlFor="doc">Title document</Label><Input id="doc" value={f.doc} onChange={set('doc')} className="h-12" />
                  <p className="text-xs text-muted-foreground">Stored as a fingerprint so the record can be checked later.</p></div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-8 sm:grid-cols-[260px_1fr]">
              <PropertyCard preview p={{ address: f.symbol || 'preview', name: f.name, location: f.location, type: f.type, supply: units, forSale: 0n, minPrice: null, rentPaid: 0n, image: cover }} />
              <dl className="divide-y self-start text-sm">
                {[['Type', f.type], ['Location', f.location], ['Photos', files.length || 'None yet'], ['Units', units.toString()], ['Short code', f.symbol], ['Title document', f.doc]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background">
        <div className="flex h-1.5 gap-1">
          {STEPS.map((_, i) => <span key={i} className={cn('flex-1 transition-colors', i <= step ? 'bg-foreground' : 'bg-muted')} />)}
        </div>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="font-semibold underline underline-offset-4 disabled:invisible">Back</button>
          {last
            ? <Button size="lg" disabled={busy} onClick={submit}>{busy && <Loader2 className="animate-spin" />}{busy ? 'Registering…' : 'Register property'}</Button>
            : <Button size="lg" variant="dark" disabled={!ok} onClick={() => setStep((s) => s + 1)}>{step === 2 && !files.length ? 'Skip for now' : 'Next'}</Button>}
        </div>
      </div>
    </div>
  )
}
