import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from '@/config'

export const sb = SUPABASE_URL.startsWith('https') && !SUPABASE_URL.includes('YOUR-PROJECT')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

export async function getMedia(tokenAddr) {
  if (!sb) return null
  const { data, error } = await sb.from('property_media').select('*').eq('token_address', tokenAddr.toLowerCase()).maybeSingle()
  if (error) throw error
  return data
}

export async function getAllMedia() {
  if (!sb) return {}
  const { data } = await sb.from('property_media').select('token_address,image_urls,location,property_type')
  const map = {}
  ;(data || []).forEach((r) => { map[r.token_address] = r })
  return map
}

export async function saveMedia(tokenAddr, patch, by) {
  if (!sb) throw new Error('Supabase is not configured. Add your URL and key in src/config.js.')
  const { error } = await sb.from('property_media').upsert(
    { token_address: tokenAddr.toLowerCase(), updated_by: by ? by.toLowerCase() : null, updated_at: new Date().toISOString(), ...patch },
    { onConflict: 'token_address' })
  if (error) throw error
}

export async function uploadImages(tokenAddr, files) {
  if (!sb) throw new Error('Supabase is not configured. Add your URL and key in src/config.js.')
  const urls = []
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > 5 * 1024 * 1024) throw new Error(f.name + ' is larger than 5 MB.')
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${tokenAddr.toLowerCase()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false })
    if (error) throw error
    urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
  }
  return urls
}

export async function removeImage(url) {
  const marker = '/' + BUCKET + '/', i = url.indexOf(marker)
  if (sb && i >= 0) await sb.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))])
}
