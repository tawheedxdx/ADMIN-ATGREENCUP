import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      console.error('[Login] Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto space-y-6 relative z-10">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto shadow-lg shadow-brand-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-graphite-100 tracking-tight">
            At GreenCup
          </h1>
          <p className="text-xs text-graphite-400 font-medium uppercase tracking-widest">
            Mobile Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-graphite-900/90 border border-graphite-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          <h2 className="text-lg font-bold text-graphite-100 text-center">
            Sign In to Dashboard
          </h2>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-300 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@atgreencup.com"
                  className="w-full pl-10 pr-4 py-3 bg-graphite-950/80 border border-graphite-800 rounded-xl text-sm text-graphite-100 placeholder-graphite-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-graphite-950/80 border border-graphite-800 rounded-xl text-sm text-graphite-100 placeholder-graphite-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-graphite-500 font-medium">
          Protected System • Authorized Admin Access Only
        </p>
      </div>
    </div>
  )
}
