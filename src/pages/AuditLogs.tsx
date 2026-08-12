import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/firebase/audit.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Search, ShieldAlert, History, Activity } from 'lucide-react'

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: logs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getLogs(50),
  })

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Fetching Audit Trail..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div>
        <h2 className="text-base font-extrabold text-graphite-100">Audit Trail</h2>
        <p className="text-xs text-graphite-400">System activity log & administrative actions</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-graphite-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search activity logs..."
          className="w-full bg-graphite-900 border border-graphite-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-graphite-100 placeholder-graphite-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <EmptyState title="No Audit Records" description="No activities recorded matching search criteria." />
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-xs font-bold text-graphite-200">{log.action}</span>
                </div>
                <span className="text-[10px] text-graphite-400">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                </span>
              </div>

              <p className="text-xs text-graphite-400 pl-5">
                By <span className="font-semibold text-graphite-200">{log.performedByName || 'Admin'}</span>
                {log.details ? ` — ${log.details}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
