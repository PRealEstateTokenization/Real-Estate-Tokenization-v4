/* ============================================================
   Parcel.io — settings you edit
   ============================================================ */

// Supabase (photos, description, location). The anon / publishable key is
// safe in the browser. Never put the service_role or secret key here.
// You can also set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as
// environment variables instead (e.g. in Render).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR-ANON-KEY'
export const BUCKET = 'property-images'

// Known team wallets -> friendly names (lowercase addresses)
export const NAMES = {
  '0x38331533814a12e238d8d7329d56fdeb9b46a6a4': { name: 'Arya', role: 'Property owner' },
  '0x4df0b8779cd4ea20f1bd27e114b7cd4bf756b0c3': { name: 'Ronan', role: 'Investor' },
  // '0xrishabh_address_lowercase': { name: 'Rishabh', role: 'Investor' },
}

export const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111
export const EXPLORER = 'https://sepolia.etherscan.io'

export const PROPERTY_TYPES = ['Commercial office', 'Retail', 'Warehousing', 'Residential', 'Mixed use']
