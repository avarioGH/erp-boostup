"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, FileText } from "lucide-react"
import { PurchasingAPI, VendorAPI, api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await PurchasingAPI.getRFQs()
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createVendorBill = async (poId: string) => {
    try {
      await VendorAPI.createVendorBill(poId)
      alert("Vendor Bill (AP) berhasil dibuat")
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal membuat bill")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Daftar pesanan pembelian yang sudah dikonfirmasi.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar PO</CardTitle>
          <CardDescription>Status penerimaan dan tagihan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Nomor PO</th>
                  <th className="p-4 text-left font-medium">Vendor</th>
                  <th className="p-4 text-left font-medium">Total</th>
                  <th className="p-4 text-left font-medium">Status Receipt</th>
                  <th className="p-4 text-left font-medium">Status Bill</th>
                  <th className="p-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-4 text-center">Memuat...</td></tr>
                ) : orders.filter(r => r.order_number.startsWith('PO')).length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center">Belum ada data PO.</td></tr>
                ) : orders.filter(r => r.order_number.startsWith('PO')).map((po) => (
                  <tr key={po.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-4 font-medium">{po.order_number}</td>
                    <td className="p-4">{po.supplier?.name}</td>
                    <td className="p-4">Rp {po.total_amount.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={po.receipt_status === 'RECEIVED' ? 'default' : po.receipt_status === 'PARTIAL' ? 'secondary' : 'outline'}>{po.receipt_status}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={po.bill_status === 'BILLED' ? 'default' : 'outline'}>{po.bill_status}</Badge>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Link href={'/purchasing/receipts?po=' + po.id}>
                        <Button size="sm" variant="outline">
                          <Package className="w-4 h-4 mr-2" /> Terima Barang
                        </Button>
                      </Link>
                      {po.receipt_status !== 'PENDING' && po.bill_status === 'PENDING' && (
                        <Button size="sm" onClick={() => createVendorBill(po.id)}>
                          <FileText className="w-4 h-4 mr-2" /> Buat Tagihan
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





