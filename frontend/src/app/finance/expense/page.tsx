"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog"
import { 
  Plus, Minus, Search, Filter, Download, ArrowLeft, Layers, 
  Settings, Trash2, Edit2, Wallet, Calendar, AlertCircle, CheckCircle2, TrendingDown,
  Tag, RefreshCw
} from "lucide-react"
import { FinanceAPI } from "@/lib/api"
import { formatThousands, parseThousands } from "@/lib/utils"

const CATEGORY_COLORS = [
  "#f43f5e", "#0ea5e9", "#f59e0b", "#10b981", 
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"
]

export default function DetailedExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  // Date and Category Filters
  const [periodPreset, setPeriodPreset] = useState<"today" | "week" | "month" | "year" | "custom" | "all">("month")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  // Modal Category Management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState("EXPENSE")
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const [catError, setCatError] = useState("")

  // Quick Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    categoryId: "",
    description: "",
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  })
  const [savingExpense, setSavingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState("")
  const [expenseSuccess, setExpenseSuccess] = useState("")

  // Initialize dates based on preset
  useEffect(() => {
    const now = new Date()
    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    if (periodPreset === "today") {
      const today = formatDate(now)
      setStartDate(today)
      setEndDate(today)
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

  const loadData = async () => {
    try {
      setLoading(true)
      const params: any = { type: 'OUT' }
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedCategory !== "ALL") params.categoryId = selectedCategory

      const [txRes, catRes] = await Promise.all([
        FinanceAPI.getTransactions(params),
        FinanceAPI.getCategories()
      ])

      setTransactions(Array.isArray(txRes) ? txRes : txRes?.data || [])
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || [])
    } catch (err) {
      console.error("Gagal memuat data pengeluaran:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate, selectedCategory])

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  // Filtered expense data
  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const search = searchTerm.toLowerCase()
      const catName = tx.items?.[0]?.category?.name?.toLowerCase() || ""
      return (
        tx.description?.toLowerCase().includes(search) ||
        tx.transaction_no?.toLowerCase().includes(search) ||
        catName.includes(search)
      )
    })
  }, [transactions, searchTerm])

  // Total and breakdown by category
  const { totalExpense, breakdownByCategory } = useMemo(() => {
    let total = 0
    const map = new Map<string, { categoryId: string; name: string; amount: number; count: number }>()

    filteredData.forEach(tx => {
      const val = Number(tx.total_amount) || 0
      total += val
      const catName = tx.items?.[0]?.category?.name || "Pengeluaran Lain-lain"
      const catId = tx.items?.[0]?.category_id || "uncategorized"

      const existing = map.get(catName) || { categoryId: catId, name: catName, amount: 0, count: 0 }
      existing.amount += val
      existing.count += 1
      map.set(catName, existing)
    })

    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount)
    return { totalExpense: total, breakdownByCategory: list }
  }, [filteredData])

  // Save new or edited category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSavingCategory(true)
    setCatError("")
    try {
      if (editingCategory) {
        await FinanceAPI.updateCategory(editingCategory.id, {
          name: newCatName,
          type: newCatType
        })
      } else {
        await FinanceAPI.createCategory({
          name: newCatName,
          type: newCatType
        })
      }
      setNewCatName("")
      setEditingCategory(null)
      const catRes = await FinanceAPI.getCategories()
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || [])
    } catch (err: any) {
      setCatError(err?.response?.data?.message || "Gagal menyimpan kategori")
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini? Transaksi yang sudah tercatat tidak akan terhapus.")) return
    try {
      await FinanceAPI.deleteCategory(id)
      const catRes = await FinanceAPI.getCategories()
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || [])
    } catch (err) {
      console.error(err)
      alert("Gagal menghapus kategori.")
    }
  }

  // Save Expense Quick Modal
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingExpense(true)
    setExpenseError("")
    setExpenseSuccess("")
    try {
      const payload = {
        amount: Number(expenseForm.amount.replace(/[^0-9.-]+/g, "")),
        categoryId: expenseForm.categoryId,
        description: expenseForm.description,
        transactionDate: expenseForm.date
      }
      await FinanceAPI.createExpense(payload)
      setExpenseSuccess("Pengeluaran berhasil disimpan!")
      setExpenseForm({
        amount: "",
        categoryId: "",
        description: "",
        date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
      })
      loadData()
      setTimeout(() => {
        setIsExpenseModalOpen(false)
        setExpenseSuccess("")
      }, 1200)
    } catch (err: any) {
      setExpenseError(err?.response?.data?.message || "Gagal mencatat pengeluaran.")
    } finally {
      setSavingExpense(false)
    }
  }

  // Export CSV
  const exportCSV = () => {
    if (filteredData.length === 0) return

    const headers = ["Tanggal", "No. Transaksi", "Kategori Biaya", "Keterangan", "Nominal (IDR)"]
    const rows = filteredData.map(tx => [
      new Date(tx.transaction_date).toLocaleDateString("id-ID"),
      `"${tx.transaction_no}"`,
      `"${tx.items?.[0]?.category?.name || '-'}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.total_amount
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Rincian_Pengeluaran_${startDate || 'Semua'}_sd_${endDate || 'Kini'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/finance">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-6 h-6 text-rose-600" /> Rincian Pengeluaran Operasional
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm pl-10">
            Lacak arus keluar uang kas secara detail (plastik, lakban, upah harian/komisi jasa, gaji bulanan, suplier ikan, dll).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCategoryModalOpen(true)}
            className="gap-2 text-xs h-9"
          >
            <Settings className="w-4 h-4 text-muted-foreground" /> Master Data Kategori
          </Button>
          <Button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2 text-xs h-9 shadow-sm"
          >
            <Minus className="w-4 h-4" /> Catat Pengeluaran Baru
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2 text-xs h-9">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI TOTAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-rose-500/5 border-l-4 border-l-rose-500 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Total Seluruh Pengeluaran (Outcome)
              </span>
              <div className="p-2 bg-rose-500/10 rounded-full text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-rose-700 dark:text-rose-400 mt-1">
              {formatIDR(totalExpense)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground flex items-center justify-between">
            <span>Terakumulasi dari {filteredData.length} transaksi pada periode terpilih</span>
            <span className="font-semibold text-foreground">{breakdownByCategory.length} Kategori Aktif</span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm flex flex-col justify-center p-4">
          <span className="text-xs font-medium text-muted-foreground">Kategori Terbesar Periode Ini</span>
          {breakdownByCategory.length > 0 ? (
            <div className="mt-2">
              <p className="text-base font-bold text-foreground truncate" title={breakdownByCategory[0].name}>
                {breakdownByCategory[0].name}
              </p>
              <p className="text-lg font-bold text-rose-600 mt-0.5">
                {formatIDR(breakdownByCategory[0].amount)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {((breakdownByCategory[0].amount / totalExpense) * 100).toFixed(1)}% dari total pengeluaran
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 italic">Belum ada transaksi</p>
          )}
        </Card>
      </div>

      {/* BREAKDOWN TIAP KOTAK KATEGORI (UANG KEMANA SAJA) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" /> Rincian Alokasi Dana Tiap Kategori
            </h2>
            <p className="text-xs text-muted-foreground">
              Klik pada salah satu kotak untuk memfilter transaksi rincian di bawah ini.
            </p>
          </div>
          {selectedCategory !== "ALL" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCategory("ALL")}
              className="text-xs h-7 text-primary hover:underline"
            >
              Reset Filter Kategori (&times; Tampilkan Semua)
            </Button>
          )}
        </div>

        {breakdownByCategory.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <p className="text-sm font-medium">Tidak ada rincian pengeluaran pada periode ini</p>
            <p className="text-xs mt-1">Gunakan tombol "Catat Pengeluaran Baru" untuk menambahkan transaksi operasional.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {breakdownByCategory.map((cat, idx) => {
              const percentage = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
              const isSelected = selectedCategory === cat.categoryId
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]

              return (
                <div
                  key={cat.categoryId || idx}
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : cat.categoryId)}
                  className={`cursor-pointer rounded-xl border p-4 bg-card transition-all hover:shadow-md relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-rose-500 shadow-md border-rose-500' : 'border-border hover:border-border/80'
                  }`}
                  style={{ borderTop: `4px solid ${color}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground line-clamp-1" title={cat.name}>
                      {cat.name}
                    </span>
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${color}18`, color: color }}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-lg font-extrabold text-foreground mt-2">
                    {formatIDR(cat.amount)}
                  </p>

                  <div className="w-full bg-muted rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div 
                      className="h-1.5 rounded-full transition-all" 
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60">
                    <span>{cat.count} transaksi</span>
                    <span className="text-primary font-medium text-[10px] hover:underline">
                      {isSelected ? "Filter Aktif ✓" : "Pilih Kategori →"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FILTER BAR: PRESETS, DATES, CATEGORY SELECTOR */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari deskripsi, no transaksi..."
                className="pl-8 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
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
              <label className="text-[11px] font-medium text-muted-foreground">Filter Kategori Biaya</label>
              <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "ALL")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {categories.filter(c => c.type === 'EXPENSE').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DETAILED TRANSACTIONS TABLE */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Tabel Riwayat Pengeluaran Real</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Menampilkan {filteredData.length} transaksi pengeluaran sesuai filter yang ditentukan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[780px]">
              <thead className="bg-muted/70 text-muted-foreground font-semibold text-xs border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Deskripsi / Perincian Biaya</th>
                  <th className="px-4 py-3">Akun Kas</th>
                  <th className="px-4 py-3 text-right">Nominal (Outcome)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Memuat rincian pengeluaran...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Layers className="w-8 h-8 text-muted-foreground/40 mb-1" />
                        <span className="font-medium text-sm">Tidak ada transaksi ditemukan</span>
                        <span className="text-xs">Coba sesuaikan filter tanggal atau catat pengeluaran baru.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const catName = tx.items?.[0]?.category?.name || "Pengeluaran Umum"
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            {catName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-normal max-w-sm">
                          {tx.description || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {tx.cash_account?.name || "Kas Utama"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatIDR(tx.total_amount)}
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
                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatIDR(totalExpense)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: MASTER DATA KATEGORI */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Master Data Kategori Keuangan
            </DialogTitle>
            <DialogDescription>
              Tambah, edit, atau hapus kategori untuk mengelompokkan pengeluaran (plastik, upah harian, komisi, gaji, dll).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2 border-t">
            {catError && (
              <div className="p-3 text-xs bg-rose-500/10 text-rose-600 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {catError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Nama Kategori</Label>
                <Input
                  placeholder="Misal: Lakban & Plastik Packing, Upah Borongan"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipe</Label>
                <Select value={newCatType} onValueChange={(val) => setNewCatType(val || "EXPENSE")}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Pengeluaran (Expense)</SelectItem>
                    <SelectItem value="INCOME">Pemasukan (Income)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingCategory && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null)
                    setNewCatName("")
                  }}
                  className="text-xs"
                >
                  Batal Edit
                </Button>
              )}
              <Button type="submit" size="sm" className="text-xs" disabled={savingCategory}>
                {savingCategory ? "Menyimpan..." : (editingCategory ? "Simpan Perubahan" : "+ Tambah Kategori")}
              </Button>
            </div>
          </form>

          {/* DAFTAR KATEGORI EXIST */}
          <div className="mt-4 pt-4 border-t space-y-2 max-h-60 overflow-y-auto">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Daftar Kategori Saat Ini ({categories.length})
            </h4>
            <div className="divide-y divide-border/60">
              {categories.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs hover:bg-muted/30 px-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.type === 'EXPENSE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({c.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingCategory(c)
                        setNewCatName(c.name)
                        setNewCatType(c.type)
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-rose-500 hover:text-rose-700"
                      onClick={() => handleDeleteCategory(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: QUICK CATAT PENGELUARAN */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Minus className="w-5 h-5" /> Catat Pengeluaran Cepat
            </DialogTitle>
            <DialogDescription>
              Masukkan rincian dana yang dikeluarkan untuk operasional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExpense} className="space-y-4 pt-2">
            {expenseSuccess && (
              <div className="p-3 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {expenseSuccess}
              </div>
            )}
            {expenseError && (
              <div className="p-3 text-xs bg-rose-500/10 text-rose-600 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {expenseError}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Nominal Pengeluaran (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatThousands(expenseForm.amount)}
                  onChange={(e) => {
                    const val = parseThousands(e.target.value);
                    setExpenseForm({ ...expenseForm, amount: val > 0 ? String(val) : "" });
                  }}
                  className="pl-10 h-9 text-base font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Kategori Biaya</Label>
              <Select 
                value={expenseForm.categoryId} 
                onValueChange={(val) => setExpenseForm({ ...expenseForm, categoryId: val || "" })}
                required
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Kategori (Plastik, Gaji, dll)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === 'EXPENSE').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tanggal Transaksi</Label>
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Keterangan / Rincian Belanja</Label>
              <Input
                placeholder="Misal: Beli lakban 5 roll & plastik vacum 10 pak"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsExpenseModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={savingExpense}>
                {savingExpense ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
