import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type { BackgroundType, Profile } from '../types'

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

function ShareLinks({ profile, onProfileChange }: { profile: Profile; onProfileChange: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newPlatform, setNewPlatform] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const platforms = [
    ...SHARE_PLATFORMS,
    ...profile.custom_platforms.map((label) => ({ key: slugifyInput(label), label })),
  ]

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

  async function handleAddPlatform(e: React.FormEvent) {
    e.preventDefault()
    const label = newPlatform.trim()
    if (!label) return

    const exists = platforms.some((p) => p.key === slugifyInput(label))
    if (exists) {
      setAddError('That platform is already in the list.')
      return
    }

    setAdding(true)
    setAddError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ custom_platforms: [...profile.custom_platforms, label] })
      .eq('id', profile.id)
    if (error) {
      setAddError(error.message)
    } else {
      setNewPlatform('')
      onProfileChange()
    }
    setAdding(false)
  }

  async function handleRemovePlatform(label: string) {
    await supabase
      .from('profiles')
      .update({ custom_platforms: profile.custom_platforms.filter((p) => p !== label) })
      .eq('id', profile.id)
    onProfileChange()
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-medium">Share links</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Use a different tagged link per platform so the Overview dashboard can tell you where clicks came from.
      </p>
      <div className="flex flex-col gap-2">
        {platforms.map(({ key, label }) => {
          const url = `${window.location.origin}/${profile.slug}?utm_source=${key}`
          const isCustom = profile.custom_platforms.includes(label)
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
              {isCustom && (
                <button
                  onClick={() => handleRemovePlatform(label)}
                  className="shrink-0 text-neutral-400 hover:text-red-600"
                  aria-label={`Remove ${label}`}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>
      <form onSubmit={handleAddPlatform} className="mt-3 flex items-center gap-2">
        <input
          value={newPlatform}
          onChange={(e) => setNewPlatform(e.target.value)}
          placeholder="Add a platform (e.g. Snapchat, LinkedIn, Pinterest)"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs"
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-full bg-black/5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-black/10"
        >
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </form>
      {addError && <p className="mt-1 text-xs text-red-600">{addError}</p>}
    </div>
  )
}

export default function DashboardSettings() {
  const { session } = useAuth()
  const { profile, refresh } = useProfile(session?.user.id, session?.user.email)
  const [name, setName] = useState(profile?.name ?? '')
  const [slug, setSlug] = useState(profile?.slug ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [accentColor, setAccentColor] = useState(profile?.accent_color ?? '#E7A8A3')
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(profile?.background_type ?? 'color')
  const [backgroundValue, setBackgroundValue] = useState(profile?.background_value ?? '#FBF4F1')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setSlug(profile.slug)
    setBio(profile.bio ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
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
        avatar_url: avatarUrl || null,
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

  async function handleAvatarUpload(file: File) {
    if (!session) return
    setUploadingAvatar(true)
    const path = `${session.user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    }
    setUploadingAvatar(false)
  }

  async function handleResetStats() {
    if (!session) return
    const confirmed = confirm(
      'This permanently deletes all click and profile-view history. Your links and settings are untouched. This cannot be undone. Continue?',
    )
    if (!confirmed) return

    setResetting(true)
    setResetMessage(null)
    const [clicksResult, viewsResult] = await Promise.all([
      supabase.from('click_events').delete().eq('profile_id', session.user.id),
      supabase.from('page_view_events').delete().eq('profile_id', session.user.id),
    ])
    setResetting(false)
    setResetMessage(
      clicksResult.error || viewsResult.error
        ? 'Something went wrong resetting statistics.'
        : 'Statistics reset. The Overview dashboard will show zero until new activity comes in.',
    )
  }

  const previewBackground =
    backgroundType === 'image' ? `url(${backgroundValue}) center/cover no-repeat` : backgroundValue

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-medium">Profile</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-[repeating-linear-gradient(45deg,#ddd,#ddd_4px,#eee_4px,#eee_8px)]" />
            )}
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Display picture
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                disabled={uploadingAvatar}
                className="text-sm"
              />
              {uploadingAvatar && <span>Uploading…</span>}
            </label>
          </div>
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

      {profile && <ShareLinks profile={profile} onProfileChange={refresh} />}

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

      <div className="rounded-2xl border border-red-200 p-5">
        <h2 className="mb-1 text-sm font-medium text-red-700">Danger zone</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Permanently deletes all click and profile-view history (device, referral source, location breakdowns,
          the 14-day chart). Your links, theme, and profile are not affected. This cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetStats}
            disabled={resetting}
            className="w-fit rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            {resetting ? 'Resetting…' : 'Reset statistics'}
          </button>
          {resetMessage && <span className="text-xs text-neutral-600">{resetMessage}</span>}
        </div>
      </div>
    </div>
  )
}
