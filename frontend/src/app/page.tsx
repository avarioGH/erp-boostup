"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { 
  TrendingUp, TrendingDown, Package, 
  CreditCard, Users, Activity, ShoppingCart, AlertCircle, ArrowUpRight, ArrowDownRight, Award, AlertTriangle, RefreshCcw, Minus, CheckCircle
} from "lucide-react"
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from "recharts"
import { DashboardAPI, InventoryAPI } from "@/lib/api"

// Helper function
const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "Baru saja"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} jam lalu`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} hari lalu`
}

export default function OwnerDashboard() {
  const [warehouse, setWarehouse] = useState("all")
  
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [kpi, setKpi] = useState<any>(null)
  
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [lowStocks, setLowStocks] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [whs, prods, txs] = await Promise.all([
          InventoryAPI.getWarehouses().catch(() => []),
          InventoryAPI.getProducts().catch(() => []),
          InventoryAPI.getTransactions().catch(() => [])
        ])
        setWarehouses(whs)
        
        // Low stocks calculation strictly from actual data
        const lows = prods.filter((p: any) => {
          const totalStock = p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0
          return totalStock < 20
        }).slice(0, 5).map((p: any) => ({
          name: p.name,
          stock: p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0,
          min: p.minimum_stock || 20,
          loc: p.warehouse_stocks?.[0]?.warehouse?.name || "Pusat"
        }))
        setLowStocks(lows)

        // Recent Activities strictly from actual transactions
        const acts = txs.slice(0, 5).map((tx: any) => {
          return {
            time: timeAgo(tx.transaction_date),
            title: tx.transaction_type === 'IN' ? 'Barang Masuk' : tx.transaction_type === 'OUT' ? 'Barang Keluar' : 'Transfer Gudang',
            desc: tx.notes || `Transaksi ${tx.reference_number}`,
            color: tx.transaction_type === 'IN' ? 'bg-success' : tx.transaction_type === 'OUT' ? 'bg-warning' : 'bg-primary'
          }
        })
        setRecentActivities(acts)
      } catch (e) {
        console.error(e)
      }
    }
    loadAuxData()
  }, [])

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

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  // Component to render percentage indicator properly based on real data
  const PercentageIndicator = ({ value, label, invertColors = false }: { value: number | undefined | null, label: string, invertColors?: boolean }) => {
    if (value === undefined || value === null || isNaN(value)) {
      return (
        <div className="flex items-center gap-2 text-sm mt-1">
          <span className="flex items-center gap-1 text-muted-foreground font-medium px-1.5 py-0.5 rounded-md bg-accent">
            <Minus className="w-3 h-3" /> —
          </span>
          <span className="text-muted-foreground text-xs">{label} (Data tidak cukup)</span>
        </div>
      )
    }

    const isPositive = value > 0;
    const isZero = value === 0;
    const isGood = invertColors ? !isPositive : isPositive;
    
    let colorClass = "text-muted-foreground bg-accent";
    let icon = <Minus className="w-3 h-3" />;
    
    if (!isZero) {
      colorClass = isGood ? "text-success bg-success/10" : "text-destructive bg-destructive/10";
      icon = isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />;
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
        <p className="text-muted-foreground font-medium text-sm">Menghubungkan ke Database Real...</p>
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
          Aplikasi gagal mengambil data real dari server PostgreSQL. Pastikan database Anda sedang berjalan.
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

  // Use data strictly from API (No hardcoded dummy arrays)
  const displaySales = kpi?.chartData?.sales || [];
  const displayExpense = kpi?.chartData?.cashflow || [];
  
  const hasSalesData = displaySales.length > 0 && displaySales.some((d: any) => d.sales > 0 || d.profit > 0);
  const hasCashflowData = displayExpense.length > 0 && displayExpense.some((d: any) => d.income > 0 || d.expense > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Bisnis</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pantau seluruh performa bisnis dan pergerakan aset Anda.</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-1.5 rounded-lg border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground pl-3 hidden sm:inline-block uppercase tracking-wider">Cabang:</span>
          <Select value={warehouse} onValueChange={(val) => setWarehouse(val as string)}>
            <SelectTrigger className="w-[180px] border-none bg-accent focus:ring-0 focus:ring-offset-0 h-8 text-sm font-medium">
              <SelectValue placeholder="Pilih Gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang (Global)</SelectItem>
              {warehouses?.map((wh, idx) => (
                <SelectItem key={wh?.id || idx} value={wh?.id || `wh-${idx}`}>{wh?.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI CARDS - ROW 1 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-primary/10 rounded-lg text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Penjualan Hari Ini</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1" title={formatIDR(kpi?.currentRevenue)}>{formatIDR(kpi?.currentRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={kpi?.comparison?.revenuePercentage} 
              label="dari kemarin" 
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-success/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-success/10 rounded-lg text-success">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Profit Bulan Ini</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1" title={formatIDR(kpi?.netProfit)}>{formatIDR(kpi?.netProfit)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={kpi?.comparison?.profitPercentage} 
              label="dari bulan lalu" 
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-info/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-info/10 rounded-lg text-info">
            <CreditCard className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Total Cash Flow</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1" title={formatIDR(kpi?.cashPosition)}>{formatIDR(kpi?.cashPosition)}</CardTitle>
          </CardHeader>
          <CardContent>
             <PercentageIndicator 
              value={kpi?.comparison?.cashFlowPercentage} 
              label="vs bulan lalu" 
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card relative overflow-hidden group hover:border-warning/50 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-warning/10 rounded-lg text-warning">
            <Package className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold tracking-wider uppercase text-[10px] text-muted-foreground truncate">Total Nilai Stok</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground truncate mt-1" title={formatIDR(kpi?.inventoryValue)}>{formatIDR(kpi?.inventoryValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <PercentageIndicator 
              value={kpi?.comparison?.inventoryPercentage} 
              label="vs bulan lalu" 
              invertColors={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* CHARTS - ROW 2 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div>
              <CardTitle className="text-base font-bold">Tren Penjualan & Profit</CardTitle>
              <CardDescription className="text-xs">Berdasarkan data transaksi aktual (30 hari)</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {!hasSalesData ? (
               <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                 <Activity className="w-8 h-8 mb-3 opacity-20" />
                 <p className="text-sm font-medium">Belum ada transaksi pada periode ini</p>
                 <p className="text-xs mt-1">Grafik akan muncul setelah transaksi tercatat.</p>
               </div>
            ) : (
              <div className="h-[300px] mt-6 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displaySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `Rp${value / 1000000}M`}
                      dx={-10}
                    />
                    <CartesianGrid vertical={false} stroke="currentColor" className="stroke-border/50" strokeDasharray="4 4" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                      formatter={(value: any) => [formatIDR(value as number), undefined]}
                      itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    <Area type="monotone" dataKey="sales" name="Penjualan" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div>
              <CardTitle className="text-base font-bold">Cash Flow Mingguan</CardTitle>
              <CardDescription className="text-xs">Pemasukan vs Pengeluaran aktual</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {!hasCashflowData ? (
               <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                 <CreditCard className="w-8 h-8 mb-3 opacity-20" />
                 <p className="text-sm font-medium">Belum ada arus kas tercatat</p>
               </div>
            ) : (
              <div className="h-[300px] mt-6 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayExpense} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={16}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `Rp${value / 1000000}M`}
                      dx={-10}
                    />
                    <CartesianGrid vertical={false} stroke="currentColor" className="stroke-border/50" strokeDasharray="4 4" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                      formatter={(value: any) => [formatIDR(value as number), undefined]}
                      cursor={{fill: 'var(--accent)'}}
                      itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    <Bar dataKey="income" name="Pemasukan" fill="var(--success)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LISTS - ROW 3 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* Barang Terlaris */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-[15px] font-bold flex items-center gap-2">
              <Award className="w-[18px] h-[18px] text-warning" /> Barang Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {(!kpi?.topProducts || kpi?.topProducts.length === 0) ? (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                   <Package className="w-6 h-6 opacity-20 mb-2" />
                   <p className="text-xs font-medium">Belum ada data penjualan.</p>
                </div>
              ) : (
                kpi.topProducts.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-semibold text-[13px] text-foreground">{item.name}</p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{item.qty} terjual</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[13px] text-foreground">{formatIDR(item.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Barang Hampir Habis */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-[15px] font-bold flex items-center gap-2">
              <AlertCircle className="w-[18px] h-[18px] text-destructive" /> Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-0 flex-1">
            {lowStocks.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                 <CheckCircle className="w-6 h-6 opacity-20 mb-2 text-success" />
                 <p className="text-xs font-medium">Stok aman, tidak ada barang menipis.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {lowStocks.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-semibold text-[13px] text-foreground">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">{item.loc}</span>
                        <span className="text-[11px] font-medium text-muted-foreground">Min: {item.min}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[12px] text-destructive bg-destructive/10 px-2.5 py-1 rounded-md">
                        Sisa {item.stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customer */}
        <Card className="border-border shadow-sm flex flex-col xl:col-span-1 md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-[15px] font-bold flex items-center gap-2">
              <Users className="w-[18px] h-[18px] text-primary" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {(!kpi?.topCustomers || kpi?.topCustomers.length === 0) ? (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                   <Users className="w-6 h-6 opacity-20 mb-2" />
                   <p className="text-xs font-medium">Belum ada data pelanggan.</p>
                </div>
              ) : (
                kpi.topCustomers.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-[13px] font-bold text-muted-foreground">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[13px] text-foreground">{item.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 mt-1 rounded border inline-block ${
                          item.level === 'Platinum' ? 'bg-foreground text-background border-foreground' :
                          item.level === 'Gold' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-accent text-muted-foreground border-border'
                        }`}>
                          {item.level || 'Regular'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[13px] text-foreground">{formatIDR(item.spent)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* ACTIVITY TIMELINE - ROW 4 */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-[15px] font-bold flex items-center gap-2">
            <Activity className="w-[18px] h-[18px] text-primary" /> Aktivitas Sistem Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {recentActivities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Belum ada aktivitas tercatat di sistem.</div>
          ) : (
            <div className="relative border-l-2 border-border ml-3 space-y-7">
              {recentActivities.map((act, i) => (
                <div key={i} className="relative pl-6">
                  <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${act.color} ring-[3px] ring-card`}></span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <h4 className="font-semibold text-[13px] text-foreground">{act.title}</h4>
                    <span className="text-[11px] text-muted-foreground font-medium">{act.time}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{act.desc}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
