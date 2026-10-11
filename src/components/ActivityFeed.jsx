import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Sparkles, Tag } from 'lucide-react'
import { fetchTransfers } from '@/lib/history'
import { getConfig } from '@/lib/chain'
import { nameFor } from '@/lib/format'
import { EXPLORER } from '@/config'
import { Skeleton } from '@/components/ui/skeleton'

const ZERO = '0x0000000000000000000000000000000000000000'

function ago(iso) {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' h ago'
  if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function describe(t, market) {
  const f = t.from?.toLowerCase(), to = t.to?.toLowerCase(), n = t.value.toString()
  if (f === ZERO) return { icon: Sparkles, text: <><b>{n} units</b> issued to {nameFor(t.to)}</> }
  if (to === market) return { icon: Tag, text: <>{nameFor(t.from)} listed <b>{n} units</b> for sale</> }
  if (f === market) return { icon: ArrowDownLeft, text: <>{nameFor(t.to)} received <b>{n} units</b></> }
  return { icon: ArrowUpRight, text: <>{nameFor(t.from)} sent <b>{n} units</b> to {nameFor(t.to)}</> }
}

export default function ActivityFeed({ address, version }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    let live = true
    setRows(null)
    fetchTransfers(address).then((r) => live && setRows(r.slice(-6).reverse())).catch(() => live && setRows([]))
    return () => { live = false }
  }, [address, version])
  const market = getConfig()?.marketplace?.toLowerCase()
  if (rows === null) return <div className="space-y-2">{[0, 1, 2].map((k) => <Skeleton key={k} className="h-12" />)}</div>
  if (!rows.length) return <p className="text-sm text-muted-foreground">Activity is shown when the network provider supports transfer history.</p>
  return (
    <ul className="space-y-1">
      {rows.map((t) => {
        const { icon: Icon, text } = describe(t, market)
        return (
          <li key={t.hash + t.to + t.value} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Icon className="size-4" /></span>
            <p className="min-w-0 flex-1 text-sm">{text}</p>
            <span className="shrink-0 text-xs text-muted-foreground">{ago(t.time)}</span>
            <a href={`${EXPLORER}/tx/${t.hash}`} target="_blank" rel="noopener" aria-label="View on Etherscan" className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /></a>
          </li>
        )
      })}
    </ul>
  )
}
