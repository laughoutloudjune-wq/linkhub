import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { ClickEvent, Link } from '../types'

function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-neutral-500">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/5">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'var(--accent, #3A2E2E)' }} />
      </div>
    </div>
  )
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) {
    const key = keyFn(item) || 'Unknown'
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

function topEntries(counts: Record<string, number>, n = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

export default function DashboardOverview() {
  const { session } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    const profileId = session.user.id

    async function load() {
      const [{ data: linksData }, { data: clicksData }, { count }] = await Promise.all([
        supabase.from('links').select('*').eq('profile_id', profileId),
        supabase.from('click_events').select('*').eq('profile_id', profileId),
        supabase
          .from('page_view_events')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId),
      ])
      setLinks(linksData ?? [])
      setClicks(clicksData ?? [])
      setProfileViews(count ?? 0)
      setLoading(false)
    }
    load()
  }, [session])

  const totalClicks = clicks.length
  const clickRate = profileViews > 0 ? Math.round((totalClicks / profileViews) * 100) : 0

  const clicksByLink = useMemo(() => {
    const counts = groupBy(clicks, (c) => c.link_id)
    return links
      .map((link) => ({ link, count: counts[link.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [links, clicks])

  const topLink = clicksByLink[0]
  const maxLinkClicks = clicksByLink[0]?.count ?? 0

  const deviceCounts = useMemo(() => groupBy(clicks, (c) => c.device ?? 'Unknown'), [clicks])
  const sourceCounts = useMemo(() => groupBy(clicks, (c) => c.source ?? 'Direct'), [clicks])
  const locationCounts = useMemo(
    () =>
      groupBy(clicks, (c) => {
        if (c.city && c.region) return `${c.city}, ${c.region}`
        return c.city ?? c.country ?? 'Unknown'
      }),
    [clicks],
  )

  const last14Days = useMemo(() => {
    const days: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = clicks.filter((c) => c.created_at.slice(0, 10) === key).length
      days.push({ date: key, count })
    }
    return days
  }, [clicks])

  const maxDaily = Math.max(1, ...last14Days.map((d) => d.count))
  const points = last14Days
    .map((d, i) => {
      const x = (i / 13) * 600
      const y = 160 - (d.count / maxDaily) * 150
      return `${x},${y}`
    })
    .join(' ')

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="text-xs text-neutral-500">Profile Views</div>
          <div className="mt-1 text-2xl font-semibold">{profileViews}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="text-xs text-neutral-500">Total Clicks</div>
          <div className="mt-1 text-2xl font-semibold">{totalClicks}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="text-xs text-neutral-500">Click Rate</div>
          <div className="mt-1 text-2xl font-semibold">{clickRate}%</div>
        </div>
        <div className="rounded-2xl p-5 text-white" style={{ background: 'var(--accent, #E7A8A3)' }}>
          <div className="text-xs opacity-80">Top Link</div>
          <div className="mt-1 truncate text-lg font-semibold">{topLink?.link.title ?? '—'}</div>
          <div className="text-xs opacity-80">{topLink?.count ?? 0} clicks</div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <div className="mb-3 text-sm font-medium">Clicks — last 14 days</div>
        <svg viewBox="0 0 600 160" className="w-full">
          <polyline points={points} fill="none" stroke="var(--accent, #E7A8A3)" strokeWidth="2" />
          <polygon points={`0,160 ${points} 600,160`} fill="var(--accent, #E7A8A3)" opacity="0.12" />
        </svg>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <div className="mb-3 text-sm font-medium">Clicks per link</div>
        <div className="flex flex-col gap-3">
          {clicksByLink.map(({ link, count }) => (
            <BarRow key={link.id} label={link.title} value={count} max={maxLinkClicks} suffix="" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="mb-3 text-sm font-medium">Device</div>
          <div className="flex flex-col gap-3">
            {topEntries(deviceCounts).map(([label, count]) => (
              <BarRow
                key={label}
                label={label}
                value={Math.round((count / totalClicks) * 100) || 0}
                max={100}
                suffix="%"
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="mb-3 text-sm font-medium">Location</div>
          <div className="flex flex-col gap-3">
            {topEntries(locationCounts).map(([label, count]) => (
              <BarRow
                key={label}
                label={label}
                value={Math.round((count / totalClicks) * 100) || 0}
                max={100}
                suffix="%"
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="mb-3 text-sm font-medium">Referral source</div>
          <div className="flex flex-col gap-3">
            {topEntries(sourceCounts).map(([label, count]) => (
              <BarRow
                key={label}
                label={label}
                value={Math.round((count / totalClicks) * 100) || 0}
                max={100}
                suffix="%"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
