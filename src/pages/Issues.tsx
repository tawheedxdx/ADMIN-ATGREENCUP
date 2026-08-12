import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { issuesService } from '@/services/firebase/issues.service'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ImageModal } from '@/components/ui/ImageModal'
import { AlertTriangle, CheckCircle, Clock, Image as ImageIcon, Wrench, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { IssueStatus, IssuePriority, ResolutionType } from '@/types'

function safeFormatDate(val: any): string {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return typeof val === 'string' ? val : ''
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Issues() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all')
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [detailIssue, setDetailIssue] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Resolution form state
  const [adminNote, setAdminNote] = useState('')
  const [resolutionType, setResolutionType] = useState<ResolutionType | ''>('')
  const [statusUpdate, setStatusUpdate] = useState<IssueStatus>('resolved')

  const { data: issues = [], isLoading, error, refetch } = useQuery({
    queryKey: ['issues-list'],
    queryFn: () => issuesService.getAll(),
  })

  const resolveMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      issuesService.resolveIssue(data.id, data.payload, user?.uid || 'admin', user?.displayName || 'Admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues-list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-issues'] })
      setSelectedIssue(null)
      setDetailIssue(null)
      setAdminNote('')
      setResolutionType('')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      issuesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues-list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-issues'] })
    },
  })

  const filteredIssues = useMemo(() => {
    if (statusFilter === 'all') return issues
    return issues.filter((i: any) => i.status === statusFilter)
  }, [issues, statusFilter])

  const stats = useMemo(() => {
    return {
      open: issues.filter((i: any) => i.status === 'open').length,
      urgent: issues.filter((i: any) => (i.priority === 'urgent' || i.severity === 'urgent') && i.status !== 'resolved' && i.status !== 'closed').length,
      inReview: issues.filter((i: any) => i.status === 'in_review').length,
      resolved: issues.filter((i: any) => i.status === 'resolved').length,
    }
  }, [issues])

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Fetching Issues Log..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div>
        <h2 className="text-base font-extrabold text-graphite-100">Factory Issues & Maintenance</h2>
        <p className="text-xs text-graphite-400">Track, review & resolve plant equipment reports</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-center">
          <span className="text-[10px] text-blue-400 font-bold block">OPEN</span>
          <span className="text-sm font-extrabold text-blue-200 block">{stats.open}</span>
        </div>
        <div className="p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl text-center">
          <span className="text-[10px] text-red-400 font-bold block">URGENT</span>
          <span className="text-sm font-extrabold text-red-200 block">{stats.urgent}</span>
        </div>
        <div className="p-2.5 bg-purple-950/40 border border-purple-800/40 rounded-xl text-center">
          <span className="text-[10px] text-purple-400 font-bold block">IN REVIEW</span>
          <span className="text-sm font-extrabold text-purple-200 block">{stats.inReview}</span>
        </div>
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-center">
          <span className="text-[10px] text-emerald-400 font-bold block">RESOLVED</span>
          <span className="text-sm font-extrabold text-emerald-200 block">{stats.resolved}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {(['all', 'open', 'in_review', 'resolved', 'needs_more_info', 'closed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-graphite-900 text-graphite-400 border border-graphite-800'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Issues Card List */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter === 'all' ? '' : statusFilter.replace('_', ' ')} Issues`}
          description="There are currently no reports matching this filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue: any) => {
            const photo = issue.photoUrl || issue.imageUrl
            const priority = issue.priority || issue.severity || 'medium'
            const machineDisplay = issue.machineNo || issue.machineNumber || '—'

            return (
              <div
                key={issue.id}
                className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md"
              >
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          priority === 'urgent'
                            ? 'bg-red-950/80 text-red-400 border-red-800/60'
                            : priority === 'high'
                            ? 'bg-orange-950/80 text-orange-400 border-orange-800/60'
                            : priority === 'medium'
                            ? 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                            : 'bg-graphite-800 text-graphite-400 border-graphite-700'
                        }`}
                      >
                        {priority}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          issue.status === 'resolved'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
                            : issue.status === 'in_review'
                            ? 'bg-purple-950/80 text-purple-400 border-purple-800/50'
                            : 'bg-blue-950/80 text-blue-400 border-blue-800/50'
                        }`}
                      >
                        {issue.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-xs font-extrabold text-graphite-100 capitalize mt-1">
                      {issue.issueType ? issue.issueType.replace('_', ' ') : issue.title || 'Equipment Issue'}
                    </h3>
                    <p className="text-[11px] text-graphite-400">
                      Machine #{machineDisplay} • Reported by {issue.operatorName || 'Operator'}
                    </p>
                  </div>

                  <button
                    onClick={() => setDetailIssue(issue)}
                    className="p-1.5 bg-graphite-800 rounded-xl text-graphite-300 hover:text-white shrink-0"
                    title="View issue details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo Thumbnail & Description */}
                <div className="flex items-start gap-3">
                  {photo ? (
                    <button
                      onClick={() => setImagePreview(photo)}
                      className="w-14 h-14 rounded-xl overflow-hidden border border-graphite-700 shrink-0 relative group"
                    >
                      <img src={photo} alt="Issue photo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  ) : null}

                  {issue.description && (
                    <p className="text-xs text-graphite-300 bg-graphite-950/80 p-2.5 rounded-xl border border-graphite-850 flex-1 line-clamp-3">
                      {issue.description}
                    </p>
                  )}
                </div>

                {/* Date & Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-graphite-850">
                  <span className="text-[10px] text-graphite-500">
                    {safeFormatDate(issue.createdAt || issue.submittedAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {issue.status === 'open' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: issue.id, status: 'in_review' })}
                        className="py-1.5 px-2.5 bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[11px] font-bold rounded-xl flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" /> In Review
                      </button>
                    )}

                    {issue.status !== 'resolved' && (
                      <button
                        onClick={() => {
                          setSelectedIssue(issue)
                          setStatusUpdate('resolved')
                          setAdminNote(issue.adminNote || '')
                          setResolutionType(issue.resolutionType || 'repaired')
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-xl flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Issue Detail View Bottom Sheet */}
      <BottomSheet
        isOpen={!!detailIssue}
        onClose={() => setDetailIssue(null)}
        title="Issue Detailed Record"
      >
        {detailIssue && (
          <div className="space-y-4">
            {/* Image Preview */}
            {(detailIssue.photoUrl || detailIssue.imageUrl) && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-graphite-400 uppercase tracking-wider">
                  Issue Photo Proof
                </span>
                <button
                  onClick={() => setImagePreview(detailIssue.photoUrl || detailIssue.imageUrl)}
                  className="w-full h-44 rounded-2xl overflow-hidden border border-graphite-700 relative block group"
                >
                  <img
                    src={detailIssue.photoUrl || detailIssue.imageUrl}
                    alt="Issue Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" /> Tap to view full size
                  </div>
                </button>
              </div>
            )}

            <div className="p-3.5 bg-graphite-950 rounded-2xl border border-graphite-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Issue Type</span>
                <span className="font-bold text-graphite-100 capitalize">
                  {detailIssue.issueType ? detailIssue.issueType.replace('_', ' ') : detailIssue.title}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Machine Unit</span>
                <span className="font-bold text-graphite-100">#{detailIssue.machineNo || detailIssue.machineNumber}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Reported By</span>
                <span className="font-bold text-graphite-200">{detailIssue.operatorName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Priority Level</span>
                <span className="font-extrabold text-amber-400 uppercase">
                  {detailIssue.priority || detailIssue.severity || 'Medium'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Current Status</span>
                <span className="font-bold text-brand-400 capitalize">
                  {detailIssue.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-graphite-400">Reported Timestamp</span>
                <span className="font-medium text-graphite-300">
                  {safeFormatDate(detailIssue.createdAt || detailIssue.submittedAt)}
                </span>
              </div>
            </div>

            {/* Description */}
            {detailIssue.description && (
              <div className="p-3 bg-graphite-900 rounded-xl border border-graphite-800 text-xs">
                <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider block mb-1">
                  Report Description
                </span>
                <p className="text-graphite-200">{detailIssue.description}</p>
              </div>
            )}

            {/* Existing Resolution Information */}
            {detailIssue.resolutionNotes || detailIssue.adminNote ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-400 block">Resolution Details</span>
                <p className="text-emerald-200">{detailIssue.resolutionNotes || detailIssue.adminNote}</p>
                {detailIssue.resolutionType && (
                  <p className="text-[10px] text-emerald-400/80">Type: {detailIssue.resolutionType}</p>
                )}
              </div>
            ) : null}

            {detailIssue.status !== 'resolved' && (
              <button
                onClick={() => {
                  setSelectedIssue(detailIssue)
                  setStatusUpdate('resolved')
                  setAdminNote(detailIssue.adminNote || '')
                  setResolutionType('repaired')
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve This Issue
              </button>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Resolution & Status Update Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        title="Resolve & Update Issue"
      >
        {selectedIssue && (
          <div className="space-y-4">
            <div className="p-3 bg-graphite-950 rounded-xl border border-graphite-800 text-xs space-y-1">
              <p className="font-bold text-graphite-200">
                Machine #{selectedIssue.machineNo || selectedIssue.machineNumber} • {selectedIssue.issueType?.replace('_', ' ') || 'Issue'}
              </p>
              <p className="text-graphite-400">{selectedIssue.description}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-graphite-300 block mb-1">
                  Resolution Type
                </label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
                  className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="repaired">Repaired / Fixed</option>
                  <option value="replaced_part">Replaced Spare Part</option>
                  <option value="operator_guidance">Operator Guidance Given</option>
                  <option value="false_alarm">False Alarm</option>
                  <option value="other">Other Action</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-graphite-300 block mb-1">
                  Set Final Status
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value as IssueStatus)}
                  className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="resolved">Resolved</option>
                  <option value="in_review">In Review / In Progress</option>
                  <option value="closed">Closed</option>
                  <option value="needs_more_info">Needs More Info</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-graphite-300 block mb-1">
                  Resolution Notes / Action Details
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Describe maintenance action taken, replacement parts, or operator guidance..."
                  rows={3}
                  className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              disabled={resolveMutation.isPending || !adminNote.trim()}
              onClick={() =>
                resolveMutation.mutate({
                  id: selectedIssue.id,
                  payload: {
                    resolutionType: resolutionType || 'repaired',
                    adminNote,
                    status: statusUpdate,
                  },
                })
              }
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              Save Resolution Record
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Image Preview Modal */}
      {imagePreview && (
        <ImageModal src={imagePreview} onClose={() => setImagePreview(null)} />
      )}
    </div>
  )
}
