import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/services/firebase/products.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Plus, Package, Edit3, Trash2, CheckCircle2, Power } from 'lucide-react'

export default function Products() {
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Paper Cups',
    defaultBoxSize: 2000,
    packetsPerBox: 40,
    pcsPerBox: 2000,
    ratePerBox: 0,
    status: 'active' as 'active' | 'inactive',
  })

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsService.getAll(),
  })

  const saveProductMutation = useMutation({
    mutationFn: async (data: typeof form): Promise<void> => {
      if (editingProduct) {
        await productsService.update(editingProduct.id, {
          name: data.name,
          code: data.code,
          category: data.category,
          defaultBoxSize: data.defaultBoxSize,
          packetsPerBox: data.packetsPerBox,
          pcsPerBox: data.pcsPerBox,
          ratePerBox: data.ratePerBox,
          status: data.status,
        })
      } else {
        await productsService.create({
          name: data.name,
          sku: data.code || data.name.toLowerCase().replace(/\s+/g, '-'),
          code: data.code,
          category: data.category,
          unit: 'BOX',
          status: data.status,
          defaultBoxSize: data.defaultBoxSize,
          packetsPerBox: data.packetsPerBox,
          pcsPerBox: data.pcsPerBox,
          ratePerBox: data.ratePerBox,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      setIsAddOpen(false)
      setEditingProduct(null)
      resetForm()
    },
  })

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      category: 'Paper Cups',
      defaultBoxSize: 2000,
      packetsPerBox: 40,
      pcsPerBox: 2000,
      ratePerBox: 0,
      status: 'active',
    })
  }

  const openEdit = (product: any) => {
    setEditingProduct(product)
    setForm({
      name: product.name || '',
      code: product.code || '',
      category: product.category || 'Paper Cups',
      defaultBoxSize: product.defaultBoxSize || 2000,
      packetsPerBox: product.packetsPerBox || 40,
      pcsPerBox: product.pcsPerBox || product.defaultBoxSize || 2000,
      ratePerBox: product.ratePerBox || 0,
      status: product.status || 'active',
    })
    setIsAddOpen(true)
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Loading Product Catalog..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Product Catalog</h2>
          <p className="text-xs text-graphite-400">Manage paper cup specifications & box rates</p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null)
            resetForm()
            setIsAddOpen(true)
          }}
          className="py-2 px-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Product Cards */}
      {products.length === 0 ? (
        <EmptyState title="Catalog Empty" description="Create your first cup product specification." />
      ) : (
        <div className="space-y-3">
          {products.map((p: any) => (
            <div
              key={p.id}
              className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/40 text-purple-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-graphite-100">{p.name}</h3>
                    <p className="text-[11px] text-graphite-400">Code: {p.code || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      p.status === 'inactive'
                        ? 'bg-red-950/80 text-red-400 border border-red-800/40'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {p.status || 'Active'}
                  </span>

                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 bg-graphite-800 hover:bg-graphite-700 text-graphite-300 hover:text-white rounded-lg transition-all"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-graphite-950/60 rounded-xl border border-graphite-850/50 text-center">
                <div>
                  <span className="text-[10px] text-graphite-500 block">Packets / Box</span>
                  <span className="text-xs font-bold text-graphite-200 block">
                    {p.packetsPerBox || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-graphite-500 block">PCS / Box</span>
                  <span className="text-xs font-bold text-graphite-200 block">
                    {p.pcsPerBox || p.defaultBoxSize || 2000}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-graphite-500 block">Rate / Box</span>
                  <span className="text-xs font-extrabold text-emerald-400 block">
                    {p.ratePerBox ? `₹${p.ratePerBox}` : '₹0'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingProduct(null)
        }}
        title={editingProduct ? 'Edit Product Specification' : 'New Product Catalog'}
      >
        <div className="space-y-4">
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-graphite-300">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 210ml Ripple Wall Cup"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-graphite-300">Item Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. GC-210-RW"
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-graphite-300">Rate / Box (₹)</label>
                <input
                  type="number"
                  value={form.ratePerBox}
                  onChange={(e) => setForm({ ...form, ratePerBox: Number(e.target.value) })}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-graphite-300">Packets per Box</label>
                <input
                  type="number"
                  value={form.packetsPerBox}
                  onChange={(e) => setForm({ ...form, packetsPerBox: Number(e.target.value) })}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-graphite-300">PCS per Box</label>
                <input
                  type="number"
                  value={form.pcsPerBox}
                  onChange={(e) => setForm({ ...form, pcsPerBox: Number(e.target.value), defaultBoxSize: Number(e.target.value) })}
                  className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-graphite-300 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="w-full bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-graphite-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            disabled={saveProductMutation.isPending || !form.name.trim()}
            onClick={() => saveProductMutation.mutate(form)}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {editingProduct ? 'Update Product Specification' : 'Save Product Specification'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
