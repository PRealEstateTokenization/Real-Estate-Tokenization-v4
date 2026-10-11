import { Minus, Plus } from 'lucide-react'

export default function Stepper({ value, max, onChange, id }) {
  const clamp = (v) => Math.max(1, Math.min(max, Number.isFinite(v) ? v : 1))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-xl border border-input">
        <button type="button" aria-label="One fewer unit" onClick={() => onChange(clamp(value - 1))} className="grid place-items-center bg-muted transition-colors hover:bg-moss disabled:opacity-40" disabled={value <= 1}><Minus className="size-4" /></button>
        <input id={id} type="number" inputMode="numeric" min={1} max={max} value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
          className="h-11 w-full border-x border-input bg-background text-center text-lg font-bold outline-none focus-visible:bg-secondary" />
        <button type="button" aria-label="One more unit" onClick={() => onChange(clamp(value + 1))} className="grid place-items-center bg-muted transition-colors hover:bg-moss disabled:opacity-40" disabled={value >= max}><Plus className="size-4" /></button>
      </div>
      {max > 1 && (
        <input type="range" min={1} max={max} value={value} onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
          aria-label="Number of units" className="w-full accent-[var(--primary)]" />
      )}
    </div>
  )
}
