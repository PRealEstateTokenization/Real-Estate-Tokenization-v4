import { useState } from 'react'
import { Grid3x3 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import Gallery from '@/components/Gallery'
import { cn } from '@/lib/utils'

const LAYOUT = {
  1: ['col-span-4 row-span-2'],
  2: ['col-span-2 row-span-2', 'col-span-2 row-span-2'],
  3: ['col-span-2 row-span-2', 'col-span-2', 'col-span-2'],
  4: ['col-span-2 row-span-2', 'col-span-2', '', ''],
  5: ['col-span-2 row-span-2', '', '', '', ''],
}

export default function PhotoMosaic({ images, name, isPlaceholder }) {
  const [open, setOpen] = useState(false)
  const shown = images.slice(0, 5)
  const cls = LAYOUT[shown.length]
  return (
    <>
      <div className="md:hidden"><Gallery images={images} name={name} isPlaceholder={isPlaceholder} /></div>
      <div className="relative hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {shown.map((u, i) => (
          <button key={u + i} type="button" onClick={() => setOpen(true)} className={cn('relative overflow-hidden bg-moss', cls[i])} aria-label={`Open photo ${i + 1}`}>
            <img src={u} alt="" className="size-full object-cover transition hover:brightness-90" />
          </button>
        ))}
        {isPlaceholder
          ? <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs">Illustration. The owner has not added photos yet.</span>
          : <button type="button" onClick={() => setOpen(true)} className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg border border-foreground/80 bg-white px-3.5 py-1.5 text-sm font-semibold shadow-sm hover:bg-muted">
              <Grid3x3 className="size-4" />Show all photos
            </button>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-[min(1000px,calc(100%-2rem))] overflow-y-auto sm:max-w-[min(1000px,calc(100%-2rem))]">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{images.length} photo{images.length === 1 ? '' : 's'}</DialogDescription>
          <div className="grid gap-2 sm:grid-cols-2">
            {images.map((u, i) => <img key={u + i} src={u} alt={`${name}, photo ${i + 1}`} className={cn('w-full rounded-xl object-cover', i % 3 === 0 && 'sm:col-span-2')} />)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
