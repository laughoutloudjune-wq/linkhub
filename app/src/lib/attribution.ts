const STORAGE_KEY = 'linkhub_attribution'

interface Attribution {
  source: string | null
  campaign: string | null
  referrer: string | null
}

function deriveSourceFromReferrer(referrer: string): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (host.includes('tiktok')) return 'tiktok'
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook'
    if (host.includes('google')) return 'google'
    if (host.includes('t.co') || host.includes('twitter') || host.includes('x.com')) return 'twitter'
    return host
  } catch {
    return null
  }
}

const IN_APP_SOURCE_KEY: Record<string, string> = {
  Instagram: 'instagram',
  Facebook: 'facebook',
  Line: 'line',
  WeChat: 'wechat',
  Snapchat: 'snapchat',
  LinkedIn: 'linkedin',
  Pinterest: 'pinterest',
  'Twitter/X': 'twitter',
  TikTok: 'tiktok',
}

export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get('utm_source')
  const utmCampaign = params.get('utm_campaign')
  const referrer = document.referrer || null

  const existing = sessionStorage.getItem(STORAGE_KEY)

  // First-touch attribution: only set once per session, don't overwrite on later navigations.
  if (existing) {
    return JSON.parse(existing) as Attribution
  }

  // In-app browsers (Instagram, TikTok, etc.) commonly strip the referrer
  // header for external links, so a click opened from inside one of those
  // apps would otherwise show up as "Direct" — fall back to sniffing the
  // WebView's own user-agent marker to recover the real source.
  const inApp = detectInAppBrowser(navigator.userAgent)

  const attribution: Attribution = {
    source: utmSource ?? deriveSourceFromReferrer(referrer ?? '') ?? (inApp ? IN_APP_SOURCE_KEY[inApp] : null),
    campaign: utmCampaign ?? null,
    referrer,
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  return attribution
}

function detectOS(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iOS'
  // iPadOS 13+ reports as "Macintosh" in desktop mode, distinguishable by touch support.
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iPadOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Other'
}

// Social apps open links in their own embedded WebView instead of the
// system browser. That WebView's user-agent string carries a marker
// identifying the host app — this lets us tell "opened inside Instagram"
// apart from "opened in Safari" instead of both just showing up as iOS.
function detectInAppBrowser(ua: string): string | null {
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook'
  if (/\bLine\//i.test(ua)) return 'Line'
  if (/MicroMessenger/i.test(ua)) return 'WeChat'
  if (/Snapchat/i.test(ua)) return 'Snapchat'
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn'
  if (/Pinterest/i.test(ua)) return 'Pinterest'
  if (/Twitter/i.test(ua)) return 'Twitter/X'
  // TikTok's in-app WebView identifies itself via the app's package name
  // rather than a friendly "TikTok" string.
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return 'TikTok'
  return null
}

export function getPlatform(): string {
  const ua = navigator.userAgent
  const os = detectOS(ua)
  const inApp = detectInAppBrowser(ua)
  return inApp ? `${os} · ${inApp} in-app` : os
}
