import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { WalletProvider, useWallet } from '@/context/WalletContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar, { MobileTabs } from '@/components/Navbar'
import Footer from '@/components/Footer'
import Home from '@/pages/Home'
import PropertyDetail from '@/pages/PropertyDetail'
import ListProperty from '@/pages/ListProperty'
import Portfolio from '@/pages/Portfolio'
import About from '@/pages/About'
import { AlertTriangle } from 'lucide-react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Shell() {
  const { status, error } = useWallet()
  const { pathname } = useLocation()
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <AlertTriangle className="mx-auto size-10 text-brick" />
        <h1 className="mt-4 text-2xl font-bold">The app could not load its contract settings</h1>
        <p className="mt-2 text-muted-foreground">{error}. Copy <code>addresses.json</code> and <code>abis.json</code> from <code>frontend-config/</code> into <code>public/</code>, then reload.</p>
      </div>
    )
  }
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-[70vh] pb-16 md:pb-0">
        {status === 'loading' ? null : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Navigate to="/" replace />} />
            <Route path="/properties/:address" element={<PropertyDetail />} />
            <Route path="/list" element={<ListProperty />} />
            <Route path="/list-property" element={<Navigate to="/list" replace />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Navigate to="/portfolio" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      {!pathname.startsWith('/list') && <Footer />}
      <MobileTabs />
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <WalletProvider>
        <TooltipProvider>
          <Shell />
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />
        </TooltipProvider>
      </WalletProvider>
    </HashRouter>
  )
}
