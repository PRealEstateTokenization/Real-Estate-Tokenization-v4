import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { perfSeries } from '@/lib/placeholder'
import { cn } from '@/lib/utils'

const SERIES = [
  { key: 'property', label: 'This property', color: 'var(--chart-1)', width: 3 },
  { key: 'nifty', label: 'NIFTY 50', color: 'var(--chart-2)', width: 2 },
  { key: 'sensex', label: 'BSE SENSEX', color: 'var(--chart-3)', width: 2 },
]

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-background px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold">{label}</p>
      {SERIES.map((s) => {
        const v = payload.find((x) => x.dataKey === s.key)?.value
        return v === undefined ? null : (
          <p key={s.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground"><i className="h-0.5 w-3 rounded" style={{ background: s.color }} />{s.label}</span>
            <span className="font-semibold">{v.toFixed(1)}</span>
          </p>
        )
      })}
    </div>
  )
}

export default function PerformanceChart({ address }) {
  const all = useMemo(() => perfSeries(address), [address])
  const [range, setRange] = useState(12)
  const data = all.slice(-(range + 1))
  const base = data[0]
  const rebased = data.map((d) => ({ month: d.month, ...Object.fromEntries(SERIES.map((s) => [s.key, (d[s.key] / base[s.key]) * 100])) }))
  const last = rebased[rebased.length - 1]
  return (
    <div className="rounded-2xl border p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {SERIES.map((s) => {
            const chg = last[s.key] - 100
            return (
              <span key={s.key} className="flex items-center gap-2 text-sm">
                <i className="h-1 w-4 rounded" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className={cn('font-bold', chg >= 0 ? 'text-positive' : 'text-destructive')}>{chg >= 0 ? '+' : ''}{chg.toFixed(1)}%</span>
              </span>
            )
          })}
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
          {[[6, '6M'], [12, '1Y']].map(([r, l]) => (
            <button key={r} type="button" onClick={() => setRange(r)} className={cn('rounded-md px-2.5 py-1', range === r ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rebased} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v) => Math.round(v)} width={48} />
            <Tooltip content={<Tip />} cursor={{ stroke: 'var(--input)' }} />
            {[...SERIES].reverse().map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={s.width} dot={false} activeDot={{ r: 4 }} isAnimationActive />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Rebased to 100. Illustrative data for the demo — not live market data or a forecast.</p>
    </div>
  )
}
