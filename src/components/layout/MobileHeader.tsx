import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Menu, Sun, Moon, ShieldCheck } from 'lucide-react'

const PAGE_TITLES: { [key: string]: string } = {
  '/': 'Dashboard',
  '/approvals': 'Approval Queue',
  '/entries': 'Production Entries',
  '/issues': 'Issues Management',
  '/employees': 'Employees',
  '/machines': 'Machines',
  '/products': 'Products',
  '/units-shifts': 'Units & Shifts',
  '/reports': 'Reports & Analytics',
  '/salaries': 'Salaries & Wages',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
}

export function MobileHeader() {
  const location = useLocation()
  const { toggleDrawer, theme, toggleTheme } = useUIStore()
  const { user } = useAuthStore()

  const currentTitle = PAGE_TITLES[location.pathname] || 'Admin Panel'

  return (
    <header className="sticky top-0 z-40 w-full mobile-nav-glass border-b border-graphite-800/80 px-4 py-3 flex items-center justify-between">
      {/* Left: Branding & Page Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleDrawer}
          className="p-2 -ml-1 rounded-xl text-graphite-300 hover:text-white hover:bg-graphite-800/80 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-subtle" />
            <h1 className="text-sm font-bold text-graphite-100 leading-tight">
              {currentTitle}
            </h1>
          </div>
          <p className="text-[10px] text-graphite-400 font-medium tracking-wide">
            AT GREENCUP ADMIN
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle & Admin Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-graphite-400 hover:text-graphite-100 hover:bg-graphite-800/80 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
        
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-950/60 border border-brand-800/50 text-brand-400 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate max-w-[70px]">
            {user?.displayName || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
