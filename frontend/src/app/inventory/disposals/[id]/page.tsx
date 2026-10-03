"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { InventoryDisposalAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, CheckCircle, XCircle, Send, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function DisposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const id = params?.id as string

  const fetchDetail = () => {
    setLoading(true)
    InventoryDisposalAPI.getDisposal(id)
      .then((res: any) => setData(res))
      .catch((err: any) => toast({ title: "Error", description: "Failed to load detail", variant: "destructive" }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      if (action === 'submit') {
        await InventoryDisposalAPI.submitDisposal(id)
        toast({ title: "Success", description: "Disposal submitted for approval." })
      } else if (action === 'approve') {
        await InventoryDisposalAPI.approveDisposal(id)
        toast({ title: "Success", description: "Disposal approved." })
      } else if (action === 'reject') {
        await InventoryDisposalAPI.rejectDisposal(id)
        toast({ title: "Success", description: "Disposal rejected." })
      }
      fetchDetail()
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to perform action.", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan.</div>
  }

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/inventory/disposals">
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detail Pemusnahan {data.disposal_number || data.disposal_no || '-'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={data.status === 'APPROVED' ? 'default' : data.status === 'DRAFT' ? 'secondary' : data.status === 'PENDING' ? 'outline' : 'destructive'}>{data.status}</Badge>
              <span className="text-sm text-muted-foreground">{new Date(data.disposal_date || data.created_at).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {data.status === 'DRAFT' && (
            <>
              <Link href={`/inventory/disposals/${id}/edit`}>
                <Button variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
              </Link>
              <Button onClick={() => {
                  if(confirm('Hapus dokumen ini?')) {
                    InventoryDisposalAPI.deleteDisposal(id).then(() => {
                      toast({ title: "Success", description: "Disposal deleted." })
                      router.push('/inventory/disposals')
                    })
                  }
                }} disabled={actionLoading} variant="destructive" className="gap-2"><Trash2 className="w-4 h-4" /> Delete</Button>
              <Button onClick={() => handleAction('submit')} disabled={actionLoading} className="gap-2"><Send className="w-4 h-4" /> Submit</Button>
            </>
          )}
          {data.status === 'PENDING' && (
            <>
              <Button onClick={() => handleAction('reject')} disabled={actionLoading} variant="destructive" className="gap-2"><XCircle className="w-4 h-4" /> Tolak</Button>
              <Button onClick={() => handleAction('approve')} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 gap-2"><CheckCircle className="w-4 h-4" /> Setujui</Button>
            </>
          )}
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Gudang</p>
            <p className="font-medium">{data.warehouse?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Keterangan</p>
            <p className="font-medium">{data.notes || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border mt-6">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Barang Dimusnahkan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="p-4 text-left font-semibold">Produk</th>
                <th className="p-4 text-left font-semibold">Qty</th>
                <th className="p-4 text-left font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items?.length > 0 ? data.items.map((it: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-4">{it.product?.name || it.product_id}</td>
                  <td className="p-4">{it.qty || it.quantity}</td>
                  <td className="p-4 text-muted-foreground">{it.notes || '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Tidak ada barang</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
