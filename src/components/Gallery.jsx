import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const slide = {
  enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0.6 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0.6 }),
}

function Arrow({ side, onClick, className }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button type="button" onClick={onClick} aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cn('absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-lg transition hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-white/60 outline-none',
        side === 'left' ? 'left-4' : 'right-4', className)}>
      <Icon className="size-5" />
    </button>
  )
}

export default function Gallery({ images, name, isPlaceholder }) {
  const n = images.length
  const [[i, dir], setState] = useState([0, 0])
  const [open, setOpen] = useState(false)
  const go = useCallback((d) => setState(([x]) => [(x + d + n) % n, d]), [n])
  const to = (k) => setState(([x]) => [k, k > x ? 1 : -1])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  const frame = (big) => (
    <AnimatePresence initial={false} custom={dir}>
      <motion.img
        key={i} src={images[i]} alt={`${name}, photo ${i + 1} of ${n}`} custom={dir}
        variants={slide} initial="enter" animate="center" exit="exit"
        transition={{ type: 'tween', duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
        drag={n > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
        onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1) }}
        onClick={() => !big && setOpen(true)}
        className={cn('absolute inset-0 size-full select-none', big ? 'object-contain' : 'cursor-zoom-in object-cover')}
        draggable={false}
      />
    </AnimatePresence>
  )

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-moss outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:aspect-[16/9] lg:aspect-[21/9]"
        tabIndex={0} aria-roledescription="carousel" aria-label={`Photos of ${name}`}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); if (e.key === 'Enter') setOpen(true) }}
      >
        {frame(false)}
        {n > 1 && <><Arrow side="left" onClick={() => go(-1)} /><Arrow side="right" onClick={() => go(1)} /></>}
        <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
          {n > 1 && <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{i + 1} / {n}</span>}
          <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md hover:bg-white">
            <Expand className="size-3.5" /> View photos
          </button>
        </div>
        {isPlaceholder && <span className="absolute bottom-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs text-foreground/80">Illustration — the owner has not added photos yet</span>}
      </div>

      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((u, k) => (
            <button key={u + k} type="button" onClick={() => to(k)} aria-label={`Show photo ${k + 1}`}
              className={cn('h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
                k === i ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100')}>
              <img src={u} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(1200px,calc(100%-2rem))] border-0 bg-neutral-950 p-0 text-white sm:max-w-[min(1200px,calc(100%-2rem))] [&>button]:text-white [&>button:hover]:bg-white/10">
          <DialogTitle className="sr-only">{name} photos</DialogTitle>
          <DialogDescription className="sr-only">Use the arrow keys to move between photos.</DialogDescription>
          <div className="relative h-[78vh] overflow-hidden rounded-2xl">
            {frame(true)}
            {n > 1 && <><Arrow side="left" onClick={() => go(-1)} /><Arrow side="right" onClick={() => go(1)} /></>}
          </div>
          <p className="px-5 pb-4 text-sm text-white/70">{name} · {i + 1} of {n}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
