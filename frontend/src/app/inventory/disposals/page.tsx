"use client"
import { useState, useEffect } from "react"
import { InventoryDisposalAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DisposalsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    InventoryDisposalAPI.getDisposals()
      .then((res: any) => {
        setData(Array.isArray(res) ? res : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pemusnahan Stok</h1>
          <p className="text-muted-foreground mt-1">Daftar pemusnahan barang (deadstock / expired).</p>
        </div>
        <Link href="/inventory/disposals/create">
          <Button className="shadow-sm">Buat Pemusnahan</Button>
        </Link>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="p-4 border-b border-border/50 bg-muted/30">
          <CardTitle className="text-lg font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5" /> Riwayat Pemusnahan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="p-4 px-6 text-left font-semibold text-muted-foreground">No. Dokumen</th>
                  <th className="p-4 px-6 text-left font-semibold text-muted-foreground">Tanggal</th>
                  <th className="p-4 px-6 text-left font-semibold text-muted-foreground">Keterangan</th>
                  <th className="p-4 px-6 text-center font-semibold text-muted-foreground">Status</th>
                  <th className="p-4 px-6 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Tidak ada riwayat pemusnahan stok.</td></tr>
                ) : (
                  data.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 px-6 font-bold text-foreground">{item.disposal_number || item.disposal_no || '-'}</td>
                      <td className="p-4 px-6 text-foreground">{new Date(item.disposal_date || item.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 px-6 text-muted-foreground">{item.notes || '-'}</td>
                      <td className="p-4 px-6 text-center">
                        <Badge variant={item.status === 'APPROVED' ? 'default' : item.status === 'DRAFT' ? 'secondary' : item.status === 'PENDING' ? 'outline' : 'destructive'}>{item.status}</Badge>
                      </td>
                      <td className="p-4 px-6 text-center flex justify-center gap-2">
                        <Link href={`/inventory/disposals/${item.id}`}>
                          <Button variant="ghost" size="sm" title="Detail"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        {item.status === 'DRAFT' && (
                          <>
                            <Link href={`/inventory/disposals/${item.id}/edit`}>
                              <Button variant="ghost" size="sm" title="Edit"><Pencil className="w-4 h-4" /></Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500" title="Delete" onClick={() => {
                              if(confirm('Hapus dokumen ini?')) {
                                InventoryDisposalAPI.deleteDisposal(item.id).then(() => {
                                  window.location.reload();
                                })
                              }
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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
