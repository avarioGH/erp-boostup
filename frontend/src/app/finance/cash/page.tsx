"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinanceAPI } from "@/lib/api"
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Download, 
  Filter, 
  Plus, 
  Minus, 
  Wallet, 
  Calendar,
  Layers,
  ArrowUpDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MutasiKasPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  // Filters
  const [periodPreset, setPeriodPreset] = useState<"today" | "week" | "month" | "year" | "custom" | "all">("month")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  // Set default start and end dates based on period preset
  useEffect(() => {
    const now = new Date()
    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    if (periodPreset === "today") {
      const todayStr = formatDate(now)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (periodPreset === "week") {
      const dayOfWeek = now.getDay()
      const diffToMonday = (dayOfWeek + 6) % 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - diffToMonday)
      setStartDate(formatDate(monday))
      setEndDate(formatDate(now))
    } else if (periodPreset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(formatDate(firstDay))
      setEndDate(formatDate(now))
    } else if (periodPreset === "year") {
      const firstJan = new Date(now.getFullYear(), 0, 1)
      setStartDate(formatDate(firstJan))
      setEndDate(formatDate(now))
    } else if (periodPreset === "all") {
      setStartDate("")
      setEndDate("")
    }
  }, [periodPreset])

  // Load transactions and categories
  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (typeFilter !== "ALL") params.type = typeFilter
      if (categoryFilter !== "ALL") params.categoryId = categoryFilter

      const [txRes, catRes] = await Promise.all([
        FinanceAPI.getTransactions(params),
        FinanceAPI.getCategories()
      ])

      setTransactions(Array.isArray(txRes) ? txRes : txRes?.data || [])
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || [])
    } catch (error) {
      console.error("Gagal memuat mutasi kas:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate, endDate, typeFilter, categoryFilter])

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value)
  }

  // Filter local search
  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const search = searchTerm.toLowerCase()
      const categoryName = tx.items?.[0]?.category?.name?.toLowerCase() || ""
      return (
        tx.description?.toLowerCase().includes(search) || 
        tx.transaction_no?.toLowerCase().includes(search) ||
        tx.reference_id?.toLowerCase().includes(search) ||
        categoryName.includes(search)
      )
    })
  }, [transactions, searchTerm])

  // Aggregate Totals
  const summary = useMemo(() => {
    let totalIn = 0
    let totalOut = 0

    filteredData.forEach(tx => {
      const val = Number(tx.total_amount) || 0
      const isIncome = tx.transaction_type === 'Income' || tx.transaction_type === 'Cash In'
      if (isIncome) {
        totalIn += val
      } else {
        totalOut += val
      }
    })

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut
    }
  }, [filteredData])

  // Export CSV
  const exportCSV = () => {
    if (filteredData.length === 0) return

    const headers = ["Tanggal", "No. Transaksi", "Kategori", "Deskripsi", "Tipe", "Pemasukan (IDR)", "Pengeluaran (IDR)"]
    const rows = filteredData.map(tx => {
      const isIncome = tx.transaction_type === 'Income' || tx.transaction_type === 'Cash In'
      const cat = tx.items?.[0]?.category?.name || "-"
      return [
        new Date(tx.transaction_date).toLocaleDateString("id-ID"),
        `"${tx.transaction_no}"`,
        `"${cat}"`,
        `"${(tx.description || "").replace(/"/g, '""')}"`,
        tx.transaction_type,
        isIncome ? tx.total_amount : 0,
        !isIncome ? tx.total_amount : 0
      ]
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Mutasi_Kas_${startDate || 'Semua'}_sd_${endDate || 'Kini'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" /> Buku Kas & Mutasi Arus Kas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pantau seluruh arus pemasukan (Income) dan pengeluaran (Outcome/Biaya) operasional secara transparan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/finance/cash-in">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Catat Pemasukan
            </Button>
          </Link>
          <Link href="/finance/cash-out">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm">
              <Minus className="w-4 h-4" /> Catat Pengeluaran
            </Button>
          </Link>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards: Inflow, Outflow, Net */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-emerald-500/5 border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Pemasukan (Income)</span>
              <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatIDR(summary.totalIn)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Total dana masuk dari penjualan & modal dalam periode terpilih
          </CardContent>
        </Card>

        <Card className="border-border bg-rose-500/5 border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Total Pengeluaran (Outcome)</span>
              <div className="p-2 bg-rose-500/10 rounded-full text-rose-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
              {formatIDR(summary.totalOut)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Beban gaji, listrik, beli ikan, dan operasional lainnya
          </CardContent>
        </Card>

        <Card className="border-border bg-blue-500/5 border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Arus Kas Bersih (Net Cash Flow)</span>
              <div className="p-2 bg-blue-500/10 rounded-full text-blue-600">
                <ArrowUpDown className="w-5 h-5" />
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold mt-1 ${summary.net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600'}`}>
              {formatIDR(summary.net)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Selisih arus kas bersih (Pemasukan dikurangi Pengeluaran)
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar: Presets, Custom Range, Type & Category */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Period Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Periode:
              </span>
              {[
                { id: "today", label: "Hari Ini" },
                { id: "week", label: "Minggu Ini" },
                { id: "month", label: "Bulan Ini" },
                { id: "year", label: "Tahun Ini" },
                { id: "custom", label: "Pilih Tanggal" },
                { id: "all", label: "Semua" },
              ].map((btn) => (
                <Button
                  key={btn.id}
                  type="button"
                  size="sm"
                  variant={periodPreset === btn.id ? "default" : "outline"}
                  className="h-8 text-xs font-medium"
                  onClick={() => setPeriodPreset(btn.id as any)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>

            {/* Local Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari referensi, biaya..."
                className="pl-8 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date Picker Range & Dropdown Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Dari Tanggal</label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={startDate}
                onChange={(e) => {
                  setPeriodPreset("custom")
                  setStartDate(e.target.value)
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Sampai Tanggal</label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={endDate}
                onChange={(e) => {
                  setPeriodPreset("custom")
                  setEndDate(e.target.value)
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Jenis Arus Kas</label>
              <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis (Masuk & Keluar)</SelectItem>
                  <SelectItem value="IN">Hanya Pemasukan (Income)</SelectItem>
                  <SelectItem value="OUT">Hanya Pengeluaran (Expense)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kategori Biaya / Akun</label>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "ALL")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Rincian Riwayat Transaksi</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Menampilkan {filteredData.length} transaksi kas yang sesuai dengan kriteria filter.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[850px]">
              <thead className="bg-muted/70 text-muted-foreground font-semibold text-xs border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan / Deskripsi</th>
                  <th className="px-4 py-3">Akun Kas</th>
                  <th className="px-4 py-3 text-right">Pemasukan (In)</th>
                  <th className="px-4 py-3 text-right">Pengeluaran (Out)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data mutasi kas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Filter className="w-8 h-8 text-muted-foreground/50 mb-1" />
                        <span className="font-medium text-sm">Tidak ada transaksi ditemukan</span>
                        <span className="text-xs">Coba sesuaikan filter tanggal atau tambahkan pengeluaran/pemasukan baru.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const isIncome = tx.transaction_type === 'Income' || tx.transaction_type === 'Cash In'
                    const categoryName = tx.items?.[0]?.category?.name || "Umum"
                    return (
                      <tr key={tx.id || idx} className="bg-card hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-medium">
                          {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                          {tx.transaction_no}
                          {tx.reference_type && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              Ref: {tx.reference_type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            isIncome 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          }`}>
                            {categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-normal max-w-xs truncate">
                          {tx.description || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {tx.cash_account?.name || "Kas Utama"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isIncome ? formatIDR(tx.total_amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {!isIncome ? formatIDR(tx.total_amount) : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-muted/50 font-bold border-t text-xs">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right uppercase tracking-wider text-muted-foreground">
                      Total ({filteredData.length} Transaksi) :
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatIDR(summary.totalIn)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatIDR(summary.totalOut)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
