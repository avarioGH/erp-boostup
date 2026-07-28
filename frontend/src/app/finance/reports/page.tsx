"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { 
  BarChart3, FileText, Download, Calendar, Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FinanceReports() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Keuangan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Unduh dan analisis performa keuangan perusahaan Anda secara komprehensif.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter Lanjutan
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Download className="w-4 h-4" /> Export Semua PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Laba Rugi */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle>Laporan Laba Rugi</CardTitle>
            <CardDescription>Profit & Loss Statement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Ringkasan total pendapatan, beban, dan laba bersih perusahaan dalam periode tertentu.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Bulan Ini
              </span>
              <Link href="/finance/reports/profit-loss">
                <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50">
                  Lihat Detail &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Arus Kas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Arus Kas (Cash Flow)</CardTitle>
            <CardDescription>Pergerakan dana masuk & keluar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Pantau likuiditas dan aktivitas mutasi kas utama serta kas operasional harian Anda.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Bulan Ini
              </span>
              <Link href="/finance/reports/cash-flow">
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50">
                  Lihat Detail &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Neraca */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Neraca Keuangan</CardTitle>
            <CardDescription>Balance Sheet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Posisi aktiva (aset), kewajiban (hutang), dan ekuitas (modal) perusahaan Anda.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tahun Ini
              </span>
              <Link href="/finance/reports/balance-sheet">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50">
                  Lihat Detail &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
