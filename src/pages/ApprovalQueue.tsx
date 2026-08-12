import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { entriesService } from '@/services/firebase/entries.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ImageModal } from '@/components/ui/ImageModal'
import { CheckCircle2, XCircle, Edit3, Image as ImageIcon, Eye, Info, Clock, CheckSquare, Square } from 'lucide-react'

function parseFirebaseDate(val: any): Date | null {
  if (!val) return null
  if (val && typeof val.toDate === 'function') return val.toDate()
  if (val && val.seconds) return new Date(val.seconds * 1000)
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  return null
}

function safeFormatDate(val: any, includeTime = true): string {
  const d = parseFirebaseDate(val)
  if (!d) return typeof val === 'string' ? val : '—'
  if (includeTime) {
    return (
      d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ApprovalQueue() {
  const queryClient = useQueryClient()
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [detailEntry, setDetailEntry] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionType, setActionType] = useState<'reject' | 'correct' | null>(null)
  const [correctedQty, setCorrectedQty] = useState<number>(0)
  const [correctedWaste, setCorrectedWaste] = useState<number>(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pending-entries'],
    queryFn: () => entriesService.getPending(),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => entriesService.approveEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-entries'] })
      queryClient.invalidateQueries({ queryKey: ['production-entries'] })
      setDetailEntry(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      entriesService.rejectEntry(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-entries'] })
      queryClient.invalidateQueries({ queryKey: ['production-entries'] })
      setSelectedEntry(null)
      setDetailEntry(null)
      setActionType(null)
      setRejectReason('')
    },
  })

  const correctMutation = useMutation({
    mutationFn: ({
      id,
      quantity,
      wasteQuantity,
    }: {
      id: string
      quantity: number
      wasteQuantity?: number
    }) => entriesService.correctEntry(id, { quantity, wasteQuantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-entries'] })
      queryClient.invalidateQueries({ queryKey: ['production-entries'] })
      setSelectedEntry(null)
      setDetailEntry(null)
      setActionType(null)
    },
  })

  const handleBatchApprove = async () => {
    for (const id of selectedIds) {
      await approveMutation.mutateAsync(id)
    }
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map((e: any) => e.id)))
    }
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Fetching Pending Queue..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Page Title & Batch Approve Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Approval Queue</h2>
          <p className="text-xs text-graphite-400">
            {entries.length} submission{entries.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchApprove}
            disabled={approveMutation.isPending}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve ({selectedIds.size})
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="There are no pending production entries left in the approval queue."
        />
      ) : (
        <div className="space-y-3">
          {/* Select All Toggle Bar */}
          <div className="flex items-center justify-between px-1.5 py-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-graphite-400 hover:text-graphite-200 transition-colors"
            >
              {selectedIds.size === entries.length && entries.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-brand-400" />
              ) : (
                <Square className="w-4 h-4 text-graphite-600" />
              )}
              Select All Submissions ({entries.length})
            </button>
          </div>

          {/* Pending Entry Cards */}
          {entries.map((entry: any) => {
            const machineDisplay = entry.machineNo || entry.machineNumber || '—'
            const boxCount = entry.boxQuantity !== undefined ? entry.boxQuantity : (entry.quantity || 0)
            const pcsCount = entry.pcs !== undefined ? entry.pcs : (entry.quantity2 || 0)
            const isSelected = selectedIds.has(entry.id)

            return (
              <div
                key={entry.id}
                className={`p-4 bg-graphite-900/90 border rounded-2xl space-y-3 shadow-md transition-all ${
                  isSelected ? 'border-brand-500/60 bg-brand-950/20' : 'border-graphite-800'
                }`}
              >
                {/* Header: Select Checkbox, Operator & Timestamp */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleSelect(entry.id)}
                      className="mt-0.5 text-graphite-400 hover:text-brand-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-brand-400" />
                      ) : (
                        <Square className="w-5 h-5 text-graphite-600" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-graphite-100 truncate">
                        {entry.operatorName}
                      </h3>
                      <p className="text-[11px] text-graphite-400 flex items-center gap-1.5 flex-wrap">
                        <span>Machine #{machineDisplay}</span>
                        <span>•</span>
                        <span>{entry.productionDate}</span>
                        {entry.shiftName && (
                          <>
                            <span>•</span>
                            <span className="text-brand-400 font-semibold">{entry.shiftName}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailEntry(entry)}
                    className="p-1.5 rounded-lg bg-graphite-800 text-graphite-300 hover:text-white hover:bg-graphite-700 active:scale-95 transition-all shrink-0"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content: Image Thumbnail & Specs */}
                <div className="flex items-center gap-3">
                  {/* Proof Photo Thumbnail */}
                  {entry.imageUrl ? (
                    <button
                      onClick={() => setImagePreview(entry.imageUrl)}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-graphite-700 shrink-0 relative group hover:border-brand-500 transition-colors"
                    >
                      <img src={entry.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-graphite-950 border border-graphite-800/80 flex flex-col items-center justify-center text-graphite-600 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-[9px] mt-0.5">No photo</span>
                    </div>
                  )}

                  {/* Quantity & Calculation Summary */}
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 p-2 bg-graphite-950/70 rounded-xl border border-graphite-850 text-center">
                    <div>
                      <span className="text-[10px] text-graphite-400 block font-medium">Product</span>
                      <span className="text-xs font-bold text-graphite-100 truncate block">
                        {entry.productName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-graphite-400 block font-medium">BOX Count</span>
                      <span className="text-xs font-extrabold text-brand-400 block">
                        {boxCount} BOX {pcsCount > 0 ? `(${pcsCount} PCS)` : ''}
                      </span>
                    </div>

                    {entry.totalPackets !== undefined && entry.counting !== undefined && (
                      <div className="col-span-2 text-[10px] text-graphite-400 border-t border-graphite-850 pt-1 flex justify-center items-center gap-1">
                        <span>Packets: {entry.totalPackets} × {entry.counting} per pkt</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Timestamp & Waste info */}
                <div className="flex items-center justify-between text-[11px] text-graphite-400 px-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-graphite-500" />
                    Submitted: {safeFormatDate(entry.submittedAt || entry.createdAt)}
                  </span>
                  {entry.wasteQuantity ? (
                    <span className="text-red-400 font-semibold">
                      Waste: {entry.wasteQuantity} {entry.wasteUnit || 'PCS'}
                    </span>
                  ) : null}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-graphite-850/60">
                  <button
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(entry.id)}
                    className="flex-1 py-2.5 px-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntry(entry)
                      setActionType('correct')
                      setCorrectedQty(boxCount)
                      setCorrectedWaste(entry.wasteQuantity || 0)
                    }}
                    className="py-2.5 px-3 bg-graphite-800 hover:bg-graphite-700 active:scale-95 text-graphite-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntry(entry)
                      setActionType('reject')
                    }}
                    className="py-2.5 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/40 active:scale-95 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Entry Details Bottom Sheet Modal */}
      <BottomSheet
        isOpen={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title="Production Entry Details"
      >
        {detailEntry && (
          <div className="space-y-4">
            {/* Proof Photo Full Display */}
            {detailEntry.imageUrl ? (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-graphite-400 uppercase tracking-wider">
                  Submission Proof Photo
                </span>
                <button
                  onClick={() => setImagePreview(detailEntry.imageUrl)}
                  className="w-full h-44 rounded-2xl overflow-hidden border border-graphite-700 relative group block"
                >
                  <img
                    src={detailEntry.imageUrl}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" /> Tap to expand photo
                  </div>
                </button>
              </div>
            ) : null}

            {/* Spec Details Grid */}
            <div className="p-3.5 bg-graphite-950 rounded-2xl border border-graphite-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Operator</span>
                <span className="font-bold text-graphite-100">{detailEntry.operatorName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Machine Unit</span>
                <span className="font-bold text-graphite-100">
                  #{detailEntry.machineNo || detailEntry.machineNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Product Name</span>
                <span className="font-bold text-brand-400">{detailEntry.productName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">BOX Quantity</span>
                <span className="font-extrabold text-emerald-400">
                  {detailEntry.boxQuantity !== undefined ? detailEntry.boxQuantity : detailEntry.quantity} BOX
                </span>
              </div>

              {detailEntry.totalPackets !== undefined && detailEntry.counting !== undefined && (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">Packet Calculation</span>
                  <span className="font-semibold text-graphite-200">
                    {detailEntry.totalPackets} pkts × {detailEntry.counting} per pkt
                  </span>
                </div>
              )}

              {detailEntry.pcs !== undefined && (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">PCS Quantity</span>
                  <span className="font-semibold text-graphite-200">{detailEntry.pcs} PCS</span>
                </div>
              )}

              {detailEntry.wasteQuantity ? (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">Waste Quantity</span>
                  <span className="font-bold text-red-400">
                    {detailEntry.wasteQuantity} {detailEntry.wasteUnit || 'PCS'}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Production Date</span>
                <span className="font-bold text-graphite-200">{detailEntry.productionDate}</span>
              </div>

              {detailEntry.shiftName && (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">Shift</span>
                  <span className="font-bold text-graphite-200">{detailEntry.shiftName}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-graphite-400">Submitted Timestamp</span>
                <span className="font-medium text-graphite-300">
                  {safeFormatDate(detailEntry.submittedAt || detailEntry.createdAt)}
                </span>
              </div>
            </div>

            {/* Operator Notes */}
            {detailEntry.notes && (
              <div className="p-3 bg-graphite-900 rounded-xl border border-graphite-800 text-xs">
                <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider block mb-1">
                  Operator Remarks / Notes
                </span>
                <p className="text-graphite-200">{detailEntry.notes}</p>
              </div>
            )}

            {/* Bottom Actions inside detail drawer */}
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(detailEntry.id)}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Entry
              </button>

              <button
                onClick={() => {
                  setSelectedEntry(detailEntry)
                  setActionType('reject')
                }}
                className="py-3 px-4 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Action Bottom Sheet (Reject / Edit) */}
      <BottomSheet
        isOpen={!!selectedEntry}
        onClose={() => {
          setSelectedEntry(null)
          setActionType(null)
        }}
        title={actionType === 'reject' ? 'Reject Submission' : 'Correct Quantity'}
      >
        {selectedEntry && actionType === 'reject' && (
          <div className="space-y-4">
            <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 space-y-1">
              <p className="font-bold">Rejecting submission for {selectedEntry.operatorName}</p>
              <p className="text-[11px] text-red-300/80">
                Machine #{selectedEntry.machineNo || selectedEntry.machineNumber} • {selectedEntry.productName} (
                {selectedEntry.boxQuantity || selectedEntry.quantity} BOX)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-graphite-300">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incorrect box count reported or wrong shift"
                rows={3}
                className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-red-500 focus:outline-none"
              />
            </div>

            <button
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              onClick={() =>
                rejectMutation.mutate({ id: selectedEntry.id, reason: rejectReason })
              }
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        )}

        {selectedEntry && actionType === 'correct' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-graphite-300">Correct Box Quantity</label>
                <input
                  type="number"
                  value={correctedQty}
                  onChange={(e) => setCorrectedQty(Number(e.target.value))}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-sm text-graphite-100 font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-graphite-300">Waste Quantity</label>
                <input
                  type="number"
                  value={correctedWaste}
                  onChange={(e) => setCorrectedWaste(Number(e.target.value))}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-sm text-graphite-100 font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              disabled={correctMutation.isPending}
              onClick={() =>
                correctMutation.mutate({
                  id: selectedEntry.id,
                  quantity: correctedQty,
                  wasteQuantity: correctedWaste,
                })
              }
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              Save Corrections & Update
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
