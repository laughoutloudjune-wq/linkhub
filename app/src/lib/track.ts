interface TrackParams {
  type: 'page_view' | 'click'
  profileId: string
  linkId?: string
  source: string | null
  campaign: string | null
  referrer: string | null
  device: string
}

export function trackEvent({ type, profileId, linkId, source, campaign, referrer, device }: TrackParams) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      profile_id: profileId,
      link_id: linkId,
      source,
      campaign,
      referrer,
      device,
    }),
  }).catch(() => {
    // Tracking is best-effort — never let a failed beacon affect the visitor's experience.
  })
}
