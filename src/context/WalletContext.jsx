import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { loadChainConfig, sendTx, prettyErr } from '@/lib/chain'
import { nameFor, roleFor } from '@/lib/format'
import { SEPOLIA_CHAIN_ID, EXPLORER } from '@/config'

const WalletCtx = createContext(null)

export function WalletProvider({ children }) {
  const [boot, setBoot] = useState({ status: 'loading', error: null })
  const [session, setSession] = useState(null)
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  const connecting = useRef(false)

  const connect = useCallback(async (silent = false) => {
    if (!window.ethereum) {
      if (!silent) toast.error('MetaMask not found', { description: 'Install the MetaMask browser extension, then reload this page.' })
      return false
    }
    if (connecting.current) return false
    connecting.current = true
    try {
      const accounts = await window.ethereum.request({ method: silent ? 'eth_accounts' : 'eth_requestAccounts' })
      if (!accounts?.length) { setSession(null); return false }
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== SEPOLIA_CHAIN_ID) {
        if (silent) return false
        try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] }) }
        catch { toast.error('Switch to Sepolia', { description: 'Change MetaMask to the Sepolia test network, then connect again.' }); return false }
      }
      const address = ethers.getAddress(accounts[0])
      setSession({ address, name: nameFor(address), role: roleFor(address) })
      return true
    } catch (e) {
      if (!silent) toast.error(e?.code === 4001 ? 'Connection cancelled' : prettyErr(e))
      return false
    } finally { connecting.current = false }
  }, [])

  const disconnect = useCallback(() => setSession(null), [])

  useEffect(() => {
    loadChainConfig()
      .then(() => setBoot({ status: 'ready', error: null }))
      .catch((e) => setBoot({ status: 'error', error: e.message }))
    if (!window.ethereum) return
    const onAccounts = (accs) => { if (accs?.length) connect(true); else setSession(null) }
    const onChain = () => window.location.reload()
    window.ethereum.on?.('accountsChanged', onAccounts)
    window.ethereum.on?.('chainChanged', onChain)
    connect(true)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccounts)
      window.ethereum.removeListener?.('chainChanged', onChain)
    }
  }, [connect])

  return (
    <WalletCtx.Provider value={{ ...boot, session, connect, disconnect, version, bump }}>
      {children}
    </WalletCtx.Provider>
  )
}

export const useWallet = () => useContext(WalletCtx)

/* Run a transaction with a toast that follows it from check -> sign -> confirm. */
export function useTx() {
  const { session, bump } = useWallet()
  return useCallback(async ({ label, success, ...params }) => {
    const id = toast.loading(label, { description: 'Checking the transaction…' })
    try {
      const rc = await sendTx({
        from: session?.address, ...params,
        onStage: (s) => {
          if (s === 'sign') toast.loading(label, { id, description: 'Confirm in MetaMask' })
          if (s === 'pending') toast.loading(label, { id, description: 'Waiting for the network to confirm (about 15 seconds)' })
        },
      })
      toast.success(success || label, {
        id, description: 'Recorded on the ledger.',
        action: { label: 'View', onClick: () => window.open(`${EXPLORER}/tx/${rc.hash}`, '_blank', 'noopener') },
      })
      bump()
      return rc
    } catch (e) {
      console.error('[tx]', label, e)
      toast.error(prettyErr(e), { id, description: undefined })
      throw e
    }
  }, [session, bump])
}
