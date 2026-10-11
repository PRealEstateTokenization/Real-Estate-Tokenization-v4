import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTx, useWallet } from '@/context/WalletContext'
import { initials, nameFor, rupee } from '@/lib/format'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OffersList({ p, onBuy }) {
  const { session, connect } = useWallet()
  const run = useTx()
  const [showPast, setShowPast] = useState(false)
  const me = session?.address?.toLowerCase()
  async function cancel(id) {
    try { await run({ label: 'Cancelling your offer', success: 'Offer cancelled. Unsold units are back in your wallet.', contract: 'Marketplace', method: 'cancel', args: [id] }) } catch {}
  }
  return (
    <div>
      {p.open.length ? (
        <ul className="divide-y overflow-hidden rounded-2xl border">
          {p.open.map((o) => {
            const mine = me && o.seller.toLowerCase() === me
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-moss text-xs font-bold text-primary">{initials(nameFor(o.seller))}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{nameFor(o.seller)} {mine && <span className="ml-1 rounded-md bg-brick-soft px-1.5 py-0.5 text-xs text-brick">you</span>}</p>
                  <p className="text-sm text-muted-foreground">{o.remaining.toString()} units available</p>
                </div>
                <p className="text-right"><span className="font-bold">{rupee(o.price)}</span><span className="text-sm text-muted-foreground"> / unit</span></p>
                {mine
                  ? <Button variant="outline" size="sm" onClick={() => cancel(o.id)}>Cancel</Button>
                  : session ? <Button size="sm" onClick={() => onBuy(o.id)}>Buy</Button>
                  : <Button variant="outline" size="sm" onClick={() => connect(false)}>Connect</Button>}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">No one is selling units right now. Check back soon.</p>
      )}
      {p.past.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowPast((s) => !s)} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn('size-4 transition-transform', showPast && 'rotate-180')} />
            {p.past.length} earlier offer{p.past.length > 1 ? 's' : ''}
          </button>
          {showPast && (
            <ul className="mt-2 divide-y rounded-2xl border bg-muted/40 text-sm text-muted-foreground">
              {p.past.map((o) => (
                <li key={o.id} className="flex justify-between px-4 py-2.5"><span>{nameFor(o.seller)}</span><span>{rupee(o.price)} / unit · closed</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
