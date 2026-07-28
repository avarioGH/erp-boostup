"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinanceAPI } from "@/lib/api"
import { ArrowLeft, Loader2, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await FinanceAPI.getProfitLossReport()
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/finance/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Laba Rugi</h1>
          <p className="text-slate-500 text-sm">Profit & Loss Statement berdasarkan transaksi dicatat</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Laba Rugi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pendapatan */}
            <div>
              <h3 className="font-semibold text-lg text-emerald-600 dark:text-emerald-400 border-b pb-2 mb-3">Pendapatan (Revenue)</h3>
              <div className="space-y-2">
                {data?.revenue?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="font-medium">{formatIDR(item.amount)}</span>
                  </div>
                ))}
                {data?.revenue?.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada transaksi pendapatan.</p>}
              </div>
              <div className="flex justify-between font-bold mt-4 pt-2 border-t text-emerald-700 dark:text-emerald-500">
                <span>Total Pendapatan</span>
                <span>{formatIDR(data?.totalRevenue || 0)}</span>
              </div>
            </div>

            {/* Beban */}
            <div>
              <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 border-b pb-2 mb-3">Beban (Expenses)</h3>
              <div className="space-y-2">
                {data?.expenses?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="font-medium">{formatIDR(item.amount)}</span>
                  </div>
                ))}
                {data?.expenses?.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada transaksi pengeluaran.</p>}
              </div>
              <div className="flex justify-between font-bold mt-4 pt-2 border-t text-red-700 dark:text-red-500">
                <span>Total Beban</span>
                <span>{formatIDR(data?.totalExpenses || 0)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`p-4 rounded-xl flex justify-between items-center text-xl font-bold ${
              (data?.netProfit || 0) >= 0 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              <span>Laba / Rugi Bersih (Net Profit)</span>
              <span>{formatIDR(data?.netProfit || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
