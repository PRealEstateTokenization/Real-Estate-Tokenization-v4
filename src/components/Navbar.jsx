import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Briefcase, ChevronDown, Compass, LogOut, Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/context/WalletContext'
import { initials, short } from '@/lib/format'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

const tabs = [
  { to: '/', label: 'Explore', icon: Compass, end: true },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
]

function AccountMenu() {
  const { session, disconnect } = useWallet()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 transition-shadow hover:shadow-md">
        <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">{initials(session.name)}</span>
        <span className="hidden text-sm font-semibold sm:block">{session.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border bg-white py-2 shadow-xl">
          <div className="px-4 py-2">
            <p className="font-semibold">{session.name}</p>
            <p className="text-xs text-muted-foreground">{session.role} · {short(session.address)}</p>
          </div>
          <div className="my-1 border-t" />
          <Link role="menuitem" to="/portfolio" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"><Briefcase className="size-4" />Portfolio</Link>
          <Link role="menuitem" to="/list" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"><Plus className="size-4" />List your property</Link>
          <div className="my-1 border-t" />
          <button role="menuitem" type="button" onClick={disconnect} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"><LogOut className="size-4" />Disconnect wallet</button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { session, connect } = useWallet()
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Logo /><span>Parcel<span className="text-brick">.io</span></span>
        </Link>
        <nav className="hidden h-full items-stretch gap-6 md:flex">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) => cn('flex items-center border-b-2 text-[15px] font-semibold transition-colors',
                isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/list" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted md:block">List your property</Link>
          {session ? <AccountMenu /> : <Button className="rounded-full" onClick={() => connect(false)}><Wallet /> Connect wallet</Button>}
        </div>
      </div>
    </header>
  )
}

export function MobileTabs() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/properties/') || pathname.startsWith('/list')) return null
  const items = [...tabs, { to: '/list', label: 'List', icon: Plus }]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <Icon className="size-5" />{label}
        </NavLink>
      ))}
    </nav>
  )
}
