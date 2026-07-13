export type BackgroundType = 'color' | 'gradient' | 'image'

export interface Profile {
  id: string
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  accent_color: string
  background_type: BackgroundType
  background_value: string
  custom_platforms: string[]
  button_text_color: string
  button_font_size: number
  bio_text_color: string
  bio_font_size: number
  created_at: string
}

export interface Link {
  id: string
  profile_id: string
  title: string
  url: string
  position: number
  active: boolean
  created_at: string
}

export interface ClickEvent {
  id: string
  link_id: string
  profile_id: string
  source: string | null
  campaign: string | null
  referrer: string | null
  device: string | null
  country: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}
