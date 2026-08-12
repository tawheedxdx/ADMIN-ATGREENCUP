import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import {
  X,
  LayoutDashboard,
  CheckSquare,
  ListFilter,
  AlertCircle,
  Users,
  Cpu,
  Package,
  Clock,
  BarChart3,
  IndianRupee,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export function MobileDrawer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { drawerOpen, setDrawerOpen } = useUIStore()
  const { user, logout } = useAuthStore()

  if (!drawerOpen) return null

  const menuGroups = [
    {
      title: 'Operations',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/approvals', label: 'Approval Queue', icon: CheckSquare },
        { path: '/entries', label: 'Production Entries', icon: ListFilter },
        { path: '/issues', label: 'Issues Management', icon: AlertCircle },
      ],
    },
    {
      title: 'Factory Setup',
      items: [
        { path: '/employees', label: 'Employees', icon: Users },
        { path: '/machines', label: 'Machines', icon: Cpu },
        { path: '/products', label: 'Products', icon: Package },
        { path: '/units-shifts', label: 'Units & Shifts', icon: Clock },
      ],
    },
    {
      title: 'Finance & Analytics',
      items: [
        { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { path: '/salaries', label: 'Salaries & Wages', icon: IndianRupee },
        { path: '/audit-logs', label: 'Audit Logs', icon: FileText },
        { path: '/settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ]

  const handleNav = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setDrawerOpen(false)
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="relative z-10 w-4/5 max-w-xs h-full bg-graphite-900 border-r border-graphite-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-graphite-800 flex items-center justify-between bg-graphite-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-graphite-100">At GreenCup</h2>
              <p className="text-[10px] text-graphite-400 font-medium">ADMIN PORTAL</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-graphite-400 hover:text-graphite-100 hover:bg-graphite-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-graphite-500 uppercase tracking-wider mb-1">
                {group.title}
              </h3>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-950/80 border border-brand-800/60 text-brand-300 shadow-sm'
                        : 'text-graphite-300 hover:bg-graphite-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-graphite-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-graphite-800 bg-graphite-950/60 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-graphite-800/40 border border-graphite-800">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-xs">
              {user?.displayName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-graphite-200 truncate">
                {user?.displayName || 'Admin'}
              </p>
              <p className="text-[10px] text-graphite-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-950/30 border border-red-900/40 hover:bg-red-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
