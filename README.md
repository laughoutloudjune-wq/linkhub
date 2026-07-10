# LinkHub

Link-in-bio tool with click/referral analytics, per-clinic custom theming (accent color + background), and UTM/referrer-based attribution tracking.

## Stack
- React + Vite + TypeScript + Tailwind (`/app`)
- Supabase (Postgres, Auth, Storage) — project `linkhub` (ref `rrraeywewwrinnqjyega`)
- Deploy target: Vercel

## Local development
```
cd app
npm install
npm run dev
```

`app/.env` already contains the Supabase URL + anon key for local dev (gitignored). Copy `app/.env.example` if you need to point at a different Supabase project.

## Deploying to Vercel
1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Set **Root Directory** to `app`.
4. Framework preset: Vite (auto-detected).
5. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (values are in `app/.env`)
6. Deploy. `app/vercel.json` handles SPA routing (rewrites all paths to `index.html` so React Router works on refresh/direct links).

## Data model
- `profiles` — one per clinic owner (id = auth user id), includes `accent_color`, `background_type`/`background_value` for theming.
- `links` — link title/url/position/active, owned by a profile.
- `click_events` — one row per link click, with `source`/`campaign` (from UTM params) and `referrer`/`device` for attribution.
- `page_view_events` — one row per public-page visit, same attribution fields, used for the Profile Views stat.

## Routes
- `/:slug` — public link page (unauthenticated)
- `/login` — owner login
- `/dashboard`, `/dashboard/links`, `/dashboard/settings` — authenticated owner dashboard

## Not yet implemented
- Owner signup flow (accounts currently need to be created directly in Supabase Auth + a matching `profiles` row)
- Geo-IP → country resolution for the Location breakdown chart (needs a Supabase Edge Function; `country` column exists but is unpopulated)
- Custom short-domain redirects for shareable per-platform links
