import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { entriesService } from '@/services/firebase/entries.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ImageModal } from '@/components/ui/ImageModal'
import { Search, Image as ImageIcon, Eye, CheckCircle2, XCircle, Clock, Download, RefreshCw } from 'lucide-react'

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

export default function ProductionEntries() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'corrected'>('all')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['production-entries'],
    queryFn: () => entriesService.getAll(),
  })

  const filteredEntries = useMemo(() => {
    return entries.filter((entry: any) => {
      const q = searchTerm.toLowerCase()
      const machineStr = (entry.machineNo || entry.machineNumber || '').toString().toLowerCase()
      const matchesSearch =
        entry.operatorName?.toLowerCase().includes(q) ||
        machineStr.includes(q) ||
        entry.productName?.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [entries, searchTerm, statusFilter])

  const handleExportCSV = () => {
    const headers = [
      'Operator',
      'Machine',
      'Product',
      'BOX Qty',
      'PCS Qty',
      'Waste Qty',
      'Date',
      'Status',
      'Submitted At'
    ]
    const rows = filteredEntries.map((e: any) => [
      `"${e.operatorName || ''}"`,
      `"${e.machineNo || e.machineNumber || ''}"`,
      `"${e.productName || ''}"`,
      e.boxQuantity !== undefined ? e.boxQuantity : e.quantity || 0,
      e.pcs !== undefined ? e.pcs : e.quantity2 || 0,
      e.wasteQuantity || 0,
      `"${e.productionDate || ''}"`,
      `"${e.status || ''}"`,
      `"${safeFormatDate(e.submittedAt || e.createdAt)}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `production-entries-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Production Logs..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Production History</h2>
          <p className="text-xs text-graphite-400">View and audit all submitted production logs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 bg-graphite-900 border border-graphite-800 rounded-xl text-graphite-300 hover:text-white active:scale-95 transition-all"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 bg-graphite-800 hover:bg-graphite-700 active:scale-95 text-brand-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-graphite-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by operator, machine #, product..."
            className="w-full bg-graphite-900 border border-graphite-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-graphite-100 placeholder-graphite-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'approved', 'pending', 'rejected', 'corrected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-graphite-900 text-graphite-400 border border-graphite-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No Logs Found"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry: any) => {
            const machineDisplay = entry.machineNo || entry.machineNumber || '—'
            const boxCount = entry.boxQuantity !== undefined ? entry.boxQuantity : (entry.quantity || 0)
            const pcsCount = entry.pcs !== undefined ? entry.pcs : (entry.quantity2 || 0)

            return (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="p-3.5 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-2.5 shadow-sm cursor-pointer active:scale-[0.99] transition-all hover:border-graphite-700"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-graphite-100">{entry.operatorName}</h3>
                    <p className="text-[10px] text-graphite-400">
                      Machine #{machineDisplay} • {entry.productionDate} {entry.shiftName ? `(${entry.shiftName})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {entry.status === 'approved' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {entry.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {entry.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/40">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                    {entry.status === 'corrected' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/40">
                        Corrected
                      </span>
                    )}
                  </div>
                </div>

                {/* Content: Thumbnail & Specs */}
                <div className="flex items-center gap-3">
                  {entry.imageUrl ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setImagePreview(entry.imageUrl)
                      }}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-graphite-700 shrink-0 relative group"
                    >
                      <img src={entry.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-graphite-950 border border-graphite-850 flex items-center justify-center text-graphite-600 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex items-center justify-between text-xs">
                    <span className="font-semibold text-graphite-200 truncate pr-2">
                      {entry.productName}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-brand-400 block">
                        {boxCount} BOX
                      </span>
                      {pcsCount > 0 && (
                        <span className="text-[10px] text-graphite-400 block">
                          {pcsCount} PCS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Entry Specification Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Entry Detailed Specification"
      >
        {selectedEntry && (
          <div className="space-y-4">
            {/* Proof Photo */}
            {selectedEntry.imageUrl ? (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-graphite-400 uppercase tracking-wider">
                  Submission Proof Photo
                </span>
                <button
                  onClick={() => setImagePreview(selectedEntry.imageUrl)}
                  className="w-full h-44 rounded-2xl overflow-hidden border border-graphite-700 relative block group"
                >
                  <img
                    src={selectedEntry.imageUrl}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" /> Tap to expand photo
                  </div>
                </button>
              </div>
            ) : null}

            {/* Spec Details Table */}
            <div className="p-3.5 bg-graphite-950 rounded-2xl border border-graphite-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Operator</span>
                <span className="font-bold text-graphite-100">{selectedEntry.operatorName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Machine Unit</span>
                <span className="font-bold text-graphite-100">
                  #{selectedEntry.machineNo || selectedEntry.machineNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Product Name</span>
                <span className="font-bold text-brand-400">{selectedEntry.productName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">BOX Quantity</span>
                <span className="font-extrabold text-emerald-400">
                  {selectedEntry.boxQuantity !== undefined ? selectedEntry.boxQuantity : selectedEntry.quantity} BOX
                </span>
              </div>

              {selectedEntry.totalPackets !== undefined && selectedEntry.counting !== undefined && (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">Packet Calculation</span>
                  <span className="font-semibold text-graphite-200">
                    {selectedEntry.totalPackets} pkts × {selectedEntry.counting} per pkt
                  </span>
                </div>
              )}

              {selectedEntry.pcs !== undefined && (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">PCS Quantity</span>
                  <span className="font-semibold text-graphite-200">{selectedEntry.pcs} PCS</span>
                </div>
              )}

              {selectedEntry.wasteQuantity ? (
                <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                  <span className="text-graphite-400">Waste Quantity</span>
                  <span className="font-bold text-red-400">
                    {selectedEntry.wasteQuantity} {selectedEntry.wasteUnit || 'PCS'}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Production Date</span>
                <span className="font-bold text-graphite-200">{selectedEntry.productionDate}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-graphite-850">
                <span className="text-graphite-400">Submitted Timestamp</span>
                <span className="font-medium text-graphite-300">
                  {safeFormatDate(selectedEntry.submittedAt || selectedEntry.createdAt)}
                </span>
              </div>

              {selectedEntry.approvedBy && (
                <div className="pt-2 border-t border-graphite-850 text-[11px] text-emerald-400">
                  <span className="font-bold block">Approved By</span>
                  <p>{selectedEntry.approvedBy} {selectedEntry.approvedAt ? `at ${safeFormatDate(selectedEntry.approvedAt)}` : ''}</p>
                </div>
              )}

              {selectedEntry.rejectedBy && (
                <div className="pt-2 border-t border-graphite-850 text-[11px] text-red-400">
                  <span className="font-bold block font-bold">Rejected By</span>
                  <p>{selectedEntry.rejectedBy}: {selectedEntry.rejectionReason || 'No reason provided'}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedEntry.notes && (
              <div className="p-3 bg-graphite-900 rounded-xl border border-graphite-800 text-xs">
                <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider block mb-1">
                  Operator Remarks / Notes
                </span>
                <p className="text-graphite-200">{selectedEntry.notes}</p>
              </div>
            )}
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
