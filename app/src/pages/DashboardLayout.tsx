import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/links', label: 'Links', end: false },
  { to: '/dashboard/settings', label: 'Settings', end: false },
]

export default function DashboardLayout() {
  const { session, loading: authLoading } = useAuth()
  const { profile } = useProfile(session?.user.id)

  if (authLoading) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col justify-between border-r border-black/10 p-6">
        <div>
          <div className="mb-8 text-lg font-semibold">LinkHub</div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium ${
                    isActive ? 'bg-black text-white' : 'text-neutral-600 hover:bg-black/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="rounded-xl bg-black/5 p-3 text-xs text-neutral-500">
          <div className="mb-2 truncate">{profile?.name ?? session.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} className="text-neutral-700 underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10">
        <Outlet />
      </main>
    </div>
  )
}
