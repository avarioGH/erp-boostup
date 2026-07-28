"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowDownRight, ArrowUpRight, Search, Activity, RefreshCcw, Package } from "lucide-react"
import { api } from "@/lib/api"

export default function MovementsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory/transactions')
      setTransactions(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTransactions = transactions.filter(t => 
    t.transaction_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'IN': return { icon: ArrowDownRight, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Masuk" }
      case 'OUT': return { icon: ArrowUpRight, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30", label: "Keluar" }
      case 'TRANSFER': return { icon: RefreshCcw, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Transfer" }
      case 'ADJUSTMENT': return { icon: Activity, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Penyesuaian" }
      default: return { icon: Package, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", label: type }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Riwayat Pergerakan Stok</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau semua barang masuk, keluar, transfer, dan penyesuaian di setiap gudang.</p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Daftar Transaksi Gudang</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Cari no referensi atau catatan..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat riwayat pergerakan stok...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              Belum ada riwayat pergerakan stok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Tipe & No. Ref</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Gudang</TableHead>
                    <TableHead>Detail Barang</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(t => {
                    const style = getTypeStyle(t.transaction_type)
                    const Icon = style.icon
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${style.bg}`}>
                              <Icon className={`w-5 h-5 ${style.color}`} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{style.label}</div>
                              <div className="text-xs text-slate-500">{t.transaction_no}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          }).format(new Date(t.transaction_date))}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{t.warehouse?.name || '-'}</div>
                          {t.target_warehouse && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <span>→</span> {t.target_warehouse.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {t.items?.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0 pb-1 last:pb-0">
                                <span className="truncate max-w-[200px]" title={item.product?.name}>
                                  {item.product?.name || 'Produk Dihapus'}
                                </span>
                                <span className="font-semibold whitespace-nowrap">
                                  {t.transaction_type === 'OUT' ? '-' : '+'}{item.qty} {item.product?.unit?.name || 'PCS'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-[200px] truncate" title={t.notes}>
                          {t.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
