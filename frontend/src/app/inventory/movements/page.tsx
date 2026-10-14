"use client"
import { useState, useEffect } from "react"
import { ReportsAPI, InventoryAPI, ExportAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, History, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Download, Filter, RotateCcw } from "lucide-react"

export default function MovementsPage() {
  const [data, setData] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  const [filters, setFilters] = useState({
    warehouseId: "",
    variant: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 25,
  })

  useEffect(() => {
    // Initial fetch warehouses
    InventoryAPI.getWarehouses()
      .then((res: any) => {
        const whs = Array.isArray(res) ? res : res.data || []
        setWarehouses(whs)
        
        // Auto default to active warehouse if set
        const activeWhJSON = localStorage.getItem("active_warehouse")
        if (activeWhJSON && activeWhJSON !== "null" && activeWhJSON !== "undefined") {
          try {
            const activeWh = JSON.parse(activeWhJSON)
            if (activeWh && activeWh.id) {
              setFilters(prev => ({ ...prev, warehouseId: activeWh.id }))
            }
          } catch(e) {}
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchMovements()
  }, [filters])

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const res = await ReportsAPI.getMovements(filters)
      const items = res?.data || res?.items || (Array.isArray(res) ? res : [])
      setData(Array.isArray(items) ? items : [])
      if (res?.totalCount !== undefined) {
        setTotalCount(res.totalCount)
      } else {
        setTotalCount(items.length)
      }
    } catch (e) {
      console.error("Gagal memuat pergerakan stok:", e)
    } finally {
      setLoading(false)
    }
  }

  const getSourceDescription = (refType: string, refId: string) => {
    switch (refType) {
      case 'TIMBER_PURCHASE':
        return { label: 'Pembelian Sawn Timber (Beli Masak)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' }
      case 'TIMBER_PURCHASE_REVERSAL':
        return { label: 'Pembatalan Pembelian Kayu', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' }
      case 'PRODUCTION_OUTPUT':
        return { label: 'Hasil Produksi Sawmill (Bongkaran)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400' }
      case 'PRODUCTION_PROCESS_OUTPUT':
        return { label: 'Hasil Pengeringan Oven (Chamber KD)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' }
      case 'PRODUCTION_PROCESS_INPUT':
        return { label: 'Bahan Masuk Oven (Chamber KD)', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400' }
      case 'PRODUCTION_PROCESS_REVERSAL':
        return { label: 'Pembatalan Batch KD (Reversal)', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' }
      case 'TIMBER_SHIPMENT':
        return { label: 'Pengiriman / Penjualan (Muat Fuso)', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400' }
      case 'TIMBER_SHIPMENT_REVERSAL':
        return { label: 'Pembatalan Muat Fuso', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' }
      case 'TRANSFER_IN':
        return { label: 'Transfer Masuk Gudang / Chamber', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400' }
      case 'TRANSFER_OUT':
        return { label: 'Transfer Keluar Gudang / Chamber', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' }
      case 'ADJUSTMENT_IN':
        return { label: 'Penyesuaian Stok (Tambah)', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400' }
      case 'ADJUSTMENT_OUT':
        return { label: 'Penyesuaian Stok (Kurang)', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' }
      case 'OPENING_BALANCE':
        return { label: 'Saldo Awal Stok Kayu', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400' }
      case 'STOCK_OPNAME_ADJUSTMENT':
        return { label: 'Penyesuaian Stock Opname', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400' }
      default:
        return { label: refType || 'Transaksi Stok', color: 'bg-muted text-muted-foreground' }
    }
  }

  const handleResetFilter = () => {
    setFilters({
      warehouseId: "",
      variant: "",
      type: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 25,
    })
  }

  const totalPages = Math.ceil(totalCount / filters.limit) || 1

  return (
    <div className="space-y-6 pb-12 px-4 md:px-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="w-7 h-7 text-primary" /> Pergerakan Stok Kayu
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Log mutasi keluar masuk stok (Stock Ledger) kayu jadi lengkap dengan asal dan keterangan transaksi.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const query = new URLSearchParams(filters as any).toString();
              window.open(ExportAPI.exportMovements(query), '_blank');
            }}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export XLSX
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Lokasi / Gudang</label>
              <select 
                value={filters.warehouseId} 
                onChange={e => setFilters({ ...filters, warehouseId: e.target.value, page: 1 })}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Semua Lokasi / Gudang</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name || w.code}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Cari SKU / Spesies</label>
              <Input 
                placeholder="cth: BKR, ULIN, MERANTI..." 
                className="h-9 text-xs"
                value={filters.variant}
                onChange={e => setFilters({ ...filters, variant: e.target.value, page: 1 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Arah Mutasi</label>
              <select 
                value={filters.type} 
                onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Semua Arah</option>
                <option value="IN">Masuk (IN)</option>
                <option value="OUT">Keluar (OUT)</option>
                <option value="ADJ">Penyesuaian (ADJ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Dari Tanggal</label>
              <Input 
                type="date" 
                className="h-9 text-xs"
                value={filters.dateFrom}
                onChange={e => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Sampai Tanggal</label>
              <div className="flex items-center gap-1.5">
                <Input 
                  type="date" 
                  className="h-9 text-xs"
                  value={filters.dateTo}
                  onChange={e => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleResetFilter} 
                  title="Reset Filter"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="py-3.5 px-4 md:px-6 border-b bg-muted/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Riwayat Transaksi Mutasi Stok
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            Total {totalCount} Catatan Transaksi
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2">
              <History className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm font-medium">Tidak ada data pergerakan stok yang cocok.</p>
              <p className="text-xs text-muted-foreground">Coba ubah tanggal atau pilih gudang lain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] md:min-w-full w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Tanggal & Waktu</th>
                    <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Gudang / Lokasi</th>
                    <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Produk / Varian Kayu</th>
                    <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Keterangan / Asal Transaksi</th>
                    <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Tipe</th>
                    <th className="py-3 px-4 text-right font-semibold text-emerald-600">Masuk (Pcs)</th>
                    <th className="py-3 px-4 text-right font-semibold text-rose-600">Keluar (Pcs)</th>
                    <th className="py-3 px-4 text-right font-semibold text-foreground">Vol (m³)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.map((m, i) => {
                    const isIn = m.type === 'IN' || (m.type === 'ADJ' && (m.quantityPcs || 0) > 0);
                    const isOut = m.type === 'OUT' || (m.type === 'ADJ' && (m.quantityPcs || 0) < 0);
                    const qty = Math.abs(m.quantityPcs || m.quantity || 0);
                    const vol = Number(m.volumeM3 || 0);
                    const v = m.timberStock?.timberVariant;
                    const loc = m.timberStock?.location;
                    const sourceInfo = getSourceDescription(m.referenceType, m.referenceId);

                    return (
                      <tr key={m.id || i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground font-mono">
                          {m.date ? new Date(m.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-foreground whitespace-nowrap">
                          {loc?.name || loc?.code || "-"}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-foreground">{v?.sku || m.timberStock?.timberVariantId || "-"}</div>
                          {v && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {v.species || "-"} &bull; Grade {v.grade || "-"} &bull; {v.thickness || 0}x{v.width || 0}x{v.length || 0} mm
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${sourceInfo.color}`}>
                            {sourceInfo.label}
                          </span>
                          {m.batch && m.batch !== 'UNKNOWN' && (
                            <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                              Batch: {m.batch}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isIn ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold gap-1 text-[11px]">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> IN
                            </span>
                          ) : isOut ? (
                            <span className="inline-flex items-center text-rose-600 font-bold gap-1 text-[11px]">
                              <ArrowUpRight className="w-3.5 h-3.5" /> OUT
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-muted-foreground font-medium text-[11px]">
                              <ArrowLeftRight className="w-3.5 h-3.5" /> ADJ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                          {isIn ? `+${qty}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 text-sm">
                          {isOut ? `-${qty}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
                          {vol > 0 ? `${vol.toFixed(4)} m³` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
          <span>Halaman {filters.page} dari {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              className="h-8 text-xs"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="h-8 text-xs"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
