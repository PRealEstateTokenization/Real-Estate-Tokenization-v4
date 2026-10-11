import { MapPin } from 'lucide-react'

export default function LocationMap({ location }) {
  if (!location) return null
  const q = encodeURIComponent(location)
  return (
    <div className="overflow-hidden rounded-2xl border">
      <iframe title={`Map of ${location}`} src={`https://maps.google.com/maps?q=${q}&z=13&output=embed`} className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-brick" />{location}</span>
        <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener">Open in Maps</a>
      </div>
    </div>
  )
}
