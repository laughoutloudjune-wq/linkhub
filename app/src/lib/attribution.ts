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

  const attribution: Attribution = {
    source: utmSource ?? deriveSourceFromReferrer(referrer ?? ''),
    campaign: utmCampaign ?? null,
    referrer,
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  return attribution
}

export function getPlatform(): string {
  const ua = navigator.userAgent

  if (/iPhone/i.test(ua)) return 'iOS'
  // iPadOS 13+ reports as "Macintosh" in desktop mode, distinguishable by touch support.
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iPadOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Other'
}
