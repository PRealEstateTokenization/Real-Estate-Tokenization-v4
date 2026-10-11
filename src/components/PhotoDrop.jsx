import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PhotoDrop({ files, onChange }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const add = (list) => onChange([...files, ...[...list].filter((f) => f.type.startsWith('image/'))])
  return (
    <div>
      <button type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}
        className={cn('flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          over ? 'border-primary bg-secondary' : 'border-input hover:bg-muted/60')}>
        <ImagePlus className="size-7 text-primary" />
        <span className="font-semibold">Drop photos here, or click to choose</span>
        <span className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB each. The first photo becomes the cover.</span>
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {files.map((f, i) => (
            <div key={f.name + i} className="relative h-20 w-28 overflow-hidden rounded-xl border">
              <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
              {i === 0 && <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 text-[10px] font-semibold text-white">Cover</span>}
              <button type="button" aria-label="Remove photo" onClick={() => onChange(files.filter((_, k) => k !== i))}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"><X className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
