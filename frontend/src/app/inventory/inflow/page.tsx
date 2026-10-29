"use client"
import { useEffect, useState } from 'react'
import { InventoryAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { TablePagination } from '@/components/ui/table-pagination'

export default function InflowPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { toast } = useToast()

  const fetchTallies = async () => {
    try {
      setLoading(true)
      const res = await InventoryAPI.getStockInTallies()
      let fetchedData = res?.data || res || []
      
      // Filter by active warehouse if any
      const activeWarehouseJSON = localStorage.getItem("active_warehouse")
      if (activeWarehouseJSON && activeWarehouseJSON !== "null" && activeWarehouseJSON !== "undefined") {
        const activeWh = JSON.parse(activeWarehouseJSON)
        if (activeWh && activeWh.id) {
          fetchedData = fetchedData.filter((item: any) => item.warehouse_id === activeWh.id)
        }
      }
      
      setData(fetchedData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTallies()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data penerimaan ini? Stok akan otomatis dikurangi kembali.")) return;
    try {
      await InventoryAPI.deleteStockInTally(id)
      toast({ title: "Berhasil dihapus", description: "Stok telah dikurangi kembali." })
      fetchTallies()
    } catch(e) {
      toast({ title: "Gagal menghapus", variant: "destructive" })
    }
  }

  // Filter logic: Search + Date
  const filteredData = data.filter((item: any) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || 
      (item.tally_number || '').toLowerCase().includes(q) ||
      (item.warehouse?.name || '').toLowerCase().includes(q) ||
      (item.notes || '').toLowerCase().includes(q) ||
      (item.items || []).some((it: any) => (it.product?.name || '').toLowerCase().includes(q))

    const itemDate = item.tally_date ? new Date(item.tally_date).toISOString().split('T')[0] : ''
    let matchesDate = true
    if (startDate && itemDate < startDate) matchesDate = false
    if (endDate && itemDate > endDate) matchesDate = false

    return matchesSearch && matchesDate
  })

  // Calculate pagination
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleReset = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Input Ikan (Teli)</h1>
          <p className="text-muted-foreground mt-1">Riwayat penerimaan stok ikan harian.</p>
        </div>
        <Link href="/inventory/inflow/tambah">
          <Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Input Ikan Masuk</Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cari No. Teli, Gudang, atau Produk..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Dari:</span>
              <Input 
                type="date" 
                className="w-auto h-9 text-xs" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Sampai:</span>
              <Input 
                type="date" 
                className="w-auto h-9 text-xs" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            {(search || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0 flex flex-col min-h-[400px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Nomor Teli</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Tanggal</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Gudang</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Keterangan</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Rincian Ikan</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Memuat data...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Belum ada data penerimaan yang cocok.</td></tr>
                ) : (
                  paginatedData.map(item => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.tally_number}</td>
                      <td className="px-6 py-4">{new Date(item.tally_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4">{item.warehouse?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{item.notes || '-'}</td>
                      <td className="px-6 py-4">
                        {item.items && item.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {item.items.map((it: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {it.product?.name || 'Ikan'} <strong className="ml-1">x{it.qty}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!loading && filteredData.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              itemLabel="teli penerimaan"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
