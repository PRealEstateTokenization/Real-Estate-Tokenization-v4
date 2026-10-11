/* Deterministic randomness, so each property always draws the same way */
export function seededRand(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000 }
}

/* Illustrated building shown until a property has real photos */
export function placeholderImg(seed = 'parcel') {
  const r = seededRand(String(seed).toLowerCase())
  const skies = [['#CFE0E8', '#EEF4F6'], ['#D9E4DC', '#F1F5F2'], ['#E6DED2', '#F6F2EC'], ['#D6DCE8', '#F0F2F7']]
  const bodies = ['#1E4A3D', '#2B3A4A', '#5B4636', '#3E5A50']
  const sky = skies[Math.floor(r() * skies.length)], body = bodies[Math.floor(r() * bodies.length)]
  const floors = 5 + Math.floor(r() * 4), cols = 4 + Math.floor(r() * 3)
  const bw = 300, bx = 250, fh = 34, bh = floors * fh + 30, by = 450 - bh
  let win = ''
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const lit = r() > 0.55, ww = (bw - 40) / cols - 10
    win += `<rect x="${(bx + 20 + c * ((bw - 40) / cols) + 5).toFixed(1)}" y="${by + 20 + f * fh}" width="${ww.toFixed(1)}" height="${fh - 14}" rx="2" fill="${lit ? '#F3D9A6' : '#ffffff'}" opacity="${lit ? 0.95 : 0.18}"/>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="800" height="500" fill="url(#s)"/><rect x="100" y="${by + 70}" width="120" height="${bh - 70}" fill="${body}" opacity="0.25"/><rect x="590" y="${by + 40}" width="140" height="${bh - 40}" fill="${body}" opacity="0.18"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="${body}"/>${win}<rect x="372" y="408" width="56" height="42" fill="#F3D9A6" opacity="0.9"/><rect x="0" y="450" width="800" height="50" fill="#C9CFC8"/></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/* Illustrative 12-month performance vs NIFTY 50 / BSE SENSEX (demo data) */
export function perfSeries(tokenAddr) {
  const r = seededRand(tokenAddr.toLowerCase() + ':perf')
  const walk = (drift, vol) => { const out = [100]; for (let i = 1; i < 13; i++) out.push(out[i - 1] * (1 + drift + (r() - 0.5) * vol)); return out }
  const prop = walk(0.0085, 0.012), nifty = walk(0.007, 0.05), sensex = walk(0.0065, 0.048)
  const now = new Date()
  return prop.map((v, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (12 - i), 1)
    return { month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), property: +v.toFixed(2), nifty: +nifty[i].toFixed(2), sensex: +sensex[i].toFixed(2) }
  })
}
