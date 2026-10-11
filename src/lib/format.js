import { NAMES } from '@/config'

export const short = (a = '') => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '')
export const initials = (n = '') => n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
export const nameFor = (a = '') => NAMES[a.toLowerCase()]?.name || short(a)
export const roleFor = (a = '') => NAMES[a.toLowerCase()]?.role || 'Investor'

export function rupee(n) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN')
}

/* ₹2.4 L, ₹1.2 Cr — for tight spaces */
export function rupeeShort(n) {
  const v = Number(n ?? 0)
  if (v >= 1e7) return '₹' + trim(v / 1e7) + ' Cr'
  if (v >= 1e5) return '₹' + trim(v / 1e5) + ' L'
  return rupee(v)
}
const trim = (x) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '')

export const pct = (part, whole, dp = 2) =>
  whole > 0n ? ((Number(part) * 100) / Number(whole)).toFixed(dp) + '%' : '0%'

export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
