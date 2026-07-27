"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowRightLeft, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"

export default function InventoryReports() {
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Stats
  const [totalValue, setTotalValue] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [movementData, setMovementData] = useState<any[]>([])
  const [warehouseData, setWarehouseData] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stocksRes, txRes] = await Promise.all([
        api.get('/inventory/stocks'),
        api.get('/inventory/transactions')
      ])
      
      const stocksData = stocksRes.data
      const txData = txRes.data
      
      setStocks(stocksData)
      setTransactions(txData)

      // Calculate Total Value & Items
      let value = 0
      let items = 0
      const lowStocks: any[] = []
      
      const whMap: Record<string, number> = {}

      stocksData.forEach((s: any) => {
        const qty = s.available_stock
        items += qty
        // Approximation: value based on selling price or purchase price. Assuming product is included.
        const price = Number(s.product?.purchase_price || 0)
        value += (qty * price)

        if (qty <= 5) { // Threshold for low stock
          lowStocks.push(s)
        }

        const whName = s.warehouse?.name || 'Unknown'
        whMap[whName] = (whMap[whName] || 0) + (qty * price)
      })

      setTotalValue(value)
      setTotalItems(items)
      setLowStockItems(lowStocks)

      // Format Warehouse Data for Pie Chart
      const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      const whChartData = Object.keys(whMap).map((key, i) => ({
        name: key,
        value: whMap[key],
        color: COLORS[i % COLORS.length]
      }))
      setWarehouseData(whChartData)

      // Process Transactions for Movement Chart (Last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const moveMap: Record<string, { in: number, out: number, dateStr: string }> = {}
      last7Days.forEach(date => {
        moveMap[date] = { in: 0, out: 0, dateStr: date }
      })

      txData.forEach((tx: any) => {
        const dateStr = new Date(tx.transaction_date).toISOString().split('T')[0]
        if (moveMap[dateStr]) {
          const totalQty = tx.items?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0
          if (tx.transaction_type === 'IN') moveMap[dateStr].in += totalQty
          if (tx.transaction_type === 'OUT') moveMap[dateStr].out += totalQty
          if (tx.transaction_type === 'TRANSFER') {
            moveMap[dateStr].in += totalQty
            moveMap[dateStr].out += totalQty
          }
        }
      })

      setMovementData(Object.values(moveMap).map(d => ({
        name: new Date(d.dateStr).toLocaleDateString('id-ID', { weekday: 'short' }),
        'Barang Masuk': d.in,
        'Barang Keluar': d.out
      })))

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-slate-500">Memuat laporan...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Stok & Analitik</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau nilai aset, pergerakan barang, dan peringatan stok kritis.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-indigo-500 to-blue-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Package className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-indigo-100 font-medium tracking-wide uppercase text-xs truncate">Total Nilai Inventaris</CardDescription>
            <CardTitle className="text-3xl font-bold truncate" title={formatIDR(totalValue)}>{formatIDR(totalValue)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-sm text-indigo-100 opacity-80">Valuasi berdasarkan harga pokok</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Kuantitas Fisik</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate">{totalItems.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">Unit</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Tersedia di seluruh gudang</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Peringatan Stok Menipis</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600 truncate">{lowStockItems.length} <span className="text-sm font-normal text-slate-500">SKU</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Butuh restock segera (&le; 5 unit)</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Transaksi (Bulan Ini)</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate">{transactions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Inbound, Outbound & Transfer</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Pergerakan Stok 7 Hari */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Volume Pergerakan Barang (7 Hari Terakhir)</CardTitle>
            <CardDescription>Grafik perbandingan jumlah barang masuk dan keluar per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Barang Masuk" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Barang Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Valuasi per Gudang */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Distribusi Nilai Aset</CardTitle>
            <CardDescription>Berdasarkan lokasi gudang</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouseData.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={warehouseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {warehouseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatIDR(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full flex flex-wrap justify-center gap-3 mt-2">
                  {warehouseData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                Belum ada data nilai aset
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <CardTitle>Peringatan Stok Menipis &le; 5 Unit</CardTitle>
          </div>
          <CardDescription>Segera lakukan pemesanan ulang (restock) untuk SKU berikut.</CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Produk</th>
                    <th className="px-4 py-3">Kode SKU</th>
                    <th className="px-4 py-3">Lokasi Gudang</th>
                    <th className="px-4 py-3 text-right">Sisa Stok</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.product?.code}</td>
                      <td className="px-4 py-3">{item.warehouse?.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{item.available_stock}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-md text-xs font-semibold">
                          Kritis
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
              <p>Semua stok aman. Tidak ada produk di bawah batas minimum.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
