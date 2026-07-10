import type { Profile } from '../types'

function backgroundCss(profile: Pick<Profile, 'background_type' | 'background_value'>): string {
  if (profile.background_type === 'image') return `url(${profile.background_value}) center/cover no-repeat`
  return profile.background_value
}

export function ThemeVars({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div
      style={
        {
          '--accent': profile.accent_color,
          background: backgroundCss(profile),
          minHeight: '100svh',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
