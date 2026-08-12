import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { entriesService } from '@/services/firebase/entries.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { Download, TrendingUp, BarChart2, Calendar, FileSpreadsheet } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899']

export default function Reports() {
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'thisMonth'>('thisWeek')

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['reports-entries'],
    queryFn: () => entriesService.getAll(),
  })

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Compiling Analytics Reports..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  // Date filtering logic (This Week vs This Month)
  const now = new Date()
  const filteredEntries = entries.filter((e) => {
    if (e.status !== 'approved') return false
    const d = new Date(e.productionDate)
    if (timeRange === 'thisWeek') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      return d >= startOfWeek
    } else {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
  })

  // Aggregation by product
  const productStatsMap: Record<string, number> = {}
  filteredEntries.forEach((e) => {
    const key = e.productName || 'Unknown Product'
    const qty = e.boxQuantity || e.quantity || 0
    productStatsMap[key] = (productStatsMap[key] || 0) + qty
  })

  const pieData = Object.keys(productStatsMap).map((key) => ({
    name: key,
    value: productStatsMap[key],
  }))

  const totalBoxes = filteredEntries.reduce((sum, e) => sum + (e.boxQuantity || e.quantity || 0), 0)
  const totalWaste = filteredEntries.reduce((sum, e) => sum + (e.wasteQuantity || 0), 0)

  // Export CSV
  const exportCSV = () => {
    const headers = ['Production Date,Operator,Machine,Product,Quantity (Box),Waste (Pcs)\n']
    const rows = filteredEntries.map(
      (e) =>
        `"${e.productionDate}","${e.operatorName}","${e.machineNumber}","${e.productName}",${
          e.boxQuantity || e.quantity || 0
        },${e.wasteQuantity || 0}\n`
    )

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Production_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Production Reports</h2>
          <p className="text-xs text-graphite-400">Factory yield & CSV audit export</p>
        </div>

        <button
          onClick={exportCSV}
          className="py-2 px-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Strict Filter Tabs: ONLY KEEP 'This Week' AND 'This Month' */}
      <div className="flex items-center gap-2 p-1 bg-graphite-900 border border-graphite-800 rounded-xl">
        <button
          onClick={() => setTimeRange('thisWeek')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            timeRange === 'thisWeek'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-graphite-400 hover:text-graphite-200'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTimeRange('thisMonth')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            timeRange === 'thisMonth'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-graphite-400 hover:text-graphite-200'
          }`}
        >
          This Month
        </button>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">
            Total Boxes Output
          </span>
          <p className="text-2xl font-extrabold text-brand-400">{totalBoxes}</p>
          <p className="text-[10px] text-graphite-400">{filteredEntries.length} Approved Entries</p>
        </div>

        <div className="bg-graphite-900/90 border border-graphite-800 p-3.5 rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400">
            Total Waste (Pcs)
          </span>
          <p className="text-2xl font-extrabold text-red-400">{totalWaste}</p>
          <p className="text-[10px] text-graphite-400">Defect cups count</p>
        </div>
      </div>

      {/* Product Share Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-graphite-900/90 border border-graphite-800 p-4 rounded-2xl space-y-3 shadow-md">
          <h3 className="text-xs font-bold text-graphite-200 uppercase tracking-wider">
            Output Breakdown by Product
          </h3>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f0f6fc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-1">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-graphite-300 font-medium truncate max-w-[180px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-graphite-100">{item.value} BOX</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
