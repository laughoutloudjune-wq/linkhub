import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}

async function bootstrapProfile(userId: string, email: string | undefined): Promise<Profile | null> {
  const base = slugify(email?.split('@')[0] ?? 'my-clinic') || 'my-clinic'
  const slug = `${base}-${userId.slice(0, 6)}`

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      slug,
      name: 'My Clinic',
      accent_color: '#E7A8A3',
      background_type: 'color',
      background_value: '#FBF4F1',
    })
    .select('*')
    .single()

  if (error) return null
  return data
}

export function useProfile(userId: string | undefined, userEmail: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) {
      setProfile(data)
      return
    }
    const created = await bootstrapProfile(userId, userEmail)
    setProfile(created)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { profile, loading, refresh }
}
