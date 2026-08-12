import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Clock, Layers, ShieldCheck } from 'lucide-react'

export default function UnitsShifts() {
  const { data: shifts = [], isLoading: shiftsLoading, error: shiftsError, refetch } = useQuery({
    queryKey: ['shifts-list'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'shifts'))
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    },
  })

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units-list'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'units'))
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    },
  })

  if (shiftsLoading || unitsLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Factory Schedules..." />
  }

  if (shiftsError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      <div>
        <h2 className="text-base font-extrabold text-graphite-100">Units & Shifts</h2>
        <p className="text-xs text-graphite-400">Production shift timings and measurement units</p>
      </div>

      {/* Shifts Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold text-graphite-300 uppercase tracking-wider">
            Active Work Shifts
          </h3>
        </div>

        {shifts.length === 0 ? (
          <div className="p-4 bg-graphite-900/60 border border-graphite-800 rounded-2xl text-xs text-graphite-400 text-center">
            Standard Day Shift (08:00 - 20:00) & Night Shift (20:00 - 08:00) configured by default.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {shifts.map((s: any) => (
              <div
                key={s.id}
                className="p-3.5 bg-graphite-900/90 border border-graphite-800 rounded-2xl flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="text-xs font-bold text-graphite-100">{s.name || s.shiftName}</h4>
                  <p className="text-[10px] text-graphite-400">
                    {s.startTime || '08:00'} - {s.endTime || '20:00'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-semibold">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Units Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-graphite-300 uppercase tracking-wider">
            Measurement Units
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 bg-graphite-900/90 border border-graphite-800 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="text-xs font-bold text-graphite-100 block">BOX</span>
            <span className="text-[10px] text-graphite-400 block">Primary Master Carton</span>
          </div>

          <div className="p-3.5 bg-graphite-900/90 border border-graphite-800 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="text-xs font-bold text-graphite-100 block">PCS</span>
            <span className="text-[10px] text-graphite-400 block">Individual Paper Cup</span>
          </div>
        </div>
      </div>
    </div>
  )
}
