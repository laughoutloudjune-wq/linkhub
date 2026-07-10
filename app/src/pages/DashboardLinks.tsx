import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { normalizeUrl } from '../lib/normalizeUrl'
import type { Link } from '../types'

export default function DashboardLinks() {
  const { session } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  async function refresh() {
    if (!session) return
    const [{ data }, { data: clickRows }] = await Promise.all([
      supabase
        .from('links')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
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
    if (!session || !newTitle.trim() || adding) return
    setAdding(true)
    // Read the current max position fresh from the DB rather than from local
    // state — stale state from rapid successive adds was causing every new
    // link to land on the same position, which made the display order
    // unstable (ties have no guaranteed order on reload).
    const { data: maxRow } = await supabase
      .from('links')
      .select('position')
      .eq('profile_id', session.user.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextPosition = maxRow ? maxRow.position + 1 : 0

    await supabase.from('links').insert({
      profile_id: session.user.id,
      title: newTitle.trim(),
      url: normalizeUrl(newUrl.trim()) || 'https://',
      position: nextPosition,
      active: true,
    })
    setNewTitle('')
    setNewUrl('')
    await refresh()
    setAdding(false)
  }

  async function updateLink(id: string, patch: Partial<Link>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    await supabase.from('links').update(patch).eq('id', id)
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= links.length) return
    const reordered = [...links]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    setLinks(reordered)
    // Renumber every link from the new array order instead of swapping just
    // the two positions involved — a plain swap silently does nothing if the
    // two rows already share a position (which happened here from a prior
    // bug), and re-deriving positions from the array each time is
    // self-healing against any duplicate/out-of-sync values already in the DB.
    await Promise.all(
      reordered.map((link, i) => supabase.from('links').update({ position: i }).eq('id', link.id)),
    )
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
          placeholder="https://… or a phone number"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onBlur={(e) => setNewUrl(normalizeUrl(e.target.value))}
          className="flex-[2] rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--accent, #3A2E2E)' }}
        >
          {adding ? 'Adding…' : '+ Add link'}
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
              onBlur={(e) => updateLink(link.id, { url: normalizeUrl(e.target.value) })}
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
