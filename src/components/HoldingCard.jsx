import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTx, useWallet } from '@/context/WalletContext'
import { pct, rupee } from '@/lib/format'
import { useState } from 'react'

export default function HoldingCard({ p }) {
  const { session } = useWallet()
  const run = useTx()
  const [busy, setBusy] = useState(false)
  if (!session) return null
  const value = p.minPrice !== null ? p.myBalance * p.minPrice : null
  async function claim() {
    setBusy(true)
    try { await run({ label: 'Claiming rent', success: `Claimed ${rupee(p.myPending)} of rent`, contract: 'PropertyToken', address: p.address, method: 'claimYield' }) }
    catch {} finally { setBusy(false) }
  }
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-3">
        <p className="font-bold">Your holding</p>
        <dl className="divide-y text-sm">
          <Row k="Units" v={p.myBalance.toString()} />
          <Row k="Share of property" v={pct(p.myBalance, p.supply)} />
          {value !== null && p.myBalance > 0n && <Row k="Value at lowest offer" v={rupee(value)} />}
          <Row k="Rent ready to claim" v={<span className={p.myPending > 0n ? 'text-positive' : ''}>{rupee(p.myPending)}</span>} />
        </dl>
        {p.myPending > 0n && <Button variant="brick" className="w-full" disabled={busy} onClick={claim}>{busy ? 'Waiting for confirmation…' : `Claim ${rupee(p.myPending)}`}</Button>}
      </CardContent>
    </Card>
  )
}
const Row = ({ k, v }) => <div className="flex justify-between py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
