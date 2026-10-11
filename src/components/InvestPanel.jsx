import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Info, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import Stepper from '@/components/Stepper'
import { useTx, useWallet } from '@/context/WalletContext'
import { getConfig, tokenContract } from '@/lib/chain'
import { nameFor, pct, rupee } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function InvestPanel({ p, selectedId, onSelect }) {
  const { session, connect } = useWallet()
  const run = useTx()
  const [tab, setTab] = useState(p.buyable.length || p.myBalance === 0n ? 'buy' : 'sell')
  const offer = p.buyable.find((o) => o.id === selectedId) || p.buyable[0] || null
  const max = offer ? Number(offer.remaining) : 1
  const [qty, setQty] = useState(Math.min(10, max))
  const [busy, setBusy] = useState(false)
  const [bought, setBought] = useState(null)

  useEffect(() => { setQty((q) => Math.min(Math.max(q, 1), max)) }, [max])
  useEffect(() => { if (selectedId !== undefined && selectedId !== null) setTab('buy') }, [selectedId])

  const total = offer ? BigInt(qty) * offer.price : 0n
  const earnedPerUnit = p.supply > 0n ? p.rentPaid / p.supply : 0n

  async function buy() {
    if (!session) return connect(false)
    setBusy(true)
    try {
      await run({ label: `Buying ${qty} units`, success: `You bought ${qty} units`, contract: 'Marketplace', method: 'buy', args: [offer.id, BigInt(qty)] })
      setBought({ qty, total })
    } catch {} finally { setBusy(false) }
  }

  /* sell */
  const myMax = Number(p.myBalance)
  const [sellQty, setSellQty] = useState(Math.min(10, Math.max(myMax, 1)))
  const [sellPrice, setSellPrice] = useState(p.minPrice !== null ? String(p.minPrice) : '5000')
  async function list() {
    if (!session) return connect(false)
    const amount = BigInt(sellQty), price = BigInt(sellPrice || '0')
    if (price <= 0n) return
    setBusy(true)
    try {
      const market = getConfig().marketplace
      const allowance = await tokenContract(p.address).allowance(session.address, market)
      if (allowance < amount) {
        await run({ label: 'Step 1 of 2: approve escrow', success: 'Escrow approved', contract: 'PropertyToken', address: p.address, method: 'approve', args: [market, amount] })
      }
      await run({ label: `Listing ${amount} units`, success: `${amount} units listed at ${rupee(price)} each`, contract: 'Marketplace', method: 'list', args: [p.address, amount, price] })
    } catch {} finally { setBusy(false) }
  }

  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-[0_6px_24px_-8px_rgba(20,35,31,.18)]">
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="flex border-b px-6">
          {[['buy', 'Buy', 'border-primary text-primary'], ['sell', 'Sell', 'border-brick text-brick']].map(([v, l, on]) => (
            <button key={v} type="button" onClick={() => setTab(v)}
              className={cn('-mb-px border-b-2 px-1 py-4 mr-7 text-[15px] font-bold transition-colors', tab === v ? on : 'border-transparent text-muted-foreground hover:text-foreground')}>{l}</button>
          ))}
        </div>

        <TabsContent value="buy">
          <CardContent className="space-y-5 p-6">
            {!offer ? (
              <div className="py-6 text-center">
                <p className="text-lg font-bold">No units for sale right now</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.open.length ? 'The only open offer is yours.' : 'New offers appear here as soon as a holder lists units.'}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">{offer.id === p.buyable[0]?.id ? 'Lowest price' : 'Selected offer'}</p>
                  <p className="text-3xl font-extrabold tracking-tight">{rupee(offer.price)}<span className="text-base font-medium text-muted-foreground"> / unit</span></p>
                  <p className="text-sm text-muted-foreground">{offer.remaining.toString()} units from {nameFor(offer.seller)}</p>
                </div>

                {p.buyable.length > 1 && (
                  <div className="space-y-2">
                    <Label>Choose an offer</Label>
                    <div className="space-y-1.5">
                      {p.buyable.slice(0, 4).map((o) => (
                        <button key={o.id} type="button" onClick={() => onSelect(o.id)}
                          className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                            o.id === offer.id ? 'border-primary bg-secondary' : 'hover:bg-muted')}>
                          <span><span className="font-semibold">{rupee(o.price)}</span> <span className="text-muted-foreground">· {o.remaining.toString()} units</span></span>
                          <span className="text-muted-foreground">{nameFor(o.seller)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="qty">How many units?</Label>
                  <Stepper id="qty" value={qty} max={max} onChange={setQty} />
                </div>

                <dl className="space-y-2 rounded-xl bg-muted p-4 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">{qty} × {rupee(offer.price)}</dt><dd className="font-semibold">{rupee(total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Your share of the property</dt><dd className="font-semibold">{pct(BigInt(qty), p.supply)}</dd></div>
                  {earnedPerUnit > 0n && <div className="flex justify-between"><dt className="text-muted-foreground">Rent paid per unit so far</dt><dd className="font-semibold">{rupee(earnedPerUnit)}</dd></div>}
                  <div className="flex justify-between border-t pt-2 text-base"><dt className="font-semibold">You pay</dt><dd className="font-extrabold">{rupee(total)}</dd></div>
                </dl>

                <Button size="lg" className="w-full" disabled={busy} onClick={buy}>
                  {session ? (busy ? 'Waiting for confirmation…' : `Buy ${qty} unit${qty === 1 ? '' : 's'}`) : <><Wallet /> Connect wallet to buy</>}
                </Button>
                <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />You pay the seller in rupees. Your wallet only signs the record of the transfer.
                </p>
              </>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="sell">
          <CardContent className="space-y-5 p-6">
            {!session ? (
              <div className="py-6 text-center">
                <p className="font-semibold">Connect your wallet to sell units</p>
                <Button className="mt-4" onClick={() => connect(false)}><Wallet /> Connect wallet</Button>
              </div>
            ) : p.myBalance === 0n ? (
              <div className="py-6 text-center">
                <p className="text-lg font-bold">You don&rsquo;t hold units here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Buy some first, then you can list them for sale.</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">You hold</p>
                  <p className="text-3xl font-extrabold tracking-tight">{p.myBalance.toString()} <span className="text-base font-medium text-muted-foreground">units</span></p>
                </div>
                <div className="space-y-2"><Label htmlFor="sellqty">Units to sell</Label><Stepper id="sellqty" value={sellQty} max={myMax} onChange={setSellQty} /></div>
                <div className="space-y-2">
                  <Label htmlFor="sellprice">Price per unit (₹)</Label>
                  <Input id="sellprice" type="number" min={1} value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="h-11 text-lg font-semibold" />
                  {p.minPrice !== null && <p className="text-xs text-muted-foreground">Lowest offer right now: {rupee(p.minPrice)}</p>}
                </div>
                <div className="flex justify-between rounded-xl bg-muted p-4 text-sm"><span className="text-muted-foreground">You&rsquo;d receive</span><span className="font-extrabold">{rupee(BigInt(sellQty) * BigInt(sellPrice || '0'))}</span></div>
                <Button size="lg" variant="brick" className="w-full" disabled={busy} onClick={list}>
                  {busy ? 'Waiting for confirmation…' : `List ${sellQty} unit${sellQty === 1 ? '' : 's'} for sale`}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">Listed units are held in escrow until they sell or you cancel the offer.</p>
              </>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <Dialog open={!!bought} onOpenChange={(o) => !o && setBought(null)}>
        <DialogContent className="text-center sm:max-w-sm">
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto mt-2 grid size-16 place-items-center rounded-full bg-positive text-white">
            <Check className="size-8" strokeWidth={3} />
          </motion.div>
          <DialogTitle className="text-2xl">You own {bought?.qty} more units</DialogTitle>
          <DialogDescription className="text-base">
            {p.name}. Pay the seller {bought ? rupee(bought.total) : ''} in rupees to complete the deal. Your units already show in your wallet.
          </DialogDescription>
          <div className="mt-2 grid gap-2">
            <Button asChild size="lg"><Link to="/portfolio">View portfolio</Link></Button>
            <Button variant="ghost" onClick={() => setBought(null)}>Keep browsing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
