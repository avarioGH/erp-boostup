"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check, FileText } from "lucide-react"
import { PurchasingAPI, api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function RFQPage() {
  const [rfqs, setRFQs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      setLoading(true)
      const res = await PurchasingAPI.getRFQs()
      setRFQs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmRFQ = async (id: string) => {
    try {
      await PurchasingAPI.confirmRFQ(id)
      alert("RFQ berhasil dikonfirmasi menjadi PO")
      fetchRFQs()
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal konfirmasi")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request for Quotation (RFQ)</h1>
          <p className="text-muted-foreground mt-1">Kelola permintaan penawaran ke vendor.</p>
        </div>
        <Button onClick={() => { /* normally route to create form */ }}><Plus className="w-4 h-4 mr-2" /> Buat RFQ</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar RFQ</CardTitle>
          <CardDescription>Menampilkan semua RFQ Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Nomor RFQ</th>
                  <th className="p-4 text-left font-medium">Vendor</th>
                  <th className="p-4 text-left font-medium">Tanggal</th>
                  <th className="p-4 text-left font-medium">Total</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-4 text-center">Memuat...</td></tr>
                ) : rfqs.filter(r => r.order_number.startsWith('RFQ')).length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center">Belum ada data RFQ.</td></tr>
                ) : rfqs.filter(r => r.order_number.startsWith('RFQ')).map((rfq) => (
                  <tr key={rfq.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-4 font-medium">{rfq.order_number}</td>
                    <td className="p-4">{rfq.supplier?.name}</td>
                    <td className="p-4">{new Date(rfq.order_date).toLocaleDateString()}</td>
                    <td className="p-4">Rp {rfq.total_amount.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={rfq.status === 'DRAFT' ? 'outline' : 'default'}>{rfq.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      {rfq.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => confirmRFQ(rfq.id)}>
                          <Check className="w-4 h-4 mr-2" /> Konfirmasi ke PO
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


