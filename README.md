# Parcel.io (React)

React + Vite + Tailwind v4 + shadcn/ui frontend for the Parcel.io prototype on Sepolia.

## 1. Add your contract config
Copy the two files from your existing `frontend/` folder (the ones the old site used) into `public/`:

```
public/addresses.json
public/abis.json
```

## 2. Add your Supabase keys
Either edit `src/config.js` (replace `https://YOUR-PROJECT.supabase.co` and `YOUR-ANON-KEY`), or create a `.env` file:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Use the anon / publishable key only. Never the service_role / secret key.
The Supabase table and bucket are the same as before (`supabase_photos.sql`), nothing to change.

## 3. Run it
```
npm install
npm run dev        # http://localhost:5173
```

## 4. Deploy on Render (static site)
- Root directory: the folder containing this README (e.g. `parcel-web`)
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- If you used a `.env`, add the same two `VITE_...` values under Environment in Render.

Before pushing, check that no secrets are committed:
```
git ls-files | grep -i env    # must print nothing
```
