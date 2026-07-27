"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Users, Printer, Download } from "lucide-react"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

export default function SalesReportPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [averageOrderValue, setAverageOrderValue] = useState(0)
  
  // Charts
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/pos/history')
      const data = res.data
      setOrders(data)

      // Calculate KPI
      let rev = 0
      data.forEach((o: any) => {
        if(o.status === 'COMPLETED') rev += Number(o.total_amount)
      })
      setTotalRevenue(rev)
      setTotalOrders(data.filter((o:any) => o.status === 'COMPLETED').length)
      setAverageOrderValue(data.length ? (rev / data.filter((o:any) => o.status === 'COMPLETED').length) : 0)

      // Group by Date for Line Chart (Last 7 Days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const trendMap: Record<string, number> = {}
      last7Days.forEach(date => trendMap[date] = 0)

      data.forEach((o: any) => {
        if(o.status !== 'COMPLETED') return
        const dateStr = new Date(o.order_date).toISOString().split('T')[0]
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr] += Number(o.total_amount)
        }
      })

      setSalesTrend(Object.keys(trendMap).map(key => ({
        name: new Date(key).toLocaleDateString('id-ID', { weekday: 'short' }),
        'Pendapatan': trendMap[key]
      })))

      // Group Top Products
      const prodMap: Record<string, {name: string, qty: number}> = {}
      data.forEach((o: any) => {
        if(o.status !== 'COMPLETED') return
        o.items?.forEach((item: any) => {
          const prodName = item.product?.name || 'Unknown'
          if (!prodMap[prodName]) {
            prodMap[prodName] = { name: prodName, qty: 0 }
          }
          prodMap[prodName].qty += item.qty
        })
      })

      const sortedProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 5)
      setTopProducts(sortedProducts)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat laporan penjualan...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Penjualan</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Analisis performa pendapatan dan tren produk laris.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Printer className="w-4 h-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md shadow-blue-200/50 dark:shadow-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <DollarSign className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-blue-100 font-medium tracking-wide uppercase text-xs">Total Pendapatan (Kotor)</CardDescription>
            <CardTitle className="text-3xl font-bold truncate">{formatIDR(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-sm text-blue-100 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12.5% dari bulan lalu
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Transaksi Selesai</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{totalOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Order melalui sistem POS</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-violet-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
            <Users className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Rata-rata Nilai Order (AOV)</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{formatIDR(averageOrderValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Pembelanjaan rata-rata pelanggan</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Tren Pendapatan (7 Hari Terakhir)</CardTitle>
            <CardDescription>Grafik garis menunjukkan fluktuasi nilai penjualan harian.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10}
                    tickFormatter={(value) => `Rp${(value/1000000).toFixed(1)}M`}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [formatIDR(value), "Pendapatan"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="Pendapatan" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Top 5 Produk Terlaris</CardTitle>
            <CardDescription>Berdasarkan volume unit terjual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} name="Terjual (Unit)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
