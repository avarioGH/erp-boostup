"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { 
  TrendingUp, TrendingDown, DollarSign, 
  CreditCard, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw, AlertTriangle, Plus, Minus
} from "lucide-react"
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from "recharts"
import { api } from "@/lib/api"
import Link from "next/link"

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setIsError(false)
        
        // Fetch Summary
        const summaryRes = await api.get('/finance/summary')
        setSummary(summaryRes.data)
        
        // Fetch Transactions
        const txRes = await api.get('/finance/transactions')
        setTransactions(txRes.data)
      } catch (error) {
        console.error("Database connection failed:", error)
        setIsError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
        <p className="text-slate-500 font-medium">Menghubungkan ke Database Keuangan...</p>
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
          Gagal mengambil data keuangan real. Pastikan backend Anda aktif.
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

  // Use data strictly from DB
  const displayCashFlow = summary?.chartData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Finance Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau arus kas, laba rugi, dan transaksi keuangan perusahaan.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/finance/cash-out" className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors font-medium text-sm">
            <Minus className="w-4 h-4" /> Catat Pengeluaran
          </Link>
          <Link href="/finance/cash-in" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm shadow-sm shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Catat Pemasukan
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <DollarSign className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-blue-100 font-medium tracking-wide uppercase text-xs truncate">Total Saldo Kas & Bank</CardDescription>
            <CardTitle className="text-3xl font-bold truncate" title={formatIDR(summary?.totalCash || 0)}>{formatIDR(summary?.totalCash || 0)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                <Activity className="w-3 h-3" /> Liquid
              </span>
              <span className="text-blue-100 opacity-80">Siap digunakan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Pemasukan (Bulan Ini)</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatIDR(summary?.totalIncomeMtd || 0)}>{formatIDR(summary?.totalIncomeMtd || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3" /> +12.5%
              </span>
              <span className="text-slate-500">vs bulan lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-rose-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Pengeluaran (Bulan Ini)</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatIDR(summary?.totalExpensesMtd || 0)}>{formatIDR(summary?.totalExpensesMtd || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <ArrowDownRight className="w-3 h-3" /> -5.2%
              </span>
              <span className="text-slate-500">vs bulan lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CreditCard className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-emerald-100 font-medium tracking-wide uppercase text-xs truncate">Laba Bersih (Bulan Ini)</CardDescription>
            <CardTitle className="text-3xl font-bold truncate" title={formatIDR((summary?.totalIncomeMtd || 0) - (summary?.totalExpensesMtd || 0))}>{formatIDR((summary?.totalIncomeMtd || 0) - (summary?.totalExpensesMtd || 0))}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                <Activity className="w-3 h-3" /> Sehat
              </span>
              <span className="text-emerald-100 opacity-80">Profit margin 57%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS & TRANSACTIONS */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Arus Kas (Pemasukan vs Pengeluaran)</CardTitle>
            <CardDescription>Perbandingan cash-in dan cash-out bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayCashFlow} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888888' }}
                    tickFormatter={(value) => `Rp${value / 1000000}M`}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatIDR(value as number), undefined]}
                  />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>Aktivitas keuangan terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.transaction_type === 'Income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {tx.transaction_type === 'Income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.description || tx.transaction_no}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.transaction_date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className={`font-semibold text-sm ${tx.transaction_type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {tx.transaction_type === 'Income' ? '+' : '-'}{formatIDR(tx.total_amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">Belum ada transaksi bulan ini.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
