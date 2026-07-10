import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type { BackgroundType } from '../types'

const ACCENT_PRESETS = ['#E7A8A3', '#B9A6E8', '#9FDFC9', '#F3B6D3', '#D9B7A3', '#8AB4E8']

const SHARE_PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'email', label: 'Email signature' },
]

function slugifyInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

function ShareLinks({ slug }: { slug: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  async function handleCopy(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500)
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-medium">Share links</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Use a different tagged link per platform so the Overview dashboard can tell you where clicks came from.
      </p>
      <div className="flex flex-col gap-2">
        {SHARE_PLATFORMS.map(({ key, label }) => {
          const url = `${window.location.origin}/${slug}?utm_source=${key}`
          return (
            <div key={key} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
              <span className="w-32 shrink-0 text-xs font-medium text-neutral-600">{label}</span>
              <span className="flex-1 truncate text-xs text-neutral-500">{url}</span>
              <button
                onClick={() => handleCopy(key, url)}
                className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-black/10"
              >
                {copiedKey === key ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardSettings() {
  const { session } = useAuth()
  const { profile, refresh } = useProfile(session?.user.id, session?.user.email)
  const [name, setName] = useState(profile?.name ?? '')
  const [slug, setSlug] = useState(profile?.slug ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [accentColor, setAccentColor] = useState(profile?.accent_color ?? '#E7A8A3')
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(profile?.background_type ?? 'color')
  const [backgroundValue, setBackgroundValue] = useState(profile?.background_value ?? '#FBF4F1')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setSlug(profile.slug)
    setBio(profile.bio ?? '')
    setAccentColor(profile.accent_color)
    setBackgroundType(profile.background_type)
    setBackgroundValue(profile.background_value)
  }, [profile])

  async function handleSave() {
    if (!session) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        slug,
        bio: bio || null,
        accent_color: accentColor,
        background_type: backgroundType,
        background_value: backgroundValue,
      })
      .eq('id', session.user.id)
    if (error) {
      setError(error.code === '23505' ? 'That URL slug is already taken.' : error.message)
    } else {
      await refresh()
    }
    setSaving(false)
  }

  async function handleImageUpload(file: File) {
    if (!session) return
    setUploading(true)
    const path = `${session.user.id}/background-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('backgrounds').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('backgrounds').getPublicUrl(path)
      setBackgroundType('image')
      setBackgroundValue(data.publicUrl)
    }
    setUploading(false)
  }

  const previewBackground =
    backgroundType === 'image' ? `url(${backgroundValue}) center/cover no-repeat` : backgroundValue

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-medium">Profile</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Clinic name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Public page URL
            <div className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-sm">
              <span className="text-neutral-400">{window.location.host}/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                className="flex-1 text-black outline-none"
              />
            </div>
            {profile && (
              <a
                href={`/${profile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 w-fit text-xs underline"
                style={{ color: 'var(--accent, #3A2E2E)' }}
              >
                View live page ↗
              </a>
            )}
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Bio
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Medical aesthetics & skincare studio"
              className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black"
            />
          </label>
        </div>
      </div>

      {profile?.slug && <ShareLinks slug={profile.slug} />}

      <div>
        <h2 className="mb-3 text-sm font-medium">Accent color</h2>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: color, borderColor: accentColor === color ? '#000' : 'transparent' }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border border-black/10"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Background</h2>
        <div className="mb-3 flex gap-2">
          {(['color', 'gradient', 'image'] as BackgroundType[]).map((type) => (
            <button
              key={type}
              onClick={() => setBackgroundType(type)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${
                backgroundType === type ? 'bg-black text-white' : 'bg-black/5 text-neutral-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {backgroundType === 'color' && (
          <input
            type="color"
            value={backgroundValue.startsWith('#') ? backgroundValue : '#FBF4F1'}
            onChange={(e) => setBackgroundValue(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-lg border border-black/10"
          />
        )}

        {backgroundType === 'gradient' && (
          <input
            value={backgroundValue}
            onChange={(e) => setBackgroundValue(e.target.value)}
            placeholder="linear-gradient(160deg, #F1EEFA, #EAF6F1)"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        )}

        {backgroundType === 'image' && (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && <span className="text-xs text-neutral-500">Uploading…</span>}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Preview</h2>
        <div
          className="flex h-32 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white"
          style={{ background: previewBackground }}
        >
          <span
            className="rounded-full px-4 py-2"
            style={{ background: accentColor }}
          >
            Sample link button
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-fit rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          style={{ background: accentColor }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
