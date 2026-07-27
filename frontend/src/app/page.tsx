"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  CreditCard, Users, Activity, ShoppingCart, AlertCircle, ArrowUpRight, ArrowDownRight, Award, AlertTriangle, RefreshCcw
} from "lucide-react"
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from "recharts"
import { DashboardAPI } from "@/lib/api"

const fallbackSalesData = [
  { date: "1 Jul", sales: 12500000, profit: 4500000 },
  { date: "5 Jul", sales: 15000000, profit: 5500000 },
  { date: "10 Jul", sales: 18000000, profit: 7000000 },
  { date: "15 Jul", sales: 14000000, profit: 5000000 },
  { date: "20 Jul", sales: 22000000, profit: 8500000 },
  { date: "25 Jul", sales: 19000000, profit: 6500000 },
  { date: "30 Jul", sales: 25000000, profit: 9500000 },
]

const fallbackExpenseData = [
  { name: "Minggu 1", income: 35000000, expense: 12000000 },
  { name: "Minggu 2", income: 42000000, expense: 15000000 },
  { name: "Minggu 3", income: 38000000, expense: 14000000 },
  { name: "Minggu 4", income: 50000000, expense: 18000000 },
]

export default function OwnerDashboard() {
  const [warehouse, setWarehouse] = useState("all")
  
  // Real DB States
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [kpi, setKpi] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setIsError(false)
        const data = await DashboardAPI.getKPIs('thisMonth', warehouse)
        setKpi(data)
      } catch (error) {
        console.error("Database connection failed:", error)
        setIsError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [warehouse])

  // Helper to format currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium">Menghubungkan ke Database Real...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Koneksi Database Terputus</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          Aplikasi gagal mengambil data real dari server PostgreSQL. Pastikan database Anda sedang berjalan di port 5432 dan backend NestJS aktif.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    )
  }

  // Use data strictly from API
  const displaySales = kpi?.chartData || [];
  const displayExpense = kpi?.chartData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau seluruh performa bisnis dan pergerakan aset Anda.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-sm font-medium text-slate-500 pl-2 hidden sm:inline-block">Filter Cabang:</span>
          <Select value={warehouse} onValueChange={(val) => setWarehouse(val as string)}>
            <SelectTrigger className="w-[180px] border-none bg-slate-50 dark:bg-slate-800 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Pilih Gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang (Global)</SelectItem>
              <SelectItem value="gudang_a">Gudang A (Pusat)</SelectItem>
              <SelectItem value="gudang_b">Gudang B (Cabang)</SelectItem>
              <SelectItem value="gudang_c">Gudang C (Retail)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI CARDS - ROW 1 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShoppingCart className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-indigo-100 font-medium tracking-wide uppercase text-xs truncate">Penjualan Hari Ini</CardDescription>
            <CardTitle className="text-3xl font-bold truncate" title={formatIDR(kpi?.currentRevenue || 0)}>{formatIDR(kpi?.currentRevenue || 0)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                <ArrowUpRight className="w-3 h-3" /> +14.5%
              </span>
              <span className="text-indigo-100 opacity-80">dari kemarin</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-emerald-100 font-medium tracking-wide uppercase text-xs truncate">Profit Bulan Ini</CardDescription>
            <CardTitle className="text-3xl font-bold truncate" title={formatIDR(kpi?.netProfit || 0)}>{formatIDR(kpi?.netProfit || 0)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                <ArrowUpRight className="w-3 h-3" /> +22.4%
              </span>
              <span className="text-emerald-100 opacity-80">dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Cash Flow</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatIDR(kpi?.cashPosition || 0)}>{formatIDR(kpi?.cashPosition || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3" /> +8.2%
              </span>
              <span className="text-slate-500">vs target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-amber-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Nilai Stok</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatIDR(kpi?.inventoryValue || 0)}>{formatIDR(kpi?.inventoryValue || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <ArrowDownRight className="w-3 h-3" /> -2.1%
              </span>
              <span className="text-slate-500">karena restock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS - ROW 2 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Tren Penjualan & Profit</CardTitle>
              <CardDescription>Grafik 30 hari terakhir</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displaySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888888' }}
                    tickFormatter={(value) => `Rp${value / 1000000}M`}
                    dx={-10}
                  />
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
                    formatter={(value: any) => [formatIDR(value as number), undefined]}
                  />
                  <Area type="monotone" dataKey="sales" name="Penjualan" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Cash Flow Mingguan</CardTitle>
            <CardDescription>Pemasukan vs Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayExpense} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={20}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888888' }}
                    tickFormatter={(value) => `Rp${value / 1000000}M`}
                    dx={-10}
                  />
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
                    formatter={(value: any) => [formatIDR(value as number), undefined]}
                    cursor={{fill: '#f1f5f9'}}
                  />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTS - ROW 3 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* Barang Terlaris */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Barang Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Kopi Arabica Premium 1Kg", qty: 245, revenue: 36750000 },
                { name: "Susu UHT Full Cream 1L", qty: 890, revenue: 17800000 },
                { name: "Sirup Caramel Monin", qty: 124, revenue: 14880000 },
                { name: "Gelas Kertas 8oz", qty: 3500, revenue: 5250000 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.qty} terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{formatIDR(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Barang Hampir Habis */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Biji Kopi Robusta", stock: 12, min: 20, loc: "Gudang A" },
                { name: "Cup Lid Sealer", stock: 5, min: 50, loc: "Gudang B" },
                { name: "Sedotan Ramah Lingkungan", stock: 80, min: 200, loc: "Gudang A" },
                { name: "Gula Aren Cair 1L", stock: 2, min: 10, loc: "Gudang C" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{item.loc}</span>
                      <span className="text-xs text-slate-500">Min: {item.min}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md">
                      Sisa {item.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customer / Aktivitas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:col-span-1 md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "PT. Maju Mundur", level: "Platinum", spent: 45200000 },
                { name: "Budi Santoso", level: "Gold", spent: 12400000 },
                { name: "Cafe Senja", level: "Gold", spent: 8900000 },
                { name: "CV. Abadi Jaya", level: "Silver", spent: 5500000 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</p>
                      <p className={`text-[10px] font-bold px-1.5 py-0.5 mt-0.5 rounded-md inline-block ${
                        item.level === 'Platinum' ? 'bg-slate-800 text-slate-100 dark:bg-slate-100 dark:text-slate-900' :
                        item.level === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{formatIDR(item.spent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* ACTIVITY TIMELINE - ROW 4 */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Aktivitas Sistem Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6 pb-2">
            {[
              { time: "Baru saja", title: "Transaksi POS Baru", desc: "Kasir 'Andi' memproses transaksi INV-202607-004 senilai Rp 150.000", color: "bg-emerald-500" },
              { time: "10 menit lalu", title: "Penerimaan Barang", desc: "Gudang A menerima 500 pcs 'Gelas Kertas 8oz' dari Supplier PT. Kemas Indo", color: "bg-blue-500" },
              { time: "1 jam lalu", title: "Transfer Kas", desc: "Admin mentransfer Rp 5.000.000 dari Kasir ke BCA Utama", color: "bg-indigo-500" },
              { time: "2 jam lalu", title: "Peringatan Stok", desc: "Stok 'Gula Aren Cair' di Gudang C menyentuh batas minimum (2 pcs)", color: "bg-rose-500" },
            ].map((act, i) => (
              <div key={i} className="relative pl-6">
                <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ${act.color} ring-4 ring-white dark:ring-slate-950`}></span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white">{act.title}</h4>
                  <span className="text-xs text-slate-500 font-medium">{act.time}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{act.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
