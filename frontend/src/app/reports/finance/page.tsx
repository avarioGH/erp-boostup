"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingDown, TrendingUp, DollarSign, Download, Printer, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function FinanceReportPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  
  const [cashFlowData, setCashFlowData] = useState<any[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/finance/transactions')
      const data = res.data
      setTransactions(data)

      let income = 0
      let expense = 0
      const expenseMap: Record<string, number> = {}

      // Group by Date for Area Chart
      const last14Days = [...Array(14)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (13 - i))
        return d.toISOString().split('T')[0]
      })

      const flowMap: Record<string, { income: number, expense: number, name: string }> = {}
      last14Days.forEach(date => flowMap[date] = { income: 0, expense: 0, name: date })

      data.forEach((t: any) => {
        if(t.status !== 'COMPLETED') return
        const amount = Number(t.total_amount)
        
        if (t.transaction_type === 'Income') {
          income += amount
        } else if (t.transaction_type === 'Expense') {
          expense += amount
          const cat = t.category?.name || 'Lainnya'
          expenseMap[cat] = (expenseMap[cat] || 0) + amount
        }

        const dateStr = new Date(t.transaction_date).toISOString().split('T')[0]
        if (flowMap[dateStr]) {
          if (t.transaction_type === 'Income') flowMap[dateStr].income += amount
          if (t.transaction_type === 'Expense') flowMap[dateStr].expense += amount
        }
      })

      setTotalIncome(income)
      setTotalExpense(expense)
      setNetProfit(income - expense)

      setCashFlowData(Object.values(flowMap).map(d => ({
        name: new Date(d.name).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        Pemasukan: d.income,
        Pengeluaran: d.expense
      })))

      const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16']
      const catData = Object.keys(expenseMap)
        .sort((a,b) => expenseMap[b] - expenseMap[a])
        .slice(0, 5)
        .map((key, i) => ({
          name: key,
          value: expenseMap[key],
          color: COLORS[i % COLORS.length]
        }))
      setExpenseByCategory(catData)

    } catch (err) {
      console.error("No finance data found or api error", err)
      // Fallback zero state
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat laporan keuangan...</div>
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Keuangan</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Laba Rugi (Profit & Loss) dan Arus Kas perusahaan.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Printer className="w-4 h-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Pemasukan</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{formatIDR(totalIncome)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-emerald-500 font-medium">+15.2% vs bulan lalu</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Total Pengeluaran</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{formatIDR(totalExpense)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-rose-500 font-medium">+5.1% vs bulan lalu</div>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md relative overflow-hidden text-white ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/50' : 'bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-200/50'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-white/80 font-medium tracking-wide uppercase text-xs">Laba Bersih (Net Profit)</CardDescription>
            <CardTitle className="text-3xl font-bold truncate">{formatIDR(Math.abs(netProfit))}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-sm text-white/90 font-medium">
              {netProfit >= 0 ? 'Profit / Untung' : 'Loss / Rugi'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Arus Kas (Cash Flow) - 14 Hari</CardTitle>
            <CardDescription>Perbandingan Pemasukan vs Pengeluaran Harian.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10}
                    tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}M`}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => formatIDR(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Pemasukan" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Distribusi Pengeluaran</CardTitle>
            <CardDescription>Berdasarkan kategori biaya operasi.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatIDR(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full flex flex-col gap-2 mt-2 px-4">
                  {expenseByCategory.slice(0,3).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatIDR(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                Belum ada data pengeluaran
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
