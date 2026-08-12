import { useState } from 'react'
import type { User, SalarySlip } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salaryService } from '@/services/firebase/salary.service'
import { wagesSlipService } from '@/services/firebase/wagesSlip.service'
import { usersService } from '@/services/firebase/users.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { DollarSign, FileText, CheckCircle2, Calculator, Settings2, Download } from 'lucide-react'

export default function Salaries() {
  const queryClient = useQueryClient()
  const [selectedOperator, setSelectedOperator] = useState<any>(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [slipPreview, setSlipPreview] = useState<any>(null)

  const { data: operators = [], isLoading: operatorsLoading } = useQuery({
    queryKey: ['operators-salary'],
    queryFn: () => usersService.getOperators(),
  })

  const { data: slips = [], isLoading: slipsLoading, error, refetch } = useQuery({
    queryKey: ['wages-slips-list'],
    queryFn: () => wagesSlipService.getAll(),
  })

  const generatePreviewMutation = useMutation({
    mutationFn: ({ operatorId, start, end }: { operatorId: string; start: string; end: string }) =>
      wagesSlipService.previewWagesSlip(operatorId, start, end),
    onSuccess: (data) => {
      setSlipPreview(data)
    },
  })

  const createSlipMutation = useMutation({
    mutationFn: (data: any) => wagesSlipService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages-slips-list'] })
      setSlipPreview(null)
      setSelectedOperator(null)
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => wagesSlipService.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages-slips-list'] })
    },
  })

  if (operatorsLoading || slipsLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Wages & Salaries..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Salaries & Wages</h2>
          <p className="text-xs text-graphite-400">Generate wage slips (Round-off values)</p>
        </div>

        <button
          onClick={() => setSelectedOperator(operators[0] || null)}
          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Calculator className="w-4 h-4" />
          Generate Slip
        </button>
      </div>

      {/* Generated Slips History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-graphite-400 uppercase tracking-wider px-1">
          Recent Wages Slips
        </h3>

        {slips.length === 0 ? (
          <EmptyState
            title="No Slips Generated"
            description="Tap 'Generate Slip' to calculate operator wages."
          />
        ) : (
          <div className="space-y-2.5">
            {slips.map((slip: SalarySlip) => (
              <div
                key={slip.id}
                className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-graphite-100">{slip.operatorName}</h4>
                    <p className="text-[10px] text-graphite-400">
                      Period: {slip.fromDate || slip.startDate} to {slip.toDate || slip.endDate}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      slip.status === 'PAID' || slip.status === 'paid'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    {slip.status || 'UNPAID'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-graphite-950/60 rounded-xl border border-graphite-850/50 text-center">
                  <div>
                    <span className="text-[10px] text-graphite-500 block">Total Boxes</span>
                    <span className="text-xs font-bold text-graphite-200 block">
                      {slip.totalBoxes || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-graphite-500 block">Gross Payable</span>
                    {/* ENFORCED ROUND-OFF VALUE RULE */}
                    <span className="text-xs font-extrabold text-emerald-400 block">
                      ₹{Math.round(slip.finalAmount || slip.grossAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-graphite-500 block">Round Off</span>
                    <span className="text-xs font-semibold text-graphite-300 block">
                      ₹{Math.round(slip.roundOff || 0)}
                    </span>
                  </div>
                </div>

                {slip.status !== 'PAID' && slip.status !== 'paid' && (
                  <button
                    disabled={markPaidMutation.isPending}
                    onClick={() => markPaidMutation.mutate(slip.id)}
                    className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/50 active:scale-95 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Salary Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Wages Slip Modal */}
      <BottomSheet
        isOpen={!!selectedOperator}
        onClose={() => {
          setSelectedOperator(null)
          setSlipPreview(null)
        }}
        title="Generate Wages Slip"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-graphite-300">Select Operator</label>
              <select
                value={selectedOperator?.uid || selectedOperator?.id || ''}
                onChange={(e) =>
                  setSelectedOperator(operators.find((op: User) => (op.uid || op.id) === e.target.value) || null)
                }
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
              >
                {operators.map((op: User) => (
                  <option key={op.uid || op.id} value={op.uid || op.id}>
                    {op.displayName || op.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-graphite-300">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-2.5 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-graphite-300">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-2.5 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            disabled={generatePreviewMutation.isPending || !selectedOperator}
            onClick={() =>
              generatePreviewMutation.mutate({
                operatorId: selectedOperator.id,
                start: startDate,
                end: endDate,
              })
            }
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            Calculate Earnings & Preview
          </button>

          {/* Slip Preview Calculation Result */}
          {slipPreview && (
            <div className="p-4 bg-graphite-950 rounded-2xl border border-brand-500/40 space-y-3 animate-fade-in">
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider text-center">
                Wages Slip Calculation Summary
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-graphite-400">Total Boxes</span>
                  <span className="font-bold text-graphite-100">{slipPreview.totalBoxes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-graphite-400">Calculated Earnings</span>
                  {/* ENFORCED ROUND OFF RULE */}
                  <span className="font-bold text-graphite-100">
                    ₹{Math.round(slipPreview.grossAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-graphite-800">
                  <span className="font-bold text-graphite-200">Net Payable Amount</span>
                  {/* ENFORCED ROUND OFF RULE */}
                  <span className="font-black text-emerald-400 text-sm">
                    ₹{Math.round(slipPreview.netPayable || slipPreview.grossAmount || 0)}
                  </span>
                </div>
              </div>

              <button
                disabled={createSlipMutation.isPending}
                onClick={() =>
                  createSlipMutation.mutate({
                    ...slipPreview,
                    grossAmount: Math.round(slipPreview.grossAmount || 0),
                    netPayable: Math.round(slipPreview.netPayable || slipPreview.grossAmount || 0),
                  })
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Confirm & Issue Wages Slip
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
