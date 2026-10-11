import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { placeholderImg } from '@/lib/placeholder'
import { rupee } from '@/lib/format'

export default function PropertyCard({ p, preview = false }) {
  const Wrap = preview ? 'div' : Link
  return (
    <Wrap to={preview ? undefined : `/properties/${p.address}`} className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
      <div className="relative aspect-[20/19] overflow-hidden rounded-2xl bg-moss">
        <img src={p.image || placeholderImg(p.address)} alt="" loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        {p.forSale > 0n && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm">
            {p.forSale.toString()} units for sale
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-semibold">{p.name || 'Untitled property'}</h3>
          {p.type && <span className="shrink-0 text-xs text-muted-foreground">{p.type}</span>}
        </div>
        <p className="truncate text-sm text-muted-foreground">{p.location || 'Location to be added'}</p>
        <p className="pt-1 text-sm">
          {p.minPrice !== null
            ? <><span className="font-semibold">{rupee(p.minPrice)}</span> <span className="text-muted-foreground">per unit</span></>
            : <span className="text-muted-foreground">No units for sale right now</span>}
        </p>
      </div>
    </Wrap>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[20/19] rounded-2xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  )
}
