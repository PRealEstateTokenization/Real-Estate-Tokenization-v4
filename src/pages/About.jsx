import { Link } from 'react-router-dom'
import { ArrowRight, BadgeIndianRupee, Building2, Check, FileCheck2, Landmark, Lock, Repeat, Scale, ShieldCheck, Users, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Section = ({ id, kicker, title, children, className = '' }) => (
  <section id={id} className={`mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6 ${className}`}>
    {kicker && <p className="font-semibold text-brick">{kicker}</p>}
    <h2 className="mt-2 max-w-3xl text-4xl leading-tight sm:text-[44px]">{title}</h2>
    <div className="mt-10">{children}</div>
  </section>
)

export default function About() {
  return (
    <div className="pb-8">
      {/* intro */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-32 size-[560px] rounded-full bg-[radial-gradient(circle,#f1d9c9_0%,transparent_65%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <p className="font-semibold text-brick">About Parcel.io</p>
          <h1 className="mt-3 max-w-4xl text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">Real estate for every Indian.</h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            Rent-earning buildings have long been one of the most dependable investments in India, and one of the hardest to get into.
            Parcel.io splits a building into units that anyone can buy, so you can earn a share of its rent without buying the whole thing.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/">Explore properties <ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#how">How it works</a></Button>
          </div>
        </div>
      </section>

      {/* problem */}
      <Section kicker="The problem" title="Good property investments are out of reach for most people">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Lock, 'Huge tickets', 'A Grade-A office floor or a shop in a busy market costs crores. Most people can never put that much into one asset, so the rent from these buildings goes to a small group of large investors.'],
            [Repeat, 'Hard to sell', 'Selling property means finding one buyer for the whole thing, negotiating, and months of paperwork. Your money is stuck until that happens.'],
            [FileCheck2, 'Hard to check', 'Who owns what is spread across paper records, registries and private agreements. For a small investor, verifying any of it is slow and expensive.'],
          ].map(([Icon, t, d]) => (
            <div key={t} className="rounded-3xl border bg-white p-7">
              <Icon className="size-7 text-brick" strokeWidth={1.6} />
              <p className="mt-5 text-xl font-bold">{t}</p>
              <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* what we do */}
      <Section kicker="What we do" title="We turn one building into many units, and keep a public record of who owns them">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
            <p>
              A building owner lists a rent-earning property on Parcel.io and splits it into a fixed number of units, say 1,000.
              Each unit is an equal share of the building's rental income. Hold 10 of 1,000 units and you receive 1% of the rent paid out.
            </p>
            <p>
              Every unit is recorded on a public ledger (a blockchain). The ledger shows exactly how many units each person holds,
              every time units change hands, and a fingerprint of the building's title documents, so anyone can check the record.
            </p>
            <p>
              Money stays in rupees. You pay sellers and receive rent through normal banking channels; the ledger only keeps track of ownership.
              You never need to buy or hold cryptocurrency.
            </p>
          </div>
          <div className="rounded-3xl bg-primary p-8 text-white">
            <p className="font-serif text-2xl font-semibold">An example</p>
            <dl className="mt-6 divide-y divide-white/10">
              {[
                ['Building value', '₹120 Cr'],
                ['Split into', '600 units'],
                ['Price of one unit', '₹20,00,000'],
                ['One unit earns', '1/600 of the rent'],
                ['You buy', '5 units'],
                ['Your share of rent', '0.83%'],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-white/65">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            <p className="mt-5 text-sm text-white/55">Illustrative figures, based on our Sunworth walkthrough.</p>
          </div>
        </div>
      </Section>

      {/* how it works */}
      <Section id="how" kicker="How it works" title="Four steps, from listing to rent">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['The owner lists', 'A building owner registers the property, uploads photos and documents, and decides how many units to create. All units start in the owner\'s wallet.'],
            ['Investors buy units', 'Holders offer units for sale at a price per unit. You pick an offer, pay the seller in rupees, and the units move to your wallet.'],
            ['Rent is shared', 'When rent comes in, the owner records it on the platform. It is split across every unit automatically, in proportion to what each person holds.'],
            ['Claim or sell', 'Claim your share of the rent from your portfolio whenever you like, or list your own units for sale to another investor.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-3xl border bg-white p-6">
              <span className="grid size-10 place-items-center rounded-full bg-brick font-serif text-lg font-semibold text-white">{i + 1}</span>
              <p className="mt-5 text-lg font-bold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* who benefits */}
      <Section kicker="Who it helps" title="Better for investors, owners and the market">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            [Users, 'For investors', ['Start with a fraction of what a whole property costs', 'Earn rent from offices, shops and warehouses, not just homes', 'Spread your money across several buildings', 'Sell your units when you need the money', 'Check your ownership yourself, any time']],
            [Building2, 'For building owners', ['Raise money from many investors without selling the building', 'Keep running and managing the property', 'Pay out rent to every holder in one step', 'A clear, shared record that investors trust']],
            [Landmark, 'For the market', ['A transparent record of every change of ownership', 'Documents fingerprinted so tampering is visible', 'Fits SEBI\'s framework for small and medium REITs', 'More people sharing in India\'s real estate growth']],
          ].map(([Icon, t, items]) => (
            <div key={t} className="rounded-3xl border bg-white p-7">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-brick-soft text-brick"><Icon className="size-5" /></span><p className="text-xl font-bold">{t}</p></div>
              <ul className="mt-6 space-y-3">
                {items.map((x) => <li key={x} className="flex gap-3 text-[15px]"><Check className="mt-0.5 size-4.5 shrink-0 text-brick" />{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* what the ledger does */}
      <Section kicker="Why a blockchain" title="What the ledger does, and what it doesn't">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-7 ring-2 ring-brick/70">
            <p className="flex items-center gap-2 font-semibold text-brick"><ShieldCheck className="size-5" />The ledger does</p>
            <ul className="mt-5 space-y-4">
              {['Record how many units each person holds', 'Record every transfer, so ownership history can be downloaded', 'Hold units in escrow while they are offered for sale', 'Split recorded rent across all units automatically', 'Store a fingerprint of the title documents'].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-brick" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border bg-white/60 p-7">
            <p className="flex items-center gap-2 font-semibold text-muted-foreground"><BadgeIndianRupee className="size-5" />The ledger does not</p>
            <ul className="mt-5 space-y-4">
              {['Move money. Payments and rent are in rupees, through banks', 'Use cryptocurrency for buying, selling or rent', 'Give you the land title. Units carry a right to the rent, not the deed', 'Replace legal agreements, registration or regulation'].map((t) => (
                <li key={t} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 size-5 shrink-0" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* regulation */}
      <Section kicker="Rules and safeguards" title="Built around India's rules for shared property ownership">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
            <p>
              In 2024, SEBI created a framework for small and medium REITs (SM REITs): trusts that hold completed, rent-earning
              property and let many investors own units in it. It sets who can manage these schemes, how they are registered, and
              what investors must be told.
            </p>
            <p>
              Parcel.io is designed to work inside that framework. The investment manager runs the scheme and the property;
              SEBI and the depositories oversee it; Parcel.io keeps the shared record of units and makes buying, selling and
              rent distribution simple.
            </p>
          </div>
          <ul className="grid gap-3 self-start sm:grid-cols-2">
            {[
              ['₹50–500 Cr', 'Size of each SM REIT scheme (under ₹500 Cr)'],
              ['₹10 lakh', 'Minimum value of a unit'],
              ['200+', 'Unitholders a scheme needs'],
              ['95%+', 'Of assets must be completed, rent-earning property'],
            ].map(([v, k]) => (
              <li key={k} className="rounded-2xl border bg-white p-5"><p className="font-serif text-3xl font-semibold">{v}</p><p className="mt-1 text-sm text-muted-foreground">{k}</p></li>
            ))}
            <li className="text-xs text-muted-foreground sm:col-span-2">Summary of SEBI's SM REIT rules for context. Always check the current SEBI regulations.</li>
          </ul>
        </div>
      </Section>

      {/* faq */}
      <Section kicker="Questions" title="Frequently asked">
        <div className="divide-y rounded-3xl border bg-white">
          {[
            ['Do I own the building?', 'You own units that carry a right to a share of the building\'s rental income. The land title stays with the trust or owner that holds the property.'],
            ['Do I need cryptocurrency?', 'No. You pay sellers and receive rent in rupees. You only need a wallet (such as MetaMask) to sign the record of your units.'],
            ['How is rent paid?', 'When rent comes in, it is recorded on the platform and split across all units. Your share appears in your portfolio, and you claim it when you like.'],
            ['Can I sell my units?', 'Yes. Open the property, choose Sell, and set your price per unit. Your units are held in escrow until someone buys them or you cancel the offer.'],
            ['How do I know the record is real?', 'Every unit and transfer is on a public ledger. Each property page links to it, and you can download the full ownership history as a spreadsheet.'],
            ['Is this live?', 'Not yet. This is a working prototype on the Ethereum Sepolia test network. Prices, rent and performance figures are for demonstration only.'],
          ].map(([q, a]) => (
            <details key={q} className="group px-6 py-5 sm:px-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                {q}<span className="grid size-8 shrink-0 place-items-center rounded-full border text-xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* team */}
      <Section kicker="Who we are" title="Built by students, with an industry partner">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <p className="text-lg leading-relaxed text-foreground/85">
            Parcel.io is being built by computer science students at Dayananda Sagar University, Bengaluru, as part of an
            internship on real estate tokenisation with Puravankara as our industry partner.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              ['Ronan Lobo', 'Frontend', Wallet],
              ['Rishabh Arya', 'Backend', Scale],
              ['Rishabh R Soraganvi', 'Blockchain', ShieldCheck],
            ].map(([n, r, Icon]) => (
              <li key={n} className="rounded-2xl border bg-white p-5">
                <span className="grid size-11 place-items-center rounded-full bg-gradient-to-b from-[#d5865b] to-[#bc6840] font-semibold text-white">
                  {n.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                <p className="mt-4 font-bold">{n}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="size-3.5" />{r}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* cta */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-center text-white">
          <div className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#b8643c66_0%,transparent_65%)]" />
          <h2 className="relative text-4xl sm:text-5xl">Start with one unit.</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/70">Browse rent-earning buildings, see how they have done, and buy as many units as suits you.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="brick" asChild><Link to="/">Explore properties <ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild><Link to="/list">List your property</Link></Button>
          </div>
        </div>
      </section>
    </div>
  )
}
