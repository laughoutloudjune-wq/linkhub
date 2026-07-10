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
   - `VITE_SUPABASE_URL` — values are in `app/.env`
   - `VITE_SUPABASE_ANON_KEY` — values are in `app/.env`
   - `SUPABASE_URL` — same value as above, **without** the `VITE_` prefix so it stays server-only (used by `app/api/track.ts`)
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Project Settings → API → `service_role` secret key. **Never** prefix this with `VITE_` — that would ship it into the client bundle and give visitors full database write access.
6. Deploy. `app/vercel.json` handles SPA routing (rewrites all paths to `index.html` so React Router works on refresh/direct links).

## Data model
- `profiles` — one per clinic owner (id = auth user id), includes `accent_color`, `background_type`/`background_value` for theming.
- `links` — link title/url/position/active, owned by a profile.
- `click_events` — one row per link click, with `source`/`campaign` (from UTM params), `referrer`/`device` for attribution, and `country`/`city` from geo-IP.
- `page_view_events` — one row per public-page visit, same fields, used for the Profile Views stat.

## Tracking pipeline
The public page never writes to `click_events`/`page_view_events` directly (RLS blocks it). Instead it POSTs to `app/api/track.ts`, a Vercel Edge Function that:
1. Reads the visitor's city/country from Vercel's edge network (`x-vercel-ip-city`/`x-vercel-ip-country` headers) — free, no external API, no rate limits.
2. Inserts the event using the Supabase service-role key (server-side only, bypasses RLS).

There's also an unused Supabase Edge Function at `supabase/functions/track/` from an earlier iteration that resolved country via `ipwho.is`/`freeipapi.com` — kept for reference but superseded by the Vercel version above, which is faster and gets city-level data for free.

## Routes
- `/:slug` — public link page (unauthenticated)
- `/login` — owner login
- `/dashboard`, `/dashboard/links`, `/dashboard/settings` — authenticated owner dashboard

## Not yet implemented
- Owner signup flow (accounts currently need to be created directly in Supabase Auth + a matching `profiles` row)
- Custom short-domain redirects for shareable per-platform links
