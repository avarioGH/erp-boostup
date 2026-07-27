"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, ArrowDownToLine, ArrowUpFromLine, Download, Printer, Box } from "lucide-react"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

export default function InventoryReportPage() {
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  
  const [totalValue, setTotalValue] = useState(0)
  const [inboundVolume, setInboundVolume] = useState(0)
  const [outboundVolume, setOutboundVolume] = useState(0)
  
  const [movementData, setMovementData] = useState<any[]>([])
  const [warehouseStockData, setWarehouseStockData] = useState<any[]>([])

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

      let value = 0
      const whMap: Record<string, number> = {}

      stocksData.forEach((s: any) => {
        const qty = s.available_stock
        const price = Number(s.product?.purchase_price || 0)
        value += (qty * price)

        const whName = s.warehouse?.name || 'Unknown'
        whMap[whName] = (whMap[whName] || 0) + qty
      })

      setTotalValue(value)
      
      const whChartData = Object.keys(whMap).map(key => ({
        name: key,
        Stok: whMap[key]
      }))
      setWarehouseStockData(whChartData)

      let inbound = 0
      let outbound = 0
      const moveMap: Record<string, { in: number, out: number, dateStr: string }> = {}
      
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      last7Days.forEach(date => {
        moveMap[date] = { in: 0, out: 0, dateStr: date }
      })

      txData.forEach((tx: any) => {
        const dateStr = new Date(tx.transaction_date).toISOString().split('T')[0]
        const totalQty = tx.items?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0
        
        if (tx.transaction_type === 'IN' || tx.transaction_type === 'ADJUSTMENT_IN') {
          inbound += totalQty
          if(moveMap[dateStr]) moveMap[dateStr].in += totalQty
        }
        if (tx.transaction_type === 'OUT' || tx.transaction_type === 'ADJUSTMENT_OUT') {
          outbound += totalQty
          if(moveMap[dateStr]) moveMap[dateStr].out += totalQty
        }
      })

      setInboundVolume(inbound)
      setOutboundVolume(outbound)

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
    return <div className="py-20 text-center text-slate-500">Memuat laporan inventaris...</div>
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Inventaris</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Pergerakan stok, volume transaksi masuk, dan keluar.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md shadow-amber-200/50 dark:shadow-none bg-gradient-to-br from-amber-500 to-orange-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Box className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2 relative z-10 overflow-hidden">
            <CardDescription className="text-amber-100 font-medium tracking-wide uppercase text-xs">Total Valuasi Aset Stok</CardDescription>
            <CardTitle className="text-3xl font-bold truncate">{formatIDR(totalValue)}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-sm text-amber-100">Berdasarkan Harga Pokok Pembelian</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Volume Barang Masuk</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{inboundVolume.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">Unit</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Dalam periode berjalan</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500 transition-colors">
          <div className="absolute top-4 right-4 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <CardHeader className="pb-2 overflow-hidden">
            <CardDescription className="font-medium tracking-wide uppercase text-xs text-slate-500 truncate">Volume Barang Keluar</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{outboundVolume.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">Unit</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">Dalam periode berjalan</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Mutasi Stok per Hari</CardTitle>
            <CardDescription>Barang masuk vs barang keluar dalam 7 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Barang Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Barang Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Distribusi Kuantitas per Gudang</CardTitle>
            <CardDescription>Berdasarkan jumlah fisik unit barang yang tersedia.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseStockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Stok" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
