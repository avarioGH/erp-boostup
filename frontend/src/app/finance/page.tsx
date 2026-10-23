"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCcw, AlertTriangle, Plus, Minus,
  Layers, ChevronRight, Package, Users, Zap, Truck, ShoppingBag, Receipt
} from "lucide-react"
import { 
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  PieChart, Pie, Cell
} from "recharts"
import { FinanceAPI } from "@/lib/api"

const CATEGORY_COLORS = [
  "#f43f5e", "#0ea5e9", "#f59e0b", "#10b981", 
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"
]

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
        
        const [summaryRes, txRes] = await Promise.all([
          FinanceAPI.getSummary(),
          FinanceAPI.getTransactions({ type: 'ALL' })
        ])
        
        setSummary(summaryRes?.data || summaryRes || null)
        setTransactions(Array.isArray(txRes) ? txRes : txRes?.data || [])
      } catch (error) {
        console.error("Database connection failed:", error)
        setIsError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  const PercentageIndicator = ({ 
    value, 
    label, 
    invertColors = false 
  }: { 
    value: number | undefined | null, 
    label: string, 
    invertColors?: boolean 
  }) => {
    if (value === undefined || value === null || isNaN(value)) {
      return (
        <div className="flex items-center gap-2 text-sm mt-1">
          <span className="flex items-center gap-1 text-muted-foreground font-medium px-1.5 py-0.5 rounded-md bg-accent text-xs">
            <Minus className="w-3 h-3" /> —
          </span>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
      )
    }

    const isPositive = value > 0
    const isZero = value === 0
    const isGood = invertColors ? !isPositive : isPositive
    
    let colorClass = "text-muted-foreground bg-accent"
    let icon = <Minus className="w-3 h-3" />
    
    if (!isZero) {
      colorClass = isGood ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400" : "text-rose-700 bg-rose-500/10 dark:text-rose-400"
      icon = isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />
    }

    return (
      <div className="flex items-center gap-2 text-sm mt-1">
        <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${colorClass}`}>
          {icon} {Math.abs(value).toFixed(1)}%
        </span>
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Menghubungkan ke Database Keuangan...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Koneksi Database Terputus</h2>
        <p className="text-muted-foreground max-w-md mb-8 text-sm">
          Gagal mengambil data keuangan real. Pastikan server backend Anda aktif.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    )
  }

  const displayCashFlow = summary?.chartData || []
  const hasCashflowData = displayCashFlow.length > 0 && displayCashFlow.some((d: any) => d.income > 0 || d.expenses > 0)
  const netProfit = (summary?.totalIncomeMtd || 0) - (summary?.totalExpensesMtd || 0)
  const expenseCategories = summary?.expenseCategories || []
  const totalExpenseBreakdown = expenseCategories.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Keuangan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pantau arus kas, laba rugi, dan rincian alokasi pengeluaran operasional perusahaan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link 
            href="/finance/expense" 
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground px-3.5 py-2 rounded-md border text-xs font-medium transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-primary" /> Rincian Pengeluaran
          </Link>
          <Link 
            href="/finance/cash-out" 
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-md transition-colors font-medium text-xs shadow-sm"
          >
            <Minus className="w-3.5 h-3.5" /> Catat Pengeluaran
          </Link>
          <Link 
            href="/finance/cash-in" 
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md transition-colors font-medium text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Catat Pemasukan
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-info/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-info/10 rounded-lg text-info">
            <DollarSign className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Saldo Kas & Bank</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{formatIDR(summary?.totalCash)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-info font-medium text-xs bg-info/10 px-2 py-0.5 rounded flex items-center gap-1"><Activity className="w-3 h-3"/> Liquid</span>
              <span className="text-muted-foreground text-xs">Siap digunakan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-success/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-success/10 rounded-lg text-success">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Pemasukan (Bulan Ini)</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1">{formatIDR(summary?.totalIncomeMtd)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={summary?.incomeGrowth} 
              label="vs bulan lalu" 
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-rose-500/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-rose-500/10 rounded-lg text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Pengeluaran (Bulan Ini)</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600 dark:text-rose-400 truncate mt-1">{formatIDR(summary?.totalExpensesMtd)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={summary?.expensesGrowth} 
              label="vs bulan lalu" 
              invertColors={true}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-primary/10 rounded-lg text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Laba Bersih (Bulan Ini)</CardDescription>
            <CardTitle className={`text-2xl font-bold truncate mt-1 ${netProfit >= 0 ? 'text-primary' : 'text-rose-600'}`}>{formatIDR(netProfit)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={summary?.profitGrowth} 
              label="vs bulan lalu" 
            />
          </CardContent>
        </Card>
      </div>

      {/* RINCIAN PENGELUARAN TIAP KOTAK (EXPENSE BREAKDOWN BY CATEGORY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" /> Rincian Alokasi Pengeluaran (Uang Kemana Saja)
            </h2>
            <p className="text-xs text-muted-foreground">
              Rincian biaya operasional bulan ini terbagi berdasarkan kategori (bahan kemasan, jasa komisi, gaji, suplier, dll).
            </p>
          </div>
          <Link href="/finance/expense" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
            Lihat Tabel & Master Data Kategori <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {expenseCategories.length === 0 ? (
          <Card className="border-border bg-card/50 p-6 text-center text-muted-foreground">
            <p className="text-xs">Belum ada pengeluaran yang dicatat bulan ini.</p>
            <Link href="/finance/cash-out" className="inline-block mt-2">
              <span className="text-xs text-primary font-medium hover:underline">+ Catat Pengeluaran Sekarang</span>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {expenseCategories.map((cat: any, idx: number) => {
              const percentage = totalExpenseBreakdown > 0 ? (cat.amount / totalExpenseBreakdown) * 100 : 0
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
              return (
                <Card 
                  key={cat.categoryId || idx} 
                  className="border-border shadow-none bg-card hover:border-primary/40 transition-all overflow-hidden border-t-2"
                  style={{ borderTopColor: color }}
                >
                  <CardHeader className="p-3.5 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[170px]" title={cat.categoryName}>
                        {cat.categoryName}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground mt-1">
                      {formatIDR(cat.amount)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full transition-all" 
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {cat.count} transaksi biaya tercatat
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* POS KAS KEUANGAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Pos Saldo Kas & Bank
            </h2>
            <p className="text-xs text-muted-foreground">
              Pos saldo riil kasir, kas operasional, kas pembelian ikan, dan rekening bank.
            </p>
          </div>
          <Link href="/finance/cash" className="text-xs text-primary hover:underline font-medium">
            Buku Kas (Mutasi) &rarr;
          </Link>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {(summary?.cashAccounts || []).map((acc: any) => (
            <Card key={acc.id} className="border-border shadow-none bg-card/60 hover:bg-card transition-all">
              <CardHeader className="p-3 pb-1">
                <CardDescription className="text-[11px] font-medium text-muted-foreground truncate">{acc.name}</CardDescription>
                <CardTitle className="text-base font-bold text-foreground mt-0.5">{formatIDR(acc.current_balance)}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                  {acc.code}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CHARTS & RECENT TRANSACTIONS */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base font-bold">Tren Arus Kas (Pemasukan vs Pengeluaran)</CardTitle>
            <CardDescription className="text-xs">Perbandingan cash-in dan cash-out harian selama 30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {!hasCashflowData ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada transaksi arus kas</p>
              </div>
            ) : (
              <div className="h-[280px] mt-6 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayCashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={14}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                      dx={-10}
                    />
                    <CartesianGrid vertical={false} stroke="currentColor" className="stroke-border/50" strokeDasharray="4 4" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                      formatter={(value: any) => [formatIDR(value as number), undefined]}
                      cursor={{fill: 'var(--accent)'}}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    <Bar dataKey="income" name="Pemasukan (In)" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Pengeluaran (Out)" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECENT TRANSACTIONS */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Transaksi Terakhir</CardTitle>
              <CardDescription className="text-xs">Aktivitas keuangan terbaru</CardDescription>
            </div>
            <Link href="/finance/cash" className="text-xs text-primary hover:underline font-medium">
              Semua &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {(!transactions || transactions.length === 0) ? (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                  <CreditCard className="w-6 h-6 opacity-20 mb-2" />
                  <p className="text-xs font-medium">Belum ada transaksi bulan ini.</p>
                </div>
              ) : (
                transactions.slice(0, 7).map((tx, i) => {
                  const isIncome = tx.transaction_type === 'Income' || tx.transaction_type === 'Cash In'
                  const catName = tx.items?.[0]?.category?.name || "Umum"
                  return (
                    <div key={tx.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="max-w-[150px] sm:max-w-[180px] truncate">
                          <p className="font-semibold text-xs text-foreground truncate">{tx.description || tx.transaction_no}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID')} &bull; {catName}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold text-xs whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{formatIDR(tx.total_amount)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
