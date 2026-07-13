import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { captureAttribution, getPlatform } from '../lib/attribution'
import { trackEvent } from '../lib/track'
import { ThemeVars } from '../components/ThemeVars'
import { PlatformIcon } from '../components/PlatformIcon'
import type { Link, Profile } from '../types'

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [trackedLinkId, setTrackedLinkId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled || !profileData) {
        setLoading(false)
        return
      }
      setProfile(profileData)

      const { data: linksData } = await supabase
        .from('links')
        .select('*')
        .eq('profile_id', profileData.id)
        .eq('active', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (!cancelled) setLinks(linksData ?? [])
      setLoading(false)

      const attribution = captureAttribution()
      trackEvent({
        type: 'page_view',
        profileId: profileData.id,
        source: attribution.source,
        campaign: attribution.campaign,
        referrer: attribution.referrer,
        device: getPlatform(),
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  function handleLinkClick(link: Link) {
    if (!profile) return
    const attribution = captureAttribution()

    setTrackedLinkId(link.id)
    setTimeout(() => setTrackedLinkId(null), 1000)

    // Navigation happens via the anchor tag's native href — not
    // programmatically here. window.open() is subject to popup blockers
    // (ad blockers in particular commonly block it on desktop even for
    // direct clicks), while a real <a> click is treated as genuine
    // navigation and isn't blocked the same way.
    trackEvent({
      type: 'click',
      profileId: profile.id,
      linkId: link.id,
      source: attribution.source,
      campaign: attribution.campaign,
      referrer: attribution.referrer,
      device: getPlatform(),
    })
  }

  if (loading) return <div className="p-10 text-center text-sm text-[var(--muted)]">Loading…</div>
  if (!profile) return <div className="p-10 text-center text-sm">Profile not found.</div>

  return (
    <ThemeVars profile={profile}>
      <div className="mx-auto max-w-[430px] px-6 pt-24 pb-18 flex flex-col items-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-22 w-22 rounded-full object-cover" />
        ) : (
          <div className="h-22 w-22 rounded-full bg-[repeating-linear-gradient(45deg,#ddd,#ddd_4px,#eee_4px,#eee_8px)]" />
        )}
        <div className="mt-4 flex items-center gap-1.5">
          <h1 className="text-[27px] font-semibold">{profile.name}</h1>
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
            style={{ background: 'var(--accent)' }}
          >
            ✓
          </span>
        </div>
        {profile.bio && (
          <p className="mt-1" style={{ color: profile.bio_text_color, fontSize: `${profile.bio_font_size}px` }}>
            {profile.bio}
          </p>
        )}

        <div className="mt-8 w-full flex flex-col gap-3.5">
          {links.map((link) => (
            <div key={link.id} className="relative">
              {trackedLinkId === link.id && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs text-white">
                  Click tracked
                </div>
              )}
              <a
                href={link.url}
                target={link.url.startsWith('tel:') || link.url.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link)}
                className="relative flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold transition-transform active:scale-[1.04]"
                style={{
                  background: 'var(--accent)',
                  color: profile.button_text_color,
                  fontSize: `${profile.button_font_size}px`,
                }}
              >
                <PlatformIcon url={link.url} className="h-[1.2em] w-[1.2em] shrink-0" />
                {link.title}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-18 text-[11px] tracking-wider text-[var(--muted,#8A7570)]">POWERED BY LINKHUB</p>
      </div>
    </ThemeVars>
  )
}
