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

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'mobile'
  return 'desktop'
}
