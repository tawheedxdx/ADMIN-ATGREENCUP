import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { machinesService } from '@/services/firebase/machines.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, QrCode, Power, Edit3, Printer } from 'lucide-react'

export default function Machines() {
  const queryClient = useQueryClient()
  const [selectedQrMachine, setSelectedQrMachine] = useState<any>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<any>(null)
  
  const [form, setForm] = useState({
    name: '',
    machineNumber: '',
    type: 'Cup Former',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  })

  const { data: machines = [], isLoading, error, refetch } = useQuery({
    queryKey: ['machines-list'],
    queryFn: () => machinesService.getAll(),
  })

  const saveMachineMutation = useMutation({
    mutationFn: async (data: typeof form): Promise<void> => {
      if (editingMachine) {
        await machinesService.update(editingMachine.id, {
          name: data.name,
          machineNo: data.machineNumber,
          status: data.status,
        })
      } else {
        await machinesService.create({
          name: data.name,
          machineNo: data.machineNumber,
          status: data.status,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-list'] })
      setIsAddOpen(false)
      setEditingMachine(null)
      setForm({ name: '', machineNumber: '', type: 'Cup Former', status: 'active' })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'maintenance' | 'inactive' }) =>
      machinesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-list'] })
    },
  })

  const openEdit = (m: any) => {
    setEditingMachine(m)
    setForm({
      name: m.name || '',
      machineNumber: m.machineNo || m.machineNumber || '',
      type: m.type || 'Cup Former',
      status: m.status || 'active',
    })
    setIsAddOpen(true)
  }

  const handlePrintQR = () => {
    window.print()
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Factory Machines..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Factory Machines</h2>
          <p className="text-xs text-graphite-400">Manage production units & QR stickers</p>
        </div>

        <button
          onClick={() => {
            setEditingMachine(null)
            setForm({ name: '', machineNumber: '', type: 'Cup Former', status: 'active' })
            setIsAddOpen(true)
          }}
          className="py-2 px-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Machine
        </button>
      </div>

      {/* Machine Cards */}
      {machines.length === 0 ? (
        <EmptyState title="No Machines Registered" description="Add your first production machine." />
      ) : (
        <div className="space-y-3">
          {machines.map((m: any) => {
            const machineNo = m.machineNo || m.machineNumber || '—'
            return (
              <div
                key={m.id}
                className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/40 text-blue-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                      #{machineNo}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-graphite-100">{m.name || `Machine #${machineNo}`}</h3>
                      <p className="text-[11px] text-graphite-400">{m.type || 'Cup Production Unit'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(m)}
                      className="p-2 bg-graphite-800 hover:bg-graphite-700 text-graphite-300 hover:text-white rounded-xl transition-all"
                      title="Edit Machine"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedQrMachine(m)}
                      className="py-2 px-3 bg-graphite-800 hover:bg-graphite-700 active:scale-95 text-graphite-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <QrCode className="w-4 h-4 text-brand-400" />
                      QR Sticker
                    </button>
                  </div>
                </div>

                {/* Status & Maintenance Action */}
                <div className="flex items-center justify-between pt-2 border-t border-graphite-850/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        m.status === 'active'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                          : m.status === 'maintenance'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                          : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}
                    >
                      {m.status || 'Active'}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: m.id,
                        status: m.status === 'active' ? 'maintenance' : 'active',
                      })
                    }
                    className="text-[11px] text-graphite-400 hover:text-graphite-200 flex items-center gap-1 font-semibold"
                  >
                    <Power className="w-3.5 h-3.5" /> Toggle Maintenance
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Machine Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingMachine(null)
        }}
        title={editingMachine ? 'Edit Machine Unit' : 'Register Machine Unit'}
      >
        <div className="space-y-4">
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-graphite-300">Machine Number</label>
              <input
                type="text"
                value={form.machineNumber}
                onChange={(e) => setForm({ ...form, machineNumber: e.target.value })}
                placeholder="e.g. 01 or 12"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-graphite-300">Machine Alias Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. High Speed 210ml Former"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-graphite-300 block mb-1">Operational Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="active">Active / Running</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="inactive">Inactive / Standby</option>
              </select>
            </div>
          </div>

          <button
            disabled={saveMachineMutation.isPending || !form.machineNumber.trim()}
            onClick={() => saveMachineMutation.mutate(form)}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {editingMachine ? 'Update Machine Details' : 'Create Machine Unit'}
          </button>
        </div>
      </BottomSheet>

      {/* QR Code Sticker Viewer Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedQrMachine}
        onClose={() => setSelectedQrMachine(null)}
        title="Machine QR Sticker Badge"
      >
        {selectedQrMachine && (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-white rounded-3xl flex flex-col items-center justify-center space-y-3 mx-auto max-w-[260px] shadow-2xl border-4 border-brand-500">
              <span className="text-xs font-black text-emerald-700 tracking-widest uppercase">
                🌿 AT GREENCUP
              </span>
              <h3 className="text-3xl font-black text-gray-900">
                #{selectedQrMachine.machineNo || selectedQrMachine.machineNumber}
              </h3>
              <p className="text-[11px] font-bold text-gray-500 truncate max-w-full">
                {selectedQrMachine.name || 'Cup Production Unit'}
              </p>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <QRCodeSVG
                  value={JSON.stringify({
                    app: 'ATGREENCUP',
                    type: 'MACHINE_QR',
                    machineNo: selectedQrMachine.machineNo || selectedQrMachine.machineNumber,
                    machineId: selectedQrMachine.id,
                  })}
                  size={160}
                  level="H"
                />
              </div>

              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase">
                Scan to select machine
              </span>
            </div>

            <button
              onClick={handlePrintQR}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print QR Badge Sticker
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
