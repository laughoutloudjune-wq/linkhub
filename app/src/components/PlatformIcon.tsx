import type { ReactElement } from 'react'

type Platform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'line'
  | 'messenger'
  | 'whatsapp'
  | 'telegram'
  | 'maps'
  | 'phone'
  | 'email'
  | 'link'

export function detectPlatform(url: string): Platform {
  if (url.startsWith('tel:')) return 'phone'
  if (url.startsWith('mailto:')) return 'email'

  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }

  if (host.includes('instagram.com')) return 'instagram'
  if (host.includes('tiktok.com')) return 'tiktok'
  if (host.includes('facebook.com') || host === 'fb.com') return 'facebook'
  if (host.includes('m.me')) return 'messenger'
  if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter'
  if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube'
  if (host.includes('line.me') || host.includes('lin.ee')) return 'line'
  if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'whatsapp'
  if (host.includes('t.me') || host.includes('telegram')) return 'telegram'
  if (host.includes('maps.google') || host.includes('maps.app.goo.gl') || host.includes('goo.gl/maps')) return 'maps'
  return 'link'
}

const ICON_PATHS: Record<Platform, ReactElement> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: (
    <path d="M14 3v10.5a3 3 0 1 1-2-2.83V3h2Zm0 0a5 5 0 0 0 5 5" />
  ),
  facebook: (
    <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13V9a1 1 0 0 1 1-1Z" />
  ),
  messenger: (
    <path d="M12 3C7 3 3 6.7 3 11.3c0 2.6 1.3 4.9 3.4 6.4V21l3.1-1.7c.8.2 1.7.4 2.5.4 5 0 9-3.7 9-8.4S17 3 12 3Zm1 11-2.6-2.8L5.9 14l5.6-5.9L14 11l4.4-2.9L13 14Z" />
  ),
  twitter: (
    <path d="M4 4l7.2 9.6L4.4 20H6l6-5.8 4.4 5.8H20l-7.6-10 6.4-6.9h-1.6l-5.5 5.9L7.8 4H4Z" />
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5l5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" />
    </>
  ),
  line: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="4" />
      <path d="M7 9v5M10.5 9v5M10.5 9l3 5V9M17 9h-2.5v5H17M14.5 11.5H17" />
    </>
  ),
  whatsapp: (
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Zm4.6 12.9c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.5-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
  ),
  telegram: (
    <path d="M21 4 3 11.5l5.5 1.8M21 4l-3.5 16-6-4.7M21 4 8.5 13.3m0 0v5.2l3-3.4" />
  ),
  maps: (
    <>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: (
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9 3 3.4 3.4 3 4 3h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.2 2.2Z" />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  link: (
    <path d="M9 15l6-6M8 12l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 17M16 12l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7" />
  ),
}

export function PlatformIcon({ url, className }: { url: string; className?: string }) {
  const platform = detectPlatform(url)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[platform]}
    </svg>
  )
}
