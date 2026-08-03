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

  await supabase.from('profile_members').insert({ profile_id: data.id, user_id: userId, role: 'owner' })
  return data
}

export function useProfile(userId: string | undefined, userEmail: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  async function refresh() {
    if (!userId) return

    // Multiple accounts can manage the same business via profile_members.
    const { data: membership } = await supabase
      .from('profile_members')
      .select('profile_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (membership) {
      const { data } = await supabase.from('profiles').select('*').eq('id', membership.profile_id).maybeSingle()
      setProfile(data)
      setUnauthorized(false)
      return
    }

    // This app hosts a single business. Only the first account to log in may
    // bootstrap that business's profile; any other account needs to be added
    // as a team member (profile_members) to get access.
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    if (count && count > 0) {
      setUnauthorized(true)
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

  return { profile, loading, unauthorized, refresh }
}
