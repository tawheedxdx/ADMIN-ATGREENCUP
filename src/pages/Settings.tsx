import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { authService } from '@/services/firebase/auth.service'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { User, LogOut, Sun, Moon, ShieldCheck, Cpu, RefreshCw, Smartphone } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div>
        <h2 className="text-base font-extrabold text-graphite-100">App Settings</h2>
        <p className="text-xs text-graphite-400">Account management & mobile app preferences</p>
      </div>

      {/* Admin Profile Card */}
      <div className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-950 border border-brand-800/50 flex items-center justify-center text-brand-400 font-black text-lg">
            {(user?.displayName || user?.name || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-graphite-100">{user?.displayName || user?.name || 'Admin User'}</h3>
            <p className="text-xs text-graphite-400">{user?.email || 'admin@atgreencup.com'}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-950 text-brand-400 border border-brand-800/50 font-semibold uppercase">
              {user?.role || 'Administrator'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-graphite-900/90 border border-graphite-800 rounded-2xl divide-y divide-graphite-850/60 shadow-md">
        <div
          onClick={toggleTheme}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-graphite-850/40 transition-all"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <p className="text-xs font-bold text-graphite-200">Color Theme</p>
              <p className="text-[10px] text-graphite-400">Currently set to {theme} mode</p>
            </div>
          </div>
          <span className="text-xs text-graphite-400 font-semibold capitalize">{theme}</span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-graphite-200">App Version</p>
              <p className="text-[10px] text-graphite-400">At GreenCup Mobile Admin</p>
            </div>
          </div>
          <span className="text-xs text-graphite-400 font-bold">v7.0.1</span>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={() => setIsLogoutOpen(true)}
        className="w-full p-4 bg-red-950/40 border border-red-800/40 hover:bg-red-900/60 active:scale-98 rounded-2xl text-red-400 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out of Mobile Admin
      </button>

      {/* Logout Confirmation Sheet */}
      <BottomSheet
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="Sign Out Confirmation"
      >
        <div className="space-y-4 text-center">
          <p className="text-xs text-graphite-300">
            Are you sure you want to end your current mobile administrator session?
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setIsLogoutOpen(false)}
              className="flex-1 py-3 bg-graphite-800 hover:bg-graphite-700 active:scale-95 text-graphite-200 text-xs font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
