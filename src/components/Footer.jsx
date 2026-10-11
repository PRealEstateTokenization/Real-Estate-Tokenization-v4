import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'

export default function Footer() {
  return (
    <footer className="mt-24 bg-primary text-white/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-white">
          <Logo className="size-8" />
          <span className="font-bold">Parcel<span className="text-brick">.io</span></span>
          <span className="text-white/60">Real estate for every Indian.</span>
          <Link to="/about" className="ml-3 font-semibold text-white underline underline-offset-4">About us</Link>
        </div>
        <p className="max-w-xl">
          Working prototype on the Ethereum Sepolia test network. Payments and rent are settled in rupees, off-chain.
          Figures marked as illustrative are for demonstration only.
        </p>
      </div>
    </footer>
  )
}
