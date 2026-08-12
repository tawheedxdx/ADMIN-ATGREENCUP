import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, ListFilter, AlertCircle, Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export function MobileNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggleDrawer } = useUIStore()

  const tabs = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/approvals', label: 'Approve', icon: CheckSquare },
    { path: '/entries', label: 'Entries', icon: ListFilter },
    { path: '/issues', label: 'Issues', icon: AlertCircle },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mobile-nav-glass border-t border-graphite-800/80 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-400 font-semibold'
                  : 'text-graphite-400 hover:text-graphite-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5" />
              )}
            </button>
          )
        })}

        {/* More Drawer Trigger */}
        <button
          onClick={toggleDrawer}
          className="flex flex-col items-center justify-center w-16 py-1 rounded-xl text-graphite-400 hover:text-graphite-200"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </nav>
  )
}
