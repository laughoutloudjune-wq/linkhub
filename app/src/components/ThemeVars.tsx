import type { Profile } from '../types'

function backgroundCss(profile: Pick<Profile, 'background_type' | 'background_value'>): string {
  if (profile.background_type === 'image') return `url(${profile.background_value}) center/cover no-repeat`
  return profile.background_value
}

export function ThemeVars({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div style={{ '--accent': profile.accent_color } as React.CSSProperties}>
      {/* Fixed full-viewport layer so the background stays put while the
          content above it scrolls — more reliable across mobile browsers
          than background-attachment: fixed, which iOS Safari ignores. */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, background: backgroundCss(profile) }} />
      <div style={{ minHeight: '100svh' }}>{children}</div>
    </div>
  )
}
