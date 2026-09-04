"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PurchasingAPI, api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

function ReceiptContent() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const poId = searchParams.get('po')

  useEffect(() => {
    fetchReceipts()
    if (poId) {
      // Typically pop up a modal to receive goods for this PO. 
      // For now we'll just show the list.
    }
  }, [poId])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const res = await PurchasingAPI.getReceipts()
      setReceipts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Penerimaan Barang (Goods Receipt)</h1>
          <p className="text-muted-foreground mt-1">Daftar barang yang diterima dari vendor.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Goods Receipt</CardTitle>
          <CardDescription>Barang yang masuk menambah stok gudang.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Nomor Receipt</th>
                  <th className="p-4 text-left font-medium">Referensi PO</th>
                  <th className="p-4 text-left font-medium">Vendor</th>
                  <th className="p-4 text-left font-medium">Tanggal</th>
                  <th className="p-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Memuat...</td></tr>
                ) : receipts.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">Belum ada data Receipt.</td></tr>
                ) : receipts.map((gr) => (
                  <tr key={gr.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-4 font-medium">{gr.receipt_number}</td>
                    <td className="p-4">{gr.purchase_order?.order_number}</td>
                    <td className="p-4">{gr.supplier?.name}</td>
                    <td className="p-4">{new Date(gr.receipt_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge variant="default">{gr.status}</Badge>
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

export default function GoodsReceiptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  )
}


