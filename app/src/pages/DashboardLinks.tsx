import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Link } from '../types'

export default function DashboardLinks() {
  const { session } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!session) return
    const [{ data }, { data: clickRows }] = await Promise.all([
      supabase.from('links').select('*').eq('profile_id', session.user.id).order('position', { ascending: true }),
      supabase.from('click_events').select('link_id').eq('profile_id', session.user.id),
    ])
    setLinks(data ?? [])
    const counts: Record<string, number> = {}
    for (const row of clickRows ?? []) {
      counts[row.link_id] = (counts[row.link_id] ?? 0) + 1
    }
    setClickCounts(counts)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !newTitle.trim()) return
    const nextPosition = links.length > 0 ? Math.max(...links.map((l) => l.position)) + 1 : 0
    await supabase.from('links').insert({
      profile_id: session.user.id,
      title: newTitle.trim(),
      url: newUrl.trim() || 'https://',
      position: nextPosition,
      active: true,
    })
    setNewTitle('')
    setNewUrl('')
    refresh()
  }

  async function updateLink(id: string, patch: Partial<Link>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    await supabase.from('links').update(patch).eq('id', id)
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= links.length) return
    const a = links[index]
    const b = links[target]
    const reordered = [...links]
    reordered[index] = b
    reordered[target] = a
    setLinks(reordered)
    await Promise.all([
      supabase.from('links').update({ position: b.position }).eq('id', a.id),
      supabase.from('links').update({ position: a.position }).eq('id', b.id),
    ])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this link?')) return
    setLinks((prev) => prev.filter((l) => l.id !== id))
    await supabase.from('links').delete().eq('id', id)
  }

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex gap-3 rounded-2xl border border-black/5 bg-white p-5">
        <input
          placeholder="Link title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <input
          placeholder="https://…"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-[2] rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ background: 'var(--accent, #3A2E2E)' }}
        >
          + Add link
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {links.map((link, i) => (
          <div key={link.id} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-col">
              <button
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="text-xs text-neutral-500 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                disabled={i === links.length - 1}
                onClick={() => move(i, 1)}
                className="text-xs text-neutral-500 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <input
              value={link.title}
              onChange={(e) => updateLink(link.id, { title: e.target.value })}
              className="w-[190px] rounded-lg border border-black/10 px-2 py-1.5 text-sm"
            />
            <input
              value={link.url}
              onChange={(e) => updateLink(link.id, { url: e.target.value })}
              className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm text-neutral-500"
            />
            <div className="w-[70px] text-center text-sm text-neutral-500">{clickCounts[link.id] ?? 0}</div>
            <button
              onClick={() => updateLink(link.id, { active: !link.active })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                link.active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {link.active ? 'Live' : 'Hidden'}
            </button>
            <button onClick={() => handleDelete(link.id)} className="text-neutral-400 hover:text-red-600">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
