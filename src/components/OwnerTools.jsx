import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PhotoDrop from '@/components/PhotoDrop'
import { useTx, useWallet } from '@/context/WalletContext'
import { removeImage, saveMedia, sb, uploadImages } from '@/lib/media'
import { PROPERTY_TYPES } from '@/config'
import { rupee } from '@/lib/format'

export default function OwnerTools({ p }) {
  const { session, bump } = useWallet()
  const run = useTx()
  const m = p.media || {}
  const [loc, setLoc] = useState(m.location || '')
  const [type, setType] = useState(m.property_type || PROPERTY_TYPES[0])
  const [desc, setDesc] = useState(m.description || '')
  const [files, setFiles] = useState([])
  const [amount, setAmount] = useState('100000')
  const [busy, setBusy] = useState(false)
  const imgs = m.image_urls || []

  async function saveDetails() {
    setBusy(true)
    try { await saveMedia(p.address, { location: loc.trim(), property_type: type, description: desc.trim() }, session.address); toast.success('Details saved'); bump() }
    catch (e) { toast.error('Could not save: ' + (e.message || e)) } finally { setBusy(false) }
  }
  async function upload() {
    if (!files.length) return
    setBusy(true)
    const id = toast.loading(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}…`)
    try { const urls = await uploadImages(p.address, files); await saveMedia(p.address, { image_urls: [...imgs, ...urls] }, session.address); setFiles([]); toast.success('Photos uploaded', { id }); bump() }
    catch (e) { toast.error('Upload failed: ' + (e.message || e), { id }) } finally { setBusy(false) }
  }
  async function remove(url) {
    try { await saveMedia(p.address, { image_urls: imgs.filter((u) => u !== url) }, session.address); await removeImage(url); toast.success('Photo removed'); bump() }
    catch (e) { toast.error('Could not remove: ' + (e.message || e)) }
  }
  async function cover(url) {
    try { await saveMedia(p.address, { image_urls: [url, ...imgs.filter((u) => u !== url)] }, session.address); toast.success('Cover photo updated'); bump() }
    catch (e) { toast.error('Could not update: ' + (e.message || e)) }
  }
  async function distribute() {
    const amt = BigInt(amount || '0'); if (amt <= 0n) return
    try { await run({ label: 'Distributing rent', success: `Distributed ${rupee(amt)} across all unit holders`, contract: 'PropertyToken', address: p.address, method: 'depositYield', args: [amt] }) } catch {}
  }

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <DialogTitle className="text-xl">Manage your listing</DialogTitle>
        <DialogDescription>Changes to details and photos show to investors straight away.</DialogDescription>
      </div>
      <div>
        <Tabs defaultValue={sb ? 'details' : 'rent'}>
          <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="photos">Photos ({imgs.length})</TabsTrigger><TabsTrigger value="rent">Distribute rent</TabsTrigger></TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            {!sb ? <p className="text-sm text-muted-foreground">Add your Supabase URL and key in <code>src/config.js</code> to edit details.</p> : <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="loc">Location</Label><Input id="loc" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Whitefield, Bengaluru" /></div>
                <div className="space-y-2"><Label>Property type</Label>
                  <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="The building, its tenants, the lease terms and the rent it earns." /></div>
              <Button disabled={busy} onClick={saveDetails}>Save details</Button>
            </>}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 pt-4">
            {!sb ? <p className="text-sm text-muted-foreground">Add your Supabase URL and key in <code>src/config.js</code> to manage photos.</p> : <>
              {imgs.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imgs.map((u, i) => (
                    <div key={u} className="group relative h-24 w-32 overflow-hidden rounded-xl border">
                      <img src={u} alt="" className="size-full object-cover" />
                      {i === 0 ? <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 text-[10px] font-semibold text-white">Cover</span>
                        : <button type="button" onClick={() => cover(u)} className="absolute bottom-1 left-1 rounded-md bg-white/90 px-1.5 text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">Make cover</button>}
                      <button type="button" aria-label="Remove photo" onClick={() => remove(u)} className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"><Trash2 className="size-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <PhotoDrop files={files} onChange={setFiles} />
              <Button disabled={busy || !files.length} onClick={upload}>Upload {files.length || ''} photo{files.length === 1 ? '' : 's'}</Button>
            </>}
          </TabsContent>

          <TabsContent value="rent" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Record a rent payment in rupees. It is split across every unit holder in proportion to the units they hold, and each holder claims their share.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2"><Label htmlFor="amt">Amount to distribute (₹)</Label><Input id="amt" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11" /></div>
              <Button size="lg" onClick={distribute}>Distribute {rupee(BigInt(amount || '0'))}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
