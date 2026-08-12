import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { entriesService } from '@/services/firebase/entries.service'
import { issuesService } from '@/services/firebase/issues.service'
import { machinesService } from '@/services/firebase/machines.service'
import { usersService } from '@/services/firebase/users.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  CheckSquare,
  AlertCircle,
  ListFilter,
  Users,
  Cpu,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: entries = [], isLoading: entriesLoading, error: entriesError, refetch } = useQuery({
    queryKey: ['dashboard-entries'],
    queryFn: () => entriesService.getAll(),
  })

  const { data: issues = [] } = useQuery({
    queryKey: ['dashboard-issues'],
    queryFn: () => issuesService.getAll(),
  })

  const { data: machines = [] } = useQuery({
    queryKey: ['dashboard-machines'],
    queryFn: () => machinesService.getAll(),
  })

  const { data: operators = [] } = useQuery({
    queryKey: ['dashboard-operators'],
    queryFn: () => usersService.getOperators(),
  })

  if (entriesLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Factory Metrics..." />
  }

  if (entriesError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const toISOStringSafe = (val: any): string => {
    if (!val) return ''
    if (typeof val === 'string') return val
    if (typeof val?.toDate === 'function') {
      try { return val.toDate().toISOString() } catch { return '' }
    }
    if (val instanceof Date) {
      try { return val.toISOString() } catch { return '' }
    }
    if (typeof val?.seconds === 'number') {
      try { return new Date(val.seconds * 1000).toISOString() } catch { return '' }
    }
    return String(val)
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter((e) => {
    const pDate = toISOStringSafe(e.productionDate)
    const sDate = toISOStringSafe(e.submittedAt)
    return pDate === today || (sDate && sDate.startsWith(today))
  })

  const pendingEntries = entries.filter((e) => e.status === 'pending')
  const approvedEntries = entries.filter((e) => e.status === 'approved')
  const rejectedEntries = entries.filter((e) => e.status === 'rejected')
  const openIssues = issues.filter((i) => i.status === 'open' || i.status === 'in_review')

  // Prepare chart data (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayEntries = entries.filter((e) => e.productionDate === dateStr && e.status === 'approved')
    const totalQty = dayEntries.reduce((sum, e) => sum + (e.boxQuantity || e.quantity || 0), 0)
    return { name: dayName, date: dateStr, count: totalQty }
  })

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Pending Banner Alert */}
      {pendingEntries.length > 0 && (
        <div
          onClick={() => navigate('/approvals')}
          className="p-3.5 bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              {pendingEntries.length}
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-200">Pending Approvals</h3>
              <p className="text-[11px] text-amber-300/80">Tap to review & process submission queue</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </div>
      )}

      {/* Grid of Key Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => navigate('/approvals')}
          className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">Pending</span>
            <CheckSquare className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-graphite-100">{pendingEntries.length}</p>
          <p className="text-[10px] text-graphite-400">Require admin action</p>
        </div>

        <div
          onClick={() => navigate('/issues')}
          className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">Open Issues</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-graphite-100">{openIssues.length}</p>
          <p className="text-[10px] text-graphite-400">Machine/Material reports</p>
        </div>

        <div
          onClick={() => navigate('/entries')}
          className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center justify-between text-brand-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">Today Entries</span>
            <ListFilter className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-graphite-100">{todayEntries.length}</p>
          <p className="text-[10px] text-graphite-400">{approvedEntries.length} Total Approved</p>
        </div>

        <div
          onClick={() => navigate('/machines')}
          className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">Machines</span>
            <Cpu className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-graphite-100">{machines.length}</p>
          <p className="text-[10px] text-graphite-400">{operators.length} Active Operators</p>
        </div>
      </div>

      {/* Production Output Trend Chart */}
      <div className="bg-graphite-900/90 border border-graphite-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-graphite-200 uppercase tracking-wider">
              Approved Production (7 Days)
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-950 text-brand-400 border border-brand-800/50 font-semibold">
            Boxes
          </span>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <XAxis dataKey="name" stroke="#6e7781" fontSize={11} tickLine={false} />
              <YAxis stroke="#6e7781" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f0f6fc',
                }}
              />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity / Action Quick Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-graphite-400 uppercase tracking-wider">
            Quick Navigation
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-3 p-3 bg-graphite-900/60 border border-graphite-800/80 rounded-xl text-left hover:border-graphite-700 active:scale-95 transition-all"
          >
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-graphite-200">Employees</p>
              <p className="text-[10px] text-graphite-400">Manage operators</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/salaries')}
            className="flex items-center gap-3 p-3 bg-graphite-900/60 border border-graphite-800/80 rounded-xl text-left hover:border-graphite-700 active:scale-95 transition-all"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-graphite-200">Salaries & Slips</p>
              <p className="text-[10px] text-graphite-400">Generate wages</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
