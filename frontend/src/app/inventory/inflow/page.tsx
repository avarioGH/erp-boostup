"use client"
import { useEffect, useState } from 'react'
import { InventoryAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function InflowPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTallies = async () => {
    try {
      const res = await InventoryAPI.getStockInTallies()
      setData(res?.data || res || [])
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Input Ikan (Teli)</h1>
          <p className="text-muted-foreground mt-1">Riwayat penerimaan stok ikan harian.</p>
        </div>
        <Link href="/inventory/inflow/create">
          <Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Input Ikan Masuk</Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Nomor Teli</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Tanggal</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Gudang</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Total Item</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada data penerimaan.</td></tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.tally_number}</td>
                      <td className="px-6 py-4">{new Date(item.tally_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4">{item.warehouse?.name || '-'}</td>
                      <td className="px-6 py-4">{item.items?.length || 0} Barang</td>
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
        </CardContent>
      </Card>
    </div>
  )
}
