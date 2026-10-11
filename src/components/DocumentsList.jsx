import { useState } from 'react'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'

const DOCS = [
  ['Red Herring Prospectus', 'Issue details, pricing and risk factors'],
  ['Valuation report', 'Independent valuation by a registered valuer'],
  ['Title deed and khata extract', 'Property title, with its fingerprint on the ledger'],
  ['Scheme offer document', 'Filed with SEBI and the stock exchange'],
  ['Trust deed', 'Registered trust deed and trustee details'],
  ['Audited financials and rent roll', 'SPV accounts, occupancy and tenant schedule'],
]

export default function DocumentsList() {
  const [all, setAll] = useState(false)
  return (
    <div>
      <ul className="divide-y">
        {(all ? DOCS : DOCS.slice(0, 3)).map(([t, d]) => (
          <li key={t}>
            <button type="button" onClick={() => toast(t, { description: 'Sample entry for the prototype. The document is published here with the live offer.' })}
              className="group flex w-full items-center gap-4 py-3.5 text-left">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium group-hover:underline">{t}</span>
                <span className="block truncate text-sm text-muted-foreground">{d}</span>
              </span>
              <span className="text-xs text-muted-foreground">PDF · sample</span>
            </button>
          </li>
        ))}
      </ul>
      {!all && <button type="button" onClick={() => setAll(true)} className="mt-3 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">Show all {DOCS.length} documents</button>}
    </div>
  )
}
