import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type { BackgroundType } from '../types'

const ACCENT_PRESETS = ['#E7A8A3', '#B9A6E8', '#9FDFC9', '#F3B6D3', '#D9B7A3', '#8AB4E8']

export default function DashboardSettings() {
  const { session } = useAuth()
  const { profile, refresh } = useProfile(session?.user.id)
  const [accentColor, setAccentColor] = useState(profile?.accent_color ?? '#E7A8A3')
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(profile?.background_type ?? 'color')
  const [backgroundValue, setBackgroundValue] = useState(profile?.background_value ?? '#FBF4F1')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!profile) return
    setAccentColor(profile.accent_color)
    setBackgroundType(profile.background_type)
    setBackgroundValue(profile.background_value)
  }, [profile])

  async function handleSave() {
    if (!session) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ accent_color: accentColor, background_type: backgroundType, background_value: backgroundValue })
      .eq('id', session.user.id)
    await refresh()
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

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-fit rounded-full px-6 py-2.5 text-sm font-semibold text-white"
        style={{ background: accentColor }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
