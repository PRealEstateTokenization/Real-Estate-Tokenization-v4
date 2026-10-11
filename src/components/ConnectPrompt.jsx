import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/context/WalletContext'

export default function ConnectPrompt({ title, body }) {
  const { connect } = useWallet()
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-moss text-primary"><Wallet className="size-6" /></div>
      <h1 className="mt-5 text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button size="lg" className="mt-6" onClick={() => connect(false)}><Wallet /> Connect wallet</Button>
    </div>
  )
}
