import { supabase } from './supabase'

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
  supabase.functions
    .invoke('track', {
      body: {
        type,
        profile_id: profileId,
        link_id: linkId,
        source,
        campaign,
        referrer,
        device,
      },
    })
    .then()
}
