export default function Logo({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="parcel-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c47048" />
          <stop offset="1" stopColor="#3d363c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#parcel-logo)" />
      <path d="M7 25 L25 7" stroke="#1d2a3c" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
