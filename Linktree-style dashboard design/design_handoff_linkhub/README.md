# Handoff: LinkHub — Link-in-Bio Tool (Public Page + Analytics Dashboard)

## Overview
LinkHub is a "link-in-bio" product (Linktree-style) for an aesthetic clinic ("Bella Aesthetics"). It has two parts:
1. **Public link page** — the page a clinic's followers land on (from Instagram bio etc.) showing a stack of tappable links.
2. **Owner dashboard** — where the clinic owner views click analytics and manages/reorders their links.

Two visual directions were designed. Neither has been picked yet — the client can choose one, or a developer can implement both behind a theme flag.

## About the Design Files
The files in this bundle (`LinkHub-A-EditorialBlush.dc.html`, `LinkHub-B-DreamyLavender.dc.html`) are **design references built as standalone HTML/React prototypes** — they demonstrate intended look, layout, and interaction, not production code to copy directly. Treat the inline styles, mock data, and component structure as a specification. **Recreate this design in the target codebase's existing environment** (React, Vue, native, etc.) using its established component patterns, state management, and API layer — or, if no environment exists yet, choose the framework best suited to the project.

Each HTML file is self-contained and can be opened directly in a browser to inspect behavior.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final-intent (not lorem ipsum). Treat hex values and pixel measurements below as authoritative. The one placeholder is the clinic's avatar photo (currently a striped SVG placeholder labeled "clinic photo") — replace with a real image upload.

## Design Direction A — "Editorial Blush"
Warm, editorial, spa-like. Cream background, single rose/blush accent, serif display headline.

### Design Tokens — A
- Background (page): `#FBF4F1`
- Background (cards/panels): `#FFFFFF`
- Text — ink: `#3A2E2E`
- Text — muted: `#8A7570`
- Accent — primary (rose): `#E7A8A3`
- Accent — secondary (lavender, used only in device-breakdown chart bar): `#CBB6E0`
- Accent — tertiary (tan, used only in referral-source chart bar): `#D9B7A3`
- Editor "Live" pill: bg `#E7DCC0`, text `#7A6A2E`
- Editor "Hidden" pill: bg `#EEE8E5`, text `#8A7570`
- Borders: `rgba(58,46,46,0.06)` (cards), `rgba(58,46,46,0.08)`–`0.15` (inputs/toggle bar)
- Fonts: headings `'DM Serif Display', serif` (weight 400); body/UI `'Poppins', sans-serif` (weights 400–700)
- Radius: pill buttons/links `999px`; cards `16px`; inputs `9–10px`
- Shadows: cards none (flat + 1px border); floating toggle bar `0 4px 16px rgba(58,46,46,0.08)`; link buttons `0 2px 8px rgba(231,168,163,0.18)`

## Design Direction B — "Dreamy Lavender"
Playful, glassmorphic, pastel duotone (lavender → mint gradient).

### Design Tokens — B
- Background (page): linear-gradient 160°, `#F1EEFA` → `#EAF6F1`
- Background (cards/panels): `rgba(255,255,255,0.65)` with `backdrop-filter: blur(8px)`
- Text — ink: `#372F4D`
- Text — muted: `#8A7FA8`
- Accent — primary (lavender): `#B9A6E8`
- Accent — secondary (mint): `#9FDFC9`
- Accent — tertiary (pink, referral-source bar only): `#F3B6D3`
- Top-link spotlight card: gradient `135deg, #B9A6E8 → #9FDFC9`, white text
- Sidebar: gradient `180deg, #C9B8ED → #A6D9C8`, white text/icons
- Editor "Live" pill: bg `#DCE9F9`, text `#5C7FA8`
- Editor "Hidden" pill: bg `#EEE9F5`, text `#8A7FA8`
- Fonts: headings `'Quicksand', sans-serif` (weight 700); body/UI `'Nunito', sans-serif` (weights 400–700)
- Radius: pill/glass cards `18–22px`; link buttons `22px`; avatar `32px` (rounded square, not circle)
- Shadows: soft, colored — `0 4px 16px rgba(185,166,232,0.12)` (cards), `0 6px 18px rgba(185,166,232,0.22)` (link buttons)

Both directions share identical layout structure, copy, data model, and interaction logic — only color/type/shape tokens differ. Everything below applies to both unless noted.

## Screens / Views

### 1. Public Link Page
**Purpose:** The page visitors land on from social bio links; lets them tap through to the clinic's key destinations.

**Layout:** Single column, centered, `max-width: 430px` (A) / `440px` (B), `margin: 0 auto`, top padding ~96–100px (clears the floating view-toggle chrome — see note below), bottom padding ~72px.

**Components (top to bottom):**
- **Avatar** — 88×88 circle (A) / 96×96 rounded-square radius 32 (B), striped placeholder pattern (diagonal stripes at 45°) with a small "clinic photo" monospace caption overlay. Replace with the clinic's uploaded photo in production; keep the shape/border treatment.
- **Name row** — clinic name (serif/rounded display font, ~27–28px) + small circular verified checkmark badge (16–17px, accent-colored bg, white ✓).
- **Bio line** — one line, muted color, 14px: "Medical aesthetics & skincare studio ✧ Downtown & Riverside".
- **Link list** — vertical stack, gap 13–14px, one pill button per **active** link (inactive/hidden links are not rendered here). Each button: full width, ~16–17px vertical padding, centered label, 15px semibold.
  - **Click behavior:** tapping a link increments that link's click count by 1 and briefly (~1s) shows a small dark "Click tracked" badge floating above the button, plus a subtle scale-up (1.0 → 1.04 → 1.0) pulse on the button itself. In production this should fire an analytics event (see Interactions section) and then navigate/open the link's URL — the prototype does not navigate since it's a mock.
- **Footer** — "POWERED BY LINKHUB", 11px, letter-spacing, low-contrast color.

**Content (current mock links, in display order):**
1. Book a Consultation → `linkhub.co/book`
2. Botox & Filler Menu → `linkhub.co/menu`
3. Before & After Gallery → `linkhub.co/gallery`
4. Skincare Shop → `linkhub.co/shop`
5. Client Reviews → `linkhub.co/reviews`
6. Instagram → `instagram.com/bellaaesthetics`
7. TikTok → `tiktok.com/@bellaaesthetics`

### 2. Dashboard — Overview tab
**Purpose:** Clinic owner reviews performance of their link page.

**Layout:** Two-column app shell — fixed left sidebar (220–224px) + flexible main content area (padding 32px/40px). Sidebar: logo/wordmark, 2 nav items (Overview, Links — pill/rounded active state), and a small footer card naming the profile being viewed.

**Main content, top to bottom:**
- **Stat row** — CSS grid, 4 equal columns, gap 16px:
  1. Profile Views (raw count, e.g. `8204`)
  2. Total Clicks (sum of all link clicks, e.g. `2546`)
  3. Click Rate (Total Clicks ÷ Profile Views, rounded %, e.g. `31%`)
  4. Top Link (accent-filled card, distinct from the other 3): link title + click count of the single highest-performing link.
- **Line/area chart card** — "Clicks — last 14 days". SVG line chart (polyline + soft area fill beneath), viewBox `0 0 600 160`, scales to container width. X-axis = day index 0–13, Y-axis = normalized min/max of the series.
- **Per-link click bars** — "Clicks per link": one row per link, sorted descending by clicks. Each row = label + click count (right-aligned) above a horizontal progress bar (bar width % = clicks ÷ max-clicks-among-links × 100).
- **3-column breakdown row** (grid, equal columns, gap 16px), each an identical bar-list pattern (label + % value above a horizontal bar, bar width % = the value itself):
  - **Device**: Mobile 78%, Desktop 17%, Tablet 5%
  - **Location**: United States 42%, Canada 18%, United Kingdom 12%, Australia 9%, Other 19%
  - **Referral source**: Instagram 46%, TikTok 24%, Direct 15%, Google 9%, Other 6%

All numeric values above are placeholder/mock data — wire to real analytics events in production (see Data & Analytics section).

### 3. Dashboard — Links tab
**Purpose:** Add, edit, reorder, hide, or remove links shown on the public page.

**Layout:** Same sidebar shell; main content:
- **Add-link form** — card with two text inputs (Link title, URL) + a primary "+ Add link" button, laid out in a single row (flex).
- **Link list** — one card-row per link (in current display order), each containing:
  - Up/down reorder arrow buttons (▲ ▼), stacked vertically
  - Title input (inline editable, width ~190px)
  - URL input (inline editable, flexible width, muted color)
  - Click count (read-only, centered, 70px column)
  - Active/Hidden toggle pill button — clicking flips the link between visible-on-public-page and hidden
  - Delete button (✕)

## Interactions & Behavior
- **View switch (prototype-only chrome):** A floating pill toggle fixed to the top-center of the screen switches between "Public Page" and "Dashboard" — this exists only so a single prototype file can demonstrate both surfaces. In the real product these are two separate routes/apps (a public unauthenticated page vs. an authenticated owner dashboard) and this toggle should **not** be built — remove it and implement normal routing/auth instead.
- **Dashboard tabs:** Overview / Links — simple state toggle, no route change required, though real app should likely make these separate routes (`/dashboard`, `/dashboard/links`).
- **Link click → tracked:** clicking a public link increments its click counter and shows a transient "Click tracked" confirmation + scale pulse (~900ms), then opens/navigates to the link's destination URL.
- **Reorder:** ▲/▼ buttons swap the link with its neighbor; no drag-and-drop in this version (fine to add drag in production, not required).
- **Add link:** requires non-empty title; URL defaults to a placeholder if left blank in the prototype — production should validate URL format and require it.
- **Toggle active/hidden:** hidden links stay in the editor list (so the owner can re-enable them) but are excluded from the public page entirely.
- **Delete:** removes the link immediately — production should probably confirm before destructive delete.
- **Edits are inline** — title/URL fields are plain editable inputs directly in the list row (no separate edit modal).

## State Management
Suggested state shape (mirrors the prototype):
```
links: [{ id, title, url, clicks, active }]   // display order = array order
dashboardTab: 'overview' | 'links'
```
Derived/computed (not stored, recompute from `links`):
- `activeLinks` — `links.filter(l => l.active)`, in array order, for the public page
- `sortedByClicks` — `links` sorted desc by `clicks`, for the per-link chart and "Top Link" stat
- `totalClicks` — sum of all `clicks`
- `clickRate` — `totalClicks / profileViews`
- `topLink` — first item of `sortedByClicks`

**Data fetching for production:**
- Public page: fetch the owner's active links (public endpoint, no auth) by profile slug.
- Dashboard: fetch links + analytics (authenticated) — profile views, per-link clicks, device/location/referral breakdowns, and a time-series for the trend chart should come from real click-event logging (each public link click should POST an event with link id, timestamp, referrer, user agent/device, and geo-IP-derived location).
- Link CRUD (add/edit/reorder/toggle/delete) needs authenticated endpoints; reorder should persist an explicit order/position field.

## Assets
- Avatar: SVG striped placeholder (inline, generated) — replace with real uploaded image in production; no external asset files used.
- Icons: none from an icon library — the ▲ ▼ ✕ ✓ glyphs are plain Unicode characters, not SVG/icon-font assets. A production build should use the codebase's existing icon set for these.
- Fonts: Google Fonts, loaded via `<link>` in the prototype's `<head>`:
  - Direction A: DM Serif Display, Poppins
  - Direction B: Quicksand, Nunito

## Files
- `LinkHub-A-EditorialBlush.dc.html` — Direction A prototype (public page + dashboard, both tabs, toggle-switchable)
- `LinkHub-B-DreamyLavender.dc.html` — Direction B prototype (same structure, alternate visual theme)

Open either file directly in a browser to interact with the live prototype (click links, switch tabs, add/reorder/edit/delete links, watch dashboard numbers update).
