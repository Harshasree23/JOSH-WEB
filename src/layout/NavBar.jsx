import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/stores/authStore'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/journal', label: 'Journal' },
  { to: '/leaderboard', label: 'Board' },
  { to: '/habits', label: 'Habits' },
  { to: '/settings', label: 'Settings' },
]

export default function NavBar() {
  const { profile, signOut } = useAuthStore()
  const location = useLocation()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <NavLink to="/" className="text-lg font-bold">
          Pillar
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            {profile?.username || 'User'}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`text-xs font-medium py-1 px-2 ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
